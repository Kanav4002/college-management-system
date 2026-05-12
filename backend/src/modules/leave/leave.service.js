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

async function buildAssignedFilter(actor) {
  let filter = {};

  if (actor.role === 'MENTOR') {
    // Always read the mentor's current group from the DB so the list is
    // resilient to stale JWTs (mentor may have been assigned a group
    // after their token was issued).
    const me = await User.findById(actor.id).select('group').lean();
    const groupId = me?.group || null;

    if (groupId) {
      const studentIds = await User.find({ role: 'STUDENT', group: groupId })
        .select('_id').lean();
      filter = { student: { $in: studentIds.map((s) => s._id) } };
    } else {
      // Mentor not yet assigned to a group → fall back to leaves marked
      // for this mentor (e.g. legacy data) so the panel isn't empty.
      filter = { mentor: actor.id };
    }
  }

  return filter;
}

async function debugRecent() {
  // Return the latest 20 leaves with student -> group -> mentor populated
  const list = await Leave.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .populate({ path: 'student', select: 'name email role group', populate: { path: 'group', select: 'name mentor' } })
    .populate({ path: 'mentor', select: 'name email role' });

  // Map each leave to a shallow debug response
  return list.map((l) => ({
    id: l._id.toString(),
    leaveType: l.leaveType,
    status: l.status,
    startDate: l.startDate,
    endDate: l.endDate,
    days: l.days,
    student: l.student ? { id: l.student._id?.toString(), name: l.student.name, email: l.student.email, group: l.student.group?._id?.toString() || l.student.group } : null,
    studentGroup: l.student && l.student.group ? { id: l.student.group._id?.toString(), name: l.student.group.name, mentor: l.student.group.mentor } : null,
    mentor: l.mentor ? { id: l.mentor._id?.toString(), name: l.mentor.name, email: l.mentor.email } : null,
    appliedAt: l.appliedAt,
  }));
}

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
  const filter = await buildAssignedFilter(actor);
  const query = actor.role === 'MENTOR' ? { ...filter, status: 'PENDING' } : filter;
  const list = await Leave.find(query)
    .populate(POPULATE)
    .sort({ createdAt: -1 });
  return list.map(leaveToResponse);
}

async function statsMentor(actor) {
  const filter = await buildAssignedFilter(actor);
  const leaves = await Leave.find(filter).select('status startDate endDate reviewedAt').lean();

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  const counts = { total: leaves.length, pending: 0, approved: 0, rejected: 0, approvedToday: 0, onLeave: 0 };
  for (const leave of leaves) {
    const status = String(leave.status || '').toUpperCase();
    if (status === 'PENDING') counts.pending += 1;
    if (status === 'APPROVED') counts.approved += 1;
    if (status === 'REJECTED') counts.rejected += 1;

    const reviewedAt = leave.reviewedAt ? new Date(leave.reviewedAt) : null;
    if (status === 'APPROVED' && reviewedAt && reviewedAt >= startOfDay && reviewedAt <= endOfDay) {
      counts.approvedToday += 1;
    }

    if (status === 'APPROVED') {
      const startDate = leave.startDate ? new Date(leave.startDate) : null;
      const endDate = leave.endDate ? new Date(leave.endDate) : null;
      if (startDate && endDate && startDate <= endOfDay && endDate >= startOfDay) {
        counts.onLeave += 1;
      }
    }
  }

  return counts;
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

module.exports = { apply, listMine, listAssigned, approve, reject, debugRecent, statsMentor };
