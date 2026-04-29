// leaves collection — student leave requests reviewed by a mentor or admin.

const mongoose = require('mongoose');

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

const leaveSchema = new mongoose.Schema(
  {
    leaveType: { type: String, required: true, trim: true },
    reason:    { type: String, required: true },
    startDate: { type: Date,   required: true },
    endDate:   { type: Date,   required: true },
    days:      { type: Number, required: true, min: 1 },
    status:    { type: String, enum: STATUSES, default: 'PENDING', index: true },

    student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // The mentor that owns the student's group at the time of application.
    mentor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    appliedAt:  { type: Date, default: () => new Date() },
  },
  { timestamps: true, collection: 'leaves' }
);

leaveSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Leave', leaveSchema);
