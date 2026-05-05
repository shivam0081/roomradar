const express = require('express');
const auth = require('../middleware/auth');
const Shortlist = require('../models/Shortlist');
const User = require('../models/User');
const Room = require('../models/Room');

const router = express.Router();

// Get shortlist for current user
router.get('/', auth, async (req, res) => {
  const { type } = req.query;

  try {
    const filter = { user: req.user.id };
    if (type) filter.type = type;

    const items = await Shortlist.find(filter).lean();

    // Populate items
    const results = await Promise.all(
      items.map(async (item) => {
        if (item.type === 'room') {
          const room = await Room.findById(item.itemId).populate('owner', 'name email');
          return { ...item, item: room };
        }
        const userDoc = await User.findById(item.itemId).select('-passwordHash');
        return { ...item, item: userDoc };
      })
    );

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle shortlist item (add/remove)
router.post('/', auth, async (req, res) => {
  const { type, itemId } = req.body;
  if (!type || !itemId) {
    return res.status(400).json({ message: 'type and itemId are required' });
  }

  try {
    const existing = await Shortlist.findOne({ user: req.user.id, type, itemId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ removed: true });
    }

    await Shortlist.create({ user: req.user.id, type, itemId });
    res.json({ added: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
