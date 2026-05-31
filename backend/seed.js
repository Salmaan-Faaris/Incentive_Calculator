const User      = require('./models/User');
const CarModel  = require('./models/CarModel');
const SlabConfig = require('./models/SlabConfig');
const SalesEntry = require('./models/SalesEntry');

module.exports = async function seed() {
  try {
    // ── Users ──
    const admin = await User.create({
      name: 'Admin', email: 'admin@toyotanippon.com',
      password: 'admin123', role: 'admin', employeeId: 'ADMIN-001',
    });

    const officerData = [
      { name: 'Salman Faris',   email: 'salman@toyotanippon.com', employeeId: 'TN-001' },
      { name: 'Ashfaq Hussain', email: 'ashfaq@toyotanippon.com', employeeId: 'TN-002' },
      { name: 'Jeslin',         email: 'jeslin@toyotanippon.com',  employeeId: 'TN-003' },
      { name: 'Swani',          email: 'swani@toyotanippon.com',   employeeId: 'TN-004' },
      { name: 'Lana',           email: 'lana@toyotanippon.com',    employeeId: 'TN-005' },
      { name: 'Nazal',          email: 'nazal@toyotanippon.com',   employeeId: 'TN-006' },
    ];

    const officers = [];
    for (const o of officerData) {
      const u = await User.create({ ...o, password: 'officer123', role: 'officer' });
      officers.push(u);
    }

    const [salman, ashfaq, jeslin, swani, lana, nazal] = officers;

    // ── Toyota Cars ──
    const cars = await CarModel.insertMany([
      { modelName: 'Toyota Camry',          baseSuffix: 'G',        variant: 'Hybrid',     category: 'Sedan',       basePrice: 4500000, color: '#eb0a1e', isActive: true },
      { modelName: 'Toyota Fortuner',       baseSuffix: 'Legender', variant: '4x4 AT',     category: 'SUV',         basePrice: 4900000, color: '#1e40af', isActive: true },
      { modelName: 'Toyota Innova HyCross', baseSuffix: 'ZX',       variant: 'Hybrid',     category: 'MPV',         basePrice: 2900000, color: '#0d9488', isActive: true },
      { modelName: 'Toyota Hyryder',        baseSuffix: 'V',        variant: 'Hybrid AWD', category: 'Compact SUV', basePrice: 2100000, color: '#7c3aed', isActive: true },
      { modelName: 'Toyota Hilux',          baseSuffix: 'High',     variant: '4WD',        category: 'Pickup',      basePrice: 3600000, color: '#b45309', isActive: true },
      { modelName: 'Toyota Vellfire',       baseSuffix: 'ZX',       variant: 'Hybrid',     category: 'Luxury MPV',  basePrice: 9000000, color: '#374151', isActive: true },
      { modelName: 'Toyota Glanza',         baseSuffix: 'V',        variant: 'AMT',        category: 'Hatchback',   basePrice: 1050000, color: '#059669', isActive: true },
    ]);

    // ── Slab Configuration ──
    const slab = await SlabConfig.create({
      name: 'Toyota Nippon Standard Plan',
      description: 'Monthly vehicle sales incentive tiers for Toyota Nippon officers',
      slabs: [
        { minQty: 1,  maxQty: 3,    incentivePerCar: 1000, label: 'Bronze' },
        { minQty: 4,  maxQty: 7,    incentivePerCar: 2000, label: 'Silver' },
        { minQty: 8,  maxQty: null, incentivePerCar: 3500, label: 'Gold'   },
      ],
      calculationType: 'flat',
      isActive: true,
    });

    // ── Sales Entries (current month) ──
    const month = new Date().getMonth() + 1;
    const year  = new Date().getFullYear();

    const salesData = [
      // Salman Faris — Gold #1 — 12 cars — ₹42,000
      { officer: salman._id, month, year, totalCars: 12, totalIncentive: 42000, tierHit: 'Gold', status: 'submitted',
        entries: [{ carModelId: cars[0]._id, quantity: 4 }, { carModelId: cars[1]._id, quantity: 5 }, { carModelId: cars[2]._id, quantity: 3 }] },
      // Swani — Gold #2 — 9 cars — ₹31,500
      { officer: swani._id,  month, year, totalCars: 9,  totalIncentive: 31500, tierHit: 'Gold', status: 'submitted',
        entries: [{ carModelId: cars[1]._id, quantity: 6 }, { carModelId: cars[3]._id, quantity: 3 }] },
      // Ashfaq Hussain — Silver #3 — 7 cars — ₹14,000
      { officer: ashfaq._id, month, year, totalCars: 7,  totalIncentive: 14000, tierHit: 'Silver', status: 'submitted',
        entries: [{ carModelId: cars[2]._id, quantity: 4 }, { carModelId: cars[4]._id, quantity: 3 }] },
      // Nazal — Silver #4 — 6 cars — ₹12,000
      { officer: nazal._id,  month, year, totalCars: 6,  totalIncentive: 12000, tierHit: 'Silver', status: 'submitted',
        entries: [{ carModelId: cars[3]._id, quantity: 6 }] },
      // Jeslin — Silver #5 — 5 cars — ₹10,000
      { officer: jeslin._id, month, year, totalCars: 5,  totalIncentive: 10000, tierHit: 'Silver', status: 'submitted',
        entries: [{ carModelId: cars[4]._id, quantity: 5 }] },
      // Lana — Bronze #6 — 3 cars — ₹3,000
      { officer: lana._id,   month, year, totalCars: 3,  totalIncentive: 3000,  tierHit: 'Bronze', status: 'draft',
        entries: [{ carModelId: cars[6]._id, quantity: 3 }] },
    ];

    for (const sd of salesData) await SalesEntry.create({ ...sd, appliedSlabId: slab._id });

    console.log('✅ Toyota Nippon seed complete!');
    console.log('   Admin:   admin@toyotanippon.com  / admin123');
    console.log('   Officer: salman@toyotanippon.com / officer123 (Top earner: ₹42,000)');
  } catch (err) {
    console.error('Seed error:', err.message);
    throw err;
  }
};
