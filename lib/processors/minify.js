const cssnano = require('cssnano')
const processPostcss = require('./postcss')

module.exports = minifyCss

function minifyCss (file, options) {
    if (!file || !file.contents) {
        throw new Error('minify: invalid arguments.')
    }

    options = Object.assign({
        safe: true
    }, options)

    const processors = options.processors || []

    return processPostcss(file, {
        processors: [cssnano(options)].concat(processors)
    }).then(f => {
        if (options.rename === true) {
            // add .min to name
            f.path = f.path.replace(/\.css$/i, '.min.css')
        } else if (typeof options.rename === 'function') {
            f.path = options.rename(f.path)
        }
        return f
    })
}
