const HttpError = require('../utils/HttpError');
const { upload } = require('../config');

const MAX_UPLOAD_MB = upload.maxFileSizeBytes / (1024 * 1024);

function toHttpError(error) {
    if (error instanceof HttpError) return error;

    if (error.type === 'entity.parse.failed') {
        return new HttpError(400, 'Request body must contain valid JSON.');
    }
    if (error.type === 'entity.too.large') {
        return new HttpError(413, 'Request body is too large.');
    }
    if (error.name === 'MulterError') {
        return error.code === 'LIMIT_FILE_SIZE'
            ? new HttpError(413, `Uploaded file exceeds the ${MAX_UPLOAD_MB} MB limit.`)
            : new HttpError(400, 'Invalid multipart upload.');
    }
    if (error.name === 'ValidationError') return new HttpError(400, error.message);
    if (error.name === 'CastError') return new HttpError(400, `Invalid value for "${error.path}".`);
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0];
        return new HttpError(409, field ? `A record with this ${field} already exists.` : 'A record with the same unique value already exists.');
    }

    return null;
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);

    const known = toHttpError(error);
    if (!known) console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, error);

    const status = known ? known.status : 500;
    res.status(status).json({ error: known ? known.message : 'Internal Server Error' });
}

module.exports = errorHandler;
