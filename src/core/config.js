require('dotenv').config();

const decodedBuffer = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64');
const jsonString = decodedBuffer.toString('utf-8');

module.exports = {
    PORT: process.env.PORT || 3000,
    MONGODB_URI: process.env.MONGODB_URI,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    GOOGLE_APPLICATION_CREDENTIALS: JSON.parse(jsonString),
}
