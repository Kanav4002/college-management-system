const mongoose = require('mongoose');

const CATEGORIES = ['Event', 'Holiday', 'Exam', 'Opportunities', 'Other'];

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'announcements',
  }
);

announcementSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Announcement', announcementSchema);
