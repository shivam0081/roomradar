const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    rent: { type: Number },
    availableFrom: { type: Date },
    seats: { type: Number, default: 1 },
    totalCapacity: { type: Number, default: 1 },
    amenities: { type: [String], default: [] },
    lifestyleTags: { type: [String], default: [] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
