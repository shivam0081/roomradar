const mongoose = require('mongoose');
require('dotenv').config();

const roomSchema = new mongoose.Schema({
  seats: Number,
  totalCapacity: Number
});

const Room = mongoose.model('Room', roomSchema);

async function fixCapacityDefinitive() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const rooms = await Room.find({});
    console.log(`Checking ${rooms.length} rooms...`);

    for (const room of rooms) {
      console.log(`Original: ${room.seats} / ${room.totalCapacity}`);
      
      // If seats > totalCapacity, the user probably meant THAT many beds total
      if (room.seats > room.totalCapacity) {
        room.totalCapacity = room.seats;
      }
      
      // Ensure totalCapacity is at least 1
      if (!room.totalCapacity || room.totalCapacity < 1) {
        room.totalCapacity = room.seats || 1;
      }

      // Final check: seats cannot exceed totalCapacity
      if (room.seats > room.totalCapacity) {
        room.seats = room.totalCapacity;
      }

      await room.save();
      console.log(`Fixed: ${room.seats} / ${room.totalCapacity}`);
    }

    console.log('Database fix complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixCapacityDefinitive();
