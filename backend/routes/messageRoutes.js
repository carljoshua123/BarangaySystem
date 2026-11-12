const router = require('express').Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const validateContent = (content) => typeof content === 'string' && content.trim().length > 0 && content.trim().length <= 4000;

router.get('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'resident') return res.status(403).json({ error: 'Resident access required.' });

  try {
    await Message.updateMany(
      { residentId: req.user.id, senderRole: 'admin', readByResident: false },
      { readByResident: true }
    );
    const messages = await Message.find({ residentId: req.user.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'resident') return res.status(403).json({ error: 'Resident access required.' });
  if (!validateContent(req.body.content)) return res.status(400).json({ error: 'Message must be between 1 and 4000 characters.' });

  try {
    const message = await Message.create({
      residentId: req.user.id,
      senderRole: 'resident',
      content: req.body.content.trim()
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations', verifyAdmin, async (req, res) => {
  try {
    const summaries = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$residentId',
          lastMessage: { $first: '$content' },
          lastSenderRole: { $first: '$senderRole' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$senderRole', 'resident'] }, { $eq: ['$readByAdmin', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ]);
    const residentIds = summaries.map((summary) => summary._id);
    const residents = await User.find({ _id: { $in: residentIds }, role: 'resident' }).select('fullName email');
    const residentById = new Map(residents.map((resident) => [resident._id.toString(), resident]));

    res.json(summaries
      .map((summary) => ({ ...summary, resident: residentById.get(summary._id.toString()) }))
      .filter((summary) => summary.resident));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:residentId', verifyAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.residentId)) return res.status(400).json({ error: 'Invalid resident ID.' });

  try {
    const resident = await User.findOne({ _id: req.params.residentId, role: 'resident' }).select('fullName email');
    if (!resident) return res.status(404).json({ error: 'Resident not found.' });

    await Message.updateMany(
      { residentId: resident._id, senderRole: 'resident', readByAdmin: false },
      { readByAdmin: true }
    );
    const messages = await Message.find({ residentId: resident._id }).sort({ createdAt: 1 });
    res.json({ resident, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:residentId', verifyAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.residentId)) return res.status(400).json({ error: 'Invalid resident ID.' });
  if (!validateContent(req.body.content)) return res.status(400).json({ error: 'Message must be between 1 and 4000 characters.' });

  try {
    const resident = await User.findOne({ _id: req.params.residentId, role: 'resident' }).select('_id');
    if (!resident) return res.status(404).json({ error: 'Resident not found.' });

    const message = await Message.create({
      residentId: resident._id,
      senderRole: 'admin',
      content: req.body.content.trim(),
      readByAdmin: true
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;