const router = require('express').Router();
const { getMovies, getBannerMovies, getMovieDetail, updateMovie, addMovie } = require('../../controllers/movies');
const { validateObjectId } = require('../../middleware/validateObjectId');

router.get('/', getMovies);
router.post('/', addMovie);
router.get('/getBannerMovies', getBannerMovies);
// "/detail/:id" (not "/:id") so it never swallows the web app's "/movies/:category" pages
router.get('/detail/:movieId', validateObjectId('params', 'movieId'), getMovieDetail);
router.patch('/detail/:movieId', validateObjectId('params', 'movieId'), updateMovie);

module.exports = router;
