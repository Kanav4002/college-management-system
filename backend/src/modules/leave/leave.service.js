// Leave business logic. The frontend (leaveApi.js) hits:
//   POST /api/leaves              -> apply
//   GET  /api/leaves/my           -> own leaves
//   GET  /api/leaves/assigned     -> leaves a mentor/admin should review
//   PUT  /api/leaves/:id/approve  -> approve
//   PUT  /api/leaves/:id/reject   -> reject

const mongoose = require('mongoose');
const { Leave, User, StudentGroup } = require('../../models');
const AppError = require('../../utils/AppError');
const { leaveToResponse } = require('../../utils/dto');

function ensureValidId(id, label = 'id') {
  if (!mongoose.isValidObjectId(id)) {
    throw AppError.badRequest(`Invalid ${label}`);
  }
}

function diffInDays(start, end) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

const POPULATE = [
  { path: 'student', select: 'name email role' },
  { path: 'mentor',  select: 'name email role' },
];

async function apply(actor, payload) {
  const { leaveType, reason, startDate, endDate } = payload;
  if (!leaveType) throw AppError.badRequest('leaveType is required');
  if (!reason) throw AppError.badRequest('reason is required');
  if (!startDate || !endDate) throw AppError.badRequest('startDate and endDate are required');

  const days = payload.days && payload.days > 0
    ? Number(payload.days)
    : diffInDays(startDate, endDate);
  if (!days || days < 1) throw AppError.badRequest('days must be at least 1');

  // Find the mentor that owns the student's group, if any.
  let mentorId = null;
  const student = await User.findById(actor.id).select('group');
  if (student?.group) {
    const group = await StudentGroup.findById(student.group).select('mentor');
    mentorId = group?.mentor || null;
  }

  const leave = await Leave.create({
    leaveType,
    reason,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    days,
    student: actor.id,
    mentor: mentorId,
    status: 'PENDING',
    appliedAt: new Date(),
  });
  const populated = await leave.populate(POPULATE);
  return leaveToResponse(populated);
}

async function listMine(actor) {
  const list = await Leave.find({ student: actor.id })
    .populate(POPULATE)
    .sort({ createdAt: -1 });
  return list.map(leaveToResponse);
}

async function listAssigned(actor) {
  // Mentors see leaves from their group's students; admins see everything.
  let filter = {};
  if (actor.role === 'MENTOR') {
    if (actor.groupId) {
      const studentIds = await User.find({ role: 'STUDENT', group: actor.groupId })
        .select('_id').lean();
      filter = { student: { $in: studentIds.map((s) => s._id) } };
    } else {
      // Mentor not yet assigned to a group → fall back to leaves marked
      // for this mentor (e.g. legacy data) so the panel isn't empty.
      filter = { mentor: actor.id };
    }
  }
  const list = await Leave.find(filter)
    .populate(POPULATE)
    .sort({ createdAt: -1 });
  return list.map(leaveToResponse);
}

async function review(actor, id, status) {
  ensureValidId(id, 'leaveId');
  const leave = await Leave.findById(id);
  if (!leave) throw AppError.notFound('Leave request not found');
  if (leave.status !== 'PENDING') {
    throw AppError.badRequest(`Leave is already ${leave.status}`);
  }
  leave.status = status;
  leave.reviewedBy = actor.id;
  leave.reviewedAt = new Date();
  // If no reviewing mentor was tagged at apply time, record the actor now
  // so leaveToResponse can surface mentorEmail to the panels.
  if (!leave.mentor) leave.mentor = actor.id;
  await leave.save();
  const populated = await leave.populate(POPULATE);
  return leaveToResponse(populated);
}

const approve = (actor, id) => review(actor, id, 'APPROVED');
const reject  = (actor, id) => review(actor, id, 'REJECTED');

module.exports = { apply, listMine, listAssigned, approve, reject };
