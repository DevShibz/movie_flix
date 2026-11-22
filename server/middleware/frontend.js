const express = require('express');
const path = require('path');
const { isProd, paths } = require('../config');

// Serves the React app: built files in production, Vite middleware (HMR) in development.
async function attachFrontend(app) {
    if (isProd) {
        app.use(express.static(paths.dist));
        app.get('/{*splat}', (req, res) => {
            res.sendFile(path.join(paths.dist, 'index.html'));
        });
        return;
    }

    const { createServer } = await import('vite');
    const vite = await createServer({
        configFile: paths.viteConfig,
        server: { middlewareMode: true },
        appType: 'spa',
    });
    app.use(vite.middlewares);
}

module.exports = attachFrontend;
