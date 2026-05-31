const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SalesEntry = require('../models/SalesEntry');
const { protect, adminOnly } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = signToken(user._id);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// POST /api/auth/officers — Admin creates a new officer account
router.post('/officers', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, employeeId } = req.body;
    const user = await User.create({ name, email, password, employeeId, role: 'officer' });
    res.status(201).json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, error: 'Email already exists' });
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/auth/officers — Admin lists all officers
router.get('/officers', protect, adminOnly, async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer' }).select('-password').sort({ name: 1 });
    res.json({ success: true, data: officers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/auth/officers/:id — Admin deletes officer
router.delete('/officers/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await SalesEntry.deleteMany({ officer: req.params.id });
    res.json({ success: true, message: 'Officer and their sales history deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
