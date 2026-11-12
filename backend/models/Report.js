const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['Emergency', 'Incident', 'Report', 'Others'], required: true },
  description: { type: String, required: true },
  place: { type: String, required: true, trim: true },
  area: { type: String, enum: ['Area A', 'Area B', 'Area C', 'Area D'], required: true },
  isAnonymous: { type: Boolean, default: false },
  imageUrl: { type: String, required: true },
  imageUrls: [{ type: String }],
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);