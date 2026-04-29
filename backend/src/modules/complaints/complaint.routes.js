// /api/complaints/* — full Spring-equivalent surface area, RBAC enforced
// per action. Order matters: literal paths before /:id-style routes.

const router = require('express').Router();

const controller = require('./complaint.controller');
const { verifyJwt } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const asyncHandler = require('../../utils/asyncHandler');

router.use(verifyJwt);

// ─── Stats (exact paths the React panels hit) ─────────────
router.get('/stats/student', requireRole('STUDENT'), asyncHandler(controller.studentStats));
router.get('/stats/mentor',  requireRole('MENTOR'),  asyncHandler(controller.mentorStats));
router.get('/stats/admin',   requireRole('ADMIN'),   asyncHandler(controller.adminStats));

// ─── Listings ─────────────────────────────────────────────
router.get('/my',          requireRole('STUDENT'),       asyncHandler(controller.listMine));
router.get('/mentor/my',   requireRole('MENTOR'),        asyncHandler(controller.listMentorOwn));
router.get('/assigned',    requireRole('MENTOR'),        asyncHandler(controller.listMentorAssigned));
router.get('/all',         requireRole('ADMIN'),         asyncHandler(controller.listAll));

// ─── Create (one route per submitter role) ────────────────
router.post('/',        requireRole('STUDENT'),  asyncHandler(controller.createAsStudent));
router.post('/mentor',  requireRole('MENTOR'),   asyncHandler(controller.createAsMentor));
router.post('/admin',   requireRole('ADMIN'),    asyncHandler(controller.createAsAdmin));

// ─── Mentor actions ───────────────────────────────────────
router.put('/:id/approve',  requireRole('MENTOR'), asyncHandler(controller.approve));
router.put('/:id/reject',   requireRole('MENTOR'), asyncHandler(controller.reject));
router.put('/:id/escalate', requireRole('MENTOR'), asyncHandler(controller.escalate));

// ─── Admin actions ────────────────────────────────────────
router.put('/:id/assign',   requireRole('ADMIN'), asyncHandler(controller.assign));
router.put('/:id/resolve',  requireRole('ADMIN'), asyncHandler(controller.resolve));
router.put('/:id/close',    requireRole('ADMIN'), asyncHandler(controller.close));
router.delete('/:id',       requireRole('ADMIN'), asyncHandler(controller.remove));

// ─── Comments — anyone authenticated can view & add ───────
router.get('/:id/comments',  asyncHandler(controller.listComments));
router.post('/:id/comments', asyncHandler(controller.addComment));

module.exports = router;
