const helper = require('../helper')
const config = require('../config')
const google = require('./../plugins/youtube')

function validateCode(req, callBack) {
  google.validateCode(req, callBack)
}

function getFiles(req, res) {
  if(req && res)
    google.getFiles(res)
}

function getTokens(req, res) {
  if(req && res) {
    google.getTokens(req, (err, tokens) => {
      if(err) {
        res.status(403).render()
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

async function create(programmingLanguage){ 
  return {"message": "Hello world !"}
}

async function update(id, programmingLanguage){
 return {"message": "Hello world !"}
}

async function remove(id){
  return {"message": "Hello world !"}
}

module.exports = {
  getFiles,
  create,
  update,
  remove,
  getState,
  getTokens,
  validateCode
}