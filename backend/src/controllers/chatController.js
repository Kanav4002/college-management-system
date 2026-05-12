const chatService = require('../services/chat.service');
const { ok, created, noContent } = require('../utils/apiResponse');

async function listChats(req, res) {
  return ok(res, await chatService.listChats(req.user, req.query));
}

async function getMessages(req, res) {
  return ok(res, await chatService.getMessages(req.user, req.params.chatId, req.query));
}

async function createPrivateChat(req, res) {
  return created(res, await chatService.createPrivateChat(req.user, req.body.userId));
}

async function createGroupChat(req, res) {
  return created(res, await chatService.createGroupChat(req.user, req.body));
}

async function sendMessage(req, res) {
  return created(res, await chatService.sendMessage(req.user, req.params.chatId, req.body));
}

async function editMessage(req, res) {
  return ok(res, await chatService.editMessage(req.user, req.params.messageId, req.body.text));
}

async function deleteMessage(req, res) {
  await chatService.deleteMessage(req.user, req.params.messageId);
  return noContent(res);
}

async function markRead(req, res) {
  return ok(res, await chatService.markRead(req.user, req.params.chatId));
}

async function togglePin(req, res) {
  return ok(res, await chatService.togglePin(req.user, req.params.messageId, req.body.pinned));
}

async function searchUsers(req, res) {
  return ok(res, await chatService.searchUsers(req.user, req.query));
}

async function searchMessages(req, res) {
  return ok(res, await chatService.searchMessages(req.user, req.query));
}

module.exports = {
  listChats,
  getMessages,
  createPrivateChat,
  createGroupChat,
  sendMessage,
  editMessage,
  deleteMessage,
  markRead,
  togglePin,
  searchUsers,
  searchMessages,
};
