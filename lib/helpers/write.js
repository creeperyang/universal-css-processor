const path = require('path')
const fs = require('fs')
const detectNewline = require('detect-newline')
const stripBom = require('strip-bom')
const File = require('../file')
const { unixStylePath } = require('../utils')

exports = module.exports = sourceMapWrite

function sourceMapWrite (file, mapDestDir, options) {
    if (!file || !file.sourceMap) {
        throw new Error('sourceMapWrite: invalid arguments.')
    }
    options = Object.assign({
        charset: 'utf8',
        addComment: true,
        includeContent: true
    }, options)

    const sourceMap = file.sourceMap
    // fix paths if Windows style paths
    sourceMap.file = unixStylePath(file.relative)

    if (options.mapSources && typeof options.mapSources === 'function') {
        sourceMap.sources = sourceMap.sources.map(filePath => {
            return options.mapSources(filePath)
        })
    }

    sourceMap.sources = sourceMap.sources.map(filePath => {
        return unixStylePath(filePath)
    })

    if (typeof options.sourceRoot === 'function') {
        sourceMap.sourceRoot = options.sourceRoot(file)
    } else {
        sourceMap.sourceRoot = options.sourceRoot
    }
    if (sourceMap.sourceRoot === null) {
        sourceMap.sourceRoot = undefined
    }

    if (options.includeContent) {
        sourceMap.sourcesContent = sourceMap.sourcesContent || []

        // load missing source content
        for (let i = 0; i < file.sourceMap.sources.length; i++) {
            if (!sourceMap.sourcesContent[i]) {
                const sourcePath = path.resolve(sourceMap.sourceRoot || file.base, sourceMap.sources[i])
                try {
                    sourceMap.sourcesContent[i] = stripBom(fs.readFileSync(sourcePath, 'utf8'))
                } catch (e) {}
            }
        }
    } else {
        delete sourceMap.sourcesContent
    }

    const extension = file.relative.split('.').pop()
    const newline = detectNewline.graceful(file.contents.toString())
    let commentFormatter

    switch (extension) {
        case 'css':
            commentFormatter = function (url) {
                return newline + '/*# sourceMappingURL=' + url + ' */' + newline
            }
            break
        default:
            commentFormatter = function (url) {
                return ''
            }
    }

    let comment, sourceMapFile

    if (mapDestDir == null) {
        // encode source map into comment
        const base64Map = new Buffer(JSON.stringify(sourceMap)).toString('base64')
        comment = commentFormatter('data:application/json;charset=' + options.charset + ';base64,' + base64Map)
    } else {
        let mapFile = path.join(mapDestDir, file.relative) + '.map'
        // custom map file name
        if (options.mapFile && typeof options.mapFile === 'function') {
            mapFile = options.mapFile(mapFile)
        }

        let sourceMapPath = path.join(file.base, mapFile)

        // if explicit destination path (for css file) is set
        if (options.destPath) {
            let destSourceMapPath = path.join(file.cwd, options.destPath, mapFile)
            let destFilePath = path.join(file.cwd, options.destPath, file.relative)
            sourceMap.file = unixStylePath(path.relative(path.dirname(destSourceMapPath), destFilePath))
            if (sourceMap.sourceRoot === undefined) {
                sourceMap.sourceRoot = unixStylePath(path.relative(path.dirname(destSourceMapPath), file.base))
            } else if (sourceMap.sourceRoot === '' || (sourceMap.sourceRoot && sourceMap.sourceRoot[0] === '.')) {
                sourceMap.sourceRoot = unixStylePath(path.join(path.relative(path.dirname(destSourceMapPath), file.base), sourceMap.sourceRoot))
            }
        } else {
            // best effort, can be incorrect if options.destPath not set
            sourceMap.file = unixStylePath(path.relative(path.dirname(sourceMapPath), file.path))
            if (sourceMap.sourceRoot === '' || (sourceMap.sourceRoot && sourceMap.sourceRoot[0] === '.')) {
                sourceMap.sourceRoot = unixStylePath(path.join(path.relative(path.dirname(sourceMapPath), file.base), sourceMap.sourceRoot))
            }
        }

        // add new source map file to stream
        sourceMapFile = new File({
            cwd: file.cwd,
            base: file.base,
            path: sourceMapPath,
            contents: new Buffer(JSON.stringify(sourceMap))
        })

        let sourceMapPathRelative = path.relative(path.dirname(file.path), sourceMapPath)

        if (options.sourceMappingURLPrefix) {
            let prefix = ''
            if (typeof options.sourceMappingURLPrefix === 'function') {
                prefix = options.sourceMappingURLPrefix(file)
            } else {
                prefix = options.sourceMappingURLPrefix
            }
            sourceMapPathRelative = prefix + path.join('/', sourceMapPathRelative)
        }
        comment = commentFormatter(unixStylePath(sourceMapPathRelative))

        if (options.sourceMappingURL && typeof options.sourceMappingURL === 'function') {
            comment = commentFormatter(options.sourceMappingURL(file))
        }
    }

    // append source map comment
    if (options.addComment) {
        file.contents = Buffer.concat([file.contents, new Buffer(comment)])
    }

    return Promise.resolve(sourceMapFile)
}
