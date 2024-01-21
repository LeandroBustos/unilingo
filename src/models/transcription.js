const mongoose = require('../core/mongo')

const transcriptionSchema = new mongoose.Schema(
    {
        video_id: { type: String, required: true },
        transcription: { type: String, required: true },
    },
    {
        versionKey: false,
    },
);

transcriptionSchema.pre('findOneAndUpdate', function (next) {
    this._update.updated_at = new Date();
    this._update.created_at = this._update.created_at
    next();
});

const TranscriptionModel = mongoose.model('Transcription', transcriptionSchema);

module.exports = {
    TranscriptionModel,
}
