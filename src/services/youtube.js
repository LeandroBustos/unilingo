const { google } = require('googleapis');

const apiKey = process.env.YOUTUBE_API_KEY;

const client = google.youtube({
    version: 'v3',
    auth: apiKey,
});

const getVideoDataById = async (id) => client.videos
    .list({
        part: 'snippet,contentDetails,statistics',
        id,
    })
    .then((response) => {
        const videoInfo = response.data.items[0];
        if (!videoInfo) throw new Error('Video Not Found')
        console.log('Información del Video:', videoInfo);
        return videoInfo
    })
    .catch((error) => {
        console.error('Error al obtener la información del video:', error.message);
        throw error
    });

module.exports = {
    getVideoDataById,
}
