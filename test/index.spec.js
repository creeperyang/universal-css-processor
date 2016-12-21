const { join } = require('path')
const { readFileSync } = require('fs')
const test = require('ava')
const File = require('../lib/file')
const ucprocessor = require('../lib')
const Assistant = ucprocessor.Assistant

test('Assistant.createFile should work correctly', t => {
    const options = {
        cwd: __dirname,
        base: join(__dirname, 'resource'),
        path: join(__dirname, 'resource/sass/std.scss')
    }
    const file = Assistant.createFile(options)
    t.deepEqual(file, new File(options, { loadContents: true }))
})

test('Assistant.createFiles should work correctly', t => {
    const files = Assistant.createFiles([
        'resource/sass/*.scss',
        '!resource/sass/_*.scss'
    ], { loadContents: false, cwd: __dirname })
    t.is(files.length, 2)
    t.is(files[0].cwd, __dirname)
    t.is(files[0].contents, undefined)
    t.is(files[0].base, join(__dirname, 'resource/sass'))
})

test('ucprocessor should work correctly', t => {
    t.is(ucprocessor.support('sass'), true)
    t.is(ucprocessor.support('scss'), true)
    t.is(ucprocessor.support('css'), true)
    t.is(ucprocessor.support('less'), true)
    t.is(ucprocessor.support('minify'), true)
    t.is(ucprocessor.support('concat'), true)
    t.is(ucprocessor.support('autoprefixer'), true)

    t.deepEqual(
        Array.from(ucprocessor.list()).sort(),
        ['css', 'less', 'sass', 'postcss', 'minify', 'autoprefixer', 'concat'].sort()
    )

    ucprocessor.load('test', file => {
        file.flag = true
        return Promise.resolve(file)
    })
    t.is(ucprocessor.support('test'), true)
    ucprocessor.unload('test')
    t.is(ucprocessor.support('test'), false)
})

test('ucprocessor.process should work correctly', t => {
    return ucprocessor.process(
        ['test/resource/sass/*.scss', '!test/resource/sass/_*.scss'],
        [
            'sass',
            {
                name: 'autoprefixer'
            },
            {
                name: 'concat',
                options: {
                    destFile: 'uni.css'
                }
            },
            {
                name: 'minify',
                options: {
                    rename: true,
                    safe: false
                }
            }
        ],
        { map: true }
    ).then(file => {
        const destPath = 'test/resource/expected'
        return ucprocessor.writeMap(file, '.', { destPath }).then(mapFile => {
            t.deepEqual(
                file.contents,
                readFileSync(join(file.cwd, destPath, file.relative))
            )
            t.deepEqual(
                mapFile.contents,
                readFileSync(join(mapFile.cwd, destPath, mapFile.relative))
            )
        })
    })
})
