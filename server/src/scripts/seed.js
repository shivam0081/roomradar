const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Room = require('../models/Room');
const bcrypt = require('bcryptjs');

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const seed = async () => {
  try {
    await connectDB();

    console.log('Seeding users...');

    const users = [
      {
        name: 'Ayesha Patel',
        email: 'ayesha@student.com',
        password: 'password123',
        role: 'owner',
        age: 22,
        gender: 'female',
        lifestyleTags: ['clean', 'early bird', 'quiet'],
        preferences: { budgetMax: 25000, location: 'Mumbai' },
      },
      {
        name: 'Shubham Bhatia',
        email: 'shubham779@gmail.com',
        password: '123qwe,./',
        role: 'owner',
        age: 26,
        gender: 'male',
        lifestyleTags: ['organized', 'friendly', 'responsible'],
        preferences: { budgetMax: 25000, location: 'Mumbai' },
      },
      {
        name: 'Neha Singh',
        email: 'neha@student.com',
        password: 'password123',
        role: 'renter',
        age: 23,
        gender: 'female',
        lifestyleTags: ['organized', 'fitness', 'quiet'],
        preferences: { budgetMax: 20000, location: 'Bangalore' },
      },
    ];

    const createdUsers = [];

    for (const u of users) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      const update = {
        name: u.name,
        role: u.role,
        age: u.age,
        gender: u.gender,
        lifestyleTags: u.lifestyleTags,
        preferences: u.preferences,
        passwordHash,
      };

      const user = await User.findOneAndUpdate(
        { email: u.email },
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      createdUsers.push(user);
    }

    console.log('Seeding rooms...');

    const rooms = [
      {
        title: 'Cozy 2BHK near OMR',
        description: 'Bright room with balcony, 2 mins from metro. Looking for a tidy roommate.',
        location: 'Chennai',
        rent: 15000,
        availableFrom: new Date(),
        seats: 1,
        amenities: ['WiFi', 'AC', 'Washer'],
        lifestyleTags: ['clean', 'quiet', 'study'],
        owner: createdUsers[0]._id,
      },
      {
        title: 'Shared flat near Andheri West',
        description: '3BHK with nice kitchen and balcony. Fun, social flatmates.',
        location: 'Mumbai',
        rent: 18000,
        availableFrom: new Date(),
        seats: 1,
        amenities: ['WiFi', 'Gym', 'Parking'],
        lifestyleTags: ['social', 'music', 'outgoing'],
        owner: createdUsers[1]._id,
      },
      {
        title: 'Quiet PG in Koramangala',
        description: 'Peaceful PG suited for students and working professionals.',
        location: 'Bangalore',
        rent: 17000,
        availableFrom: new Date(),
        seats: 1,
        amenities: ['AC', 'Laundry', 'Housekeeping'],
        lifestyleTags: ['quiet', 'study', 'organized'],
        owner: createdUsers[2]._id,
      },
    ];

    for (const room of rooms) {
      await Room.findOneAndUpdate(
        { title: room.title },
        { $set: room },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log('Seed complete.');
    console.log('Login with:');
    users.forEach((user) => console.log(`- ${user.email} / ${user.password}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
