const { join } = require('path')
const { readFileSync } = require('fs')
const test = require('ava')
const File = require('../lib/file')
const sourceMapInit = require('../lib/helpers/init')
const sourceMapWrite = require('../lib/helpers/write')
const processLess = require('../lib/processors/less')

test('should throw if less file has syntax error', t => {
    const srcPath = join(__dirname, 'resource/less/invalid.less')
    const styleFile = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: srcPath
    }, { loadContents: true })

    t.throws(processLess(styleFile))
})

test('should add a correct source map for less', t => {
    const srcPath = join(__dirname, 'resource/less/std.less')
    const destPath = 'resource/expected'
    const styleFile = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: srcPath
    }, { loadContents: true })

    return sourceMapInit(styleFile).then(file => {
        return processLess(file)
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
