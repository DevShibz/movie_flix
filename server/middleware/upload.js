const multer = require('multer');
const { upload } = require('../config');

const uploader = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: upload.maxFileSizeBytes, files: 1 },
});

module.exports = { uploadSingleFile: uploader.single('file') };
