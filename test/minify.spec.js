const { join } = require('path')
const { readFileSync } = require('fs')
const test = require('ava')
const File = require('../lib/file')
const sourceMapInit = require('../lib/helpers/init')
const sourceMapWrite = require('../lib/helpers/write')
const minifyCss = require('../lib/processors/minify')

test('should minify css and generate sourcemap correctly', t => {
    const styleFile = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: join(__dirname, 'resource/css/simple.css')
    }, { loadContents: true })
    const destPath = 'resource/expected'

    return sourceMapInit(styleFile).then(file => {
        return minifyCss(file, {
            rename: true
        })
    }).then(file => {
        return sourceMapWrite(file, '.', { destPath })
    }).then(mapFile => {
        t.deepEqual(
            styleFile.contents,
            readFileSync(join(styleFile.cwd, destPath, styleFile.relative))
        )
        t.deepEqual(
            mapFile.contents,
            readFileSync(join(mapFile.cwd, destPath, mapFile.relative))
        )
    })
})
