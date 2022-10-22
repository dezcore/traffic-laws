const express = require('express');
const router = express.Router();
const trafficlaws = require('../services/index');

/* GET test responses */
router.get('/', async function(req, res, next) {
  try {
    res.json(await trafficlaws.getMultiple(req.query.page));
  } catch (err) {
    console.error(`Error while getting test responses`, err.message);
    next(err);
  }
});

/* POST test responses */
router.post('/', async function(req, res, next) {
  try {
    res.json(await trafficlaws.create(req.body));
  } catch (err) {
    console.error(`Error while creating test responses`, err.message);
    next(err);
  }
});

/* PUT test responses */
router.put('/:id', async function(req, res, next) {
  try {
    res.json(await trafficlaws.update(req.params.id, req.body));
  } catch (err) {
    console.error(`Error while updating test responses`, err.message);
    next(err);
  }
});

/* DELETE test responses */
router.delete('/:id', async function(req, res, next) {
  try {
    res.json(await trafficlaws.remove(req.params.id));
  } catch (err) {
    console.error(`Error while deleting test responses`, err.message);
    next(err);
  }
});

module.exports = router;