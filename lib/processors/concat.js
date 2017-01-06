const { join, basename, dirname } = require('path')
const Concat = require('concat-with-sourcemaps')
const File = require('../file')
const rebase = require('../helpers/rebaseurl')
const update = require('sourcemap-updater')

module.exports = concatFiles

const urlRegExp = /(url\s*\(\s*['"]?)([^)'"]+)(['"]?\s*\)\s*)/g

function concatFiles (files, options) {
    if (!files || !files.length) {
        throw new Error('concat: files are empty')
    }
    let destFile
    if (typeof options === 'string') {
        destFile = options
        options = { destFile }
    } else if (typeof options === 'object') {
        destFile = options.destFile
    }
    if (!destFile) {
        throw new Error('concat: miss destFile option')
    }

    if (typeof options.newLine !== 'string') {
        options.newLine = `\n`
    }
    if (options.rebaseUrl === undefined) {
        options.rebaseUrl = true
    }

    let isUsingSourceMaps = false
    let latestFile
    let fileName
    let concat
    let destDir

    if (typeof destFile === 'string') {
        fileName = destFile
        destDir = dirname(destFile)
    } else if (typeof destFile.path === 'string') {
        fileName = basename(destFile.path)
        destDir = dirname(destFile.path)
    } else {
        throw new Error('concat: miss path in file option')
    }

    files.forEach(f => addFile(f))
    return Promise.resolve(end())

    function rewriteCssUrl (file) {
        const css = file.contents.toString()
        const res = update([css, file.sourceMap], {
            updater (str, node, type) {
                if (!type && node && node.prop) {
                    return str.replace(urlRegExp, (match, left, url, right) => {
                        return left + rebase(url, {
                            base: file.base,
                            path: file.path,
                            destDir: destDir || ''
                        }) + right
                    })
                }
                return false
            }
        })
        // If the css content changes
        if (res.css !== css) {
            file.contents = new Buffer(res.css)
            // update sourcemap
            file.sourceMap = res.map
        }
    }

    function addFile (file) {
        // enable sourcemap support for concat
        // if a sourcemap initialized file comes in
        if (file.sourceMap && isUsingSourceMaps === false) {
            isUsingSourceMaps = true
        }

        // set latest file if not already set,
        // or if the current file was modified more recently.
        if (!latestFile) {
            latestFile = file
        }

        if (options.rebaseUrl) {
            rewriteCssUrl(file)
        }

        // construct concat instance
        if (!concat) {
            concat = new Concat(isUsingSourceMaps, fileName, options.newLine)
        }

        // add file to concat instance
        concat.add(file.relative, file.contents, file.sourceMap)
    }

    function end () {
        // no files passed in, no file goes out
        if (!latestFile || !concat) {
            return
        }

        let joinedFile

        // if file opt was a file path
        // clone everything from the latest file
        if (typeof destFile === 'string') {
            joinedFile = latestFile.clone({
                contents: false
            })
            joinedFile.path = join(latestFile.base, destFile)
        } else {
            joinedFile = new File(destFile)
        }

        joinedFile.contents = concat.content

        if (concat.sourceMapping) {
            joinedFile.sourceMap = JSON.parse(concat.sourceMap)
        }

        // Add concat flag, it may be used by other processors.
        // For example: postcss processor maybe use it to clean sourceMap.sources
        joinedFile._concated = joinedFile.path

        return joinedFile
    }
}
