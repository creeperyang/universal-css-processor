const path = require('path')
const accord = require('accord')
const applySourceMap = require('vinyl-sourcemaps-apply')
const scss = accord.load('scss')

module.exports = processSass

function processSass (file, options) {
    if (!file || !file.contents) {
        throw new Error('scss: invalid arguments.')
    }

    options = Object.assign({}, options)

    options.filename = file.path

    if (path.extname(file.path) === '.sass') {
        options.indentedSyntax = true
    }

    if (options.includePaths) {
        if (typeof options.includePaths === 'string') {
            options.includePaths = [options.includePaths]
        }
    } else {
        options.includePaths = []
    }
    options.includePaths.unshift(path.dirname(file.path))

    // Generate Source Maps if plugin source-map present
    if (file.sourceMap) {
        options.sourcemap = true
    }

    return scss.render(file.contents.toString(), options)
        .then(handleResult)
        .catch(handleError)

    function handleResult (res) {
        let sassMap, sassMapFile, sassFileSrc, sassFileSrcPath, sourceFileIndex
        if (res.sourcemap) {
            // Transform map into JSON
            sassMap = res.sourcemap
            // Grab the stdout and transform it into stdin
            sassMapFile = sassMap.file.replace(/^stdout$/, 'stdin')
            // Grab the base file name that's being worked on
            sassFileSrc = file.relative
            // Grab the path portion of the file that's being worked on
            sassFileSrcPath = path.dirname(sassFileSrc)

            // sources are all absolute paths
            const base = path.dirname(file.path)
            sassMap.sources = sassMap.sources.map(source => path.relative(base, source))
            if (sassFileSrcPath) {
                // Prepend the path to all files in the sources array except the file that's being worked on
                sourceFileIndex = sassMap.sources.indexOf(sassMapFile)
                sassMap.sources = sassMap.sources.map((source, index) => {
                    return (index === sourceFileIndex) ? source : path.join(sassFileSrcPath, source)
                })
            }

            // Remove 'stdin' from souces and replace with filenames!
            sassMap.sources = sassMap.sources.filter(src => {
                if (src !== 'stdin') {
                    return src
                }
            })

            // Replace the map file with the original file name (but new extension)
            sassMap.file = sassFileSrc.replace(/\.\w+$/i, '.css')
            // Apply the map
            applySourceMap(file, sassMap)
        }

        file.contents = new Buffer(res.result)
        file.path = file.path.replace(/\.\w+$/i, '.css')

        return file
    }

    function handleError (error) {
        let relativePath = ''
        let filePath = error.file === 'stdin' ? file.path : error.file
        let message = ''

        filePath = filePath || file.path
        relativePath = path.relative(process.cwd(), filePath)

        message += relativePath + '\n'
        message += error.message

        error.messageFormatted = message
        error.messageOriginal = error.message
        error.message = message
        error.relativePath = relativePath

        throw error
    }
}
