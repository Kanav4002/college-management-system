// complaints collection — the central entity. Mirrors the Spring entity so
// the existing React frontend keeps working without contract changes.

const mongoose = require('mongoose');

const STATUSES   = ['PENDING', 'APPROVED', 'REJECTED', 'ASSIGNED', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const SUBMITTERS = ['STUDENT', 'MENTOR', 'ADMIN'];

const complaintSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },

    category:    { type: String, required: true, trim: true },
    issueType:   { type: String, required: true, trim: true, index: true },
    building:    { type: String, required: true, trim: true, index: true },
    floorNumber: { type: String, required: true, trim: true },
    roomNumber:  { type: String, required: true, trim: true },

    // Optional — when the user thinks the issue actually started.
    problemStartedAt: { type: Date, default: null },

    priority: { type: String, enum: PRIORITIES, default: 'MEDIUM' },
    status:   { type: String, enum: STATUSES,   default: 'PENDING', index: true },

    // We name this `student` because that's the field the frontend reads
    // (studentName/studentEmail), but it actually points to whoever raised
    // the complaint regardless of role. `submitterRole` disambiguates.
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    submitterRole: { type: String, enum: SUBMITTERS, default: 'STUDENT' },

    // Mentor who reviewed / approved / rejected this complaint.
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Department that ends up handling the complaint (auto-routed for
    // mentor-submitted, manually assigned by admin otherwise).
    assignedDepartment: { type: String, default: null },
  },
  { timestamps: true, collection: 'complaints' }
);

complaintSchema.statics.STATUSES   = STATUSES;
complaintSchema.statics.PRIORITIES = PRIORITIES;
complaintSchema.statics.SUBMITTERS = SUBMITTERS;

module.exports = mongoose.model('Complaint', complaintSchema);
