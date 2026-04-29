// MongoDB connection using Mongoose.
// `connectDB` returns a promise so server.js can await it before listening.

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

// Make every document use { id: '<hex>' } in JSON output and hide
// internals like _id and __v. Saves us from doing it in each schema.
mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

async function connectDB() {
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  logger.info(`MongoDB connected: ${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) =>
    logger.error('MongoDB connection error:', err.message)
  );
  mongoose.connection.on('disconnected', () =>
    logger.warn('MongoDB disconnected')
  );
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB, mongoose };
