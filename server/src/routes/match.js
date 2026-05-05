const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Room = require('../models/Room');
const { scoreUserMatch, scoreRoomMatch } = require('../utils/match');

const router = express.Router();

// Recommend other users (potential roommates) based on lifestyle and preferences
router.get('/users', auth, async (req, res) => {
  try {
    const current = await User.findById(req.user.id);
    if (!current) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (current.role === 'owner') {
      return res.json([]);
    }

    const candidates = await User.find({ 
      _id: { $ne: current._id },
      role: { $ne: 'owner' } // Exclude owners from roommate matches
    });

    const scored = candidates
      .map((candidate) => ({
        user: candidate,
        score: scoreUserMatch(current, candidate),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    res.json(scored);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Recommend rooms for current user
router.get('/rooms', auth, async (req, res) => {
  try {
    const current = await User.findById(req.user.id);
    if (!current) {
      return res.status(404).json({ message: 'User not found' });
    }

    const rooms = await Room.find({}).populate('owner', 'name email');

    const scored = rooms
      .filter((room) => room.owner?._id.toString() !== current._id.toString())
      .map((room) => ({
        room,
        score: scoreRoomMatch(current, room),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    res.json(scored);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
