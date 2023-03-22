const express = require('express')
const router = express.Router()
const openaiService = require('../services/openai')

router.get('/chatgpt/test', (req, res) => {
  openaiService.testChatGpt(req, res)
})

module.exports = router