const mongoose = require('mongoose');

// A single "slab" entry: minQty, maxQty (null = unlimited), incentivePerCar
const slabEntrySchema = new mongoose.Schema(
  {
    minQty: { type: Number, required: true, min: 0 },
    maxQty: { type: Number, default: null }, // null = no upper limit (8+)
    incentivePerCar: { type: Number, required: true, min: 0 },
    label: { type: String }, // e.g. "Bronze", "Silver", "Gold" — auto generated if not set
  },
  { _id: true }
);

const slabConfigSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Default Incentive Structure' },
    description: { type: String, default: '' },
    slabs: { type: [slabEntrySchema], default: [] },
    calculationType: {
      type: String,
      enum: ['flat', 'progressive'],
      default: 'flat',
      // flat: all cars earn the tier rate
      // progressive: like tax brackets — each band earns its own rate
    },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SlabConfig', slabConfigSchema);
