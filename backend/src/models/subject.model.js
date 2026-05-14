const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentGroup',
      default: null,
      index: true,
    },
    section: { type: String, trim: true, default: '' },
  },
  { timestamps: true, collection: 'subjects' }
);

subjectSchema.index(
  { code: 1, group: 1 },
  { unique: true, partialFilterExpression: { code: { $type: 'string' } } }
);

module.exports = mongoose.model('Subject', subjectSchema);
