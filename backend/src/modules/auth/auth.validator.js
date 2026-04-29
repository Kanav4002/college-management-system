// express-validator chains. Role-specific field requirements are enforced
// in the service layer (since they depend on the role value at runtime).

const { body } = require('express-validator');

// When the client supplies a Google registration ticket, the email/name come
// from the verified ticket and the password is generated server-side, so we
// only validate them lightly here. The service layer enforces the strict
// rules for the LOCAL flow.
const registerRules = [
  body('role').isString().isIn(['STUDENT', 'MENTOR', 'ADMIN']).withMessage('Role must be STUDENT, MENTOR, or ADMIN'),
  body('registrationToken').optional({ nullable: true, checkFalsy: true }).isString(),
  body('name').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ min: 2 }),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail(),
  body('password').optional({ nullable: true, checkFalsy: true }).isString().isLength({ min: 6 }),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const googleLoginRules = [
  body('accessToken').isString().notEmpty().withMessage('Google accessToken is required'),
];

const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

const resetPasswordRules = [
  body('token').isString().notEmpty().withMessage('Reset token is required'),
  body('newPassword').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

module.exports = {
  registerRules,
  loginRules,
  googleLoginRules,
  forgotPasswordRules,
  resetPasswordRules,
};
