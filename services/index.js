const helper = require('../helper')
const config = require('../config')
const google = require('./../plugins/youtube')
const fileService = require('./file')

function setTokens(tokens, callBack) {
  google.setTokens(tokens, callBack)
}

function getTokens(req, res) {
  if(req && res) {
    google.getTokens(req, (err, tokens) => {
      if(err) {
        res.sendStatus(403)
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

function exist(name, callBack) {
  if(name) {
    google.search('name = \'' + name + '\'', (err1, exist) => {
      if(callBack) {
        callBack(err1, exist)
      } else if(err1) {
        res.sendStatus(403)
      } else {
        res.json({"exist" : exist})
      }
    })
  }
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

function getResponses(req, res) {
  const name = req.query.name
  console.log("getResponses : ", req)
  if(name && res) {
    google.search('name = \'' + name + '\'', (err1, file) => {
      if(err1) {
        res.sendStatus(403)
      } else {
        res.json({"file" : file})
      }
    })
  }0
}

function createFolder(req, res, callBack) {
  const folderName = req.body.folderName

  if(folderName) {
    exist(folderName, (err1, res1) => {
      if(callBack && res1.data && 0 < res1.data.files.length) {
        callBack(err1, res1.data.files[0].id)
      } else if(err1) {
        res.status(403).render()
      } else if(res1.data && res1.data.files.length === 0) {
        google.createFolder(folderName, (err2, res2) => {
          if(callBack) {
            callBack(err2, res2.data.id)
          } else if(err1) {
            res.sendStatus(403)
          } else {
            res.json({"file" : res2.data.files[0].id})
          }
        })
      } else {
        res.json({"file" : res1.data.files[0].id})
      }
    })
  } else {
    res.sendStatus(403)
  }
}

function createFile(req, res, callBack) {
  const fileName = req.body.fileName
  const folderId = req.body.folderId

  if(fileName) {
    exist(fileName, (err1, res1) => {
      if(callBack && res1.data && 0 < res1.data.files.length) {
        callBack(err1, res1)
      } else if(err1) {
        res.status(403).render()
      } else if(res1.data && res1.data.files.length === 0) {
        google.createFile(fileName, req.body.media, folderId, (err2, res2) => {
          if(callBack) {
            callBack(err2, res2)
          } else if(err2) {
            res.sendStatus(403)
          } else {
            res.json({"fileId" : res2.data.id})
          }
        })
      } else {
        res.json({"file" : res1})
      }

    })
  } else {
    res.sendStatus(403)
  }
}

function postUserResponse(req, res) {
  //removeFolder(req, res)
  const fileName = req.body.fileName
  const content =JSON.stringify(req.body.data)
  if(req && res) {
    createFolder(req, res, (err1, folderId) => {
      if(err1) {
        res.sendStatus(403)
      } else if(fileName && content) {
        req.body.folderId = folderId
        req.body.media = "json"
        fileService.writeFile("../files/", fileName, content)
        createFile(req, res, (err2, file2) => {
          if(err2) res.sendStatus(403)
          else res.json({"file" : file2})
        })
      } else {
        res.sendStatus(403)
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
  const folderName = req.body.folderName

  if(req && res) {
    exist(folderName, (err1, res1) => {
      if(err1) {
        res.sendStatus(403)
      } else if(res1.data && 0 < res1.data.files.length) {
        google.deleteFile(res1.data.files[0].id, (err2, res2) => {
          if(err2) res.sendStatus(403)
          else res.json({"file" : res2}) 
        })
      }
    })
  }
}

function remove(id){
  return {"message": "Hello world !"}
}

module.exports = {
  exist,
  create,
  update,
  remove,
  getFiles,
  getState,
  getTokens,
  setTokens,
  createFile,
  createFolder,
  removeFolder,
  getResponses,
  postUserResponse
}