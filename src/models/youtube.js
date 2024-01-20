const mongoose = require('../core/mongo')

const videoSchema = new mongoose.Schema(
    {
        video_id: { type: String, required: true },
        title: { type: String, required: true },
        view_count: { type: Number, required: true },
        latest_comment: { type: String, required: true },
        created_at: { type: Date, required: true, default: Date.now },
        updated_at: { type: Date, required: true, default: Date.now },
    },
    {
        versionKey: false,
    },
);

videoSchema.pre('findOneAndUpdate', function (next) {
    this._update.updated_at = new Date();
    this._update.created_at = this._update.created_at
    next();
});

const VideoModel = mongoose.model('Video', videoSchema);

module.exports = {
    VideoModel,
}
