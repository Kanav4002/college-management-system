// Verifies a Google OAuth *access token* by calling Google's userinfo
// endpoint. We use access tokens (not ID tokens) because the React frontend
// uses @react-oauth/google's useGoogleLogin() implicit flow, which returns
// access tokens.
//
// Returns { email, name, sub } on success, throws AppError otherwise.

const AppError = require('../utils/AppError');

async function verifyGoogleAccessToken(accessToken) {
  if (!accessToken) {
    throw AppError.badRequest('Missing Google access token');
  }
  let res;
  try {
    res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    throw AppError.unauthorized(`Could not reach Google: ${err.message}`);
  }
  if (!res.ok) {
    throw AppError.unauthorized('Google rejected the access token');
  }
  const profile = await res.json();
  if (!profile?.email) {
    throw AppError.unauthorized('Google profile is missing an email');
  }
  return {
    email: String(profile.email).toLowerCase(),
    name: profile.name || profile.email,
    sub: profile.sub,
    emailVerified: profile.email_verified === true,
  };
}

module.exports = { verifyGoogleAccessToken };
