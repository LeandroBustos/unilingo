const express = require('express');
const { getVideoDataById } = require('../services/youtube');

const router = express.Router();

router.get('/video/:id/info', async (req, res, next) => {
    const { id } = req.params
    try {
        const videoInfo = await getVideoDataById(id)
        return res.json(videoInfo);
    } catch (err) {
        next()
    }
});

module.exports = router;
