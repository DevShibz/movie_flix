const express = require('express');
const routes = require('./router');
const apiNotFound = require('./middleware/apiNotFound');
const attachFrontend = require('./middleware/frontend');
const errorHandler = require('./middleware/errorHandler');

async function createApp() {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(routes);
    app.use(apiNotFound);
    await attachFrontend(app);

    app.use(errorHandler);
    return app;
}

module.exports = createApp;
