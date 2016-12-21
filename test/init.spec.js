const { join } = require('path')
const { readFileSync } = require('fs')
const test = require('ava')
const File = require('../lib/file')
const sourceMapInit = require('../lib/helpers/init')

test('sourceMapInit should throw error with invalid arguments', t => {
    t.throws(() => sourceMapInit())
    t.throws(() => sourceMapInit({}))
})

test('sourceMapInit should do nothing if file has sourceMap', t => {
    const file = File.from(__filename)
    file.sourceMap = true
    return sourceMapInit(file).then(f => {
        t.is(f, file)
        t.deepEqual(f, file)
    })
})

test('sourceMapInit should add empty sourceMap', t => {
    const file = File.from(join(__dirname, 'resource/css/simple.css'), null, true)
    return sourceMapInit(file).then(f => {
        t.deepEqual(f.sourceMap, {
            version: 3,
            names: [],
            mappings: '',
            sources: [f.relative],
            sourcesContent: [f.contents.toString()],
            file: f.relative
        })
    })
})

test('sourceMapInit should load sourceMap', t => {
    const file = File.from(join(__dirname, 'resource/expected/css/simple.min.css'))
    return sourceMapInit(file, { loadMaps: true }).then(f => {
        t.deepEqual(f.sourceMap.mappings, JSON.parse(
            readFileSync(join(__dirname, 'resource/expected/css/simple.min.css.map'))
        ).mappings)
    })
})

test('sourceMapInit should generate sourceMap', t => {
    const file = File.from(join(__dirname, 'resource/css/simple.css'))
    return sourceMapInit(file, {
        loadMaps: false,
        identityMap: true
    }).then(f => {
        t.is(f.sourceMap.mappings, 'CAAC;KACI;KACA;;;CAGJ;KACI;KACA')
    })
})
