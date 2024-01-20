const { VideoModel } = require('../models/youtube')

const getVideoBySearch = async videoData => {
    const query = {
        video_id: {
            $regex: videoData.video_id,
            $options: 'i',
        },
    }

    try {
        return VideoModel.find(query).lean();
    } catch (err) {
        console.log('Error searching video', err)
        throw new Error(`Error searching video: ${err}`)
    }
}

const getLastVideo = async () => {
    try {
        return VideoModel.find().sort({ updated_at: -1 }).limit(1).lean();
    } catch (err) {
        console.log('Error searching video', err)
        throw new Error(`Error searching video: ${err}`)
    }
}

const createVideo = async videoData => VideoModel.findOneAndUpdate(
        { video_id: videoData.id },
        videoData,
        { new: true, upsert: true, timestamps: false },
    ).catch(err => {
        console.log('Error creating video', err)
        throw new Error(`Error creating client: ${err}`)
    })

module.exports = {
    getVideoBySearch,
    getLastVideo,
    createVideo,
}
