const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

async function listNotifications(req, res) {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ success: true, data: notifications });
}

async function markNotificationRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { isRead: true },
    { new: true }
  ).lean();

  if (!notification) {
    throw AppError.notFound('Notification not found');
  }

  return res.json({ success: true, data: notification });
}

async function markAllNotificationsRead(req, res) {
  await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });

  return res.json({ success: true, data: { updated: true } });
}

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
