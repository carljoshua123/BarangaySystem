const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestType: { type: String, required: true },
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  contact: { type: String, required: true },
  dateNeeded: { type: String, required: true },
  pickupRequired: { type: Boolean, default: false },
  purpose: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  notes: { type: String, default: '' },
  adminReviewed: { type: Boolean, default: false },
  chairmanSigned: { type: Boolean, default: false },
  signatureData: { type: String, default: '' },
  treasurerSignatureData: { type: String, default: '' },
  sealApplied: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Ready for Release', 'Released', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', RequestSchema);
