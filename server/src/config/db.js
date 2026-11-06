const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} / database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // In development, keep process alive so developer can start local MongoDB or provide an Atlas URI in .env
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Connection reconnected');
});

module.exports = connectDB;
