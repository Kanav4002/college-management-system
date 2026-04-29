// Catches any request that didn't match a route and forwards a 404
// to the central error middleware so the response shape stays consistent.

const AppError = require('../utils/AppError');

function notFoundMiddleware(req, _res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFoundMiddleware;
