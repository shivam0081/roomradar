const mongoose = require('mongoose');
require('dotenv').config();

const roomSchema = new mongoose.Schema({
  seats: Number,
  totalCapacity: Number
});

const Room = mongoose.model('Room', roomSchema);

async function fixCapacity() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const rooms = await Room.find({});
    console.log(`Found ${rooms.length} rooms to check.`);

    let updatedCount = 0;
    for (const room of rooms) {
      let changed = false;
      
      // 1. Ensure totalCapacity exists
      if (room.totalCapacity === undefined || room.totalCapacity === null) {
        room.totalCapacity = room.seats || 1;
        changed = true;
      }

      // 2. Ensure seats doesn't exceed totalCapacity
      if (room.seats > room.totalCapacity) {
        console.log(`Fixing room ${room._id}: seats ${room.seats} > totalCapacity ${room.totalCapacity}`);
        room.seats = room.totalCapacity;
        changed = true;
      }

      if (changed) {
        await room.save();
        updatedCount++;
      }
    }

    console.log(`Fix complete. Updated ${updatedCount} rooms.`);
    process.exit(0);
  } catch (err) {
    console.error('Error during fix:', err);
    process.exit(1);
  }
}

fixCapacity();
