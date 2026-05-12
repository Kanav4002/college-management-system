// Business logic for the auth module. Controllers stay thin; this file
// owns the rules around role-specific fields, group assignment, password
// reset tokens, and Google account provisioning.

const crypto = require('crypto');
const mongoose = require('mongoose');

const { User, StudentGroup, PasswordResetToken } = require('../../models');
const { hashPassword, comparePassword } = require('../../services/hash.service');
const {
  generateToken,
  signGoogleRegistrationTicket,
  verifyGoogleRegistrationTicket,
} = require('../../services/jwt.service');
const { verifyGoogleAccessToken } = require('../../services/google.service');
const { sendPasswordResetEmail } = require('../../services/email.service');
const { loginResponse } = require('../../utils/dto');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Loads the User's group document so we can return groupId/groupName in the
// LoginResponse without an extra round-trip on the frontend.
async function loadGroup(groupId) {
  if (!groupId) return null;
  return StudentGroup.findById(groupId).lean();
}

async function register(input) {
  const role = String(input.role || '').toUpperCase();
  if (!User.ROLES.includes(role)) {
    throw AppError.badRequest(`Invalid role: ${input.role}`);
  }

  // If the client supplies a Google registration ticket, override the
  // email/name from the verified ticket (so the locked fields can't be
  // tampered with) and skip the password requirement.
  let verifiedEmail = null;
  let verifiedName = null;
  let authProvider = 'LOCAL';

  if (input.registrationToken) {
    const ticket = verifyGoogleRegistrationTicket(input.registrationToken);
    verifiedEmail = ticket.email;
    verifiedName = ticket.name || input.name;
    // Default to GOOGLE for ticket-based signups, but if the client
    // also supplied a password we treat this as the user choosing to
    // enable email/password login and create a LOCAL account instead.
    authProvider = 'GOOGLE';
    if (input.password && String(input.password).length >= 6) {
      authProvider = 'LOCAL';
    }
  }

  const email = String(verifiedEmail || input.email).toLowerCase().trim();
  if (!email) throw AppError.badRequest('Email is required');
  if (await User.exists({ email })) {
    throw AppError.conflict('Email is already registered');
  }

  const name = String(verifiedName || input.name || '').trim();
  if (name.length < 2) throw AppError.badRequest('Name is required');

  // Local accounts must supply a password; Google-ticket accounts get a
  // random unguessable one (the user will always sign back in via Google).
  if (authProvider === 'LOCAL') {
    if (!input.password || String(input.password).length < 6) {
      throw AppError.badRequest('Password must be at least 6 characters');
    }
  }

  // Role-specific required fields, mirroring the original Spring DTOs.
  if (role === 'STUDENT') {
    if (!input.rollNo) throw AppError.badRequest('rollNo is required for STUDENT');
    if (!input.branch) throw AppError.badRequest('branch is required for STUDENT');
  }
  if (role === 'MENTOR' && !input.facultyId) {
    throw AppError.badRequest('facultyId is required for MENTOR');
  }
  if (role === 'ADMIN' && !input.adminId) {
    throw AppError.badRequest('adminId is required for ADMIN');
  }

  // Group assignment — only meaningful for STUDENT/MENTOR.
  let groupId = null;
  if (input.groupId && (role === 'STUDENT' || role === 'MENTOR')) {
    if (!mongoose.isValidObjectId(input.groupId)) {
      throw AppError.badRequest('Invalid groupId');
    }
    const group = await StudentGroup.findById(input.groupId);
    if (!group) throw AppError.badRequest('Selected group does not exist');
    groupId = group._id;
  }

  const rawPassword =
    authProvider === 'GOOGLE'
      ? crypto.randomBytes(32).toString('hex')
      : input.password;
  const passwordHash = await hashPassword(rawPassword);

  const doc = {
    name,
    email,
    password: passwordHash,
    role,
    group: groupId,
    authProvider,
  };
  // Set role-specific fields only when applicable so the partial-unique
  // indexes don't fire on shared null values.
  if (role === 'STUDENT') {
    doc.rollNo = input.rollNo;
    doc.branch = input.branch;
  }
  if (role === 'MENTOR') doc.facultyId = input.facultyId;
  if (role === 'ADMIN')  doc.adminId   = input.adminId;

  const user = await User.create(doc);

  const group = await loadGroup(user.group);
  const token = generateToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
    groupId: group?._id?.toString() || null,
  });

  return loginResponse({ user, token, group });
}

