/**
 * RoomRadar Admin Script
 * ─────────────────────
 * Lists all users AND resets their passwords to: 123qwe,./Sh
 *
 * Usage:
 *   cd "c:\FullStack 5 sem\server"
 *   node scripts/reset-passwords.js
 *
 * ⚠️  REQUIRES MongoDB Atlas to be connected (whitelist your IP first).
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/* ── Schema (inline so we don't need imports) ─────────────────────── */
const userSchema = new mongoose.Schema({
  name:         String,
  email:        String,
  passwordHash: String,
  role:         String,
  isVerified:   Boolean,
  lifestyleTags: [String],
  age:          Number,
  gender:       String,
  preferences:  Object,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

/* ── Main ─────────────────────────────────────────────────────────── */
async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌  MONGO_URI not found in .env file');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB Atlas…');
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅  Connected!\n');

  /* 1. List all users */
  const users = await User.find({})
    .select('name email role isVerified age lifestyleTags createdAt')
    .sort({ createdAt: -1 });

  if (users.length === 0) {
    console.log('ℹ️   No users found in the database.');
    await mongoose.disconnect();
    return;
  }

  console.log(`👥  Found ${users.length} user(s):\n`);
  console.log('─'.repeat(70));
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.name.padEnd(20)} | ${u.email.padEnd(28)} | ${u.role}`);
  });
  console.log('─'.repeat(70));

  /* 2. Reset all passwords */
  const NEW_PASSWORD = '123qwe,./Sh';
  console.log(`\n🔑  Resetting ALL passwords to: ${NEW_PASSWORD}\n`);

  const newHash = await bcrypt.hash(NEW_PASSWORD, 12);

  const result = await User.updateMany({}, { $set: { passwordHash: newHash } });
  console.log(`✅  Updated ${result.modifiedCount} user(s) successfully.\n`);

  /* 3. Print summary table */
  console.log('📋  User Summary:\n');
  console.log('  Name                 | Email                        | Role   | Tags');
  console.log('─'.repeat(80));
  users.forEach((u) => {
    const tags = (u.lifestyleTags || []).join(', ') || '(none)';
    const name  = u.name.padEnd(20);
    const email = u.email.padEnd(28);
    const role  = u.role.padEnd(6);
    console.log(`  ${name} | ${email} | ${role} | ${tags}`);
  });
  console.log('─'.repeat(80));
  console.log(`\n🔐  All users can now log in with password: ${NEW_PASSWORD}`);
  console.log('⚠️   Remember to update your own password after logging in!\n');

  await mongoose.disconnect();
  console.log('🔌  Disconnected. Done!');
}

main().catch((err) => {
  console.error('❌  Error:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
