// Usage: EMAIL=you@example.com PASSWORD=plain node scripts/checkLogin.js
// Reads the user document and verifies bcrypt compare for the given password.

const mongoose = require('mongoose');
const env = require('../src/config/env');
const { User } = require('../src/models');
const { comparePassword } = require('../src/services/hash.service');

async function main() {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;

  if (!email || !password) {
    console.error('Usage: EMAIL=you@example.com PASSWORD=plain node scripts/checkLogin.js');
    process.exit(2);
  }

  await mongoose.connect(env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    const normalised = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalised }).select('+password').lean();

    if (!user) {
      console.log('User not found for email:', normalised);
      process.exit(1);
    }

    console.log('User found:');
    console.log({
      _id: user._id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      hasPasswordField: !!user.password,
      passwordSample: user.password ? user.password.slice(0, 10) + '...' : null,
    });

    if (!user.password) {
      console.log('No password stored on the user document. Likely a Google-only account.');
      process.exit(1);
    }

    const ok = await comparePassword(password, user.password);
    console.log('Password compare result:', ok);
    process.exit(ok ? 0 : 1);
  } catch (err) {
    console.error('Error:', err);
    process.exit(2);
  } finally {
    mongoose.disconnect();
  }
}

main();
