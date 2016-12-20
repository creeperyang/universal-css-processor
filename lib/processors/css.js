const CSS = require('css')
const SourceMapGenerator = require('source-map').SourceMapGenerator
const applySourceMap = require('vinyl-sourcemaps-apply')
const { unixStylePath } = require('../utils')

exports = module.exports = css
exports.generateCssSourceMap = generateCssSourceMap

function css (file, options = { silent: true }) {
    if (!file || !file.contents) {
        throw new Error('css: invalid arguments.')
    }
    const sourceMap = generateCssSourceMap(file, options)
    if (!file.sourceMap) {
        file.sourceMap = sourceMap
    } else {
        applySourceMap(file, sourceMap)
    }
    return Promise.resolve(file)
}

function generateCssSourceMap (file, options) {
    const source = unixStylePath(file.relative)
    const generator = new SourceMapGenerator({
        file: source
    })
    const fileContent = file.contents.toString()

    const ast = CSS.parse(fileContent, options)
    const registerTokens = ast => {
        if (ast.position) {
            generator.addMapping({
                original: ast.position.start,
                generated: ast.position.start,
                source: source
            })
        }

        for (let key in ast) {
            if (key !== 'position') {
                if (Object.prototype.toString.call(ast[key]) === '[object Object]') {
                    registerTokens(ast[key])
                } else if (Array.isArray(ast[key])) {
                    for (let i = 0; i < ast[key].length; i++) {
                        registerTokens(ast[key][i])
                    }
                }
            }
        }
    }
    registerTokens(ast)
    generator.setSourceContent(source, fileContent)
    return generator.toJSON()
}
