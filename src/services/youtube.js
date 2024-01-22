const { google } = require('googleapis');
const { YOUTUBE_API_KEY } = require('../core/config');

const apiKey = YOUTUBE_API_KEY;

const client = google.youtube({
    version: 'v3',
    auth: apiKey,
});

const convertISO8601DurationToSeconds = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const seconds = match[3] ? parseInt(match[3], 10) : 0;

    return hours * 3600 + minutes * 60 + seconds;
}

const getVideoDataById = async (id) => {
    try {
        const videoInfoResponse = await client.videos.list({
            part: 'snippet,contentDetails,statistics',
            id,
        })
        const videoInfo = videoInfoResponse.data.items[0];
        if (!videoInfo) throw new Error('Video Not Found')
        const title = videoInfo.snippet.title;
        const viewCount = videoInfo.statistics.viewCount;
        const thumbnailUrl = videoInfo.snippet.thumbnails.default.url;
        const durationIsoString = videoInfo.contentDetails.duration;
        const durationInSeconds = convertISO8601DurationToSeconds(durationIsoString);

        let latestCommentText = null
        try {
            const commentsInfoResponse = await client.commentThreads.list({
                part: 'snippet',
                videoId: id,
                order: 'time', // Order comments by time to get the latest
                maxResults: 1, // Get only the latest comment
            });
            if (commentsInfoResponse) {
                const latestComment = commentsInfoResponse.data.items[0];
                latestCommentText = latestComment.snippet.topLevelComment.snippet.textDisplay;
            }
        } catch (err) {
            console.error('Error al obtener la información de los comentarios del video:', err.message);
        }

        return {
            id,
            title,
            view_count: viewCount,
            latest_comment: latestCommentText,
            thumbnail: thumbnailUrl,
            duration: durationInSeconds,
        }
    } catch (err) {
        console.error('Error al obtener la información del video:', err.message);
        throw err
    }
}

module.exports = {
    getVideoDataById,
}
