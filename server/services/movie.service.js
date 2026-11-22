const Movie = require('../models/movies');
const HttpError = require('../utils/HttpError');

const listMovies = () => Movie.find().populate('assets', 'images videos trailers');

const listBannerMovies = () =>
    Movie.find({ isBanner: true }).populate('assets', 'images videos trailers');

const createMovie = (data) => Movie.create(data);

const EDITABLE_FIELDS = ['title', 'director', 'releaseYear', 'genre', 'isBanner'];

async function updateMovie(movieId, body = {}) {
    const changes = {};
    for (const field of EDITABLE_FIELDS) {
        if (body[field] !== undefined) changes[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
    if (Object.keys(changes).length === 0) {
        throw HttpError.badRequest(`Send at least one of: ${EDITABLE_FIELDS.join(', ')}.`);
    }

    const movie = await Movie.findByIdAndUpdate(movieId, { $set: changes }, { returnDocument: 'after', runValidators: true });
    if (!movie) throw HttpError.notFound('Movie not found');
    return movie;
}

async function getMovieDetails(movieId) {
    const movie = await Movie.findById(movieId).populate('assets', 'images videos trailers');
    if (!movie) throw HttpError.notFound('Movie not found');
    return movie;
}

async function getMovieOrThrow(movieId) {
    const movie = await Movie.findById(movieId);
    if (!movie) throw HttpError.notFound('Movie not found');
    return movie;
}

module.exports = { listMovies, listBannerMovies, createMovie, updateMovie, getMovieDetails, getMovieOrThrow };
