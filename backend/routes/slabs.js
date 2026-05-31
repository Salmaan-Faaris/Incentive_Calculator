const express = require('express');
const router = express.Router();
const SlabConfig = require('../models/SlabConfig');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/slabs — active slab config (all authenticated)
router.get('/', protect, async (req, res) => {
  try {
    let config = await SlabConfig.findOne({ isActive: true }).sort({ updatedAt: -1 });
    if (!config) {
      // Return default if none exists
      config = {
        name: 'Default',
        slabs: [
          { minQty: 1, maxQty: 3, incentivePerCar: 1000, label: 'Bronze' },
          { minQty: 4, maxQty: 7, incentivePerCar: 2000, label: 'Silver' },
          { minQty: 8, maxQty: null, incentivePerCar: 3500, label: 'Gold' },
        ],
        calculationType: 'flat',
      };
    }
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/slabs/all — all configs (admin)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const configs = await SlabConfig.find().sort({ updatedAt: -1 });
    res.json({ success: true, data: configs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/slabs — create or update active config (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, slabs, calculationType } = req.body;
    if (!slabs || slabs.length === 0)
      return res.status(400).json({ success: false, error: 'At least one slab required' });

    // Validate slabs: sort by minQty and ensure no overlaps
    const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);

    // Deactivate all existing
    await SlabConfig.updateMany({}, { isActive: false });

    // Create new active config
    const config = await SlabConfig.create({
      name: name || 'Incentive Structure',
      description,
      slabs: sorted,
      calculationType: calculationType || 'flat',
      isActive: true,
      updatedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: config, message: 'Slab configuration saved' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/slabs/calculate — real-time calculation endpoint
router.post('/calculate', protect, async (req, res) => {
  try {
    const { totalCars, slabs, calculationType } = req.body;
    const { calculateIncentive, getNextMilestone } = require('../utils/incentiveEngine');

    const result = calculateIncentive(totalCars || 0, slabs || [], calculationType || 'flat');
    const milestone = getNextMilestone(totalCars || 0, slabs || []);

    res.json({ success: true, data: { ...result, nextMilestone: milestone } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
