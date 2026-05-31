const express = require('express');
const router = express.Router();
const SalesEntry = require('../models/SalesEntry');
const SlabConfig = require('../models/SlabConfig');
const CarModel = require('../models/CarModel');
const { protect, adminOnly } = require('../middleware/auth');
const { calculateIncentive, getNextMilestone } = require('../utils/incentiveEngine');

// Helper: get or create sales entry for officer/month/year
async function getOrCreateEntry(officerId, month, year) {
  let entry = await SalesEntry.findOne({ officer: officerId, month, year });
  if (!entry) {
    entry = await SalesEntry.create({ officer: officerId, month, year, entries: [] });
  }
  return entry;
}

// GET /api/sales/my?month=5&year=2025 — officer's own entry
router.get('/my', protect, async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const entry = await getOrCreateEntry(req.user._id, month, year);
    await entry.populate('entries.carModelId');
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/sales/my — officer saves/updates their sales entries
router.put('/my', protect, async (req, res) => {
  try {
    const { month, year, entries } = req.body;
    const m = parseInt(month);
    const y = parseInt(year);

    // Get active slab config
    const slabConfig = await SlabConfig.findOne({ isActive: true }).sort({ updatedAt: -1 });
    const slabs = slabConfig?.slabs || [];
    const calcType = slabConfig?.calculationType || 'flat';

    // Filter entries with qty > 0
    const validEntries = (entries || []).filter((e) => e.quantity > 0);
    const totalCars = validEntries.reduce((sum, e) => sum + (e.quantity || 0), 0);

    // Calculate incentive
    const { totalIncentive, tierHit, breakdown, appliedRate } = calculateIncentive(totalCars, slabs, calcType);
    const nextMilestone = getNextMilestone(totalCars, slabs);

    // Upsert
    const entry = await SalesEntry.findOneAndUpdate(
      { officer: req.user._id, month: m, year: y },
      {
        entries: validEntries,
        totalCars,
        totalIncentive,
        appliedSlabId: slabConfig?._id,
        tierHit,
        breakdown,
        status: 'draft',
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: entry,
      calculation: { totalCars, totalIncentive, tierHit, breakdown, appliedRate, nextMilestone },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sales/my/submit — officer submits final
router.post('/my/submit', protect, async (req, res) => {
  try {
    const { month, year } = req.body;
    const entry = await SalesEntry.findOneAndUpdate(
      { officer: req.user._id, month: parseInt(month), year: parseInt(year) },
      { status: 'submitted' },
      { new: true }
    );
    if (!entry) return res.status(404).json({ success: false, error: 'Entry not found' });
    res.json({ success: true, data: entry, message: 'Sales submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sales/history — officer's own history
router.get('/history', protect, async (req, res) => {
  try {
    const entries = await SalesEntry.find({ officer: req.user._id })
      .sort({ year: -1, month: -1 })
      .limit(12);
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sales/admin/all?month=5&year=2025 — admin views all officers
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const entries = await SalesEntry.find({ month, year })
      .populate('officer', 'name email employeeId')
      .sort({ totalIncentive: -1, totalCars: -1 });

    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sales/admin/leaderboard — top officers this month
router.get('/admin/leaderboard', protect, adminOnly, async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const entries = await SalesEntry.find({ month, year })
      .populate('officer', 'name email employeeId')
      .sort({ totalIncentive: -1, totalCars: -1 })
      .limit(10);

    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
