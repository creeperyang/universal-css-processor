const autoprefixer = require('autoprefixer')
const processPostcss = require('./postcss')

module.exports = prefix

function prefix (file, options) {
    if (!file || !file.contents) {
        throw new Error('autoprefixer: invalid arguments.')
    }
    options = Object.assign({}, options)

    const processors = options.processors || []

    return processPostcss(file, {
        processors: [autoprefixer(options)].concat(processors)
    })
}
