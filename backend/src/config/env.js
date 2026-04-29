// Loads .env once and exposes it as a typed object.

require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 4000),

  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unisphere',

  JWT: {
    SECRET: process.env.JWT_SECRET || 'dev-only-insecure-secret',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  },

  // Optional. Leave blank to disable Google sign-in on the backend.
  // The frontend already gates the button on VITE_GOOGLE_CLIENT_ID.
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  },

  // Used to build password-reset links sent in dev console.
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};
