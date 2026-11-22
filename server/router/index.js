const router = require('express').Router();

router.use('/movies', require('./categories'));
router.use('/movies', require('./movies'));
router.use('/assets', require('./assets'));

module.exports = router;
