const router = require('express').Router();

const controller = require('./attendance.controller');
const { verifyJwt } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');
const asyncHandler = require('../../utils/asyncHandler');

router.use(verifyJwt);

router.get('/subjects', asyncHandler(controller.listSubjects));
router.post('/subjects', requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.createSubject));

router.get('/students', requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.listStudents));

router.get('/student/summary', requireRole('STUDENT'), asyncHandler(controller.studentSummary));
router.get('/mentor/stats', requireRole('MENTOR'), asyncHandler(controller.mentorStats));
router.get('/admin/stats', requireRole('ADMIN'), asyncHandler(controller.adminStats));

router.get('/sessions', asyncHandler(controller.listSessions));
router.post('/sessions', requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.createSession));
router.get('/sessions/:id', asyncHandler(controller.getSession));
router.put('/sessions/:id/records', requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.updateRecords));
router.put('/sessions/:id/mark-all-present', requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.markAllPresent));
router.put('/sessions/:id/lock', requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.lockSession));

router.put('/records/:id/correction', requireRole('STUDENT'), asyncHandler(controller.requestCorrection));
router.put('/records/:id/correction/resolve', requireRole('MENTOR', 'ADMIN'), asyncHandler(controller.resolveCorrection));

module.exports = router;
