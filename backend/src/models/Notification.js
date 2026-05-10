const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      default: 'New announcement posted',
    },
    type: {
      type: String,
      required: true,
      default: 'ANNOUNCEMENT',
    },
    announcementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Announcement',
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'notifications',
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
