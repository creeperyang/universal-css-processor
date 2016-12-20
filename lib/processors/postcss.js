const path = require('path')
const accord = require('accord')
const applySourceMap = require('vinyl-sourcemaps-apply')
const postcss = accord.load('postcss')

module.exports = processPostcss

function processPostcss (file, options) {
    if (!file || !file.contents) {
        throw new Error('postcss: invalid arguments.')
    }

    options = Object.assign({
        map: false,
        processors: []
    }, options)

    if (!Array.isArray(options.processors)) {
        throw new Error('Postcss: options.processors should be array')
    }

    options.processors = options.processors.map(p => {
        if (p === 'autoprefixer') {
            return require('autoprefixer')
        } else if (p === 'cssnano') {
            return require('cssnano')()
        } else if (p === 'precss') {
            return require('precss')
        } else if (typeof p === 'string') {
            throw new Error(`Postcss: ${p} is not a built-in processor.`)
        }
        return p
    })
    options.from = file.path
    options.to = options.to || file.path

    // Generate separate source map for gulp-sourcemap
    if (file.sourceMap) {
        options.map = {
            annotation: false,
            prev: file.sourceMap
        }
    }

    options.use = options.processors

    return postcss.render(file.contents, options)
        .then(handleResult, handleError)

    function handleResult (res) {
        file.contents = new Buffer(res.result)

        // Apply source map to the chain
        if (file.sourceMap) {
            const map = res.sourcemap
            map.file = file.relative
            map.sources = [].map.call(map.sources, source => {
                return path.join(path.dirname(file.relative), source)
            })

            applySourceMap(file, map)
        }
        return file
    }

    function handleError (error) {
        if (error.name === 'CssSyntaxError') {
            error.messageOriginal = error.message
            error.message = error.message + '\n\n' + error.showSourceCode() + '\n'
        }
        throw error
    }
}
