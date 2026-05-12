const mongoose = require('mongoose');

const readReceiptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    name: { type: String, trim: true },
    type: {
      type: String,
      enum: ['FILE', 'IMAGE', 'VOICE'],
      default: 'FILE',
    },
    mimeType: { type: String, trim: true },
    size: { type: Number, min: 0 },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: { type: String, trim: true, default: '' },
    attachments: [attachmentSchema],
    readBy: [readReceiptSchema],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'messages' }
);

messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ text: 'text' });

module.exports = mongoose.model('Message', messageSchema);
