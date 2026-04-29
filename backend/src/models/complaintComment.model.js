// complaintComments collection — threaded discussion on a complaint.

const mongoose = require('mongoose');

const complaintCommentSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: 'complaintComments' }
);

module.exports = mongoose.model('ComplaintComment', complaintCommentSchema);
