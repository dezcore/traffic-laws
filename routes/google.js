const express = require('express')
const router = express.Router()
const youtubeService = require('../services/youtube')

router.get('/youtube/download', (req, res) => {
  youtubeService.download(req, res)
})

router.get('/youtube/download/progress',(req, res) => {
  youtubeService.progress(req, res)
})

/*router.post('/', verifyToken, (req, res)=> {
  trafficlawService.postUserResponse(req, res)
})
router.put('/:id', async function(req, res, next) {
  try {
    res.json(await trafficlawService.update(req.params.id, req.body))
  } catch (err) {
    console.error(`Error while updating test responses`, err.message)
    next(err)
  }
})
router.delete('/folder/:name',  verifyToken, (req, res) => {
  trafficlawService.removeFolder(req, res)
})*/
module.exports = router