const { join } = require('path')
const { readFileSync } = require('fs')
const test = require('ava')
const File = require('../lib/file')
const sourceMapInit = require('../lib/helpers/init')
const sourceMapWrite = require('../lib/helpers/write')
const processPostcss = require('../lib/processors/postcss')

test('should add a correct source map', t => {
    const styleFile = new File({
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: join(__dirname, 'resource/postcss/simple.css')
    }, { loadContents: true })
    const destPath = 'resource/expected'

    return sourceMapInit(styleFile).then(file => {
        return processPostcss(file, { processors: ['autoprefixer', 'precss'] })
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

