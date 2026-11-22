const assetService = require('../../services/asset.service');
const cloudinaryService = require('../../services/cloudinary.service');
const HttpError = require('../../utils/HttpError');

async function addAssetToMovie(req, res) {
    const { movieId, type, url } = req.body || {};
    await assetService.addAssetToMovie({ movieId, type, url });
    res.json({ message: `Asset ${type} added to movie successfully` });
}

async function removeMovieAsset(req, res) {
    const { movieId, type, url } = req.body || {};
    await assetService.removeAssetFromMovie({ movieId, type, url });
    res.json({ message: `Asset ${type} removed from movie successfully` });
}

async function updateMovieAsset(req, res) {
    const { movieId, type, oldUrl, newUrl } = req.body || {};
    await assetService.updateAssetUrl({ movieId, type, oldUrl, newUrl });
    res.json({ message: `Asset ${type} updated successfully` });
}

async function setPrimaryAsset(req, res) {
    const { movieId, type, url } = req.body || {};
    await assetService.setPrimaryAsset({ movieId, type, url });
    res.json({ message: `Asset ${type} set as primary successfully` });
}

function getUploadSignature(req, res) {
    res.json(cloudinaryService.createUploadSignature());
}

async function getMovieAssets(req, res) {
    res.json(await assetService.getAssetsByMovieId(req.params.movieId));
}

async function uploadAsset(req, res) {
    if (!req.file || !req.file.buffer) {
        throw HttpError.badRequest('Provide a file in the "file" field');
    }

    const { url, publicId } = await cloudinaryService.uploadBuffer(req.file.buffer);
    res.json({ message: 'Asset uploaded to Cloudinary successfully', url, publicId });
}

async function removeAsset(req, res) {
    const { publicId } = req.body || {};
    if (!publicId) {
        throw HttpError.badRequest('Provide the Cloudinary public ID in the "publicId" field');
    }

    await cloudinaryService.removeImage(publicId);
    res.json({ message: 'Asset removed from Cloudinary successfully' });
}

module.exports = {
    addAssetToMovie,
    removeMovieAsset,
    updateMovieAsset,
    setPrimaryAsset,
    getMovieAssets,
    getUploadSignature,
    uploadAsset,
    removeAsset,
};
