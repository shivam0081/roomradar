const express = require('express');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// Get messages for a roomId
router.get('/:roomId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a message in a room
router.post('/', auth, async (req, res) => {
  const { roomId, to, text } = req.body;
  if (!roomId || !to || !text) {
    return res.status(400).json({ message: 'roomId, to, and text are required' });
  }

  try {
    const currentUser = await User.findById(req.user.id);
    const toUser = await User.findById(to);

    const message = await Message.create({
      roomId,
      from: req.user.id,
      fromName: currentUser?.name,
      to,
      toName: toUser?.name || to,
      text,
    });

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
