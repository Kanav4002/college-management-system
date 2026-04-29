// Group business logic. Membership is stored on User.group, so adding /
// removing a member is a User.update under the hood.

const mongoose = require('mongoose');
const { User, StudentGroup } = require('../../models');
const AppError = require('../../utils/AppError');
const { groupToResponse, userToMember } = require('../../utils/dto');

function ensureValidId(id, label = 'id') {
  if (!mongoose.isValidObjectId(id)) {
    throw AppError.badRequest(`Invalid ${label}`);
  }
}

// Returns a Map<groupId, memberCount> built in a single aggregation pass.
async function memberCountsByGroup() {
  const rows = await User.aggregate([
    { $match: { group: { $ne: null } } },
    { $group: { _id: '$group', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.count]));
}

async function listGroups() {
  const [groups, counts] = await Promise.all([
    StudentGroup.find().populate('mentor', 'name email role').sort({ createdAt: -1 }),
    memberCountsByGroup(),
  ]);
  return groups.map((g) => groupToResponse(g, counts.get(g._id.toString()) || 0));
}

async function listMentors() {
  const mentors = await User.find({ role: 'MENTOR' }).select('name email').sort({ name: 1 });
  return mentors.map((m) => ({
    id: m._id.toString(),
    name: m.name,
    email: m.email,
  }));
}

async function listUnassigned(role) {
  const upper = String(role || '').toUpperCase();
  if (!['STUDENT', 'MENTOR'].includes(upper)) {
    throw AppError.badRequest('role must be STUDENT or MENTOR');
  }
  const users = await User.find({ role: upper, group: null }).select('name email role').sort({ name: 1 });
  return users.map(userToMember);
}

async function getGroupMembers(groupId) {
  ensureValidId(groupId, 'groupId');
  const exists = await StudentGroup.exists({ _id: groupId });
  if (!exists) throw AppError.notFound('Group not found');
  const members = await User.find({ group: groupId }).select('name email role').sort({ role: 1, name: 1 });
  return members.map(userToMember);
}

async function createGroup({ name, description, mentorId }) {
  if (!name || !name.trim()) throw AppError.badRequest('Group name is required');

  if (mentorId) {
    ensureValidId(mentorId, 'mentorId');
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'MENTOR') {
      throw AppError.badRequest('Mentor not found or not a MENTOR');
    }
  }

  const created = await StudentGroup.create({
    name: name.trim(),
    description: description || '',
    mentor: mentorId || null,
  });

  // Mentors are themselves group members.
  if (mentorId) {
    await User.findByIdAndUpdate(mentorId, { group: created._id });
  }

  const populated = await created.populate('mentor', 'name email role');
  return groupToResponse(populated, mentorId ? 1 : 0);
}

async function updateGroup(id, { name, description, mentorId }) {
  ensureValidId(id, 'groupId');
  const group = await StudentGroup.findById(id);
  if (!group) throw AppError.notFound('Group not found');

  if (name !== undefined) group.name = name.trim();
  if (description !== undefined) group.description = description || '';

  if (mentorId !== undefined) {
    if (mentorId) {
      ensureValidId(mentorId, 'mentorId');
      const mentor = await User.findById(mentorId);
      if (!mentor || mentor.role !== 'MENTOR') {
        throw AppError.badRequest('Mentor not found or not a MENTOR');
      }
      // Switch the mentor on the group; old mentor (if different) keeps
      // their group field so an admin can move them deliberately.
      group.mentor = mentor._id;
      // Make sure the new mentor is themselves a member of this group.
      await User.findByIdAndUpdate(mentor._id, { group: group._id });
    } else {
      group.mentor = null;
    }
  }

  await group.save();
  const populated = await group.populate('mentor', 'name email role');
  const counts = await memberCountsByGroup();
  return groupToResponse(populated, counts.get(group._id.toString()) || 0);
}

async function deleteGroup(id) {
  ensureValidId(id, 'groupId');
  const group = await StudentGroup.findById(id);
  if (!group) throw AppError.notFound('Group not found');
  // Detach every member so users aren't left referencing a deleted group.
  await User.updateMany({ group: group._id }, { $set: { group: null } });
  await group.deleteOne();
}

async function addMember(groupId, userId) {
  ensureValidId(groupId, 'groupId');
  ensureValidId(userId, 'userId');

  const [group, user] = await Promise.all([
    StudentGroup.findById(groupId),
    User.findById(userId),
  ]);
  if (!group) throw AppError.notFound('Group not found');
  if (!user) throw AppError.notFound('User not found');
  if (user.role === 'ADMIN') {
    throw AppError.badRequest('Admins cannot belong to a group');
  }

  user.group = group._id;
  await user.save();
  return userToMember(user);
}

async function removeMember(groupId, userId) {
  ensureValidId(groupId, 'groupId');
  ensureValidId(userId, 'userId');

  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  if (user.group?.toString() !== groupId) {
    throw AppError.badRequest('User is not a member of this group');
  }
  user.group = null;
  await user.save();

  // If the removed user was the mentor, also clear the group's mentor field.
  await StudentGroup.updateOne({ _id: groupId, mentor: userId }, { $set: { mentor: null } });
}

module.exports = {
  listGroups,
  listMentors,
  listUnassigned,
  getGroupMembers,
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
};
