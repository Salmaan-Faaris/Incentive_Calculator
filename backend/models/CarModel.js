const mongoose = require('mongoose');

const carModelSchema = new mongoose.Schema(
  {
    modelName: { type: String, required: true, trim: true },
    baseSuffix: { type: String, trim: true, default: '' },
    variant: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'Sedan' },
    basePrice: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    color: { type: String, default: '#7c3aed' }, // display accent color
  },
  { timestamps: true }
);

// Virtual: full display name
carModelSchema.virtual('displayName').get(function () {
  const parts = [this.modelName, this.baseSuffix, this.variant].filter(Boolean);
  return parts.join(' ');
});

carModelSchema.set('toObject', { virtuals: true });
carModelSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('CarModel', carModelSchema);
