/**
 * Rewirte based on https://github.com/floridoo/gulp-sourcemaps
 */

const path = require('path')
const fs = require('fs')
const convert = require('convert-source-map')
const stripBom = require('strip-bom')
const { generateCssSourceMap } = require('../processors/css')
const { unixStylePath } = require('../utils')

const urlRegex = /^(https?|webpack(-[^:]+)?):\/\//

module.exports = sourceMapInit

/**
 * Init source map
 * @param  {Object}   file     file
                                {
                                   contents: Buffer,
                                   path: String,
                                   base: String,
                                   relative: String,
                                   sourceMap: Object
                                }
 * @param  {Object}   options  options
                                {
                                    loadMaps: true,
                                    largeFile: false
                                }
 * @return {[type]}            [description]
 */
function sourceMapInit (file, options) {
    // pass through if file is null or already has a source map
    if (!file || !file.path) {
        throw new Error('invalid arguments')
    }
    if (file.sourceMap) {
        return Promise.resolve(file)
    }

    if (!file.contents) {
        file.read()
    }
    let fileContent = file.contents.toString()
    let sourceMap

    if (!options) options = {}

    if (options.loadMaps) {
        let sourcePath = '' // root path for the sources in the map

        // Try to read inline source map
        sourceMap = convert.fromSource(fileContent, options.largeFile)
        if (sourceMap) {
            sourceMap = sourceMap.toObject()
            // sources in map are relative to the source file
            sourcePath = path.dirname(file.path)
            if (!options.largeFile) {
                fileContent = convert.removeComments(fileContent)
            }
        } else {
            // look for source map comment referencing a source map file
            let mapComment = convert.mapFileCommentRegex.exec(fileContent)

            let mapFile
            if (mapComment) {
                mapFile = path.resolve(path.dirname(file.path), mapComment[1] || mapComment[2])
                fileContent = convert.removeMapFileComments(fileContent)
            }
            // if no comment try map file with same name as source file
            else {
                mapFile = file.path + '.map'
            }

            // sources in external map are relative to map file
            sourcePath = path.dirname(mapFile)

            try {
                sourceMap = JSON.parse(stripBom(fs.readFileSync(mapFile, 'utf8')))
            } catch (e) {}
        }

        // fix source paths and sourceContent for imported source map
        if (sourceMap) {
            sourceMap.sourcesContent = sourceMap.sourcesContent || []
            sourceMap.sources.forEach((source, i) => {
                if (source.match(urlRegex)) {
                    sourceMap.sourcesContent[i] = sourceMap.sourcesContent[i] || null
                    return
                }
                let absPath = path.resolve(sourcePath, source)
                sourceMap.sources[i] = unixStylePath(path.relative(file.base, absPath))

                if (!sourceMap.sourcesContent[i]) {
                    let sourceContent = null
                    if (sourceMap.sourceRoot) {
                        if (sourceMap.sourceRoot.match(urlRegex)) {
                            sourceMap.sourcesContent[i] = null
                            return
                        }
                        absPath = path.resolve(sourcePath, sourceMap.sourceRoot, source)
                    }

                    // if current file: use content
                    if (absPath === file.path) {
                        sourceContent = fileContent
                    }
                    // else load content from file
                    else {
                        try {
                            sourceContent = stripBom(fs.readFileSync(absPath, 'utf8'))
                        } catch (e) {}
                    }
                    sourceMap.sourcesContent[i] = sourceContent
                }
            })

            // remove source map comment from source
            file.contents = new Buffer(fileContent, 'utf8')
        }
    }

    if (!sourceMap && options.identityMap) {
        const fileType = path.extname(file.path)

        if (fileType === '.css') {
            sourceMap = generateCssSourceMap(file, undefined)
        }
    }

    if (!sourceMap) {
        // Make an empty source map
        sourceMap = {
            version: 3,
            names: [],
            mappings: '',
            sources: [unixStylePath(file.relative)],
            sourcesContent: [fileContent]
        }
    }

    sourceMap.file = unixStylePath(file.relative)
    file.sourceMap = sourceMap
    return Promise.resolve(file)
}
