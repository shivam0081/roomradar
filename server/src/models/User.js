const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['renter', 'owner'], default: 'renter' },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], default: 'prefer_not_to_say' },
    lifestyleTags: {
      type: [{
        tag: { type: String, required: true },
        weight: { type: Number, default: 1 },
        isMandatory: { type: Boolean, default: false }
      }],
      default: []
    },
    preferences: {
      budgetMin: { type: Number },
      budgetMax: { type: Number },
      moveInDate: { type: Date },
      location: { type: String },
    },
    avatar: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
