const { join } = require('path')
const { readFileSync } = require('fs')
const test = require('ava')
const File = require('../lib/file')
const sourceMapInit = require('../lib/helpers/init')
const sourceMapWrite = require('../lib/helpers/write')
const minifyCss = require('../lib/processors/minify')

test('sourceMapWrite should throw error with invalid arguments', t => {
    t.throws(() => sourceMapWrite())
    t.throws(() => sourceMapWrite({}))
})

test('sourceMapWrite should work correctly', t => {
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
            mapFile.contents,
            readFileSync(join(mapFile.cwd, destPath, mapFile.relative))
        )
    })
})
