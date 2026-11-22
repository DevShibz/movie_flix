const cloudinary = require('../config/cloudinary');
const HttpError = require('../utils/HttpError');

function assertConfigured() {
    const { cloud_name, api_key, api_secret } = cloudinary.config();
    if (!cloud_name || !api_key || !api_secret) {
        throw HttpError.unavailable(
            'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
        );
    }
}

const UPLOAD_FOLDER = 'movie-manager';

// Lets the browser upload a file straight to Cloudinary (large videos, progress bar)
// without exposing the API secret: only this short-lived signature is shared.
function createUploadSignature() {
    assertConfigured();

    const { cloud_name, api_key, api_secret } = cloudinary.config();
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ folder: UPLOAD_FOLDER, timestamp }, api_secret);

    return { cloudName: cloud_name, apiKey: api_key, folder: UPLOAD_FOLDER, timestamp, signature };
}

async function uploadBuffer(buffer) {
    assertConfigured();

    try {
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, uploaded) => {
                if (error) return reject(error);
                if (!uploaded) return reject(new Error('Cloudinary returned no upload result.'));
                resolve(uploaded);
            });
            stream.end(buffer);
        });

        return { url: result.secure_url, publicId: result.public_id };
    } catch (error) {
        console.error('Error uploading asset to Cloudinary:', error);
        throw HttpError.badGateway('Cloudinary upload failed');
    }
}

async function removeImage(publicId) {
    assertConfigured();

    let result;
    try {
        result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
        console.error('Error removing asset from Cloudinary:', error);
        throw HttpError.badGateway('Cloudinary asset removal failed');
    }

    if (result.result !== 'ok' && result.result !== 'not found') {
        throw HttpError.badGateway('Cloudinary asset removal failed');
    }
}

module.exports = { createUploadSignature, uploadBuffer, removeImage };
