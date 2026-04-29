// Reads "Authorization: Bearer <token>", verifies it, and attaches the
// decoded payload to req.user so the next middleware/route can use it.

const { verifyToken } = require('../services/jwt.service');
const AppError = require('../utils/AppError');

function verifyJwt(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing or malformed Authorization header'));
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = {
      id: payload.id,
      email: payload.sub,
      role: payload.role,
      name: payload.name,
      groupId: payload.groupId || null,
    };
    return next();
  } catch (err) {
    return next(err);
  }
}

// Variant that attaches req.user when a valid token is present, but never
// blocks the request. Useful for endpoints that are public-but-personalised
// or where guests are allowed (e.g. browsing groups list during register).
function optionalJwt(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  try {
    const payload = verifyToken(header.slice(7));
    req.user = {
      id: payload.id,
      email: payload.sub,
      role: payload.role,
      name: payload.name,
      groupId: payload.groupId || null,
    };
  } catch {
    // ignore — caller treated as guest
  }
  return next();
}

module.exports = { verifyJwt, optionalJwt };
