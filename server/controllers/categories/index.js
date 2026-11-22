const categoryService = require('../../services/category.service');

async function createCategory(req, res) {
    await categoryService.createCategory(req.body || {});
    res.json({ message: 'Category added successfully' });
}

async function getCategories(req, res) {
    res.json(await categoryService.listCategories());
}

async function getCategoryByName(req, res) {
    res.json(await categoryService.getCategoryWithMovies(req.params.name));
}

async function updateCategory(req, res) {
    const category = await categoryService.updateCategory(req.params.categoryId, req.body || {});
    res.json({ message: 'Category updated successfully', category });
}

async function addMovieCategory(req, res) {
    const { categoryId, movieId } = req.body;
    await categoryService.addMovieCategory({ categoryId, movieId });
    res.json({ message: 'Movie category updated successfully' });
}

async function removeMovieFromCategory(req, res) {
    const { categoryId, movieId } = req.body;
    await categoryService.removeMovieFromCategory({ categoryId, movieId });
    res.json({ message: 'Movie removed from category successfully' });
}

module.exports = { createCategory, getCategories, getCategoryByName, updateCategory, addMovieCategory, removeMovieFromCategory };
