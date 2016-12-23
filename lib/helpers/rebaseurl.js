const { relative, resolve, dirname } = require('path')

function isUrl (url) {
    return url && /^(https?|webpack(-[^:]+)?):\/\//.test(url)
}

function isDataUrl (url) {
    return url && /^(data:.*;.*,)/.test(url)
}

/**
 * rebase url
 * @param  {String} url     asset's url (asset is in current file)
 * @param  {String} base    current file's base
 * @param  {String} path    current file's path
 * @param  {String} destDir new file's dest dir
 * @return {String}         rebased url
 */
function rebase (url, { base, path, destDir } = {}) {
    if (isUrl(url) || isDataUrl(url) || url[0] === '/' || url[0] === '#') {
        return url
    }

    let resourceAbsUrl = relative(base, resolve(dirname(path), url))
    resourceAbsUrl = relative(destDir, resourceAbsUrl)
    return resourceAbsUrl
}

module.exports = rebase
