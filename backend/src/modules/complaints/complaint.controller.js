const service = require('./complaint.service');
const { ok, created, noContent } = require('../../utils/apiResponse');

// ─── Create ──────────────────────────────────────────
async function createAsStudent(req, res) {
  return created(res, await service.createAsStudent(req.user, req.body));
}
async function createAsMentor(req, res) {
  return created(res, await service.createAsMentor(req.user, req.body));
}
async function createAsAdmin(req, res) {
  return created(res, await service.createAsAdmin(req.user, req.body));
}

// ─── Read ───────────────────────────────────────────
async function listMine(req, res) {
  return ok(res, await service.getMyComplaints(req.user));
}
async function listMentorOwn(req, res) {
  return ok(res, await service.getMentorOwnComplaints(req.user));
}
async function listMentorAssigned(req, res) {
  return ok(res, await service.getMentorAssignedComplaints(req.user));
}
async function listAll(_req, res) {
  return ok(res, await service.getAllComplaints());
}

// ─── Mentor actions ─────────────────────────────────
async function approve(req, res) {
  return ok(res, await service.approve(req.user, req.params.id));
}
async function reject(req, res) {
  return ok(res, await service.reject(req.user, req.params.id));
}
async function escalate(req, res) {
  return ok(res, await service.escalate(req.user, req.params.id));
}

// ─── Admin actions ──────────────────────────────────
async function assign(req, res) {
  return ok(res, await service.assign(req.user, req.params.id, req.body?.department));
}
async function resolve(req, res) {
  return ok(res, await service.resolve(req.user, req.params.id));
}
async function close(req, res) {
  return ok(res, await service.close(req.user, req.params.id));
}
async function remove(req, res) {
  await service.remove(req.user, req.params.id);
  return noContent(res);
}

// ─── Comments ───────────────────────────────────────
async function listComments(req, res) {
  return ok(res, await service.listComments(req.params.id));
}
async function addComment(req, res) {
  return created(res, await service.addComment(req.user, req.params.id, req.body?.content));
}

// ─── Stats ──────────────────────────────────────────
async function studentStats(req, res) {
  return ok(res, await service.studentStats(req.user));
}
async function mentorStats(req, res) {
  return ok(res, await service.mentorStats(req.user));
}
async function adminStats(_req, res) {
  return ok(res, await service.adminStats());
}

module.exports = {
  createAsStudent, createAsMentor, createAsAdmin,
  listMine, listMentorOwn, listMentorAssigned, listAll,
  approve, reject, escalate,
  assign, resolve, close, remove,
  listComments, addComment,
  studentStats, mentorStats, adminStats,
};
