const HttpError = require('../utils/HttpError');

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const isObjectId = (value) => typeof value === 'string' && OBJECT_ID.test(value);

// validateObjectId('params', 'movieId') or validateObjectId('body', 'categoryId')
function validateObjectId(source, field) {
    return (req, res, next) => {
        const value = req[source] && req[source][field];
        if (!isObjectId(value)) {
            return next(HttpError.badRequest(`"${field}" must be a valid id.`));
        }
        next();
    };
}

module.exports = { validateObjectId, isObjectId };
