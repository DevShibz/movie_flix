
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const movieSchema = new Schema({
    title: { type: String, required: true },
    director: { type: String, required: true },
    releaseYear: { type: Number, required: true },
    genre: { type: String, required: true },
    isBanner:{type:Boolean,default:false}
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

movieSchema.virtual('assets', {
    ref: 'MovieAsset',
    localField: '_id',
    foreignField: 'movieId'
});

movieSchema.index({ title: 1 }, { unique: true });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;