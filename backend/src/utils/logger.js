// Minimal logger so we don't sprinkle console.log everywhere.
// Swap in pino/winston later without touching call sites.

const env = require('../config/env');
const isDev = env.NODE_ENV !== 'production';

const logger = {
  info: (...a) => console.log('[info]', ...a),
  warn: (...a) => console.warn('[warn]', ...a),
  error: (...a) => console.error('[error]', ...a),
  debug: (...a) => {
    if (isDev) console.log('[debug]', ...a);
  },
};

module.exports = logger;
