const mongoose = require('mongoose');

const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const StudentGroup = require('../models/studentGroup.model');
const AppError = require('../utils/AppError');

const PUBLIC_USER_FIELDS = 'name email role group branch rollNo facultyId adminId';

function toId(value) {
  return value?._id?.toString?.() || value?.toString?.() || String(value);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureObjectId(id, label = 'id') {
  if (!mongoose.isValidObjectId(id)) {
    throw AppError.badRequest(`Invalid ${label}`);
  }
}

function canPrivateChat(currentRole, targetRole) {
  if (currentRole === 'ADMIN') return true;
  if (currentRole === 'MENTOR') return ['STUDENT', 'ADMIN'].includes(targetRole);
  if (currentRole === 'STUDENT') return targetRole === 'MENTOR';
  return false;
}

function canAccessChat(user, chat) {
  if (user.role === 'ADMIN') return true;

  const userId = toId(user.id);
  if (chat.type === 'PRIVATE') {
    return chat.participants.some((participant) => toId(participant) === userId);
  }

  if (!user.groupId || !chat.group) return false;
  return toId(chat.group) === toId(user.groupId);
}

function normalizeMessagePayload(payload = {}) {
  const text = String(payload.text || '').trim();
  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments
        .filter((attachment) => attachment && (attachment.url || attachment.name))
        .map((attachment) => ({
          url: String(attachment.url || '').trim(),
          name: String(attachment.name || 'Attachment').trim(),
          type: ['FILE', 'IMAGE', 'VOICE'].includes(attachment.type) ? attachment.type : 'FILE',
          mimeType: String(attachment.mimeType || '').trim(),
          size: Number.isFinite(Number(attachment.size)) ? Number(attachment.size) : undefined,
        }))
    : [];

  if (!text && attachments.length === 0) {
    throw AppError.badRequest('Message text or attachment is required');
  }

  return { text, attachments };
}

function populateChat(query) {
  return query
    .populate('participants', PUBLIC_USER_FIELDS)
    .populate('group', 'name description mentor')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: PUBLIC_USER_FIELDS },
    })
    .populate({
      path: 'pinnedMessages',
      match: { isDeleted: false },
      options: { sort: { createdAt: -1 }, limit: 5 },
      populate: { path: 'sender', select: PUBLIC_USER_FIELDS },
    });
}

async function getAccessibleChat(user, chatId) {
  ensureObjectId(chatId, 'chatId');
  const chat = await Chat.findById(chatId);
  if (!chat) throw AppError.notFound('Chat not found');
  if (!canAccessChat(user, chat)) throw AppError.forbidden('You cannot access this chat');
  return chat;
}

async function listChats(user, filters = {}) {
  const query = {};
  if (user.role !== 'ADMIN') {
    query.$or = [{ participants: user.id }];
    if (user.groupId) query.$or.push({ type: 'GROUP', group: user.groupId });
  }

  if (filters.type && ['PRIVATE', 'GROUP'].includes(filters.type)) {
    query.type = filters.type;
  }

  if (filters.role) {
    const users = await User.find({ role: filters.role }).select('_id').lean();
    query.participants = { $in: users.map((item) => item._id) };
  }

  if (filters.course) {
    query.course = new RegExp(escapeRegExp(filters.course), 'i');
  }

  const chats = await populateChat(Chat.find(query).sort({ updatedAt: -1 }).limit(100)).lean();
  const unreadCounts = await Message.aggregate([
    {
      $match: {
        chat: { $in: chats.map((chat) => chat._id) },
        sender: { $ne: new mongoose.Types.ObjectId(user.id) },
        'readBy.user': { $ne: new mongoose.Types.ObjectId(user.id) },
        isDeleted: false,
      },
    },
    { $group: { _id: '$chat', count: { $sum: 1 } } },
  ]);

  const countsByChat = new Map(unreadCounts.map((item) => [toId(item._id), item.count]));
  return chats.map((chat) => ({
    ...chat,
    unreadCount: countsByChat.get(toId(chat._id)) || 0,
  }));
}

async function createPrivateChat(user, targetUserId) {
  ensureObjectId(targetUserId, 'userId');
  if (toId(targetUserId) === toId(user.id)) {
    throw AppError.badRequest('You cannot start a chat with yourself');
  }

  const target = await User.findById(targetUserId).select(PUBLIC_USER_FIELDS);
  if (!target) throw AppError.notFound('User not found');
  if (!canPrivateChat(user.role, target.role) || !canPrivateChat(target.role, user.role)) {
    throw AppError.forbidden('Chat is not allowed between these roles');
  }

  const participants = [user.id, target._id].sort((a, b) => toId(a).localeCompare(toId(b)));
  let chat = await Chat.findOne({
    type: 'PRIVATE',
    participants: { $all: participants, $size: 2 },
  });

  if (!chat) {
    chat = await Chat.create({
      type: 'PRIVATE',
      participants,
      createdBy: user.id,
    });
  }

  return populateChat(Chat.findById(chat._id)).lean();
}

