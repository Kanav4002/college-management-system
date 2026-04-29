// Auth HTTP layer. Just unwraps req → service → response.

const service = require('./auth.service');
const { ok, created, text } = require('../../utils/apiResponse');

async function register(req, res) {
  const data = await service.register(req.body);
  return created(res, data);
}

async function login(req, res) {
  const data = await service.login(req.body);
  return ok(res, data);
}

async function googleLogin(req, res) {
  const data = await service.googleLogin(req.body);
  return ok(res, data);
}

async function forgotPassword(req, res) {
  const message = await service.forgotPassword(req.body);
  return text(res, message);
}

async function resetPassword(req, res) {
  const message = await service.resetPassword(req.body);
  return text(res, message);
}

module.exports = {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
};
