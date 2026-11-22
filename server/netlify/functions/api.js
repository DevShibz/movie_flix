const serverless = require('serverless-http');
const { connectToDatabase } = require('../../db');
const { createApi } = require('../../api');

// Created once per warm function instance, so later requests reuse the app and the MongoDB connection.
let handlerPromise;

function getHandler() {
    if (!handlerPromise) {
        handlerPromise = connectToDatabase()
            .then(() => serverless(createApi()))
            .catch((error) => {
                handlerPromise = undefined; // try again on the next request
                throw error;
            });
    }
    return handlerPromise;
}

// Netlify can pass either the rewritten path (/.netlify/functions/api/movies) or the original
// one (/api/movies). Normalise both to /api/... so Express can route it.
function normalisePath(path = '/') {
    const rest = path.replace(/^\/\.netlify\/functions\/api/, '');
    return rest.startsWith('/api') ? rest : `/api${rest || '/'}`;
}

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    try {
        const handler = await getHandler();
        return await handler({ ...event, path: normalisePath(event.path) }, context);
    } catch (error) {
        console.error('API function failed:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
