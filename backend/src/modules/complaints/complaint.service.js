// Complaint business logic — includes comments + stats. Mirrors the
// Spring service so the React frontend works without modification.

const mongoose = require('mongoose');
const { User, Complaint, ComplaintComment } = require('../../models');
const AppError = require('../../utils/AppError');
const { complaintToResponse, commentToResponse } = require('../../utils/dto');

// Auto-routing map for issue type → maintenance department.
// Mentors and the system rely on this to pick a default department.
const DEPT_MAP = {
  'Cleaning':           'Janitorial Staff',
  'IT / Network':       'IT Department',
  'Electrical':         'Electrical Maintenance',
  'Plumbing':           'Plumbing Maintenance',
  'Furniture':          'Facilities Management',
  'Civil / Structural': 'Civil Maintenance',
  'Pest Control':       'Pest Control Services',
};
const DEFAULT_DEPT = 'General Administration';

function resolveDepartment(issueType) {
  return DEPT_MAP[issueType] || DEFAULT_DEPT;
}

// Common populate pipeline so every read returns the same shape.
const POPULATE = [
  { path: 'student', select: 'name email role group', populate: { path: 'group', select: 'name' } },
  { path: 'mentor',  select: 'name email role' },
];

function ensureValidId(id, label = 'id') {
  if (!mongoose.isValidObjectId(id)) {
    throw AppError.badRequest(`Invalid ${label}`);
  }
}

// ─── Create ────────────────────────────────────────────────────────────────

async function createAsStudent(actor, payload) {
  return create({ actor, payload, submitterRole: 'STUDENT', initialStatus: 'PENDING' });
}

// Mentors get auto-routing + ASSIGNED status, exactly like the Spring flow.
async function createAsMentor(actor, payload) {
  const department = resolveDepartment(payload.issueType);
  return create({
    actor,
    payload,
    submitterRole: 'MENTOR',
    initialStatus: 'ASSIGNED',
    extra: { mentor: actor.id, assignedDepartment: department },
  });
}

async function createAsAdmin(actor, payload) {
  return create({ actor, payload, submitterRole: 'ADMIN', initialStatus: 'PENDING' });
}

async function create({ actor, payload, submitterRole, initialStatus, extra = {} }) {
  const required = ['title', 'description', 'category', 'issueType', 'building', 'floorNumber', 'roomNumber'];
  for (const f of required) {
    if (!payload[f] || !String(payload[f]).trim()) {
      throw AppError.badRequest(`${f} is required`);
    }
  }

  const created = await Complaint.create({
    title: payload.title.trim(),
    description: payload.description.trim(),
    category: payload.category.trim(),
    issueType: payload.issueType.trim(),
    building: payload.building.trim(),
    floorNumber: payload.floorNumber.trim(),
    roomNumber: payload.roomNumber.trim(),
    problemStartedAt: payload.problemStartedAt ? new Date(payload.problemStartedAt) : null,
    priority: payload.priority || 'MEDIUM',
    status: initialStatus,
    student: actor.id,
    submitterRole,
    ...extra,
  });

  const populated = await Complaint.findById(created._id).populate(POPULATE);
  return complaintToResponse(populated);
}

// ─── Read ──────────────────────────────────────────────────────────────────

async function getMyComplaints(actor) {
  const list = await Complaint.find({ student: actor.id, submitterRole: 'STUDENT' })
    .populate(POPULATE)
    .sort({ createdAt: -1 });
  return list.map(complaintToResponse);
}

async function getMentorOwnComplaints(actor) {
  const list = await Complaint.find({ student: actor.id, submitterRole: 'MENTOR' })
    .populate(POPULATE)
    .sort({ createdAt: -1 });
  return list.map(complaintToResponse);
}

// Mentor "review pile" — student-submitted complaints from the mentor's
// own group. Falls back to all student complaints if the mentor isn't yet
// assigned to a group, so the panel isn't useless on day one.
async function getMentorAssignedComplaints(actor) {
  let studentIds = null;
  if (actor.groupId) {
    const students = await User.find({ role: 'STUDENT', group: actor.groupId }).select('_id').lean();
    studentIds = students.map((s) => s._id);
  }
  const filter = { submitterRole: 'STUDENT' };
  if (studentIds) filter.student = { $in: studentIds };
  const list = await Complaint.find(filter).populate(POPULATE).sort({ createdAt: -1 });
  return list.map(complaintToResponse);
}

async function getAllComplaints() {
  const list = await Complaint.find().populate(POPULATE).sort({ createdAt: -1 });
  return list.map(complaintToResponse);
}

async function getById(id) {
  ensureValidId(id, 'complaintId');
  const c = await Complaint.findById(id).populate(POPULATE);
  if (!c) throw AppError.notFound('Complaint not found');
  return c;
}

// ─── Mentor actions ────────────────────────────────────────────────────────

async function approve(actor, id) {
  const c = await getById(id);
  if (c.status !== 'PENDING') {
    throw AppError.badRequest(`Cannot approve a complaint that is ${c.status}`);
  }
  c.status = 'APPROVED';
  c.mentor = actor.id;
  await c.save();
  const populated = await Complaint.findById(c._id).populate(POPULATE);
  return complaintToResponse(populated);
}

