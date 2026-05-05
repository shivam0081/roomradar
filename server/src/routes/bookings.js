const express = require('express');
const auth = require('../middleware/auth');
const BookingRequest = require('../models/BookingRequest');
const Room = require('../models/Room');
const { getIO } = require('../socket');

const router = express.Router();

// Create a booking request (renter -> owner)
router.post('/', auth, async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) {
    return res.status(400).json({ message: 'roomId is required' });
  }

  try {
    const room = await Room.findById(roomId).populate('owner');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.owner._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Owners cannot request booking on their own rooms' });
    }

    if (room.seats <= 0) {
      return res.status(400).json({ message: 'This room is currently full' });
    }

    const existing = await BookingRequest.findOne({ 
      room: roomId, 
      renter: req.user.id, 
      status: { $in: ['pending', 'accepted'] } 
    });
    if (existing) {
      return res.status(409).json({ 
        message: existing.status === 'accepted' 
          ? 'You already have an accepted booking for this room' 
          : 'You already have a pending request for this room' 
      });
    }

    const request = await BookingRequest.create({
      room: roomId,
      renter: req.user.id,
      owner: room.owner._id,
      status: 'pending',
    });

    // Real-time: notify both renter and owner
    const populated = await BookingRequest.findById(request._id)
      .populate('room', 'title location rent seats totalCapacity')
      .populate('renter', 'name email')
      .populate('owner', 'name email');
    const io = getIO();
    if (io) {
      io.to(req.user.id).emit('bookingUpdate', populated);
      io.to(room.owner._id.toString()).emit('bookingUpdate', populated);
    }

    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all booking requests for the current user
router.get('/', auth, async (req, res) => {
  try {
    const requests = await BookingRequest.find({
      $or: [{ renter: req.user.id }, { owner: req.user.id }],
    })
      .populate('room', 'title location rent seats totalCapacity')
      .populate('renter', 'name email')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Owner accepts/rejects a request (or cancels accepted one)
router.patch('/:id', auth, async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const request = await BookingRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Capacity management
    const room = await Room.findById(request.room);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // IF CHANGING TO ACCEPTED
    if (status === 'accepted' && request.status !== 'accepted') {
      if ((room.seats || 0) <= 0) {
        return res.status(400).json({ message: 'Cannot accept request. Room is full.' });
      }
      // Decrement seats
      room.seats = Math.max(0, (room.seats || 0) - 1);
      await room.save();
    }

    // IF CHANGING FROM ACCEPTED TO REJECTED/CANCELLED (Remove Tenant)
    if ((status === 'rejected' || status === 'cancelled') && request.status === 'accepted') {
      // Increment seats (put back pool)
      const maxCap = room.totalCapacity || (room.seats + 1);
      room.seats = Math.min(maxCap, (room.seats || 0) + 1);
      await room.save();
    }

    request.status = status;
    await request.save();

    // Real-time: notify both parties of the updated status
    const populated = await BookingRequest.findById(request._id)
      .populate('room', 'title location rent seats totalCapacity')
      .populate('renter', 'name email')
      .populate('owner', 'name email');
    const io = getIO();
    if (io) {
      io.to(request.renter.toString()).emit('bookingUpdate', populated);
      io.to(request.owner.toString()).emit('bookingUpdate', populated);
    }

    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
