const router = require('express').Router();
const User = require('../models/User');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Get all pending residents for evaluation
router.get('/residents', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status, role: 'resident' } : { role: 'resident' };
    const residents = await User.find(query).select('-password');
    res.json(residents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update resident evaluation status (approve/reject)
router.patch('/residents/:id', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!updatedUser) return res.status(404).json({ error: 'Resident not found.' });

    res.json({ message: `Resident status updated to ${status}`, updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;