const express = require('express');
const User = require('../models/User');
const Room = require('../models/Room');

const router = express.Router();

// Dev-only: show counts and sample data
router.get('/status', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }

  const [userCount, roomCount] = await Promise.all([User.countDocuments(), Room.countDocuments()]);
  const users = await User.find({}, { name: 1, email: 1, role: 1 }).limit(20);
  const rooms = await Room.find({}, { title: 1, location: 1, rent: 1 }).limit(20);

  res.json({ userCount, roomCount, users, rooms });
});

module.exports = router;
