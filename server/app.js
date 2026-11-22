const express = require('express');
const { mountApi } = require('./api');
const attachFrontend = require('./middleware/frontend');
const errorHandler = require('./middleware/errorHandler');

// The API plus the React app: Vite middleware in development, built files in production.
async function createApp() {
    const app = express();
    mountApi(app);
    await attachFrontend(app);
    app.use(errorHandler);
    return app;
}

module.exports = createApp;
