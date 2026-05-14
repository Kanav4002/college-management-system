const mongoose = require('mongoose');

const AppError = require('../../utils/AppError');
const {
  AttendanceRecord,
  AttendanceSession,
  Subject,
  User,
} = require('../../models');

const VALID_STATUSES = ['PRESENT', 'ABSENT', 'LEAVE', 'PENDING'];

function assertObjectId(id, label = 'id') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw AppError.badRequest(`Invalid ${label}`);
  }
}

function normalizeDate(value = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw AppError.badRequest('Invalid date');
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

function percentage(present, total) {
  return total ? Math.round((present / total) * 100) : 0;
}

function assertStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    throw AppError.badRequest(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
}

function isMentorOwner(user, session) {
  return String(session.mentor?._id || session.mentor) === String(user.id);
}

function ensureCanManageSession(user, session) {
  if (user.role === 'ADMIN') return;
  if (user.role === 'MENTOR' && isMentorOwner(user, session)) return;
  throw AppError.forbidden('You can manage attendance only for assigned sessions');
}

function ensureCanViewSession(user, session) {
  if (user.role === 'ADMIN') return;
  if (user.role === 'MENTOR' && isMentorOwner(user, session)) return;
  if (user.role === 'STUDENT' && String(user.groupId || '') === String(session.group || '')) return;
  throw AppError.forbidden('You cannot view this attendance session');
}

function subjectDto(subject) {
  return {
    id: String(subject._id),
    name: subject.name,
    code: subject.code,
    section: subject.section || '',
    groupId: subject.group ? String(subject.group._id || subject.group) : null,
    groupName: subject.group?.name || '',
    mentorId: subject.mentor ? String(subject.mentor._id || subject.mentor) : null,
    mentorName: subject.mentor?.name || '',
  };
}

function studentDto(student) {
  return {
    id: String(student._id),
    name: student.name,
    email: student.email,
    rollNo: student.rollNo || '',
    branch: student.branch || '',
    groupId: student.group ? String(student.group._id || student.group) : null,
    groupName: student.group?.name || '',
  };
}

function recordDto(record) {
  const student = record.student || {};
  return {
    id: String(record._id),
    sessionId: String(record.session?._id || record.session),
    studentId: String(student._id || record.student),
    studentName: student.name || '',
    studentEmail: student.email || '',
    rollNo: student.rollNo || '',
    subjectId: String(record.subject?._id || record.subject),
    subjectName: record.subject?.name || '',
    subjectCode: record.subject?.code || '',
    date: record.date,
    status: record.status,
    remarks: record.remarks || '',
    correction: record.correction || { status: 'NONE' },
    updatedAt: record.updatedAt,
  };
}

function sessionDto(session, records = []) {
  const counts = records.reduce(
    (acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    },
    { PRESENT: 0, ABSENT: 0, LEAVE: 0, PENDING: 0 }
  );
  const total = records.length;

  return {
    id: String(session._id),
    title: session.title || '',
    date: session.date,
    locked: Boolean(session.locked),
    lockedAt: session.lockedAt,
    submittedAt: session.submittedAt,
    subjectId: String(session.subject?._id || session.subject),
    subjectName: session.subject?.name || '',
    subjectCode: session.subject?.code || '',
    groupId: session.group ? String(session.group._id || session.group) : null,
    groupName: session.group?.name || '',
    section: session.section || session.subject?.section || '',
    mentorId: String(session.mentor?._id || session.mentor),
    mentorName: session.mentor?.name || '',
    total,
    counts,
    percentage: percentage(counts.PRESENT, total),
    records: records.map(recordDto),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

async function listSubjects(user) {
  const query = {};
  if (user.role === 'MENTOR') {
    query.$or = [{ mentor: user.id }];
    if (user.groupId) query.$or.push({ group: user.groupId });
  }
  if (user.role === 'STUDENT') {
    if (!user.groupId) return [];
    query.group = user.groupId;
  }

  const subjects = await Subject.find(query)
    .populate('group', 'name')
    .populate('mentor', 'name email')
    .sort({ name: 1 });
  return subjects.map(subjectDto);
}

async function createSubject(user, payload) {
  const name = String(payload?.name || '').trim();
  const code = String(payload?.code || '').trim().toUpperCase();
  if (!name || !code) throw AppError.badRequest('Subject name and code are required');

  const group = payload?.groupId || user.groupId || null;
  if (group) assertObjectId(group, 'groupId');

  const mentorId = user.role === 'ADMIN' && payload?.mentorId ? payload.mentorId : user.id;
  assertObjectId(mentorId, 'mentorId');

  const subject = await Subject.create({
    name,
    code,
    group,
    mentor: mentorId,
    section: String(payload?.section || '').trim(),
  });

  return subjectDto(await subject.populate(['group', 'mentor']));
}

async function listStudents(user, groupId) {
  const group = groupId || user.groupId;
  if (!group) {
    if (user.role !== 'ADMIN') return [];
    const students = await User.find({ role: 'STUDENT' }).populate('group', 'name').sort({ name: 1 });
    return students.map(studentDto);
  }

  assertObjectId(group, 'groupId');
  if (user.role === 'MENTOR' && user.groupId && String(group) !== String(user.groupId)) {
    throw AppError.forbidden('You can view only students in your assigned group');
  }

  const students = await User.find({ role: 'STUDENT', group })
    .populate('group', 'name')
    .sort({ rollNo: 1, name: 1 });
  return students.map(studentDto);
}

async function ensureRecordsForSession(session) {
  const students = await User.find({ role: 'STUDENT', group: session.group }).select('_id');
  if (!students.length) return;

  await AttendanceRecord.bulkWrite(
    students.map((student) => ({
      updateOne: {
        filter: { session: session._id, student: student._id },
        update: {
          $setOnInsert: {
            session: session._id,
            student: student._id,
            mentor: session.mentor,
            subject: session.subject,
            group: session.group,
            date: session.date,
            status: 'PENDING',
          },
        },
        upsert: true,
      },
    }))
  );
}

async function createSession(user, payload) {
  if (user.role !== 'MENTOR' && user.role !== 'ADMIN') {
    throw AppError.forbidden();
  }

  const subjectId = payload?.subjectId;
  assertObjectId(subjectId, 'subjectId');
  const subject = await Subject.findById(subjectId);
  if (!subject) throw AppError.notFound('Subject not found');

  if (user.role === 'MENTOR') {
    const ownsSubject = String(subject.mentor || '') === String(user.id);
    const ownsGroup = user.groupId && String(subject.group || '') === String(user.groupId);
    if (!ownsSubject && !ownsGroup) {
      throw AppError.forbidden('You can create sessions only for assigned subjects');
    }
  }

  const group = payload?.groupId || subject.group || user.groupId;
  if (!group) throw AppError.badRequest('A class/group is required for attendance');
  assertObjectId(group, 'groupId');

  const session = await AttendanceSession.create({
    title: String(payload?.title || '').trim(),
    mentor: user.role === 'MENTOR' ? user.id : subject.mentor || user.id,
    subject: subject._id,
    group,
    section: String(payload?.section || subject.section || '').trim(),
    date: normalizeDate(payload?.date),
  });

  await ensureRecordsForSession(session);
  return getSession(user, session._id);
}

async function buildSessionQuery(user, filters = {}) {
  const query = {};
  if (user.role === 'MENTOR') query.mentor = user.id;
  if (user.role === 'STUDENT') query.group = user.groupId || '__none__';
  if (filters.subjectId) {
    assertObjectId(filters.subjectId, 'subjectId');
    query.subject = filters.subjectId;
  }
  if (filters.groupId) {
    assertObjectId(filters.groupId, 'groupId');
    query.group = filters.groupId;
  }
  if (filters.date) query.date = normalizeDate(filters.date);
  return query;
}

async function listSessions(user, filters = {}) {
  const query = await buildSessionQuery(user, filters);
  const sessions = await AttendanceSession.find(query)
    .populate('subject', 'name code section')
    .populate('group', 'name')
    .populate('mentor', 'name email')
    .sort({ date: -1, createdAt: -1 })
    .limit(80);

  const records = await AttendanceRecord.find({ session: { $in: sessions.map((s) => s._id) } })
    .populate('student', 'name email rollNo')
    .populate('subject', 'name code');

  const bySession = records.reduce((acc, record) => {
    const key = String(record.session);
    acc[key] = acc[key] || [];
    acc[key].push(record);
    return acc;
  }, {});

  return sessions.map((session) => sessionDto(session, bySession[String(session._id)] || []));
}

async function getSession(user, id) {
  assertObjectId(id);
  const session = await AttendanceSession.findById(id)
    .populate('subject', 'name code section')
    .populate('group', 'name')
    .populate('mentor', 'name email');
  if (!session) throw AppError.notFound('Attendance session not found');
  ensureCanViewSession(user, session);

  await ensureRecordsForSession(session);

  const records = await AttendanceRecord.find({ session: session._id })
    .populate('student', 'name email rollNo')
    .populate('subject', 'name code')
    .sort({ 'student.rollNo': 1, 'student.name': 1 });

  return sessionDto(session, records);
}

async function updateRecords(user, sessionId, payload) {
  assertObjectId(sessionId, 'sessionId');
  const session = await AttendanceSession.findById(sessionId);
  if (!session) throw AppError.notFound('Attendance session not found');
  ensureCanManageSession(user, session);
  if (session.locked) throw AppError.badRequest('Attendance is locked for this session');

  const records = Array.isArray(payload?.records) ? payload.records : [];
  if (!records.length) throw AppError.badRequest('At least one attendance record is required');

  await AttendanceRecord.bulkWrite(
    records.map((item) => {
      assertObjectId(item.studentId, 'studentId');
      assertStatus(item.status);
      return {
        updateOne: {
          filter: { session: session._id, student: item.studentId },
          update: {
            $set: {
              status: item.status,
              remarks: String(item.remarks || '').trim(),
              mentor: session.mentor,
              subject: session.subject,
              group: session.group,
              date: session.date,
            },
          },
          upsert: true,
        },
      };
    })
  );

  session.submittedAt = new Date();
  await session.save();
  return getSession(user, session._id);
}

async function markAllPresent(user, sessionId) {
  const session = await AttendanceSession.findById(sessionId);
  if (!session) throw AppError.notFound('Attendance session not found');
  ensureCanManageSession(user, session);
  if (session.locked) throw AppError.badRequest('Attendance is locked for this session');

  await ensureRecordsForSession(session);
  await AttendanceRecord.updateMany(
    { session: session._id },
    { $set: { status: 'PRESENT', remarks: '' } }
  );
  session.submittedAt = new Date();
  await session.save();
  return getSession(user, session._id);
}

async function lockSession(user, sessionId) {
  const session = await AttendanceSession.findById(sessionId);
  if (!session) throw AppError.notFound('Attendance session not found');
  ensureCanManageSession(user, session);
  session.locked = true;
  session.lockedAt = new Date();
  session.submittedAt = session.submittedAt || new Date();
  await session.save();
  return getSession(user, session._id);
}

async function requestCorrection(user, recordId, payload) {
  assertObjectId(recordId, 'recordId');
  const record = await AttendanceRecord.findById(recordId);
  if (!record) throw AppError.notFound('Attendance record not found');
  if (String(record.student) !== String(user.id)) {
    throw AppError.forbidden('You can request corrections only for your own records');
  }

  const reason = String(payload?.reason || '').trim();
  if (!reason) throw AppError.badRequest('Correction reason is required');

  record.correction = {
    status: 'PENDING',
    reason,
    response: '',
    requestedAt: new Date(),
    resolvedAt: null,
    resolvedBy: null,
  };
  await record.save();
  return recordDto(await record.populate(['student', 'subject']));
}

async function resolveCorrection(user, recordId, payload) {
  assertObjectId(recordId, 'recordId');
  const record = await AttendanceRecord.findById(recordId).populate('session');
  if (!record) throw AppError.notFound('Attendance record not found');
  ensureCanManageSession(user, record.session);

  const approved = Boolean(payload?.approved);
  const status = payload?.status || record.status;
  if (approved) assertStatus(status);

  record.status = approved ? status : record.status;
  record.correction = {
    ...record.correction,
    status: approved ? 'APPROVED' : 'REJECTED',
    response: String(payload?.response || '').trim(),
    resolvedAt: new Date(),
    resolvedBy: user.id,
  };
  await record.save();
  return recordDto(await record.populate(['student', 'subject']));
}

async function studentSummary(user, filters = {}) {
  const query = { student: user.id };
  if (filters.month) {
    const [year, month] = String(filters.month).split('-').map(Number);
    if (!year || !month) throw AppError.badRequest('Month must be YYYY-MM');
    query.date = {
      $gte: new Date(year, month - 1, 1),
      $lt: new Date(year, month, 1),
    };
  }

  const records = await AttendanceRecord.find(query)
    .populate('subject', 'name code')
    .populate({
      path: 'session',
      select: 'title locked group mentor',
      populate: [{ path: 'mentor', select: 'name email' }, { path: 'group', select: 'name' }],
    })
    .sort({ date: -1 });

  const total = records.length;
  const present = records.filter((record) => record.status === 'PRESENT').length;
  const absent = records.filter((record) => record.status === 'ABSENT').length;
  const leave = records.filter((record) => record.status === 'LEAVE').length;
  const pending = records.filter((record) => record.status === 'PENDING').length;

  const subjectMap = new Map();
  records.forEach((record) => {
    const key = String(record.subject?._id || record.subject);
    const item = subjectMap.get(key) || {
      subjectId: key,
      subjectName: record.subject?.name || 'Subject',
      subjectCode: record.subject?.code || '',
      total: 0,
      present: 0,
      absent: 0,
      leave: 0,
      pending: 0,
      percentage: 0,
    };
    item.total += 1;
    item[record.status.toLowerCase()] += 1;
    item.percentage = percentage(item.present, item.total);
    subjectMap.set(key, item);
  });

  const monthlyMap = new Map();
  records.forEach((record) => {
    const key = new Date(record.date).toISOString().slice(0, 7);
    const item = monthlyMap.get(key) || { month: key, total: 0, present: 0, percentage: 0 };
    item.total += 1;
    if (record.status === 'PRESENT') item.present += 1;
    item.percentage = percentage(item.present, item.total);
    monthlyMap.set(key, item);
  });

  return {
    overall: {
      total,
      present,
      absent,
      leave,
      pending,
      percentage: percentage(present, total),
      lowAttendance: percentage(present, total) < 75,
    },
    subjectWise: Array.from(subjectMap.values()).sort((a, b) => a.subjectName.localeCompare(b.subjectName)),
    monthly: Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month)),
    history: records.map((record) => ({
      ...recordDto(record),
      sessionTitle: record.session?.title || '',
      mentorName: record.session?.mentor?.name || '',
      groupName: record.session?.group?.name || '',
      locked: Boolean(record.session?.locked),
    })),
  };
}

async function mentorStats(user) {
  const sessions = await listSessions(user);
  const totals = sessions.reduce(
    (acc, session) => {
      acc.sessions += 1;
      acc.students += session.total;
      acc.present += session.counts.PRESENT;
      acc.absent += session.counts.ABSENT;
      acc.leave += session.counts.LEAVE;
      acc.pending += session.counts.PENDING;
      return acc;
    },
    { sessions: 0, students: 0, present: 0, absent: 0, leave: 0, pending: 0 }
  );

  return {
    ...totals,
    percentage: percentage(totals.present, totals.students),
    bySubject: sessions.reduce((acc, session) => {
      const key = session.subjectName || 'Subject';
      acc[key] = acc[key] || { total: 0, present: 0, percentage: 0 };
      acc[key].total += session.total;
      acc[key].present += session.counts.PRESENT;
      acc[key].percentage = percentage(acc[key].present, acc[key].total);
      return acc;
    }, {}),
  };
}

async function adminStats(user) {
  return mentorStats(user);
}

module.exports = {
  listSubjects,
  createSubject,
  listStudents,
  createSession,
  listSessions,
  getSession,
  updateRecords,
  markAllPresent,
  lockSession,
  requestCorrection,
  resolveCorrection,
  studentSummary,
  mentorStats,
  adminStats,
};
