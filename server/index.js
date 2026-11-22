const { port, isProd } = require('./config');
const { connectToDatabase } = require('./db');
const createApp = require('./app');

async function startServer() {
    try {
        await connectToDatabase();
        const app = await createApp();

        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
            if (!isProd) console.log('Vite frontend served via Express middleware');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exitCode = 1;
    }
}

startServer();
