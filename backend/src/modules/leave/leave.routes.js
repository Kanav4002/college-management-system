// /api/leaves/* — student applies; mentor or admin reviews.

const router = require('express').Router();

const controller = require('./leave.controller');
const { verifyJwt } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const asyncHandler = require('../../utils/asyncHandler');

// Dev-only unauthenticated debug route (useful when calling from browser)
if (process.env.NODE_ENV !== 'production') {
	router.get('/debug/recent-noauth', asyncHandler(controller.debugRecent));
	router.get('/debug/assigned/:mentorId', asyncHandler(controller.debugAssigned));
}

router.use(verifyJwt);

router.post('/',          requireRole('STUDENT'),         asyncHandler(controller.apply));
router.get('/my',         requireRole('STUDENT'),         asyncHandler(controller.listMine));
router.get('/pending',    requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.listAssigned));
router.get('/assigned',   requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.listAssigned));
router.get('/stats/mentor', requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.statsMentor));
router.put('/:id/approve', requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.approve));
router.put('/:id/reject',  requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.reject));

// Development-only debug endpoint to inspect recent leaves with populated
// student/group/mentor relationships. Not exposed in production.
if (process.env.NODE_ENV !== 'production') {
	router.get('/debug/recent', asyncHandler(controller.debugRecent));
}

module.exports = router;
