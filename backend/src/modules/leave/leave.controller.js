const service = require('./leave.service');
const { ok, created } = require('../../utils/apiResponse');

async function apply(req, res) {
  return created(res, await service.apply(req.user, req.body));
}

async function listMine(req, res) {
  return ok(res, await service.listMine(req.user));
}

async function listAssigned(req, res) {
  return ok(res, await service.listAssigned(req.user));
}

async function approve(req, res) {
  return ok(res, await service.approve(req.user, req.params.id));
}

async function reject(req, res) {
  return ok(res, await service.reject(req.user, req.params.id));
}

async function statsMentor(req, res) {
  return ok(res, await service.statsMentor(req.user));
}

// Dev/debug helpers
async function debugRecent(req, res) {
  return ok(res, await service.debugRecent());
}

module.exports = { apply, listMine, listAssigned, approve, reject, debugRecent, statsMentor };
module.exports.statsMentor = statsMentor;

// Dev helper to see what a mentor would get for /assigned
async function debugAssigned(req, res) {
  const mentorId = req.params.mentorId;
  if (!mentorId) return ok(res, []);
  // Build an actor object similar to verifyJwt output
  const actor = { id: mentorId, role: 'MENTOR' };
  return ok(res, await service.listAssigned(actor));
}

module.exports.debugAssigned = debugAssigned;
