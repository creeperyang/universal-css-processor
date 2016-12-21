const { join } = require('path')
const gp = require('glob-parent')
const globAll = require('glob-all')
const File = require('./file')
const sourceMapInit = require('./helpers/init')
const sourceMapWrite = require('./helpers/write')

class Assistant {
    constructor () {
        this._loadedProcessors = new Map()
        this._aliasMap = new Map()
    }
    static createFile ({ cwd, path, base, contents }) {
        return new File({
            cwd,
            path,
            base: base || cwd,
            contents
        }, { loadContents: true })
    }
    static createFiles (glob, options = {}) {
        if (!Array.isArray(glob)) {
            glob = [glob]
        }
        const cwd = options.cwd || process.cwd()
        const files = globAll.sync(glob, {
            cwd
        })
        let loadContents = true
        if (options.loadContents === false) {
            loadContents = false
        }
        const base = options.base || join(cwd, gp(glob[0]))
        return files.map(v => new File({
            cwd,
            base,
            path: join(cwd, v)
        }, { loadContents }))
    }
    load (name, fn) {
        if (!name || !fn) {
            throw new Error(`Assistant.load: invalid arguments`)
        }
        this._loadedProcessors.set(name, fn)
    }
    unload (name) {
        return name && this._loadedProcessors.delete(name)
    }
    alias (alias, origin) {
        if (!origin || !alias || alias === origin) {
            return false
        }
        if (this._loadedProcessors.has(origin)) {
            this._aliasMap.set(alias, origin)
            return true
        }
        return false
    }
    unalias (aliasName) {
        return this._aliasMap.delete(aliasName)
    }
    support (name) {
        return this._loadedProcessors.has(name) || this._aliasMap.has(name)
    }
    list (withEntries) {
        return withEntries
            ? this._loadedProcessors.entries()
            : this._loadedProcessors.keys()
    }
    apply (files, loaders, options = {}) {
        if (!Array.isArray(files) || !Array.isArray(loaders)) {
            throw new Error('Assistant.apply: invalid arguments')
        }
        const loadersBeforeConcat = []
        const loadersAfterConcat = []
        let hasConcatLoader = false
        loaders.forEach(loader => {
            if (typeof loader === 'string') {
                loader = {
                    name: loader,
                    options: {}
                }
            }
            if (loader.name === 'concat') {
                hasConcatLoader = true
            }
            if (hasConcatLoader) {
                loadersAfterConcat.push(loader)
            } else {
                loadersBeforeConcat.push(loader)
            }
        })
        const promises = files.map(file => {
            let promise = options.map ? sourceMapInit(file) : Promise.resolve(file)
            loadersBeforeConcat.forEach(loader => {
                let loaderFn = this._loadedProcessors.get(loader.name)
                promise = promise.then(file => loaderFn(file, loader.options))
            })
            return promise
        })
        return Promise.all(promises).then(files => {
            const concatLoader = loadersAfterConcat.shift()
            if (!concatLoader) return files
            return this._loadedProcessors.get(concatLoader.name)(
                files,
                concatLoader.options
            ).then(joinedFile => {
                let promise = Promise.resolve(joinedFile)
                loadersAfterConcat.forEach(loader => {
                    let loaderFn = this._loadedProcessors.get(loader.name)
                    promise = promise.then(file => loaderFn(file, loader.options))
                })
                return promise
            })
        })
    }
    process (glob, loaders, options = {}) {
        if (!loaders || !loaders.length || !glob) {
            throw new Error('Assistant.process: invalid arguments.')
        }
        if (options.map !== false) {
            options.map = true
        }
        const files = Assistant.createFiles([].concat(glob), options)
        return this.apply(files, loaders, options)
    }
}

const man = new Assistant()
man.load('css', require('./processors/css'))
man.load('less', require('./processors/less'))
man.load('sass', require('./processors/sass'))
man.load('postcss', require('./processors/postcss'))
man.load('minify', require('./processors/minify'))
man.load('autoprefixer', require('./processors/autoprefixer'))
man.load('concat', require('./processors/concat'))
man.alias('scss', 'sass')

exports = module.exports = man
exports.Assistant = Assistant
exports.writeMap = sourceMapWrite
