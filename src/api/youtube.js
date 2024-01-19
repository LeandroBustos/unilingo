const express = require('express');
const { getVideoDataById } = require('../services/youtube');

const router = express.Router();

router.get('/video/:id/info', async (req, res) => {
    const { id } = req.params
    try {
        const videoInfo = await getVideoDataById(id)
        return res.json(videoInfo);
    } catch (err) {
        return res.statusCode(500).end();
    }
});

module.exports = router;
