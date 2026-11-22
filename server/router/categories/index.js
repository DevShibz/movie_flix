const router = require('express').Router();
const {
    createCategory,
    getCategories,
    getCategoryByName,
    updateCategory,
    addMovieCategory,
    removeMovieFromCategory,
} = require('../../controllers/categories');
const { validateObjectId } = require('../../middleware/validateObjectId');

router.get('/categories', getCategories);
router.get('/categories/:name', getCategoryByName);
router.patch('/categories/:categoryId', validateObjectId('params', 'categoryId'), updateCategory);
router.post('/addMovieCategory', createCategory);
router.post(
    '/updateMoviesInCategory',
    validateObjectId('body', 'categoryId'),
    validateObjectId('body', 'movieId'),
    addMovieCategory
);
router.post(
    '/removeMovieFromCategory',
    validateObjectId('body', 'categoryId'),
    validateObjectId('body', 'movieId'),
    removeMovieFromCategory
);

module.exports = router;
