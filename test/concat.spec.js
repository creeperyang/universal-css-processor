const { join } = require('path')
const { readFileSync } = require('fs')
const test = require('ava')
const File = require('../lib/file')
const sourceMapInit = require('../lib/helpers/init')
const sourceMapWrite = require('../lib/helpers/write')
const processLess = require('../lib/processors/less')
const processSass = require('../lib/processors/sass')
const concat = require('../lib/processors/concat')

test('should concat css and generate sourcemap correctly when destFile is File', t => {
    const styleFile1 = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: join(__dirname, 'resource/css/simple.css')
    }, { loadContents: true })
    const styleFile2 = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: join(__dirname, 'resource/less/std.less')
    }, { loadContents: true })
    const styleFile3 = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: join(__dirname, 'resource/sass/std.scss')
    }, { loadContents: true })
    const destFile = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: join(__dirname, 'resource/concat.css')
    })
    const destPath = 'resource/expected'
    let joinedFile

    return Promise.all([
        sourceMapInit(styleFile1),
        sourceMapInit(styleFile2).then(file => {
            return processLess(file)
        }),
        sourceMapInit(styleFile3).then(file => {
            return processSass(file)
        })
    ]).then(files => {
        t.is(files.length, 3)
        return concat(files, {
            destFile,
            rebaseUrl: false
        })
    }).then(file => {
        joinedFile = file
        return sourceMapWrite(file, '.', { destPath })
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

test('should concat css and generate sourcemap correctly when destFile is string', t => {
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
        t.is(files.length, 2)
        return concat(files, {
            destFile: 'concat2.css',
            rebaseUrl: true
        })
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

test('should concat css and generate sourcemap correctly when rebase url', t => {
    const styleFile3 = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: join(__dirname, 'resource/css/simple.css')
    }, { loadContents: true })
    const styleFile2 = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: join(__dirname, 'resource/css/std.css')
    }, { loadContents: true })
    const styleFile1 = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: join(__dirname, 'resource/css/unusual.css')
    }, { loadContents: true })
    const destPath = 'resource/expected'
    let joinedFile

    return Promise.all([
        sourceMapInit(styleFile1),
        sourceMapInit(styleFile2),
        sourceMapInit(styleFile3)
    ]).then(files => {
        return concat(files, {
            destFile: 'concated.css',
            rebaseUrl: true
        })
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
