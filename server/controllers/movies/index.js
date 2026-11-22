const movieService = require('../../services/movie.service');
const HttpError = require('../../utils/HttpError');

async function getMovies(req, res) {
    res.json(await movieService.listMovies());
}

async function getBannerMovies(req, res) {
    res.json(await movieService.listBannerMovies());
}

async function getMovieDetail(req, res) {
    res.json(await movieService.getMovieDetails(req.params.movieId));
}

async function updateMovie(req, res) {
    const movie = await movieService.updateMovie(req.params.movieId, req.body);
    res.json({ message: 'Movie updated successfully', movie });
}

async function addMovie(req, res) {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw HttpError.badRequest('Request body must be a movie object.');
    }

    const movie = await movieService.createMovie(req.body);
    res.status(201).json({ message: 'Movie added successfully', movieId: movie._id });
}

module.exports = { getMovies, getBannerMovies, getMovieDetail, updateMovie, addMovie };
