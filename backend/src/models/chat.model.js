const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['PRIVATE', 'GROUP'],
      required: true,
      index: true,
    },
    name: { type: String, trim: true, default: '' },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentGroup',
      default: null,
      index: true,
    },
    course: { type: String, trim: true, default: '' },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
  },
  { timestamps: true, collection: 'chats' }
);

chatSchema.index({ type: 1, participants: 1 });
chatSchema.index({ type: 1, group: 1 }, { unique: true, partialFilterExpression: { type: 'GROUP' } });

module.exports = mongoose.model('Chat', chatSchema);
