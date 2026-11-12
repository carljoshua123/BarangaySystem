const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';
const isValidEmail = (email) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
const findUserByEmail = (email) => {
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return User.findOne({ email: { $regex: `^${escapedEmail}$`, $options: 'i' } });
};

const isStrongPassword = (password) => (
  typeof password === 'string' &&
  password.length >= 12 &&
  password.length <= 128 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9\s]/.test(password)
);

router.get('/check-email', async (req, res) => {
  const email = normalizeEmail(req.query.email);
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });

  try {
    const existingUser = await findUserByEmail(email).select('_id');
    res.json({ available: !existingUser });
  } catch (err) {
    res.status(500).json({ error: 'Could not check email availability.' });
  }
});

// Register Account (Resident or Admin)
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'Password must be 12-128 characters and include uppercase, lowercase, a number, and a symbol.' });
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) return res.status(400).json({ error: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'resident',
      status: role === 'admin' ? 'approved' : 'pending' // Admins auto-approved, residents pending
    });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful. Account pending evaluation if resident.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(normalizeEmail(email));
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

    if (user.role === 'resident' && user.status !== 'approved') {
      return res.status(403).json({ error: `Your account status is currently: ${user.status}. Please wait for admin approval.` });
    }

    const token = jwt.sign({ id: user._id, role: user.role, fullName: user.fullName }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, status: user.status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;