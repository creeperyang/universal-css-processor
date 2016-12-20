const { sep } = require('path')

module.exports = {
    unixStylePath
}

function unixStylePath (filePath) {
    return filePath.split(sep).join('/')
}
