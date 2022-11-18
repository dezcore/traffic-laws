const fs = require('fs');
const path = require('path');

function writeFile(filePath, fileName, content) {
    const _path = path.resolve(__dirname, filePath + "/" + fileName)

    if(_path) {
        fs.appendFile(_path, content, function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
    }
}

function getFileContent(filePath, fileName, callBack) {
    const _path = path.resolve(__dirname, filePath + "/" + fileName)

    if(_path) {
        callBack(fs.createReadStream(_path))
    }
}

module.exports = {
    writeFile,
    getFileContent
}