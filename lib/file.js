/**
 * Rewrite based on vinyl
 *
 * repo: https://github.com/gulpjs/vinyl
 * license: https://github.com/gulpjs/vinyl/blob/master/LICENSE
 */

const path = require('path')
const mkdirp = require('mkdirp')
const { writeFileSync, readFileSync, existsSync } = require('fs')
const { unixStylePath } = require('./utils')

const PROPERTIES = ['cwd', 'base', 'path', 'contents', 'history']

class File {
    constructor (file = {}, { loadContents } = {}) {
        if (!file) {
            throw new Error('File#constructor: invalid arguments.')
        }

        this.history = Array.prototype.slice.call(file.history || [])
        this.contents = file.contents
        this._cwd = unixStylePath(file.cwd || process.cwd())
        if (file.path) {
            this.path = file.path
        }
        if (file.base) {
            this._base = unixStylePath(file.base)
        }
        if (!file.contents && loadContents && this.path) {
            try {
                this.contents = readFileSync(this.path)
            } catch (e) {}
        }
    }
    static isFile (file) {
        return file instanceof File
    }
    static from (path, cwd, loadContents) {
        if (!path) {
            throw new Error('File.from must has a valid path.')
        }
        return new File({ cwd, path }, { loadContents })
    }
    dest (destDir, creatDirIfNotExist = true) {
        if (!this.contents) {
            return
        }
        const dest = destDir ? path.resolve(this.cwd, destDir, this.relative) : this.path
        if (!existsSync(dest)) {
            mkdirp.sync(path.dirname(dest))
        }
        writeFileSync(
            dest,
            this.contents
        )
    }
    clone (opts) {
        opts = Object.assign({ history: false }, opts)
        const file = {}
        PROPERTIES.forEach(v => {
            if (!(v in opts) || opts[v]) {
                file[v] = this[v]
            }
        })
        return new File(file)
    }
    read () {
        if (this.path) {
            try {
                this.contents = readFileSync(this.path)
            } catch (e) {}
        }
    }
    basename (ext) {
        return path.basename(this.path, ext)
    }
    get path () {
        return this.history[this.history.length - 1]
    }
    set path (path) {
        if (typeof path !== 'string') {
            throw new Error('path should be a string.')
        }
        path = unixStylePath(path)

        // Record history only when path changed
        if (path && path !== this.path) {
            this.history.push(path)
        }
    }
    get relative () {
        if (!this.path) {
            throw new Error('No path specified! Can not get relative.')
        }
        return path.relative(this.base, this.path)
    }
    set relative (r) {
        throw new Error('File.relative is generated from the base and path attributes. Do not modify it.')
    }
    get cwd () {
        return this._cwd
    }
    set cwd (cwd) {
        if (!cwd || typeof cwd !== 'string') {
            throw new Error('cwd must be a non-empty string.')
        }
        this._cwd = unixStylePath(cwd)
    }
    get base () {
        return this._base || this._cwd
    }
    set base (base) {
        if (base == null) {
            delete this._base
            return
        }
        if (typeof base !== 'string' || !base) {
            throw new Error('base must be a non-empty string, or null/undefined.')
        }
        base = unixStylePath(base)
        if (base !== this._cwd) {
            this._base = base
        }
    }
}

module.exports = File
