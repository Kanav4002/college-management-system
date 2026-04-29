// Issues and verifies HS256 JWTs.
// - Auth tokens carry { sub, role, name, id, groupId } so RBAC + group-scoped
//   reads don't need a DB hit on every request.
// - Google "registration tickets" are short-lived JWTs we hand out when a
//   Google sign-in finds no matching account. They prove that we (the server)
//   verified the email with Google, so when the client comes back to
//   /api/auth/register we can trust the email/name fields against tampering.

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const GOOGLE_REG_KIND = 'google-registration';
const GOOGLE_REG_EXPIRES_IN = '15m';

function generateToken({ id, email, role, name, groupId = null }) {
  return jwt.sign(
    { sub: email, role, name, id, groupId },
    env.JWT.SECRET,
    { expiresIn: env.JWT.EXPIRES_IN }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT.SECRET);
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }
}

function signGoogleRegistrationTicket({ email, name }) {
  return jwt.sign(
    { kind: GOOGLE_REG_KIND, email, name },
    env.JWT.SECRET,
    { expiresIn: GOOGLE_REG_EXPIRES_IN }
  );
}

function verifyGoogleRegistrationTicket(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.JWT.SECRET);
  } catch {
    throw AppError.badRequest('Google registration ticket is invalid or has expired');
  }
  if (payload.kind !== GOOGLE_REG_KIND || !payload.email) {
    throw AppError.badRequest('Google registration ticket is invalid');
  }
  return { email: payload.email, name: payload.name || '' };
}

module.exports = {
  generateToken,
  verifyToken,
  signGoogleRegistrationTicket,
  verifyGoogleRegistrationTicket,
};
