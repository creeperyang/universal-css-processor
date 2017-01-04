const { join } = require('path')
const { readFileSync } = require('fs')
const test = require('ava')
const File = require('../lib/file')
const sourceMapInit = require('../lib/helpers/init')
const sourceMapWrite = require('../lib/helpers/write')
const minifyCss = require('../lib/processors/minify')
const concat = require('../lib/processors/concat')

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

test('should handle sourceMap.sources correctly when file is processed by concat', t => {
    const styleFile1 = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: join(__dirname, 'resource/css/simple.css')
    }, { loadContents: true })
    const styleFile2 = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: join(__dirname, 'resource/css/std.css')
    }, { loadContents: true })
    const destPath = 'resource/expected'
    let joinedFile

    return Promise.all([
        sourceMapInit(styleFile1),
        sourceMapInit(styleFile2)
    ]).then(files => {
        return concat(files, {
            destFile: 'concat3.css'
        })
    }).then(file => {
        return minifyCss(file)
    }).then(file => {
        joinedFile = file
        return sourceMapWrite(file, '.', { destPath, includeContent: false })
    }).then(mapFile => {
        t.deepEqual(
            joinedFile.contents,
            readFileSync(join(joinedFile.cwd, destPath, joinedFile.relative))
        )
        t.deepEqual(
            mapFile.contents,
            readFileSync(join(mapFile.cwd, destPath, mapFile.relative))
        )
    })
})
