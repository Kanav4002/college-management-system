const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentGroup',
      default: null,
      index: true,
    },
    section: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, index: true },
    locked: { type: Boolean, default: false },
    lockedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'attendanceSessions' }
);

attendanceSessionSchema.index({ subject: 1, group: 1, date: 1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
