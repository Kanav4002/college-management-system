const router = require('express').Router();

const controller = require('../controllers/chatController');
const { verifyJwt } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

router.use(verifyJwt);

router.get('/', asyncHandler(controller.listChats));
router.get('/users', asyncHandler(controller.searchUsers));
router.get('/messages/search', asyncHandler(controller.searchMessages));
router.get('/:chatId/messages', asyncHandler(controller.getMessages));

router.post('/private', asyncHandler(controller.createPrivateChat));
router.post('/group', asyncHandler(controller.createGroupChat));
router.post('/:chatId/messages', asyncHandler(controller.sendMessage));
router.post('/:chatId/read', asyncHandler(controller.markRead));

router.patch('/messages/:messageId', asyncHandler(controller.editMessage));
router.patch('/messages/:messageId/pin', asyncHandler(controller.togglePin));
router.delete('/messages/:messageId', asyncHandler(controller.deleteMessage));

module.exports = router;
