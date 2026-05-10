const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');

async function createAnnouncement(req, res) {
  const { title, summary, content, category } = req.body;

  const announcement = await Announcement.create({
    title,
    summary,
    content,
    category,
    createdBy: req.user.id,
  });

  const recipients = await User.find({ role: { $in: ['STUDENT', 'MENTOR'] } }).select('_id').lean();
  if (recipients.length > 0) {
    const notifications = recipients.map((user) => ({
      userId: user._id,
      announcementId: announcement._id,
    }));
    await Notification.insertMany(notifications);
  }

  return res.status(201).json({ success: true, data: announcement });
}

async function listAnnouncements(req, res) {
  const { search, category } = req.query;
  const filter = {};

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (search) {
    const regex = { $regex: search, $options: 'i' };
    filter.$or = [
      { title: regex },
      { summary: regex },
      { content: regex },
    ];
  }

  const announcements = await Announcement.find(filter)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email')
    .lean();

  return res.json({ success: true, data: announcements });
}

async function getAnnouncement(req, res) {
  const announcement = await Announcement.findById(req.params.id)
    .populate('createdBy', 'name email')
    .lean();

  if (!announcement) {
    throw AppError.notFound('Announcement not found');
  }

  return res.json({ success: true, data: announcement });
}

async function updateAnnouncement(req, res) {
  const { title, summary, content, category } = req.body;

  const announcement = await Announcement.findByIdAndUpdate(
    req.params.id,
    { title, summary, content, category, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).lean();

  if (!announcement) {
    throw AppError.notFound('Announcement not found');
  }

  return res.json({ success: true, data: announcement });
}

async function deleteAnnouncement(req, res) {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) {
    throw AppError.notFound('Announcement not found');
  }

  await Notification.deleteMany({ announcementId: announcement._id });

  return res.json({ success: true, data: null });
}

module.exports = {
  createAnnouncement,
  listAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
