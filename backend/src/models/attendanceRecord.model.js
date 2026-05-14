const mongoose = require('mongoose');

const STATUSES = ['PRESENT', 'ABSENT', 'LEAVE', 'PENDING'];

const attendanceRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
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
    date: { type: Date, required: true, index: true },
    status: { type: String, enum: STATUSES, default: 'PENDING' },
    remarks: { type: String, trim: true, default: '' },
    correction: {
      status: {
        type: String,
        enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
        default: 'NONE',
      },
      reason: { type: String, trim: true, default: '' },
      response: { type: String, trim: true, default: '' },
      requestedAt: { type: Date, default: null },
      resolvedAt: { type: Date, default: null },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
  },
  { timestamps: true, collection: 'attendanceRecords' }
);

attendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
