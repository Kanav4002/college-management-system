// studentGroups collection — a class/batch grouping that ties students to a
// mentor. Membership lives on User.group (cheap to query either way).

const mongoose = require('mongoose');

const studentGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true, collection: 'studentGroups' }
);

module.exports = mongoose.model('StudentGroup', studentGroupSchema);
