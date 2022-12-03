const fs = require('fs');
const path = require('path');

function appendFile(filePath, fileName, content, callBack) {
    const _path = path.resolve(__dirname, filePath + "/" + fileName)

    if(_path) {
        try {
            fs.appendFile(_path, content, function (err) {
                if (err) callBack(err);
                console.log('Saved!');
            });
        } catch (error) {
            callBack(error, null)
            // expected output: ReferenceError: nonExistentFunction is not defined
            // Note - error messages will vary depending on browser
        }
    }
}

function writeFile(filePath, fileName, content, callBack) {
    const _path = path.resolve(__dirname, filePath + "/" + fileName)

    if(_path) {
        try {
            fs.writeFile(_path, content, (err) => {
                //if (err) callBack(err)
                
                if(callBack)
                    callBack(err)

                console.log('Saved!')
            })
        } catch (error) {
            callBack(error, null)
            // expected output: ReferenceError: nonExistentFunction is not defined
            // Note - error messages will vary depending on browser
        }
    }
}

function deleteFile(filePath, fileName, callBack) {
    const _path = path.resolve(__dirname, filePath + "/" + fileName)
    
    if(_path) {
        try {
            fs.unlink(_path, (err) => {
                //if (err) callBack(err);
                if(callBack)
                    callBack(err)
            })
        } catch (error) {
            callBack(error, null)
            // expected output: ReferenceError: nonExistentFunction is not defined
            // Note - error messages will vary depending on browser
        }
    }
}

function getFileContent(filePath, fileName, callBack) {
    let stream
    const _path = path.resolve(__dirname, filePath + "/" + fileName)

    if(_path) {
        try {
            stream = fs.createReadStream(_path)
            callBack(null, stream)
        } catch (error) {
            callBack(error, null)
            // expected output: ReferenceError: nonExistentFunction is not defined
            // Note - error messages will vary depending on browser
        }
    }
}

module.exports = {
    writeFile,
    appendFile,
    deleteFile,
    getFileContent
}