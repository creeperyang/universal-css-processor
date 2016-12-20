const { dirname, relative } = require('path')
const accord = require('accord')
const applySourceMap = require('vinyl-sourcemaps-apply')
const less = accord.load('less')

module.exports = processLess

function processLess (file, options) {
    if (!file || !file.contents) {
        throw new Error('less: invalid arguments.')
    }

    options = Object.assign({
        compress: false
    }, options)
    options.filename = file.path

    if (options.paths) {
        if (typeof options.paths === 'string') {
            options.paths = [options.paths]
        }
    } else {
        options.paths = []
    }
    options.paths.unshift(dirname(file.path))

    // Generate Source Maps if plugin source-map present
    if (file.sourceMap) {
        options.sourceMap = true
    }

    return less.render(file.contents.toString(), options)
        .then(handleResult)

    function handleResult (res) {
        file.contents = new Buffer(res.result)
        file.path = file.path.replace(/\.\w+$/, '.css')
        if (res.sourcemap) {
            res.sourcemap.file = file.relative
            res.sourcemap.sources = res.sourcemap.sources.map(function (source) {
                return relative(file.base, source)
            })

            applySourceMap(file, res.sourcemap)
        }
        return file
    }
}
