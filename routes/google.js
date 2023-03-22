const express = require('express')
const router = express.Router()
const youtubeService = require('../services/youtube')
const trafficlawService = require('../services/index')

function verifyToken(req, res, next) {
  let tokens = null

  try {
    tokens = Object.values(JSON.parse(req.headers.tokens))[0]
    
    if(tokens) {    
      trafficlawService.setTokens(tokens, () => {
          next()
      })
    } else {
      res.sendStatus(403)
    }

  } catch(e) {
    res.sendStatus(403)
  }
}

router.get('/youtube/download', (req, res) => {
  youtubeService.download(req, res)
})

router.get('/youtube/download/progress',(req, res) => {
  youtubeService.progress(req, res)
})

router.get('/drive/file/:name', verifyToken, (req, res) => {
  trafficlawService.getFile(req, res)
})

router.get('/drive/file/content/:name', verifyToken, (req, res) => {
  trafficlawService.getFileContent(req, res)
})

router.get('/drive/download', verifyToken, (req, res) => {
  trafficlawService.downloadFile(req, res)
})

router.get('/drive/files', verifyToken, (req, res) => {
  trafficlawService.getFiles(req, res)
})

router.post('/drive/', verifyToken, (req, res) => {
  trafficlawService.postUserResponse(req, res)
})

router.delete('/drive/file/:id',  verifyToken, (req, res) => {
  trafficlawService.removeFile(req, res)
})

router.delete('/drive/folder/:name',  verifyToken, (req, res) => {
  trafficlawService.removeFolder(req, res)
})

module.exports = router