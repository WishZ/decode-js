import {parse} from "@babel/parser";
import _generate from '@babel/generator'
import _traverse from '@babel/traverse'
import * as t from '@babel/types'

const generator = _generate.default
const traverse = _traverse.default

function RemoveVoid(path) {
    if (path.node.operator === 'void') {
        path.replaceWith(path.node.argument)
    }
}
function LintConditionalAssign(path) {
    if (!t.isAssignmentExpression(path?.parent)) {
        return
    }
    let { test, consequent, alternate } = path.node
    let { operator, left } = path.parent
    consequent = t.assignmentExpression(operator, left, consequent)
    alternate = t.assignmentExpression(operator, left, alternate)
    path.parentPath.replaceWith(
        t.conditionalExpression(test, consequent, alternate)
    )
}

function LintConditionalIf(ast) {
    function conditional(path) {
        let { test, consequent, alternate } = path.node
        // console.log(generator(test, { minified: true }).code)
        if (t.isSequenceExpression(path.parent)) {
            if (!sequence(path.parentPath)) {
                path.stop()
            }
            return
        }
        if (t.isLogicalExpression(path.parent)) {
            if (!logical(path.parentPath)) {
                path.stop()
            }
            return
        }
        if (!t.isExpressionStatement(path.parent)) {
            console.error(`Unexpected parent type: ${path.parent.type}`)
            path.stop()
            return
        }
        consequent = t.expressionStatement(consequent)
        alternate = t.expressionStatement(alternate)
        let statement = t.ifStatement(test, consequent, alternate)
        path.replaceWithMultiple(statement)
    }

    function sequence(path) {
        if (t.isLogicalExpression(path.parent)) {
            return logical(path.parentPath)
        }
        let body = []
        for (const item of path.node.expressions) {
            body.push(t.expressionStatement(item))
        }
        let node = t.blockStatement(body, [])
        let replace_path = path
        if (t.isExpressionStatement(path.parent)) {
            replace_path = path.parentPath
        } else if (!t.isBlockStatement(path.parent)) {
            console.error(`Unexpected parent type: ${path.parent.type}`)
            return false
        }
        replace_path.replaceWith(node)
        return true
    }

    function logical(path) {
        let { operator, left, right } = path.node
        if (operator !== '&&') {
            console.error(`Unexpected logical operator: ${operator}`)
            return false
        }
        if (!t.isExpressionStatement(path.parent)) {
            console.error(`Unexpected parent type: ${path.parent.type}`)
            return false
        }
        let node = t.ifStatement(left, t.expressionStatement(right))
        path.parentPath.replaceWith(node)
        return true
    }

    traverse(ast, {
        ConditionalExpression: { enter: conditional },
    })
}

function LintIfStatement(path) {
    let { test, consequent, alternate } = path.node
    let changed = false
    if (!t.isBlockStatement(consequent)) {
        consequent = t.blockStatement([consequent])
        changed = true
    }
    if (alternate && !t.isBlockStatement(alternate)) {
        alternate = t.blockStatement([alternate])
        changed = true
    }
    if (!changed) {
        return
    }
    path.replaceWith(t.ifStatement(test, consequent, alternate))
}

export default function (code) {
    let ast = parse(code)
    // 去掉void
    traverse(ast, {
        UnaryExpression: RemoveVoid,
    })
    traverse(ast, {
        ConditionalExpression: { exit: LintConditionalAssign },
    })
    LintConditionalIf(ast)
    traverse(ast, {
        IfStatement: { exit: LintIfStatement },
    })

    code = generator(ast, {
        comments: false,
        jsescOption: { minimal: true },
    }).code
    return code
}
