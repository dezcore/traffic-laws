const fs = require('fs');
const path = require('path');
const filePath = "../files"
const dir = path.resolve(__dirname, filePath)

function appendFile(filePath, fileName, content, callBack) {
    const _path = path.resolve(__dirname, filePath + "/" + fileName)

    if(!fs.existsSync(dir))
        fs.mkdirSync(dir)

    if(_path) {
        try {
            return fs.appendFile(_path, content, function (err) {
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

    if(!fs.existsSync(dir))
        fs.mkdirSync(dir)

    if(_path) {
        try {
            return fs.writeFile(_path, content, (err) => {                
                console.log('Saved!')
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

function deleteFile(filePath, fileName, callBack) {
    const _path = path.resolve(__dirname, filePath + "/" + fileName)
    
    if(_path) {
        try {
            return fs.unlink(_path, (err) => {
                if(callBack)
                    callBack(err)
            })
        } catch (error) {
            callBack(error, null)
        }
    }
}

function getFileContent(filePath, fileName, callBack) {
    let stream
    const _path = path.resolve(__dirname, filePath + "/" + fileName)

    if(_path) {
        try {
            stream = fs.createReadStream(_path)
            //stream.on("error", err => console.log("err : ", err))
            //stream.on("data", chunk => console.log("chunk : ", chunk))
            /*stream.on('data', function (chunk) {
                callBack(null, chunk)
            })*/
            callBack(null, stream)
        } catch (error) {
            callBack(error, null)
        }
    }
}

module.exports = {
    writeFile,
    appendFile,
    deleteFile,
    getFileContent
}