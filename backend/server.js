const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const requestRoutes = require('./routes/requestRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Setup
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/messages', messageRoutes);

// Database Connection & Server Start
const PORT = process.env.PORT || 5000;
const mongoTarget = (process.env.MONGO_TARGET || 'atlas').toLowerCase();
const mongoUri = mongoTarget === 'local'
  ? (process.env.MONGO_LOCAL_URI || 'mongodb://127.0.0.1:27017/barangay_db')
  : mongoTarget === 'atlas'
    ? process.env.MONGO_URI
    : undefined;

if (!mongoUri) {
  console.error(`Missing MongoDB URI for MONGO_TARGET="${mongoTarget}". Set MONGO_URI for Atlas or MONGO_LOCAL_URI for local MongoDB.`);
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log(`Connected to MongoDB (${mongoTarget})`);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('Database connection error:', err));