const express = require('express');
const { getVideoDataById } = require('../services/youtube');

const router = express.Router();

router.get('/video/:id/info', (req, res) => {
    const { id } = req.params
    const videoInfo = getVideoDataById(id)
    res.json(videoInfo);
});

module.exports = router;
