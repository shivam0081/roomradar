require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Room = require('../src/models/Room');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomradar';

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    // 1. Migrate Users
    const users = await User.find({});
    let usersUpdated = 0;
    for (let user of users) {
      if (user.lifestyleTags && user.lifestyleTags.length > 0 && typeof user.lifestyleTags[0] === 'string') {
        user.lifestyleTags = user.lifestyleTags.map(tag => ({
          tag: tag,
          weight: 1,
          isMandatory: false
        }));
        await user.save();
        usersUpdated++;
      }
    }
    console.log(`Migrated ${usersUpdated} users.`);

    // 2. Migrate Rooms
    const rooms = await Room.find({});
    let roomsUpdated = 0;
    for (let room of rooms) {
      if (room.lifestyleTags && room.lifestyleTags.length > 0 && typeof room.lifestyleTags[0] === 'string') {
        room.lifestyleTags = room.lifestyleTags.map(tag => ({
          tag: tag,
          weight: 1,
          isMandatory: false
        }));
        await room.save();
        roomsUpdated++;
      }
    }
    console.log(`Migrated ${roomsUpdated} rooms.`);

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