async function login({ email, password }) {
  const normalised = String(email).toLowerCase().trim();
  // Need +password because the schema marks it select:false.
  const user = await User.findOne({ email: normalised }).select('+password');
  if (!user) throw AppError.unauthorized('Invalid email or password');
  if (!user.password) {
    throw AppError.unauthorized('This account uses Google sign-in. Please continue with Google.');
  }

  const ok = await comparePassword(password, user.password);
  if (!ok) throw AppError.unauthorized('Invalid email or password');

  const group = await loadGroup(user.group);
  const token = generateToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
    groupId: group?._id?.toString() || null,
  });
  return loginResponse({ user, token, group });
}

// Google sign-in.
//   - If the verified Google email matches an existing account, log them in.
//   - If not, do NOT silently provision a STUDENT (that was the old bug).
//     Hand back a short-lived registration ticket so the frontend can route
//     the user to /register with their email + name pre-filled and locked,
//     and let them pick a role + role-specific fields themselves.
async function googleLogin({ accessToken }) {
  const profile = await verifyGoogleAccessToken(accessToken);

  const user = await User.findOne({ email: profile.email });
  if (user) {
    const group = await loadGroup(user.group);
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      groupId: group?._id?.toString() || null,
    });
    return loginResponse({ user, token, group });
  }

  const registrationToken = signGoogleRegistrationTicket({
    email: profile.email,
    name: profile.name,
  });

  return {
    needsRegistration: true,
    email: profile.email,
    name: profile.name,
    registrationToken,
  };
}

// Always returns a generic message — never reveals whether the email exists.
async function forgotPassword({ email }) {
  const normalised = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: normalised });

  // If a user exists, always create a password-reset token so they can
  // set a local password — this supports users who originally signed up
  // via Google and want to enable email/password login later. We still
  // return a generic message to avoid leaking account existence.
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    await PasswordResetToken.create({
      token,
      user: user._id,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    // Pass along whether this was a Google-backed account so email
    // transports can customize messaging if desired.
    await sendPasswordResetEmail({ to: user.email, resetUrl, isGoogle: user.authProvider === 'GOOGLE' });
    // In development, return the resetUrl so the frontend can show it
    // (useful when no SMTP transport is configured). Do NOT expose this
    // in production.
    if (env.NODE_ENV !== 'production') {
      return { message: 'If an account with that email exists, a reset link has been sent.', resetUrl };
    }
  }

  return 'If an account with that email exists, a reset link has been sent.';
}

async function resetPassword({ token, newPassword }) {
  if (!token) throw AppError.badRequest('Reset token is required');
  if (!newPassword || newPassword.length < 6) {
    throw AppError.badRequest('Password must be at least 6 characters');
  }

  const record = await PasswordResetToken.findOne({ token });
  if (!record) throw AppError.badRequest('Reset link is invalid or has expired');
  if (record.usedAt) throw AppError.badRequest('Reset link has already been used');
  if (record.expiresAt.getTime() < Date.now()) {
    throw AppError.badRequest('Reset link has expired');
  }

  const user = await User.findById(record.user);
  if (!user) throw AppError.badRequest('Reset link is invalid');

  user.password = await hashPassword(newPassword);
  user.authProvider = 'LOCAL';
  await user.save();

  record.usedAt = new Date();
  await record.save();

  return 'Password has been updated. You can now sign in.';
}

module.exports = {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
};
