import * as esprimaLoad from 'esprima';
import estraverse, {Syntax} from 'estraverse'
import escodegen from 'escodegen'

const esprima = esprimaLoad.default;

export default function (code) {
    var ast = esprima.parse(code)
    ast = estraverse.replace(ast, {
        enter: function (node, parentNode) {
            switch (node.type) {
                case Syntax.UnaryExpression:
                    // 去掉 void 混淆 夹杂在三目表达式前面
                    if(node.operator === "void" && parentNode.type === Syntax.ExpressionStatement)
                        return node.argument;
                    return node;
            }
        }
    })
    //还原ast为JS
    return escodegen.generate(ast)
}