const mongoose = require('mongoose');
const { mongoUri } = require('../config');

async function connectToDatabase() {
  // Fail fast if the database is unreachable (a serverless function only has a few seconds).
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
}

module.exports = { connectToDatabase };
