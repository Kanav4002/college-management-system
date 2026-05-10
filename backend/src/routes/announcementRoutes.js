const router = require('express').Router();

const controller = require('../controllers/announcementController');
const { verifyJwt } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');
const asyncHandler = require('../utils/asyncHandler');

router.use(verifyJwt);

router.get('/', asyncHandler(controller.listAnnouncements));
router.get('/:id', asyncHandler(controller.getAnnouncement));
router.post('/', requireRole('ADMIN'), asyncHandler(controller.createAnnouncement));
router.put('/:id', requireRole('ADMIN'), asyncHandler(controller.updateAnnouncement));
router.delete('/:id', requireRole('ADMIN'), asyncHandler(controller.deleteAnnouncement));

module.exports = router;
