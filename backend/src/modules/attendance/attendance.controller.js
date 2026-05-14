const service = require('./attendance.service');
const { created, ok } = require('../../utils/apiResponse');

async function listSubjects(req, res) {
  return ok(res, await service.listSubjects(req.user));
}

async function createSubject(req, res) {
  return created(res, await service.createSubject(req.user, req.body));
}

async function listStudents(req, res) {
  return ok(res, await service.listStudents(req.user, req.query.groupId));
}

async function createSession(req, res) {
  return created(res, await service.createSession(req.user, req.body));
}

async function listSessions(req, res) {
  return ok(res, await service.listSessions(req.user, req.query));
}

async function getSession(req, res) {
  return ok(res, await service.getSession(req.user, req.params.id));
}

async function updateRecords(req, res) {
  return ok(res, await service.updateRecords(req.user, req.params.id, req.body));
}

async function markAllPresent(req, res) {
  return ok(res, await service.markAllPresent(req.user, req.params.id));
}

async function lockSession(req, res) {
  return ok(res, await service.lockSession(req.user, req.params.id));
}

async function requestCorrection(req, res) {
  return ok(res, await service.requestCorrection(req.user, req.params.id, req.body));
}

async function resolveCorrection(req, res) {
  return ok(res, await service.resolveCorrection(req.user, req.params.id, req.body));
}

async function studentSummary(req, res) {
  return ok(res, await service.studentSummary(req.user, req.query));
}

async function mentorStats(req, res) {
  return ok(res, await service.mentorStats(req.user));
}

async function adminStats(req, res) {
  return ok(res, await service.adminStats(req.user));
}

module.exports = {
  listSubjects,
  createSubject,
  listStudents,
  createSession,
  listSessions,
  getSession,
  updateRecords,
  markAllPresent,
  lockSession,
  requestCorrection,
  resolveCorrection,
  studentSummary,
  mentorStats,
  adminStats,
};
