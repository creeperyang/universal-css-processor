const test = require('ava')
const rebase = require('../lib/helpers/rebaseurl')

test('rebase should return the same url if url is absolute/http(s)/hash', t => {
    t.is(rebase('#hash'), '#hash')
    t.is(rebase('/abs'), '/abs')
    t.is(rebase('https://cdn.com/icon.png'), 'https://cdn.com/icon.png')
    t.is(rebase('http://cdn.com/icon.png'), 'http://cdn.com/icon.png')
})

test('rebase should return rebase url correctly', t => {
    t.is(rebase('i.png', {
        base: '/proj',
        path: '/proj/src/1.css',
        destDir: 'dest'
    }), '../src/i.png')
})
