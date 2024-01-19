const express = require('express');

const youtube = require('./youtube');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/youtube', youtube);

module.exports = router;
