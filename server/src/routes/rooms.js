const express = require('express');
const auth = require('../middleware/auth');
const Room = require('../models/Room');
const BookingRequest = require('../models/BookingRequest');

const router = express.Router();

// Get owner's own rooms
router.get('/my', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new room listing
router.post('/', auth, async (req, res) => {
  try {
    const { totalCapacity, ...rest } = req.body;
    const room = await Room.create({
      ...rest,
      owner: req.user.id,
      totalCapacity: totalCapacity || 1,
      seats: totalCapacity || 1,
    });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room by id
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('owner', 'name email');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Browse rooms with optional filters
router.get('/', async (req, res) => {
  const { location, minRent, maxRent, tags } = req.query;
  const filter = {};

  if (location) {
    filter.location = { $regex: new RegExp(location, 'i') };
  }
  if (minRent) {
    filter.rent = { ...filter.rent, $gte: Number(minRent) };
  }
  if (maxRent) {
    filter.rent = { ...filter.rent, $lte: Number(maxRent) };
  }
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : tags.split(',');
    filter.lifestyleTags = { $in: tagArray.map((t) => t.trim()) };
  }

  try {
    const rooms = await Room.find(filter).populate('owner', 'name email').sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a room (owner only)
router.patch('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { totalCapacity, ...otherData } = req.body;

    // Sync capacity if totalCapacity changed
    if (totalCapacity !== undefined && totalCapacity !== room.totalCapacity) {
      const delta = totalCapacity - (room.totalCapacity || 1);
      room.totalCapacity = totalCapacity;
      room.seats = Math.max(0, (room.seats || 0) + delta);
    }
    
    // Always clamp seats to totalCapacity as a safety measure
    if (room.seats > room.totalCapacity) {
      room.seats = room.totalCapacity;
    }

    // Apply other updates
    Object.assign(room, otherData);
    
    await room.save();
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a room (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Clean up associated booking requests
    await BookingRequest.deleteMany({ room: req.params.id });
    
    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
