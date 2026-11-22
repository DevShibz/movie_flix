const router = require('express').Router();
const {
    addAssetToMovie,
    removeMovieAsset,
    updateMovieAsset,
    setPrimaryAsset,
    getMovieAssets,
    getUploadSignature,
    uploadAsset,
    removeAsset,
} = require('../../controllers/assets');
const { validateObjectId } = require('../../middleware/validateObjectId');
const { uploadSingleFile } = require('../../middleware/upload');

router.get('/movie/:movieId', validateObjectId('params', 'movieId'), getMovieAssets);
router.post('/addAsset', validateObjectId('body', 'movieId'), addAssetToMovie);
router.post('/removeMovieAsset', validateObjectId('body', 'movieId'), removeMovieAsset);
router.post('/updateMovieAsset', validateObjectId('body', 'movieId'), updateMovieAsset);
router.post('/setPrimaryAsset', validateObjectId('body', 'movieId'), setPrimaryAsset);
router.post('/uploadSignature', getUploadSignature);
router.post('/uploadAsset', uploadSingleFile, uploadAsset);
router.post('/removeAsset', removeAsset);

module.exports = router;
