// Centralized CORS options. Origins come from CORS_ORIGINS in .env so
// deployments can whitelist different frontends without code changes.
// In development we additionally accept any http://localhost:* and
// http://127.0.0.1:* origin so the Vite dev server "just works" even
// when it falls back to an alternate port like :5174.

const env = require('./env');

const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (env.CORS_ORIGINS.includes(origin)) return cb(null, true);
    if (env.NODE_ENV !== 'production' && LOCALHOST_RE.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;
