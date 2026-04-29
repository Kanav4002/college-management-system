// /api/auth/* — public routes (register, login, Google sign-in,
// password reset request + confirm). No JWT required.

const router = require('express').Router();

const controller = require('./auth.controller');
const {
  registerRules,
  loginRules,
  googleLoginRules,
  forgotPasswordRules,
  resetPasswordRules,
} = require('./auth.validator');
const { validate } = require('../../middlewares/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');

router.post('/register',         registerRules,        validate, asyncHandler(controller.register));
router.post('/login',            loginRules,           validate, asyncHandler(controller.login));
router.post('/oauth/google',     googleLoginRules,     validate, asyncHandler(controller.googleLogin));
router.post('/forgot-password',  forgotPasswordRules,  validate, asyncHandler(controller.forgotPassword));
router.post('/reset-password',   resetPasswordRules,   validate, asyncHandler(controller.resetPassword));

module.exports = router;
