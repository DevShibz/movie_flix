const path = require('path');

const root = path.join(__dirname, '..');

try {
    process.loadEnvFile(path.join(root, '.env'));
} catch (error) {
    if (error.code !== 'ENOENT') throw error;
}

const env = process.env.NODE_ENV || 'development';

module.exports = {
    env,
    isProd: env === 'production',
    port: Number(process.env.PORT) || 3000,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/movies',
    paths: {
        root,
        dist: path.join(root, 'dist'),
        viteConfig: path.join(root, 'vite.config.js'),
    },
    upload: {
        maxFileSizeBytes: 10 * 1024 * 1024,
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
};
