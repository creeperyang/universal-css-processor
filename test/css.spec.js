const { join } = require('path')
const test = require('ava')
const File = require('../lib/file')
const processCss = require('../lib/processors/css')
const generateCssSourceMap = processCss.generateCssSourceMap

test('generateCssSourceMap should generate sourcemap successfully.', t => {
    const filePath = join(__dirname, 'resource/css/simple.css')
    const file = File.from(filePath, __dirname, true)
    const map = generateCssSourceMap(file)
    t.deepEqual(map, {
        version: 3,
        sources: ['resource/css/simple.css'],
        names: [],
        mappings: 'CAAC;KACI;KACA;;;CAGJ;KACI;KACA',
        file: 'resource/css/simple.css',
        sourcesContent: [
            file.contents.toString()
        ]
    })
})

test('css should work correctly.', t => {
    const filePath = join(__dirname, 'resource/css/simple.css')
    const file = File.from(filePath, __dirname, true)
    t.throws(() => {
        processCss()
    })
    return processCss(file).then(f => {
        t.deepEqual(file.sourceMap, {
            version: 3,
            sources: ['resource/css/simple.css'],
            names: [],
            mappings: 'CAAC;KACI;KACA;;;CAGJ;KACI;KACA',
            file: 'resource/css/simple.css',
            sourcesContent: [
                file.contents.toString()
            ]
        })
    })
})
