const router = require('express').Router();

const controller = require('../controllers/notificationController');
const { verifyJwt } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

router.use(verifyJwt);

router.get('/', asyncHandler(controller.listNotifications));
router.put('/:id/read', asyncHandler(controller.markNotificationRead));
router.put('/read-all', asyncHandler(controller.markAllNotificationsRead));

module.exports = router;
