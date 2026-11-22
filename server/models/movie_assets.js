const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const movieAssetSchema = new Schema({
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    images: [{ type: String }],
    videos: [{ type: String }],
    trailers: [{ type: String }]
});

// one asset document per movie; also makes the upsert in asset.service race-safe
movieAssetSchema.index({ movieId: 1 }, { unique: true });

const MovieAsset = mongoose.model('MovieAsset', movieAssetSchema);

module.exports = MovieAsset;