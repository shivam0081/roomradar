const mongoose = require('mongoose');
require('dotenv').config();

const BookingRequestSchema = new mongoose.Schema({
  room: mongoose.Schema.Types.ObjectId,
  renter: mongoose.Schema.Types.ObjectId,
  status: String
});
const BookingRequest = mongoose.model('BookingRequest', BookingRequestSchema);

const RoomSchema = new mongoose.Schema({
  seats: Number,
  totalCapacity: Number
});
const Room = mongoose.model('Room', RoomSchema);

async function fixDuplicates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const bookings = await BookingRequest.find({});
    const duplicates = {};

    bookings.forEach(b => {
      const key = `${b.room}_${b.renter}`;
      if (!duplicates[key]) duplicates[key] = [];
      duplicates[key].push(b);
    });

    for (const key in duplicates) {
      const list = duplicates[key];
      if (list.length > 1) {
        console.log(`Duplicate detected for ${key}: ${list.length} entries`);
        
        // Strategy: Keep 'accepted' if exists, else keep most recent 'pending', else keep first one.
        // Also, if we delete an 'accepted' one, we MUST increment the room seats back.
        // But wait, if there are 2 accepted ones, it means the room seats were decremented twice.
        // So deleting one accepted and incrementing seats once is correct.
        
        list.sort((a, b) => {
          if (a.status === 'accepted' && b.status !== 'accepted') return -1;
          if (b.status === 'accepted' && a.status !== 'accepted') return 1;
          return 0; // Or sort by date if available
        });

        const toKeep = list[0];
        const toDelete = list.slice(1);

        console.log(`Keeping: ${toKeep._id} (${toKeep.status})`);
        
        for (const b of toDelete) {
          console.log(`Deleting: ${b._id} (${b.status})`);
          if (b.status === 'accepted') {
            const room = await Room.findById(b.room);
            if (room) {
              room.seats = Math.min(room.totalCapacity || (room.seats + 1), (room.seats || 0) + 1);
              await room.save();
              console.log(`Incremented seats back for room ${b.room}. Now ${room.seats}/${room.totalCapacity}`);
            }
          }
          await BookingRequest.findByIdAndDelete(b._id);
        }
      }
    }

    console.log('Duplicate cleanup complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixDuplicates();
