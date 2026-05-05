const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true },
    from: { type: String, required: true },
    fromName: { type: String },
    to: { type: String, required: true },
    toName: { type: String },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
