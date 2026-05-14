const mongoose = require('mongoose');

const classSectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentGroup',
      default: null,
      index: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    description: { type: String, default: '' },
  },
  { timestamps: true, collection: 'classSections' }
);

classSectionSchema.index({ name: 1, group: 1 }, { unique: true });

module.exports = mongoose.model('ClassSection', classSectionSchema);
