// users collection — single document with role-specific fields embedded.
// Mongoose lets us collapse Spring's User+Student+Mentor+Admin tables into
// one collection because the per-role fields are sparse and small.

const mongoose = require('mongoose');

const ROLES = ['STUDENT', 'MENTOR', 'ADMIN'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // password is `select: false` so it is never returned by default;
    // services that need it must `.select('+password')` explicitly.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, index: true },

    // Role-specific identifiers. We deliberately do NOT set `default: null`
    // here — leaving the field absent lets the partial unique indexes below
    // skip the document entirely.
    rollNo:    { type: String, trim: true },
    branch:    { type: String, trim: true },
    facultyId: { type: String, trim: true },
    adminId:   { type: String, trim: true },

    // Group membership for STUDENT/MENTOR. Admins do not belong to a group.
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentGroup',
      default: null,
      index: true,
    },

    // Marks accounts created via Google OAuth so we can skip password rules.
    authProvider: {
      type: String,
      enum: ['LOCAL', 'GOOGLE'],
      default: 'LOCAL',
    },
  },
  { timestamps: true, collection: 'users' }
);

// Partial unique indexes — uniqueness is enforced only for documents where
// the field is actually present (non-null string). This is safer than the
// older `sparse: true` option, which treats null as an indexable value.
userSchema.index(
  { rollNo: 1 },
  { unique: true, partialFilterExpression: { rollNo: { $type: 'string' } } }
);
userSchema.index(
  { facultyId: 1 },
  { unique: true, partialFilterExpression: { facultyId: { $type: 'string' } } }
);
userSchema.index(
  { adminId: 1 },
  { unique: true, partialFilterExpression: { adminId: { $type: 'string' } } }
);

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);
