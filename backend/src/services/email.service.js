// Email service — minimal stub. We don't ship a real SMTP transport in dev
// so the password-reset link is logged to the server console. Swap this for
// nodemailer (or any provider SDK) when you're ready to send real mail.

const logger = require('../utils/logger');

async function sendPasswordResetEmail({ to, resetUrl }) {
  logger.info(`📧 Password reset requested for ${to}`);
  logger.info(`   → Reset link: ${resetUrl}`);
  logger.info('   (Configure SMTP/transport in src/services/email.service.js to actually send.)');
}

module.exports = { sendPasswordResetEmail };
