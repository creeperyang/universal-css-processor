const { join } = require('path')
const { readFileSync } = require('fs')
const test = require('ava')
const File = require('../lib/file')

test('File constructor should work correctly.', t => {
    const file = new File({
        cwd: process.cwd(),
        path: __filename,
        base: join(__filename, '..')
    })
    t.is(file.path, __filename)
    t.is(file.cwd, process.cwd())
    t.is(file.base, join(__filename, '..'))
    t.is(file.contents, undefined)
})

test('File.from should work correctly.', t => {
    const file = File.from(__filename, process.cwd(), true)
    t.is(file.path, __filename)
    t.is(file.cwd, process.cwd())
    t.is(file.base, file.cwd)
    t.deepEqual(file.contents, readFileSync(__filename))
})

test(`File's properties should work correctly.`, t => {
    const file = File.from(__filename, process.cwd())
    t.throws(() => {
        file.base = false
    })
    t.throws(() => {
        file.relative = './a'
    })
    t.throws(() => {
        file.cwd = null
    })

    t.deepEqual(file.history, [__filename])
    file.cwd = '/x'
    file.base = '/x/y'
    file.path = '/x/y/z'
    t.is(file.cwd, '/x')
    t.is(file.base, '/x/y')
    t.is(file.path, '/x/y/z')
    t.deepEqual(file.history, [__filename, '/x/y/z'])
})
