const express = require('express');
const router = express.Router();
const CarModel = require('../models/CarModel');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/cars — all active cars (all authenticated users)
router.get('/', protect, async (req, res) => {
  try {
    const cars = await CarModel.find({ isActive: true }).sort({ modelName: 1 });
    res.json({ success: true, data: cars });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/cars/all — all cars including inactive (admin only)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const cars = await CarModel.find().sort({ modelName: 1 });
    res.json({ success: true, data: cars });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cars — create car model (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const car = await CarModel.create(req.body);
    res.status(201).json({ success: true, data: car });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/cars/:id — update (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const car = await CarModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!car) return res.status(404).json({ success: false, error: 'Car not found' });
    res.json({ success: true, data: car });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/cars/:id — hard delete (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await CarModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Car model deleted completely' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
