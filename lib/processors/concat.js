const { join, basename, dirname } = require('path')
const Concat = require('concat-with-sourcemaps')
const File = require('../file')
const rebase = require('../helpers/rebaseurl')
const postcss = require('postcss')

module.exports = concatFiles

const urlRegExp = /(url\s*\(\s*['"]?)([^)]+)(['"]?\s*\)\s*)/g

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
        const processed = css.replace(urlRegExp, (match, left, url, right) => {
            return left + rebase(url, {
                base: file.base,
                path: file.path,
                destDir: destDir || ''
            }) + right
        })
        // If the css content changes
        if (processed !== css) {
            file.contents = new Buffer(processed)
            // update sourcemap
            const map = postcss([]).process(file.contents, {
                from: file.path,
                to: file.path,
                map: {
                    annotation: false,
                    prev: file.sourceMap
                }
            }).map.toJSON()
            map.file = file.relative
            map.sources = [].map.call(map.sources, source => {
                return join(dirname(file.relative), source)
            })
            file.sourceMap = map
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
        return joinedFile
    }
}
