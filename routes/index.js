const express = require('express')
const router = express.Router()
const trafficlawService = require('../services/index')

function verifyToken(req, res, next) {
  let bearer, bearerToken
  const bearerHeader = req.headers['authorization']

  if(typeof bearerHeader !== 'undefined') {
    bearer = bearerHeader.split(' ')
    bearerToken = bearer[1]
    req.body.code = bearerToken
    
    trafficlawService.validateCode(req, (validate, message) => {
      if(validate)
        next()
      else
        res.json({"code" : 403, "message" : message})

    })

  } else {
    res.sendStatus(403)
  }
}

/* GET test responses */
router.get('/', verifyToken, (req, res) => {
  trafficlawService.getFiles(req, res)
})

router.get('/state', (req, res) => {
  trafficlawService.getState(res)
})

router.post('/code', async function(req, res) {
  trafficlawService.getTokens(req, res)
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

/* DELETE test responses */
router.delete('/:id', async function(req, res, next) {
  try {
    res.json(await trafficlawService.remove(req.params.id))
  } catch (err) {
    console.error(`Error while deleting test responses`, err.message)
    next(err)
  }
})

module.exports = router