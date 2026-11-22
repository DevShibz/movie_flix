// fetch() calls ask for JSON first; page navigations ask for HTML first.
// Unmatched JSON requests get a real 404 instead of the SPA's index.html.
function apiNotFound(req, res, next) {
    if (req.accepts(['html', 'json']) === 'json') {
        return res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.path}` });
    }
    next();
}

module.exports = apiNotFound;
