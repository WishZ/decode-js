import fs from 'fs'
import iconv from 'iconv-lite'
import PluginSojson from './plugin/sojson.js'
import PluginSojsonV7 from './plugin/sojsonv7.js'
import PluginObfuscator from './plugin/obfuscator.js'
import PluginAwsc from './plugin/awsc.js'
import PluginAwsc226 from './plugin/awsc226.js'

// 读取参数
let type = 'obfuscator'
let encodeFile = 'input.js'
let decodeFile = 'output.js'
for (let i = 2; i < process.argv.length; i += 2) {
  if (process.argv[i] === '-t') {
    type = process.argv[i + 1]
  }
  if (process.argv[i] === '-i') {
    encodeFile = process.argv[i + 1]
  }
  if (process.argv[i] === '-o') {
    decodeFile = process.argv[i + 1]
  }
}
console.log(`类型: ${type}`)
console.log(`输入: ${encodeFile}`)
console.log(`输出: ${decodeFile}`)

// 读取源代码
const content = fs.readFileSync(encodeFile, { encoding: 'binary' })
var buf = new Buffer.from(content, 'binary');
var sourceCode = iconv.decode(buf, 'utf-8')

// 净化源代码
let code
if (type === 'sojson') {
  code = PluginSojson(sourceCode)
} else if (type === 'sojsonv7') {
  code = PluginSojsonV7(sourceCode)
} else if (type === 'obfuscator') {
  code = PluginObfuscator(sourceCode)
} else if (type === 'awsc') {
  code = PluginAwsc(sourceCode)
} else if (type === 'awsc226') {
  code = PluginAwsc226(sourceCode)
}

// 输出代码
if (code) {
  fs.writeFile(decodeFile, code, () => {})
}
