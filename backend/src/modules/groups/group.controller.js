const service = require('./group.service');
const { ok, created, noContent } = require('../../utils/apiResponse');

async function listGroups(_req, res) {
  return ok(res, await service.listGroups());
}

async function listMentors(_req, res) {
  return ok(res, await service.listMentors());
}

async function listUnassigned(req, res) {
  return ok(res, await service.listUnassigned(req.params.role));
}

async function getMembers(req, res) {
  return ok(res, await service.getGroupMembers(req.params.id));
}

async function createGroup(req, res) {
  return created(res, await service.createGroup(req.body));
}

async function updateGroup(req, res) {
  return ok(res, await service.updateGroup(req.params.id, req.body));
}

async function deleteGroup(req, res) {
  await service.deleteGroup(req.params.id);
  return noContent(res);
}

async function addMember(req, res) {
  return created(res, await service.addMember(req.params.id, req.params.userId));
}

async function removeMember(req, res) {
  await service.removeMember(req.params.id, req.params.userId);
  return noContent(res);
}

module.exports = {
  listGroups,
  listMentors,
  listUnassigned,
  getMembers,
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
};
