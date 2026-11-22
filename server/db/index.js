const mongoose = require('mongoose');
const { mongoUri } = require('../config');

async function connectToDatabase() {
  await mongoose.connect(mongoUri);
}

module.exports = { connectToDatabase };
