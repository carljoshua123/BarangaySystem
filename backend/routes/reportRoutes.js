const router = require('express').Router();
const Report = require('../models/Report');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Submit a new report with image evidence and an incident location
router.post('/', verifyToken, upload.array('image', 5), async (req, res) => {
  try {
    const { category, description, place, area, lat, lng } = req.body;
    if (!req.files?.length) return res.status(400).json({ error: 'Image evidence is required.' });
    if (!['Area A', 'Area B', 'Area C', 'Area D'].includes(area)) {
      return res.status(400).json({ error: 'Please select a valid incident area.' });
    }

    const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
    const isAnonymous = ['Report', 'Others'].includes(category) && req.body.isAnonymous === 'true';
    const latitude = Number.parseFloat(lat);
    const longitude = Number.parseFloat(lng);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    if (!isAnonymous && !hasCoordinates) return res.status(400).json({ error: 'A valid incident map location is required.' });
    const newReport = new Report({
      residentId: req.user.id,
      category,
      description,
      place,
      area,
      isAnonymous,
      imageUrl: imageUrls[0],
      imageUrls,
      ...(!isAnonymous && { location: { lat: latitude, lng: longitude } })
    });

    await newReport.save();
    res.status(201).json({ message: 'Report successfully filed to Barangay officials!', report: newReport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch reports (Residents see their own, Admins see all)
router.get('/', verifyToken, async (req, res) => {
  try {
    let reports;
    if (req.user.role === 'admin') {
      reports = await Report.find().populate('residentId', 'fullName email').sort({ createdAt: -1 });
      reports = reports.map((report) => {
        if (!report.isAnonymous) return report;
        const anonymousReport = report.toObject();
        delete anonymousReport.residentId;
        return anonymousReport;
      });
    } else {
      reports = await Report.find({ residentId: req.user.id }).sort({ createdAt: -1 });
    }
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid report status.' });
    }

    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    res.json({ message: 'Report status updated.', report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;