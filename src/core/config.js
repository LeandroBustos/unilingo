require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    MONGODB_URI: process.env.MONGODB_URI,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
}
