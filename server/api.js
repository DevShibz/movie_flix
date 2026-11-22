const express = require('express');
const routes = require('./router');
const apiNotFound = require('./middleware/apiNotFound');
const errorHandler = require('./middleware/errorHandler');

// Deliberately free of any frontend/Vite imports: this file is what gets bundled into the Netlify Function.
function mountApi(app) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api', routes);
    app.use('/api', apiNotFound);
}

// The JSON API only. This is what runs as the Netlify Function (netlify/functions/api.js).
function createApi() {
    const app = express();
    mountApi(app);
    app.use(errorHandler);
    return app;
}

module.exports = { mountApi, createApi };
