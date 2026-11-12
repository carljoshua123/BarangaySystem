const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  senderRole: { type: String, enum: ['resident', 'admin'], required: true },
  content: { type: String, required: true, trim: true, maxlength: 4000 },
  readByAdmin: { type: Boolean, default: false },
  readByResident: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);