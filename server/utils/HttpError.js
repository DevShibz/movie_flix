class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }

    static badRequest(message) {
        return new HttpError(400, message);
    }

    static notFound(message) {
        return new HttpError(404, message);
    }

    static badGateway(message) {
        return new HttpError(502, message);
    }

    static unavailable(message) {
        return new HttpError(503, message);
    }
}

module.exports = HttpError;
