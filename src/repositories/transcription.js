const { TranscriptionModel } = require('../models/transcription')

const getTranscriptionBySearch = async transcriptionData => {
    const query = {
        video_id: {
            $regex: transcriptionData.video_id,
            $options: 'i',
        },
    }

    try {
        return TranscriptionModel.find(query).lean();
    } catch (err) {
        console.log('Error searching transcription', err)
        throw new Error(`Error searching transcription: ${err}`)
    }
}

const createTranscription = async transcriptionData => TranscriptionModel.findOneAndUpdate(
        { video_id: transcriptionData.id },
        transcriptionData,
        { new: true, upsert: true, timestamps: false },
    ).catch(err => {
        console.log('Error creating transcription', err)
        throw new Error(`Error creating transcription: ${err}`)
    })

module.exports = {
    getTranscriptionBySearch,
    createTranscription,
}
