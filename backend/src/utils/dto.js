// Pure mapping functions: Mongoose docs/POJOs → plain JSON shapes that
// match the contract the React frontend was originally built against.
// Keeping them in one place avoids accidental drift between routes.

function userToPublic(user) {
  if (!user) return null;
  return {
    id: user._id?.toString() || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    rollNo: user.rollNo || null,
    branch: user.branch || null,
    facultyId: user.facultyId || null,
    adminId: user.adminId || null,
  };
}

function userToMember(user) {
  if (!user) return null;
  return {
    id: user._id?.toString() || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// LoginResponse — flat shape the AuthContext consumes.
function loginResponse({ user, token, group }) {
  return {
    token,
    email: user.email,
    role: user.role,
    name: user.name,
    groupId: group ? (group._id?.toString() || group.id) : null,
    groupName: group ? group.name : null,
  };
}

function groupToResponse(group, memberCount = 0) {
  if (!group) return null;
  const mentor = group.mentor && typeof group.mentor === 'object' ? group.mentor : null;
  return {
    id: group._id?.toString() || group.id,
    name: group.name,
    description: group.description || '',
    mentorId: mentor ? (mentor._id?.toString() || mentor.id) : (group.mentor || null),
    mentorName: mentor?.name || null,
    mentorEmail: mentor?.email || null,
    memberCount,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

function complaintToResponse(c) {
  if (!c) return null;
  const student = c.student && typeof c.student === 'object' ? c.student : null;
  const mentor  = c.mentor  && typeof c.mentor  === 'object' ? c.mentor  : null;
  // Group can be on the student (preferred) or detached.
  const group = student?.group && typeof student.group === 'object' ? student.group : null;
  return {
    id: c._id?.toString() || c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    issueType: c.issueType,
    building: c.building,
    floorNumber: c.floorNumber,
    roomNumber: c.roomNumber,
    problemStartedAt: c.problemStartedAt || null,
    priority: c.priority,
    status: c.status,
    studentName: student?.name || null,
    studentEmail: student?.email || null,
    mentorName: mentor?.name || null,
    assignedDepartment: c.assignedDepartment || null,
    submitterRole: c.submitterRole,
    groupName: group?.name || null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function commentToResponse(comment) {
  if (!comment) return null;
  const author = comment.author && typeof comment.author === 'object' ? comment.author : null;
  return {
    id: comment._id?.toString() || comment.id,
    complaintId: (comment.complaint?._id || comment.complaint)?.toString(),
    authorName: author?.name || null,
    authorEmail: author?.email || null,
    authorRole: author?.role || null,
    content: comment.content,
    createdAt: comment.createdAt,
  };
}

function leaveToResponse(leave) {
  if (!leave) return null;
  const student = leave.student && typeof leave.student === 'object' ? leave.student : null;
  const mentor  = leave.mentor  && typeof leave.mentor  === 'object' ? leave.mentor  : null;
  return {
    id: leave._id?.toString() || leave.id,
    leaveType: leave.leaveType,
    reason: leave.reason,
    startDate: leave.startDate,
    endDate: leave.endDate,
    days: leave.days,
    status: leave.status,
    studentEmail: student?.email || null,
    studentName: student?.name || null,
    mentorEmail: mentor?.email || null,
    appliedAt: leave.appliedAt || leave.createdAt,
    reviewedAt: leave.reviewedAt || null,
  };
}

module.exports = {
  userToPublic,
  userToMember,
  loginResponse,
  groupToResponse,
  complaintToResponse,
  commentToResponse,
  leaveToResponse,
};
