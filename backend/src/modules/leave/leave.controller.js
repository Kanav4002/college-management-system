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

module.exports = { apply, listMine, listAssigned, approve, reject };
