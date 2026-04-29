// /api/leaves/* — student applies; mentor or admin reviews.

const router = require('express').Router();

const controller = require('./leave.controller');
const { verifyJwt } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const asyncHandler = require('../../utils/asyncHandler');

router.use(verifyJwt);

router.post('/',          requireRole('STUDENT'),         asyncHandler(controller.apply));
router.get('/my',         requireRole('STUDENT'),         asyncHandler(controller.listMine));
router.get('/assigned',   requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.listAssigned));
router.put('/:id/approve', requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.approve));
router.put('/:id/reject',  requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.reject));

module.exports = router;
