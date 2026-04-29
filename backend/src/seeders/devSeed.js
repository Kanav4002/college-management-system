// Idempotent dev seeder. Safe to run repeatedly:
//   - upserts one ADMIN, one MENTOR, one STUDENT with known passwords
//   - upserts a single demo group and links the mentor + student to it
//
// Run from the backend folder:  npm run seed
//
// Default credentials (change in code if you want different ones):
//   admin@unisphere.dev   / Admin@123
//   mentor@unisphere.dev  / Mentor@123
//   student@unisphere.dev / Student@123

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const env = require('../config/env');
const { User, StudentGroup } = require('../models');

const ACCOUNTS = [
  {
    email: 'admin@unisphere.dev',
    password: 'Admin@123',
    name: 'Demo Admin',
    role: 'ADMIN',
    adminId: 'ADM-DEMO-001',
  },
  {
    email: 'mentor@unisphere.dev',
    password: 'Mentor@123',
    name: 'Demo Mentor',
    role: 'MENTOR',
    facultyId: 'FAC-DEMO-001',
  },
  {
    email: 'student@unisphere.dev',
    password: 'Student@123',
    name: 'Demo Student',
    role: 'STUDENT',
    rollNo: 'ROLL-DEMO-001',
    branch: 'CSE',
  },
];

const DEMO_GROUP_NAME = 'CSE-DEMO';

async function upsertUser(spec) {
  const { email, password, ...rest } = spec;
  const existing = await User.findOne({ email });
  const hashed = await bcrypt.hash(password, 10);

  if (existing) {
    Object.assign(existing, rest, { password: hashed });
    await existing.save();
    return { user: existing, created: false };
  }

  const user = await User.create({ email, password: hashed, ...rest });
  return { user, created: true };
}

async function run() {
  await mongoose.connect(env.MONGO_URI);
  console.log(`[seed] connected to ${mongoose.connection.name}`);

  const created = {};
  for (const spec of ACCOUNTS) {
    const { user, created: isNew } = await upsertUser(spec);
    created[spec.role] = user;
    console.log(`[seed] ${isNew ? 'created' : 'updated'} ${spec.role.padEnd(7)} ${user.email}`);
  }

  // Ensure a demo group exists, with the demo mentor as its mentor.
  let group = await StudentGroup.findOne({ name: DEMO_GROUP_NAME });
  if (!group) {
    group = await StudentGroup.create({
      name: DEMO_GROUP_NAME,
      description: 'Demo group seeded for local development',
      mentor: created.MENTOR._id,
    });
    console.log(`[seed] created group ${group.name}`);
  } else {
    group.mentor = created.MENTOR._id;
    if (!group.description) group.description = 'Demo group seeded for local development';
    await group.save();
    console.log(`[seed] updated group ${group.name}`);
  }

  // Link mentor + student to the group (admin stays unassigned).
  for (const role of ['MENTOR', 'STUDENT']) {
    const u = created[role];
    if (!u.group || String(u.group) !== String(group._id)) {
      u.group = group._id;
      await u.save();
      console.log(`[seed] linked ${role} to group ${group.name}`);
    }
  }

  console.log('\n[seed] done. Try logging in with:');
  for (const a of ACCOUNTS) {
    console.log(`  ${a.role.padEnd(7)}  ${a.email}  /  ${a.password}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
