/**
 * IncentIQ — Mock Server (In-Memory, No MongoDB)
 * Toyota Nippon Demo Data
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({ origin: 'http://localhost:5174', credentials: true }));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'incentive_super_secret_jwt_key_2025';
const PORT = process.env.PORT || 5001;

let users = [], cars = [], slabConfig = null, salesEntries = [];
let nextId = 1;
const uid = () => String(nextId++);

async function seed() {
  const hashAdmin   = await bcrypt.hash('admin123',   10);
  const hashOfficer = await bcrypt.hash('officer123', 10);

  users = [
    { _id: uid(), name: 'Admin',          email: 'admin@toyotanippon.com',  password: hashAdmin,   role: 'admin',   employeeId: 'ADMIN-001', isActive: true, createdAt: new Date() },
    { _id: uid(), name: 'Salman Faris',   email: 'salman@toyotanippon.com', password: hashOfficer, role: 'officer', employeeId: 'TN-001',    isActive: true, createdAt: new Date() },
    { _id: uid(), name: 'Ashfaq Hussain', email: 'ashfaq@toyotanippon.com', password: hashOfficer, role: 'officer', employeeId: 'TN-002',    isActive: true, createdAt: new Date() },
    { _id: uid(), name: 'Jeslin',         email: 'jeslin@toyotanippon.com', password: hashOfficer, role: 'officer', employeeId: 'TN-003',    isActive: true, createdAt: new Date() },
    { _id: uid(), name: 'Swani',          email: 'swani@toyotanippon.com',  password: hashOfficer, role: 'officer', employeeId: 'TN-004',    isActive: true, createdAt: new Date() },
    { _id: uid(), name: 'Lana',           email: 'lana@toyotanippon.com',   password: hashOfficer, role: 'officer', employeeId: 'TN-005',    isActive: true, createdAt: new Date() },
    { _id: uid(), name: 'Nazal',          email: 'nazal@toyotanippon.com',  password: hashOfficer, role: 'officer', employeeId: 'TN-006',    isActive: true, createdAt: new Date() },
  ];

  cars = [
    { _id: uid(), modelName: 'Toyota Camry',          baseSuffix: 'G',    variant: 'Hybrid',      category: 'Sedan',         basePrice: 4500000, color: '#eb0a1e', isActive: true },
    { _id: uid(), modelName: 'Toyota Fortuner',       baseSuffix: 'Legender', variant: '4x4 AT', category: 'SUV',           basePrice: 4900000, color: '#1e40af', isActive: true },
    { _id: uid(), modelName: 'Toyota Innova HyCross', baseSuffix: 'ZX',   variant: 'Hybrid',      category: 'MPV',           basePrice: 2900000, color: '#0d9488', isActive: true },
    { _id: uid(), modelName: 'Toyota Hyryder',        baseSuffix: 'V',    variant: 'Hybrid AWD',  category: 'Compact SUV',   basePrice: 2100000, color: '#7c3aed', isActive: true },
    { _id: uid(), modelName: 'Toyota Hilux',          baseSuffix: 'High', variant: '4WD',         category: 'Pickup',        basePrice: 3600000, color: '#b45309', isActive: true },
    { _id: uid(), modelName: 'Toyota Vellfire',       baseSuffix: 'ZX',   variant: 'Hybrid',      category: 'Luxury MPV',    basePrice: 9000000, color: '#374151', isActive: true },
    { _id: uid(), modelName: 'Toyota Glanza',         baseSuffix: 'V',    variant: 'AMT',         category: 'Hatchback',     basePrice: 1050000, color: '#059669', isActive: true },
  ];

  slabConfig = {
    _id: uid(),
    name: 'Toyota Nippon Standard Plan',
    description: 'Monthly vehicle sales incentive tiers for Toyota Nippon officers',
    slabs: [
      { _id: uid(), minQty: 1, maxQty: 3,    incentivePerCar: 1000, label: 'Bronze' },
      { _id: uid(), minQty: 4, maxQty: 7,    incentivePerCar: 2000, label: 'Silver' },
      { _id: uid(), minQty: 8, maxQty: null,  incentivePerCar: 3500, label: 'Gold'  },
    ],
    calculationType: 'flat',
    isActive: true,
    updatedAt: new Date(),
  };

  const [admin, salman, ashfaq, jeslin, swani, lana, nazal] = users;
  const month = new Date().getMonth() + 1;
  const year  = new Date().getFullYear();

  salesEntries = [
    // Salman Faris — Gold tier (12 cars = ₹42,000) — #1
    {
      _id: uid(), officer: salman._id, month, year,
      entries: [
        { carModelId: cars[0]._id, quantity: 4 },
        { carModelId: cars[1]._id, quantity: 5 },
        { carModelId: cars[2]._id, quantity: 3 },
      ],
      totalCars: 12, totalIncentive: 42000, tierHit: 'Gold', status: 'submitted',
    },
    // Swani — Gold tier (9 cars = ₹31,500) — #2
    {
      _id: uid(), officer: swani._id, month, year,
      entries: [{ carModelId: cars[1]._id, quantity: 9 }],
      totalCars: 9, totalIncentive: 31500, tierHit: 'Gold', status: 'submitted',
    },
    // Ashfaq Hussain — Silver (7 cars = ₹14,000) — #3
    {
      _id: uid(), officer: ashfaq._id, month, year,
      entries: [{ carModelId: cars[2]._id, quantity: 7 }],
      totalCars: 7, totalIncentive: 14000, tierHit: 'Silver', status: 'submitted',
    },
    // Nazal — Silver (6 cars = ₹12,000) — #4
    {
      _id: uid(), officer: nazal._id, month, year,
      entries: [{ carModelId: cars[3]._id, quantity: 6 }],
      totalCars: 6, totalIncentive: 12000, tierHit: 'Silver', status: 'submitted',
    },
    // Jeslin — Silver (5 cars = ₹10,000) — #5
    {
      _id: uid(), officer: jeslin._id, month, year,
      entries: [{ carModelId: cars[4]._id, quantity: 5 }],
      totalCars: 5, totalIncentive: 10000, tierHit: 'Silver', status: 'submitted',
    },
    // Lana — Bronze (3 cars = ₹3,000) — #6
    {
      _id: uid(), officer: lana._id, month, year,
      entries: [{ carModelId: cars[6]._id, quantity: 3 }],
      totalCars: 3, totalIncentive: 3000, tierHit: 'Bronze', status: 'draft',
    },
  ];
  console.log('✅ Toyota Nippon seed complete — Salman Faris leads with ₹42,000');
}

// ── Auth middleware ──
const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const user = users.find(u => u._id === decoded.id);
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    req.user = user;
    next();
  } catch { res.status(401).json({ success: false, error: 'Invalid token' }); }
};
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin only' });
  next();
};

function calculateIncentive(totalCars, slabs, calcType = 'flat') {
  if (!slabs?.length || totalCars === 0) return { totalIncentive: 0, tierHit: null, appliedRate: 0, breakdown: [] };
  const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);
  if (calcType === 'flat') {
    let applied = null;
    for (const s of sorted) {
      if (totalCars >= s.minQty && (s.maxQty == null || totalCars <= s.maxQty)) applied = s;
    }
    if (!applied) applied = sorted[sorted.length - 1];
    const total = totalCars * applied.incentivePerCar;
    return { totalIncentive: total, tierHit: applied.label, appliedRate: applied.incentivePerCar,
      breakdown: sorted.map(s => ({ label: s.label, range: s.maxQty ? `${s.minQty}–${s.maxQty}` : `${s.minQty}+`, rate: s.incentivePerCar, isActive: s === applied, cars: s === applied ? totalCars : 0, amount: s === applied ? total : 0 })) };
  }
  let rem = totalCars, total = 0; const breakdown = [];
  for (const s of sorted) {
    if (rem <= 0) break;
    const maxInBand = s.maxQty != null ? s.maxQty - s.minQty + 1 : Infinity;
    const inBand = Math.min(rem, maxInBand); const amt = inBand * s.incentivePerCar;
    total += amt; breakdown.push({ label: s.label, range: s.maxQty ? `${s.minQty}–${s.maxQty}` : `${s.minQty}+`, rate: s.incentivePerCar, cars: inBand, amount: amt, isActive: inBand > 0 }); rem -= inBand;
  }
  const last = [...breakdown].reverse().find(b => b.isActive);
  return { totalIncentive: total, tierHit: last?.label || null, appliedRate: last?.rate || 0, breakdown };
}
function getNextMilestone(totalCars, slabs) {
  const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);
  for (const s of sorted) { if (s.minQty > totalCars) return { carsNeeded: s.minQty - totalCars, nextRate: s.incentivePerCar, nextLabel: s.label || 'Next Tier' }; }
  return null;
}

// ── Auth routes ──
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email?.toLowerCase().trim());
  if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safe } = user;
  res.json({ success: true, token, user: safe });
});
app.get('/api/auth/me', protect, (req, res) => { const { password: _, ...safe } = req.user; res.json({ success: true, user: safe }); });
app.get('/api/auth/officers', protect, adminOnly, (req, res) => { res.json({ success: true, data: users.filter(u => u.role === 'officer').map(({ password: _, ...u }) => u) }); });
app.post('/api/auth/officers', protect, adminOnly, async (req, res) => {
  const { name, email, password, employeeId } = req.body;
  if (users.find(u => u.email === email)) return res.status(400).json({ success: false, error: 'Email already exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = { _id: uid(), name, email: email.toLowerCase(), password: hashed, role: 'officer', employeeId, isActive: true, createdAt: new Date() };
  users.push(user); const { password: _, ...safe } = user;
  res.status(201).json({ success: true, user: safe });
});
app.delete('/api/auth/officers/:id', protect, adminOnly, (req, res) => { users = users.filter(u => u._id !== req.params.id); res.json({ success: true }); });

// ── Car routes ──
app.get('/api/cars', protect, (req, res) => res.json({ success: true, data: cars.filter(c => c.isActive) }));
app.get('/api/cars/all', protect, adminOnly, (req, res) => res.json({ success: true, data: cars }));
app.post('/api/cars', protect, adminOnly, (req, res) => { const car = { _id: uid(), ...req.body, isActive: true }; car.displayName = [car.modelName, car.baseSuffix, car.variant].filter(Boolean).join(' '); cars.push(car); res.status(201).json({ success: true, data: car }); });
app.put('/api/cars/:id', protect, adminOnly, (req, res) => { const i = cars.findIndex(c => c._id === req.params.id); if (i === -1) return res.status(404).json({ success: false, error: 'Not found' }); cars[i] = { ...cars[i], ...req.body }; cars[i].displayName = [cars[i].modelName, cars[i].baseSuffix, cars[i].variant].filter(Boolean).join(' '); res.json({ success: true, data: cars[i] }); });
app.delete('/api/cars/:id', protect, adminOnly, (req, res) => { const i = cars.findIndex(c => c._id === req.params.id); if (i !== -1) cars[i].isActive = false; res.json({ success: true }); });

// ── Slab routes ──
app.get('/api/slabs', protect, (req, res) => res.json({ success: true, data: slabConfig }));
app.post('/api/slabs', protect, adminOnly, (req, res) => {
  const { name, description, slabs, calculationType } = req.body;
  slabConfig = { _id: slabConfig?._id || uid(), name: name || 'Incentive Structure', description, slabs: [...slabs].sort((a, b) => a.minQty - b.minQty).map(s => ({ ...s, _id: s._id || uid() })), calculationType: calculationType || 'flat', isActive: true, updatedAt: new Date() };
  res.status(201).json({ success: true, data: slabConfig });
});

// ── Sales routes ──
app.get('/api/sales/my', protect, (req, res) => {
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  let entry = salesEntries.find(e => e.officer === req.user._id && e.month === month && e.year === year);
  if (!entry) { entry = { _id: uid(), officer: req.user._id, month, year, entries: [], totalCars: 0, totalIncentive: 0, status: 'draft' }; salesEntries.push(entry); }
  const populated = { ...entry, entries: entry.entries.map(e => ({ ...e, carModelId: cars.find(c => c._id === e.carModelId) || { _id: e.carModelId } })) };
  res.json({ success: true, data: populated });
});
app.put('/api/sales/my', protect, (req, res) => {
  const { month, year, entries } = req.body; const m = parseInt(month), y = parseInt(year);
  const slabs = slabConfig?.slabs || []; const calcType = slabConfig?.calculationType || 'flat';
  const validEntries = (entries || []).filter(e => e.quantity > 0);
  const totalCars = validEntries.reduce((s, e) => s + (e.quantity || 0), 0);
  const { totalIncentive, tierHit, breakdown, appliedRate } = calculateIncentive(totalCars, slabs, calcType);
  const nextMilestone = getNextMilestone(totalCars, slabs);
  let entryIdx = salesEntries.findIndex(e => e.officer === req.user._id && e.month === m && e.year === y);
  const updated = { _id: entryIdx >= 0 ? salesEntries[entryIdx]._id : uid(), officer: req.user._id, month: m, year: y, entries: validEntries, totalCars, totalIncentive, tierHit, breakdown, status: entryIdx >= 0 ? salesEntries[entryIdx].status : 'draft', updatedAt: new Date() };
  if (entryIdx >= 0) salesEntries[entryIdx] = updated; else salesEntries.push(updated);
  res.json({ success: true, data: updated, calculation: { totalCars, totalIncentive, tierHit, breakdown, appliedRate, nextMilestone } });
});
app.post('/api/sales/my/submit', protect, (req, res) => {
  const { month, year } = req.body;
  const i = salesEntries.findIndex(e => e.officer === req.user._id && e.month === parseInt(month) && e.year === parseInt(year));
  if (i === -1) return res.status(404).json({ success: false, error: 'Entry not found' });
  salesEntries[i].status = 'submitted'; res.json({ success: true, data: salesEntries[i] });
});
app.get('/api/sales/history', protect, (req, res) => { res.json({ success: true, data: salesEntries.filter(e => e.officer === req.user._id).sort((a, b) => b.year - a.year || b.month - a.month) }); });
app.get('/api/sales/admin/all', protect, adminOnly, (req, res) => {
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const entries = salesEntries.filter(e => e.month === month && e.year === year).sort((a, b) => (b.totalIncentive || 0) - (a.totalIncentive || 0)).map(e => ({ ...e, officer: users.find(u => u._id === e.officer) }));
  res.json({ success: true, data: entries });
});
app.get('/api/sales/admin/leaderboard', protect, adminOnly, (req, res) => {
  const month = new Date().getMonth() + 1; const year = new Date().getFullYear();
  const lb = salesEntries.filter(e => e.month === month && e.year === year).sort((a, b) => (b.totalIncentive || 0) - (a.totalIncentive || 0)).slice(0, 10).map(e => ({ ...e, officer: users.find(u => u._id === e.officer) }));
  res.json({ success: true, data: lb });
});
app.get('/api/health', (req, res) => res.json({ status: 'OK', mode: 'mock', company: 'Toyota Nippon' }));

seed().then(() => app.listen(PORT, () => {
  console.log(`\n  ⚡ IncentIQ Mock Server — Toyota Nippon`);
  console.log(`  🚀 http://localhost:${PORT}\n`);
  console.log(`  Admin:   admin@toyotanippon.com / admin123`);
  console.log(`  Officer: salman@toyotanippon.com / officer123\n`);
}));
