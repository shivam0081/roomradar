const express = require('express');
const auth = require('../middleware/auth');
const Connection = require('../models/Connection');
const User = require('../models/User');
const { getIO } = require('../socket');

const router = express.Router();

// Get all connections for the current user
router.get('/', auth, async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .sort({ updatedAt: -1 });

    res.json(connections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a connection request
router.post('/', auth, async (req, res) => {
  const { receiverId } = req.body;
  
  if (!receiverId) {
    return res.status(400).json({ message: 'Receiver ID is required' });
  }

  if (receiverId === req.user.id) {
    return res.status(400).json({ message: 'Cannot connect with yourself' });
  }

  try {
    // Check if a connection already exists
    const existing = await Connection.findOne({
      $or: [
        { sender: req.user.id, receiver: receiverId },
        { sender: receiverId, receiver: req.user.id },
      ],
    });

    if (existing) {
      return res.status(400).json({ message: 'Connection already exists' });
    }

    const connection = await Connection.create({
      sender: req.user.id,
      receiver: receiverId,
      status: 'pending',
    });

    // Real-time: notify receiver of new request
    const io = getIO();
    if (io) {
      io.to(receiverId).emit('connectionUpdate', connection);
      io.to(req.user.id).emit('connectionUpdate', connection);
    }

    res.status(201).json(connection);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept or reject a connection
router.put('/:id', auth, async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Only the receiver can accept/reject
    if (connection.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    connection.status = status;
    await connection.save();

    // Real-time: notify both parties
    const io = getIO();
    if (io) {
      io.to(connection.sender.toString()).emit('connectionUpdate', connection);
      io.to(connection.receiver.toString()).emit('connectionUpdate', connection);
    }

    res.json(connection);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a connection
router.delete('/:id', auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Either sender or receiver can remove
    if (connection.sender.toString() !== req.user.id && connection.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await connection.deleteOne();
    res.json({ message: 'Connection removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
