const router = require('express').Router();
const mongoose = require('mongoose');
const Request = require('../models/Request');
const User = require('../models/User');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Resident submits a request
router.post('/', verifyToken, async (req, res) => {
  try {
    const { requestType, fullName, address, contact, dateNeeded, pickupRequired, purpose, details, notes } = req.body;

    const purposeRequired = ![
      'Barangay Business Clearance (or Permit)',
      'First-Time Jobseeker Barangay Certificate',
      'Blotter Reports / Incident Records'
    ].includes(requestType);

    if (!requestType || !fullName || !address || !contact || !dateNeeded || (purposeRequired && !purpose)) {
      return res.status(400).json({ error: 'Please complete all required request fields.' });
    }

    let residentId = req.user.id;
    if (req.user.role === 'admin') {
      residentId = undefined;
      if (req.body.residentId) {
        if (!mongoose.isValidObjectId(req.body.residentId)) {
          return res.status(400).json({ error: 'Select a valid resident account or choose walk-in.' });
        }
        const resident = await User.findOne({ _id: req.body.residentId, role: 'resident' }).select('_id');
        if (!resident) return res.status(404).json({ error: 'Resident account not found.' });
        residentId = resident._id;
      }
    }

    const newRequest = new Request({
      ...(residentId && { residentId }),
      requestType,
      fullName,
      address,
      contact,
      dateNeeded,
      pickupRequired: pickupRequired === true,
      purpose: purpose || '',
      details: details || {},
      notes: notes || ''
    });

    await newRequest.save();
    if (req.user.role === 'admin' && residentId) await newRequest.populate('residentId', 'fullName email');
    res.status(201).json({ message: 'Request successfully submitted to the barangay office.', request: newRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resident sees own requests; admin sees all requests
router.get('/', verifyToken, async (req, res) => {
  try {
    let requests;

    if (req.user.role === 'admin') {
      requests = await Request.find().populate('residentId', 'fullName email').sort({ createdAt: -1 });
    } else {
      requests = await Request.find({ residentId: req.user.id }).sort({ createdAt: -1 });
    }

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin updates request status
router.patch('/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { status, adminReviewed, chairmanSigned, signatureData, treasurerSignatureData, sealApplied } = req.body;
    const validStatuses = ['Pending', 'In Progress', 'Ready for Release', 'Released', 'Approved', 'Rejected'];

    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid request status.' });
    }

    const updatedRequest = await Request.findById(req.params.id);
    if (!updatedRequest) return res.status(404).json({ error: 'Request not found.' });
    const isWalkInRequest = !updatedRequest.residentId;

    if (isWalkInRequest && status !== undefined) {
      return res.status(400).json({ error: 'Walk-in requests use the signature-only workflow and do not have resident processing statuses.' });
    }

    if (typeof adminReviewed === 'boolean') updatedRequest.adminReviewed = adminReviewed;
    if (typeof chairmanSigned === 'boolean') updatedRequest.chairmanSigned = chairmanSigned;
    if (typeof sealApplied === 'boolean') updatedRequest.sealApplied = sealApplied;

    if (signatureData !== undefined) {
      if (signatureData !== '' && (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signatureData) || signatureData.length > 300000)) {
        return res.status(400).json({ error: 'Invalid signature image.' });
      }
      if (signatureData && !updatedRequest.adminReviewed && !isWalkInRequest) {
        return res.status(400).json({ error: 'Review request details before adding the chairman signature.' });
      }
      updatedRequest.signatureData = signatureData;
      updatedRequest.chairmanSigned = Boolean(signatureData);
      if (!signatureData) updatedRequest.sealApplied = false;
    }

    if (treasurerSignatureData !== undefined) {
      if (treasurerSignatureData !== '' && (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(treasurerSignatureData) || treasurerSignatureData.length > 300000)) {
        return res.status(400).json({ error: 'Invalid treasurer signature image.' });
      }
      if (treasurerSignatureData && updatedRequest.requestType !== 'Barangay Business Clearance (or Permit)') {
        return res.status(400).json({ error: 'A treasurer signature is only available for business clearance requests.' });
      }
      if (treasurerSignatureData && !updatedRequest.adminReviewed && !isWalkInRequest) {
        return res.status(400).json({ error: 'Review request details before adding the treasurer signature.' });
      }
      updatedRequest.treasurerSignatureData = treasurerSignatureData;
    }

    if (chairmanSigned === false) {
      updatedRequest.signatureData = '';
      updatedRequest.sealApplied = false;
    }

    if (chairmanSigned === true && !updatedRequest.adminReviewed && !isWalkInRequest) {
      return res.status(400).json({ error: 'Review request details before confirming the chairman signature.' });
    }
    if (chairmanSigned === true && !updatedRequest.signatureData) {
      return res.status(400).json({ error: 'Add the chairman digital signature before confirming sign-off.' });
    }
    if (sealApplied === true && (!updatedRequest.chairmanSigned || !updatedRequest.signatureData)) {
      return res.status(400).json({ error: 'Add the chairman signature before applying the official seal.' });
    }

    if (!updatedRequest.adminReviewed && !isWalkInRequest) {
      updatedRequest.chairmanSigned = false;
      updatedRequest.signatureData = '';
      updatedRequest.sealApplied = false;
    } else if (!updatedRequest.chairmanSigned) {
      updatedRequest.signatureData = '';
      updatedRequest.sealApplied = false;
    }

    if (status === 'Ready for Release' || status === 'Released' || status === 'Approved') {
      if (!updatedRequest.adminReviewed || !updatedRequest.chairmanSigned || !updatedRequest.signatureData || !updatedRequest.sealApplied) {
        return res.status(400).json({ error: 'Confirm admin review, chairman signature, and official seal before releasing this request.' });
      }
    }

    if (status !== undefined) updatedRequest.status = status;
    if ((updatedRequest.status === 'Ready for Release' || updatedRequest.status === 'Released' || updatedRequest.status === 'Approved') &&
      (!updatedRequest.adminReviewed || !updatedRequest.chairmanSigned || !updatedRequest.signatureData || !updatedRequest.sealApplied)) {
      updatedRequest.status = 'In Progress';
    }
    await updatedRequest.save();
    res.json({ message: 'Request status updated.', request: updatedRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
