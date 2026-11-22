// Anything under /api that no route handled gets a JSON 404 (never the web app's index.html).
function apiNotFound(req, res) {
    res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
}

module.exports = apiNotFound;
