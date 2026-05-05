const mongoose = require('mongoose');

const shortlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['user', 'room'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

shortlistSchema.index({ user: 1, type: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('Shortlist', shortlistSchema);