async function reject(actor, id) {
  const c = await getById(id);
  if (c.status !== 'PENDING') {
    throw AppError.badRequest(`Cannot reject a complaint that is ${c.status}`);
  }
  c.status = 'REJECTED';
  c.mentor = actor.id;
  await c.save();
  const populated = await Complaint.findById(c._id).populate(POPULATE);
  return complaintToResponse(populated);
}

// "Escalate" routes the complaint to the right department (status ASSIGNED)
// without involving an admin first. Allowed from PENDING or APPROVED.
async function escalate(actor, id) {
  const c = await getById(id);
  if (!['PENDING', 'APPROVED'].includes(c.status)) {
    throw AppError.badRequest(`Cannot escalate a complaint that is ${c.status}`);
  }
  c.status = 'ASSIGNED';
  c.mentor = actor.id;
  c.assignedDepartment = resolveDepartment(c.issueType);
  await c.save();
  const populated = await Complaint.findById(c._id).populate(POPULATE);
  return complaintToResponse(populated);
}

// ─── Admin actions ─────────────────────────────────────────────────────────

async function assign(_actor, id, department) {
  if (!department || !String(department).trim()) {
    throw AppError.badRequest('department is required');
  }
  const c = await getById(id);
  c.assignedDepartment = String(department).trim();
  c.status = 'ASSIGNED';
  await c.save();
  const populated = await Complaint.findById(c._id).populate(POPULATE);
  return complaintToResponse(populated);
}

async function resolve(_actor, id) {
  const c = await getById(id);
  if (c.status === 'CLOSED') {
    throw AppError.badRequest('Cannot resolve a closed complaint');
  }
  c.status = 'RESOLVED';
  await c.save();
  const populated = await Complaint.findById(c._id).populate(POPULATE);
  return complaintToResponse(populated);
}

async function close(_actor, id) {
  const c = await getById(id);
  c.status = 'CLOSED';
  await c.save();
  const populated = await Complaint.findById(c._id).populate(POPULATE);
  return complaintToResponse(populated);
}

async function remove(_actor, id) {
  ensureValidId(id, 'complaintId');
  const c = await Complaint.findById(id);
  if (!c) throw AppError.notFound('Complaint not found');
  await ComplaintComment.deleteMany({ complaint: c._id });
  await c.deleteOne();
}

// ─── Comments ──────────────────────────────────────────────────────────────

async function listComments(complaintId) {
  ensureValidId(complaintId, 'complaintId');
  const exists = await Complaint.exists({ _id: complaintId });
  if (!exists) throw AppError.notFound('Complaint not found');
  const list = await ComplaintComment.find({ complaint: complaintId })
    .populate('author', 'name email role')
    .sort({ createdAt: 1 });
  return list.map(commentToResponse);
}

async function addComment(actor, complaintId, content) {
  ensureValidId(complaintId, 'complaintId');
  if (!content || !content.trim()) {
    throw AppError.badRequest('Comment content is required');
  }
  const exists = await Complaint.exists({ _id: complaintId });
  if (!exists) throw AppError.notFound('Complaint not found');

  const comment = await ComplaintComment.create({
    complaint: complaintId,
    author: actor.id,
    content: content.trim(),
  });
  const populated = await comment.populate('author', 'name email role');
  return commentToResponse(populated);
}

// ─── Stats ─────────────────────────────────────────────────────────────────

const STATUS_KEYS = ['pending', 'approved', 'rejected', 'assigned', 'resolved', 'closed'];

function emptyStatus() {
  return STATUS_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), { total: 0 });
}

function bucketBy(rows, field) {
  const out = {};
  for (const r of rows) {
    const key = r[field];
    if (!key) continue;
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

async function statsForFilter(filter) {
  const rows = await Complaint.find(filter)
    .select('status category issueType building createdAt updatedAt')
    .lean();

  const stats = emptyStatus();
  stats.total = rows.length;
  let resolutionMs = 0;
  let resolved = 0;

  for (const r of rows) {
    const key = String(r.status || '').toLowerCase();
    if (key in stats) stats[key] += 1;
    if (r.status === 'RESOLVED') {
      resolutionMs += new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime();
      resolved += 1;
    }
  }

  stats.byCategory  = bucketBy(rows, 'category');
  stats.byIssueType = bucketBy(rows, 'issueType');
  stats.byBuilding  = bucketBy(rows, 'building');
  stats.avgResolutionHours = resolved > 0 ? +(resolutionMs / resolved / 3_600_000).toFixed(2) : 0;
  return stats;
}

async function studentStats(actor) {
  return statsForFilter({ student: actor.id });
}

async function mentorStats(actor) {
  // Numbers should reflect what the mentor actually sees in their panel.
  let studentIds = null;
  if (actor.groupId) {
    const students = await User.find({ role: 'STUDENT', group: actor.groupId }).select('_id').lean();
    studentIds = students.map((s) => s._id);
  }
  const filter = { submitterRole: 'STUDENT' };
  if (studentIds) filter.student = { $in: studentIds };
  return statsForFilter(filter);
}

async function adminStats() {
  return statsForFilter({});
}

module.exports = {
  createAsStudent,
  createAsMentor,
  createAsAdmin,

  getMyComplaints,
  getMentorOwnComplaints,
  getMentorAssignedComplaints,
  getAllComplaints,

  approve,
  reject,
  escalate,

  assign,
  resolve,
  close,
  remove,

  listComments,
  addComment,

  studentStats,
  mentorStats,
  adminStats,

  resolveDepartment,
};
