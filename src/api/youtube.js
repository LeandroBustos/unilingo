const express = require('express');
const { getVideoDataById } = require('../services/youtube');
const { createVideo, getLastVideo } = require('../repositories/youtube');

const router = express.Router();

router.get('/video/last/info', async (req, res, next) => {
    try {
        const video = await getLastVideo()
        if (!video.length) throw new Error('Video doesnt exists in DB')
        return res.json(video[0]);
    } catch (err) {
        next()
    }
});

router.get('/video/:id/info', async (req, res, next) => {
    const { id } = req.params

    try {
        const videoInfo = await getVideoDataById(id)
        const video = await createVideo({
            video_id: videoInfo.id,
            ...videoInfo,
        })
        return res.json(video);
    } catch (err) {
        next()
    }
});

router.post('/video/:id', async (req, res, next) => {
    const { title } = req.body
    try {
        const video = await createVideo({ title })
        return res.json(video);
    } catch (err) {
        next()
    }
});

module.exports = router;
