// passwordResetTokens collection — short-lived single-use reset tokens.
// We rely on a TTL index so expired tokens are evicted automatically.

const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'passwordResetTokens' }
);

// Mongo will purge documents shortly after `expiresAt` passes.
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
