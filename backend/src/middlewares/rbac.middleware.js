// Role-based access control. Use after verifyJwt:
//   router.get('/admin/...', verifyJwt, requireRole('ADMIN'), handler)

const AppError = require('../utils/AppError');

function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden(`Requires one of: ${allowedRoles.join(', ')}`));
    }
    return next();
  };
}

module.exports = { requireRole };
