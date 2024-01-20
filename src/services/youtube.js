const { google } = require('googleapis');
const { YOUTUBE_API_KEY } = require('../core/config');

const apiKey = YOUTUBE_API_KEY;

const client = google.youtube({
    version: 'v3',
    auth: apiKey,
});

const getVideoDataById = async (id) => {
    try {
        const videoInfoResponse = await client.videos.list({
                part: 'snippet,contentDetails,statistics',
                id,
            })
        const videoInfo = videoInfoResponse.data.items[0];
        const title = videoInfo.snippet.title;
        const viewCount = videoInfo.statistics.viewCount;
        if (!videoInfo) throw new Error('Video Not Found')
        const commentsInfoResponse = await client.commentThreads.list({
                part: 'snippet',
                videoId: id,
                order: 'time', // Order comments by time to get the latest
                maxResults: 1, // Get only the latest comment
            });
        if (!commentsInfoResponse) throw new Error('Comments Not Found')

        const latestComment = commentsInfoResponse.data.items[0];
        const latestCommentText = latestComment.snippet.topLevelComment.snippet.textDisplay;
        return {
            id,
            title,
            view_count: viewCount,
            latest_comment: latestCommentText,
        }
    } catch (err) {
        console.error('Error al obtener la información del video:', err.message);
        throw err
    }
}

module.exports = {
    getVideoDataById,
}
