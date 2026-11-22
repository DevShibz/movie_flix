const cloudinary = require('cloudinary').v2;
const { cloudinary: settings } = require('./index');

cloudinary.config({
    cloud_name: settings.cloudName,
    api_key: settings.apiKey,
    api_secret: settings.apiSecret,
});

module.exports = cloudinary;
