const Category = require('../models/category');
const HttpError = require('../utils/HttpError');
const movieService = require('./movie.service');

const createCategory = ({ name, description }) => Category.create({ name, description });

const listCategories = () => Category.find().populate('movies', 'title description');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function getCategoryWithMovies(name) {
    const category = await Category.findOne({ name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') }).populate({
        path: 'movies',
        populate: { path: 'assets', select: 'images videos trailers' },
    });
    if (!category) throw HttpError.notFound('Category not found');
    return category;
}

async function addMovieCategory({ categoryId, movieId }) {
    const category = await Category.findById(categoryId);
    if (!category) throw HttpError.notFound('Category not found');

    await movieService.getMovieOrThrow(movieId);

    await Category.updateOne({ _id: categoryId }, { $addToSet: { movies: movieId } });
}

async function updateCategory(categoryId, { name, description }) {
    const changes = {};
    if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) throw HttpError.badRequest('"name" cannot be empty.');
        changes.name = name.trim();
    }
    if (description !== undefined) changes.description = String(description).trim();
    if (Object.keys(changes).length === 0) throw HttpError.badRequest('Send "name" and/or "description" to update.');

    const category = await Category.findByIdAndUpdate(categoryId, { $set: changes }, { returnDocument: 'after', runValidators: true });
    if (!category) throw HttpError.notFound('Category not found');
    return category;
}

async function removeMovieFromCategory({ categoryId, movieId }) {
    const category = await Category.findById(categoryId);
    if (!category) throw HttpError.notFound('Category not found');

    await Category.updateOne({ _id: categoryId }, { $pull: { movies: movieId } });
}

module.exports = {
    createCategory,
    listCategories,
    getCategoryWithMovies,
    addMovieCategory,
    updateCategory,
    removeMovieFromCategory,
};
