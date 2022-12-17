const express = require('express')
const router = express.Router()
const trafficlawService = require('../services/index')

function verifyToken(req, res, next) {
  let tokens = null
  
  try {
    tokens = JSON.parse(req.headers.tokens)

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

/* GET test responses */
router.get('/', verifyToken, (req, res) => {
  trafficlawService.getFiles(req, res)
})

router.get('/file', verifyToken, (req, res) => {
  trafficlawService.getFiles(req, res)
})

router.get('/download', verifyToken, (req, res) => {
  trafficlawService.downloadFile(req, res)
})

router.get('/responses', verifyToken, (req, res) => {
  trafficlawService.getResponses(req, res)
})

router.get('/state', (req, res) => {
  trafficlawService.getState(res)
})

router.post('/', verifyToken, (req, res)=> {
  trafficlawService.postUserResponse(req, res)
})

router.post('/code', (req, res) => {
  trafficlawService.getTokens(req, res)
})

router.post('/file', verifyToken, (req, res) => {
  trafficlawService.createFile(req, res)
})

router.post('/folder', verifyToken, (req, res) => {
  trafficlawService.createFolder(req, res)
})

router.post('/token', async function(req, res, next) {
  try {
    res.json(await trafficlawService.initGToken(req.body))
  } catch (err) {
    console.error(`Error while creating test responses`, err.message)
    next(err)
  }
})

/* PUT test responses */
router.put('/:id', async function(req, res, next) {
  try {
    res.json(await trafficlawService.update(req.params.id, req.body))
  } catch (err) {
    console.error(`Error while updating test responses`, err.message)
    next(err)
  }
})

/*DELETE test responses*/
router.delete('/folder/:name',  verifyToken, (req, res) => {
  trafficlawService.removeFolder(req, res)
})

module.exports = router