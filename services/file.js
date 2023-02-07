const fs = require('fs');
const fs_promise = require('fs/promises');
const path = require('path');
const filePath = "../files"
const dir = path.resolve(__dirname, filePath)

async function exists (path) {  
    try {
      await fs_promise.access(path)
      return true
    } catch {
      return false
    }
}

function appendFile(filePath, fileName, content, callBack) {
    const _path = path.resolve(__dirname, filePath + "/" + fileName)

    if(!fs.existsSync(dir))
        fs.mkdirSync(dir)
        
    if(_path) {
        try {
            return fs.appendFile(_path, content, function (err) {
                if (err) callBack(err)
                console.log('Saved!')
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
            return fs.writeFile(_path, content, err => {
                if (err) {
                  console.error(err);
                } else {
                    callBack()
                }
             })
        } catch (error) {
            callBack(error, null)
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

function closeStream(stream) {
    if(stream) {
        stream.close()
        stream.push(null);
        stream.read(0);
    }
}

async function getFileContent(filePath, fileName, callBack) {
    let stream
    const _path = path.resolve(__dirname, filePath + "/" + fileName)

    if(_path) {
        try {
            stream = fs.createReadStream(_path)
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
    closeStream,
    getFileContent
}