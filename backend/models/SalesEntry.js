const mongoose = require('mongoose');

const carSaleEntrySchema = new mongoose.Schema(
  {
    carModelId: { type: mongoose.Schema.Types.ObjectId, ref: 'CarModel', required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const salesEntrySchema = new mongoose.Schema(
  {
    officer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    entries: { type: [carSaleEntrySchema], default: [] },
    // Computed fields (stored for history)
    totalCars: { type: Number, default: 0 },
    totalIncentive: { type: Number, default: 0 },
    appliedSlabId: { type: mongoose.Schema.Types.ObjectId, ref: 'SlabConfig' },
    tierHit: { type: String }, // label of the highest slab hit
    breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
  },
  { timestamps: true }
);

// Unique: one entry per officer per month/year
salesEntrySchema.index({ officer: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('SalesEntry', salesEntrySchema);
