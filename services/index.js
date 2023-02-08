const helper = require('../helper')
const config = require('../config')
const google = require('./../plugins/youtube')

function setTokens(tokens, callBack) {
  google.setTokens(tokens, callBack)
}

function getTokens(req, res) {
  if(req && res) {
    google.getTokens(req, (err, tokens) => {
      if(err) {
        res.status(403).send(err)
      } else {
        res.json({"tokens" : tokens})
      }
    })
  }
}

function getState(res) {
  if(res)
   google.getState(res)
}

function getFiles(req, res) {
  if(req && res) {
    google.search(null, (err1, response) => {
      if(err1) {
        res.sendStatus(403)
      } else {
        res.json({"files" : response.data.files.map((file) => {
          return {name : file.name, fileId : file.id}
        })})
      }
    })
  }
}

function downloadFile(req, res) {
  const fileId = req.query.fileId

  if(fileId) {
    google.downloadFile(fileId, (err1, res1) => {
      if(err1) {
        res.sendStatus(403)
      } else {
        res.json(res1.data)
      }
    })
  }
}

function getResponses(req, res) {
  const name = req.query.name

  if(name && res) {
    google.search('name = \'' + name + '\'', (err1, res1) => {
      if(err1) {
        res.statusCode = 401
        res.send(err1.response)
      } else {
        res.json(res1.data.files)
      }
    })
  }
}

function createFolder(req, res, callBack) {
  const folderName = req.body.folderName

  if(folderName) {
    google.createFolder(folderName, (err, res) => {
      if(callBack) {
        callBack(err, res)
      } else if(err) {
        res.sendStatus(403)
      } else if(res.data && res.data.files) {
        res.json({"file" : res.data.files[0].id})
      }
    })
  }
}

function createFile(req, res, callBack) {
  google.createFile(req, function(err, response){
    if(err) {
      res.statusCode = 403
      res.send(err)
    } else if(response) {
      res.json({"file" : response})
    } else if(callBack) {
      callBack(err, response)
    }
  })
}

function postUserResponse(req, res) {
  const fileName = req.body.fileName

  if(req && res) {
    createFolder(req, res, (err1, folderId) => {
      if(err1) {
        res.statusCode = 403
        res.send(err1.response)
      } else if(fileName) {
        req.body.folderId = folderId
        req.body.media = "json"
        createFile(req, res, (err2, file2) => {
          if(err2) res.sendStatus(403)
          else res.json({"file" : file2})
        })
      } else {
        res.statusCode = 403
        res.send(err1.response)
      } 
    })
  }

}

function create(){ 
  return {"message": "Hello world !"}
}

function update(){
 return {"message": "Hello world !"}
}

function removeFolder(req, res) {
  const folderName = req.params.name

  if(req && res) {
    google.deleteFolder(folderName, (err, response)=>{
      if(err) {
        res.statusCode = 403
        res.send(err)
      } else if(response) {
        res.json({"delete" : response})
      } 
    })
  }
}

module.exports = {
  create,
  update,
  getFiles,
  getState,
  getTokens,
  setTokens,
  createFile,
  createFolder,
  removeFolder,
  getResponses,
  downloadFile,
  postUserResponse
}