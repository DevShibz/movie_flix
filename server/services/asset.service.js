const MovieAsset = require('../models/movie_assets');
const HttpError = require('../utils/HttpError');
const movieService = require('./movie.service');

const ASSET_TYPES = ['images', 'videos', 'trailers'];

function validateAsset({ type, url }) {
    if (!ASSET_TYPES.includes(type)) {
        throw HttpError.badRequest(`"type" must be one of: ${ASSET_TYPES.join(', ')}.`);
    }
    if (typeof url !== 'string' || !url.trim()) {
        throw HttpError.badRequest('"url" is required.');
    }
    return url.trim();
}

async function addAssetToMovie({ movieId, type, url }) {
    const cleanUrl = validateAsset({ type, url });

    await movieService.getMovieOrThrow(movieId);

    return MovieAsset.findOneAndUpdate(
        { movieId },
        { $addToSet: { [type]: cleanUrl } },
        { upsert: true, returnDocument: 'after' }
    );
}

async function removeAssetFromMovie({ movieId, type, url }) {
    const cleanUrl = validateAsset({ type, url });

    await movieService.getMovieOrThrow(movieId);
    await MovieAsset.updateOne({ movieId }, { $pull: { [type]: cleanUrl } });
}

async function updateAssetUrl({ movieId, type, oldUrl, newUrl }) {
    const from = validateAsset({ type, url: oldUrl });
    const to = validateAsset({ type, url: newUrl });

    await movieService.getMovieOrThrow(movieId);

    const result = await MovieAsset.updateOne({ movieId, [type]: from }, { $set: { [`${type}.$`]: to } });
    if (!result.matchedCount) throw HttpError.notFound('That asset was not found on this movie');
}

// The first item of each list is the one the site shows, so "primary" means "move to the front".
async function setPrimaryAsset({ movieId, type, url }) {
    const clean = validateAsset({ type, url });

    await movieService.getMovieOrThrow(movieId);

    const assets = await MovieAsset.findOne({ movieId, [type]: clean });
    if (!assets) throw HttpError.notFound('That asset was not found on this movie');

    assets[type] = [clean, ...assets[type].filter((item) => item !== clean)];
    await assets.save();
}

async function getAssetsByMovieId(movieId) {
    await movieService.getMovieOrThrow(movieId);
    return MovieAsset.find({ movieId }, 'movieId images videos trailers');
}

module.exports = { ASSET_TYPES, addAssetToMovie, removeAssetFromMovie, updateAssetUrl, setPrimaryAsset, getAssetsByMovieId };