async function createGroupChat(user, payload = {}) {
  const groupId = payload.groupId || user.groupId;
  ensureObjectId(groupId, 'groupId');

  if (user.role !== 'ADMIN' && toId(groupId) !== toId(user.groupId)) {
    throw AppError.forbidden('You can only create a chat for your own group');
  }

  const group = await StudentGroup.findById(groupId);
  if (!group) throw AppError.notFound('Group not found');

  const members = await User.find({ group: groupId }).select('_id').lean();
  const participantIds = [...new Set([user.id, ...members.map((member) => toId(member._id))])];

  const chat = await Chat.findOneAndUpdate(
    { type: 'GROUP', group: groupId },
    {
      $setOnInsert: {
        type: 'GROUP',
        group: groupId,
        name: payload.name || `${group.name} Chat`,
        createdBy: user.id,
      },
      $set: {
        participants: participantIds,
        course: payload.course || group.name,
      },
    },
    { upsert: true, new: true }
  );

  return populateChat(Chat.findById(chat._id)).lean();
}

async function getMessages(user, chatId, query = {}) {
  const chat = await getAccessibleChat(user, chatId);
  const limit = Math.min(Number(query.limit) || 50, 100);
  const messageQuery = { chat: chat._id };

  if (query.before && mongoose.isValidObjectId(query.before)) {
    const beforeMessage = await Message.findById(query.before).select('createdAt');
    if (beforeMessage) messageQuery.createdAt = { $lt: beforeMessage.createdAt };
  }

  const messages = await Message.find(messageQuery)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', PUBLIC_USER_FIELDS)
    .populate('readBy.user', PUBLIC_USER_FIELDS)
    .lean();

  return messages.reverse();
}

async function sendMessage(user, chatId, payload) {
  const chat = await getAccessibleChat(user, chatId);
  const messagePayload = normalizeMessagePayload(payload);
  const message = await Message.create({
    chat: chat._id,
    sender: user.id,
    ...messagePayload,
    readBy: [{ user: user.id, readAt: new Date() }],
  });

  chat.lastMessage = message._id;
  await chat.save();

  return Message.findById(message._id)
    .populate('sender', PUBLIC_USER_FIELDS)
    .populate('readBy.user', PUBLIC_USER_FIELDS)
    .lean();
}

async function editMessage(user, messageId, text) {
  ensureObjectId(messageId, 'messageId');
  const message = await Message.findById(messageId);
  if (!message || message.isDeleted) throw AppError.notFound('Message not found');
  if (toId(message.sender) !== toId(user.id)) {
    throw AppError.forbidden('You can only edit messages you sent');
  }

  const nextText = String(text || '').trim();
  if (!nextText) throw AppError.badRequest('Message text is required');

  message.text = nextText;
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  return Message.findById(message._id).populate('sender', PUBLIC_USER_FIELDS).lean();
}

async function deleteMessage(user, messageId) {
  ensureObjectId(messageId, 'messageId');
  const message = await Message.findById(messageId);
  if (!message || message.isDeleted) throw AppError.notFound('Message not found');
  if (toId(message.sender) !== toId(user.id) && user.role !== 'ADMIN') {
    throw AppError.forbidden('You can only delete messages you sent');
  }

  message.text = '';
  message.attachments = [];
  message.isDeleted = true;
  message.deletedAt = new Date();
  await message.save();
}

async function markRead(user, chatId) {
  const chat = await getAccessibleChat(user, chatId);
  await Message.updateMany(
    {
      chat: chat._id,
      'readBy.user': { $ne: user.id },
    },
    {
      $push: { readBy: { user: user.id, readAt: new Date() } },
    }
  );

  return { chatId: toId(chat._id), userId: toId(user.id), readAt: new Date().toISOString() };
}

async function togglePin(user, messageId, pinned = true) {
  ensureObjectId(messageId, 'messageId');
  const message = await Message.findById(messageId);
  if (!message || message.isDeleted) throw AppError.notFound('Message not found');

  const chat = await getAccessibleChat(user, message.chat);

  message.pinned = Boolean(pinned);
  await message.save();

  await Chat.findByIdAndUpdate(chat._id, Boolean(pinned)
    ? { $addToSet: { pinnedMessages: message._id } }
    : { $pull: { pinnedMessages: message._id } });

  return Message.findById(message._id).populate('sender', PUBLIC_USER_FIELDS).lean();
}

async function searchUsers(user, query = {}) {
  const term = String(query.q || '').trim();
  const filter = {};

  if (term) {
    const regex = new RegExp(escapeRegExp(term), 'i');
    filter.$or = [
      { name: regex },
      { email: regex },
      { rollNo: regex },
      { facultyId: regex },
    ];
  }

  if (query.role && ['STUDENT', 'MENTOR', 'ADMIN'].includes(query.role)) {
    filter.role = query.role;
  }

  filter._id = { $ne: user.id };
  const users = await User.find(filter).select(PUBLIC_USER_FIELDS).limit(25).lean();
  return users.filter((item) => canPrivateChat(user.role, item.role) && canPrivateChat(item.role, user.role));
}

async function searchMessages(user, query = {}) {
  const term = String(query.q || '').trim();
  if (!term) return [];

  const chats = await listChats(user, { type: query.type, role: query.role, course: query.course });
  const chatIds = chats.map((chat) => chat._id);

  return Message.find({
    chat: { $in: chatIds },
    isDeleted: false,
    text: new RegExp(escapeRegExp(term), 'i'),
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('chat', 'name type group participants')
    .populate('sender', PUBLIC_USER_FIELDS)
    .lean();
}

module.exports = {
  canAccessChat,
  createGroupChat,
  createPrivateChat,
  deleteMessage,
  editMessage,
  getAccessibleChat,
  getMessages,
  listChats,
  markRead,
  searchMessages,
  searchUsers,
  sendMessage,
  togglePin,
};
