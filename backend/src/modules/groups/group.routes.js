// /api/groups/* — most routes require ADMIN. The plain GET /api/groups
// is public so the Register page can list groups before the user has
// signed in.

const router = require('express').Router();

const controller = require('./group.controller');
const { verifyJwt } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const asyncHandler = require('../../utils/asyncHandler');

// Public — used by the Register form to list available groups.
router.get('/', asyncHandler(controller.listGroups));

// Everything below is admin-only.
router.use(verifyJwt, requireRole('ADMIN'));

router.get('/mentors', asyncHandler(controller.listMentors));
router.get('/unassigned/:role', asyncHandler(controller.listUnassigned));
router.get('/:id/members', asyncHandler(controller.getMembers));

router.post('/', asyncHandler(controller.createGroup));
router.put('/:id', asyncHandler(controller.updateGroup));
router.delete('/:id', asyncHandler(controller.deleteGroup));

router.post('/:id/members/:userId', asyncHandler(controller.addMember));
router.delete('/:id/members/:userId', asyncHandler(controller.removeMember));

module.exports = router;
