const { join } = require('path')
const { readFileSync } = require('fs')
const test = require('ava')
const File = require('../lib/file')
const sourceMapInit = require('../lib/helpers/init')
const sourceMapWrite = require('../lib/helpers/write')
const processSass = require('../lib/processors/sass')

test('should add a correct source map for scss', t => {
    const srcPath = join(__dirname, 'resource/sass/std.scss')
    const destPath = 'resource/expected'
    const styleFile = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: srcPath
    }, { loadContents: true })

    return sourceMapInit(styleFile).then(file => {
        return processSass(file)
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

test('should add a correct source map for complex scss', t => {
    const srcPath = join(__dirname, 'resource/sass/import.scss')
    const destPath = 'resource/expected'
    const styleFile = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: srcPath
    }, { loadContents: true })

    return sourceMapInit(styleFile).then(file => {
        return processSass(file)
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
