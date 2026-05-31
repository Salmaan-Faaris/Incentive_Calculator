import { useState, useEffect, useCallback } from 'react';
import Topnav from '../components/Topnav';
import {
  getCars, getAllCars, createCar, updateCar, deleteCar,
  getActiveSlab, saveSlab,
  getAdminAllSales, getLeaderboard,
  getOfficers, createOfficer, deleteOfficer,
} from '../api';
import { useToast } from '../context/ToastContext';

const TIER_COLORS = ['#cd7f32', '#94a3b8', '#f59e0b', '#06b6d4', '#10b981', '#7c3aed'];
const TIER_NAMES  = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CAR_COLORS  = ['#e11d48', '#0891b2', '#059669', '#7c3aed', '#d97706', '#dc2626', '#f97316', '#db2777', '#0ea5e9'];
const CATEGORIES  = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'EV', 'EV SUV', 'Crossover', 'Pickup', 'Luxury'];

const currentYear = new Date().getFullYear();
const DYNAMIC_YEARS = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

const TABS = [
  { id: 'overview',  icon: '📊', label: 'Overview' },
  { id: 'slabs',     icon: '⚡', label: 'Slab Config' },
  { id: 'cars',      icon: '🚗', label: 'Car Models' },
  { id: 'officers',  icon: '👤', label: 'Officers' },
];

/* ═══ Slab Editor ═══ */
function SlabEditor({ initialSlabs, initialType, onSave, loading }) {
  const [slabs, setSlabs] = useState(initialSlabs || [
    { minQty: 1, maxQty: 3,   incentivePerCar: 1000, label: 'Bronze' },
    { minQty: 4, maxQty: 7,   incentivePerCar: 2000, label: 'Silver' },
    { minQty: 8, maxQty: null, incentivePerCar: 3500, label: 'Gold' },
  ]);
  const [configName, setConfigName] = useState('Standard Incentive Plan');

  useEffect(() => {
    if (initialSlabs?.length) setSlabs(initialSlabs);
  }, [initialSlabs]);

  const updateSlab = (i, field, val) => {
    const next = slabs.map((s, idx) =>
      idx === i ? { ...s, [field]: field === 'label' ? val : (val === '' ? null : Number(val)) } : s
    );
    setSlabs(next);
  };

  const addSlab = () => {
    const last = slabs[slabs.length - 1];
    const newMin = last ? (last.maxQty ?? last.minQty) + 1 : 1;
    setSlabs([...slabs, {
      minQty: newMin,
      maxQty: null,
      incentivePerCar: (last?.incentivePerCar || 0) + 1000,
      label: TIER_NAMES[slabs.length] || `Tier ${slabs.length + 1}`,
    }]);
  };

  const removeSlab = (i) => {
    if (slabs.length <= 1) return;
    setSlabs(slabs.filter((_, idx) => idx !== i));
  };

  const tierColor = (i) => TIER_COLORS[i % TIER_COLORS.length];

  return (
    <div>
      {/* Config Name */}
      <div style={{ marginBottom: 28 }}>
        <div className="form-group">
          <label className="form-label">Configuration Name</label>
          <input className="form-input" value={configName} onChange={(e) => setConfigName(e.target.value)} placeholder="e.g. Q2 2025 Incentive Plan" />
        </div>
      </div>

      {/* Slab Rows */}
      <div className="slab-editor-wrap">
        {slabs.map((slab, i) => (
          <div key={i} className="slab-row-editor" style={{ paddingLeft: 24 }}>
            <div className="slab-tier-indicator" style={{ background: tierColor(i) }} />
            <div className="slab-row-num" style={{ color: tierColor(i) }}>{slab.label || `Tier ${i + 1}`}</div>

            <div className="form-group">
              <label className="form-label">Min Qty</label>
              <input type="number" className="form-input" min="0" value={slab.minQty} onChange={(e) => updateSlab(i, 'minQty', e.target.value)} style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Qty <span style={{ color: 'var(--text-disabled)' }}>(blank = ∞)</span></label>
              <input type="number" className="form-input" min="0" value={slab.maxQty ?? ''} onChange={(e) => updateSlab(i, 'maxQty', e.target.value)} placeholder="∞ no limit" style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }} />
            </div>
            <div className="form-group">
              <label className="form-label">₹ Incentive / Car</label>
              <input type="number" className="form-input" min="0" value={slab.incentivePerCar} onChange={(e) => updateSlab(i, 'incentivePerCar', e.target.value)} style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 800, color: tierColor(i) }} />
            </div>
            <div className="form-group">
              <label className="form-label">Tier Label</label>
              <input className="form-input" value={slab.label || ''} onChange={(e) => updateSlab(i, 'label', e.target.value)} placeholder={TIER_NAMES[i] || `Tier ${i + 1}`} />
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="form-label" style={{ opacity: 0 }}>_</label>
              <button className="btn btn-danger btn-sm" onClick={() => removeSlab(i)} disabled={slabs.length <= 1}>✕</button>
            </div>
          </div>
        ))}

        <button className="add-slab-btn" onClick={addSlab} id="add-slab-btn">
          <span style={{ fontSize: 20 }}>＋</span>
          Add Tier / Slab
        </button>
      </div>

      {/* Visual Preview */}
      <div className="slab-visual">
        <h4>Visual Slab Distribution</h4>
        <div className="slab-bar-track">
          {slabs.map((s, i) => {
            const width = s.maxQty ? s.maxQty - s.minQty + 1 : 4;
            return (
              <div key={i} className="slab-bar-seg" style={{ flex: width, background: tierColor(i) }}>
                <span style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  {s.label || `T${i + 1}`} — ₹{(s.incentivePerCar || 0).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
        <div className="slab-legend">
          {slabs.map((s, i) => (
            <div key={i} className="slab-legend-item">
              <div className="slab-legend-dot" style={{ background: tierColor(i) }} />
              <span>
                {s.minQty}–{s.maxQty ?? '∞'} cars → ₹{(s.incentivePerCar || 0).toLocaleString()}/car
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button className="btn btn-primary btn-lg" id="save-slabs-btn" onClick={() => onSave({ name: configName, slabs, calculationType: 'flat' })} disabled={loading}>
          {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Saving…</> : '✓ Save Slab Configuration'}
        </button>
      </div>
    </div>
  );
}

/* ═══ Car Modal ═══ */
function CarModal({ mode, initial, onClose, onSave, loading }) {
  const EMPTY = { modelName: '', baseSuffix: '', variant: '', category: 'Sedan', basePrice: '', color: '#7c3aed' };
  const [form, setForm] = useState(initial || EMPTY);
  const ch = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{mode === 'add' ? '🚗 Add Car Model' : '✏️ Edit Car Model'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Model Name *</label>
                <input name="modelName" className="form-input" value={form.modelName} onChange={ch} placeholder="e.g. Maruti Swift" />
              </div>
              <div className="form-group">
                <label className="form-label">Base Suffix</label>
                <input name="baseSuffix" className="form-input" value={form.baseSuffix} onChange={ch} placeholder="e.g. VXi" />
              </div>
              <div className="form-group">
                <label className="form-label">Variant</label>
                <input name="variant" className="form-input" value={form.variant} onChange={ch} placeholder="e.g. MT / AT / Turbo" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select name="category" className="form-input" value={form.category} onChange={ch}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Base Price (₹)</label>
                <input name="basePrice" type="number" className="form-input" value={form.basePrice} onChange={ch} placeholder="e.g. 650000" style={{ fontFamily: 'JetBrains Mono' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Accent Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: 48, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                    {CAR_COLORS.map((c) => (
                      <div key={c} onClick={() => setForm({ ...form, color: c })} style={{ width: 22, height: 22, borderRadius: 50, background: c, cursor: 'pointer', border: form.color === c ? '2px solid white' : '2px solid transparent', transition: 'border 0.15s' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!form.modelName || loading} onClick={() => onSave(form)}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '✓ Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ Officer Modal ═══ */
function OfficerModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', employeeId: '' });
  const ch = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>👤 Add Sales Officer</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input name="name" className="form-input" value={form.name} onChange={ch} placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input name="employeeId" className="form-input" value={form.employeeId} onChange={ch} placeholder="SO-001" style={{ fontFamily: 'JetBrains Mono' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input name="email" type="email" className="form-input" value={form.email} onChange={ch} placeholder="name@toyotanippon.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input name="password" type="password" className="form-input" value={form.password} onChange={ch} placeholder="Min. 6 characters" />
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!form.name || !form.email || !form.password || loading} onClick={() => onSave(form)}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '✓ Create Officer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ MAIN ADMIN DASHBOARD ═══ */
export default function AdminDashboard() {
  const [tab, setTab]             = useState('overview');
  const [cars, setCars]           = useState([]);
  const [slab, setSlab]           = useState(null);
  const [leaderboard, setLb]      = useState([]);
  const [officers, setOfficers]   = useState([]);
  const [allSales, setAllSales]   = useState([]);
  const [carModal, setCarModal]   = useState(null);
  const [offModal, setOffModal]   = useState(false);
  const [slabLoading, setSlabLoading] = useState(false);
  const [carLoading, setCarLoading]   = useState(false);
  const [offLoading, setOffLoading]   = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
  const [viewYear,  setViewYear]  = useState(new Date().getFullYear());
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const [carsR, slabR, offR] = await Promise.all([
        getAllCars(), getActiveSlab(), getOfficers(),
      ]);
      setCars(carsR.data.data);
      setSlab(slabR.data.data);
      setOfficers(offR.data.data);
    } catch { toast('Failed to load data', 'error'); }
  }, []);

  const loadSales = useCallback(async () => {
    try {
      const [r, lbR] = await Promise.all([
        getAdminAllSales(viewMonth, viewYear),
        getLeaderboard(viewMonth, viewYear)
      ]);
      setAllSales(r.data.data);
      setLb(lbR.data.data);
    } catch { toast('Failed to load sales', 'error'); }
  }, [viewMonth, viewYear]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'overview') loadSales(); }, [tab, loadSales]);

  // Slab save
  const handleSaveSlab = async (data) => {
    setSlabLoading(true);
    try {
      const r = await saveSlab(data);
      setSlab(r.data.data);
      toast('Slab configuration saved! 🎉', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save', 'error');
    } finally { setSlabLoading(false); }
  };

  // Car CRUD
  const handleSaveCar = async (form) => {
    setCarLoading(true);
    try {
      if (carModal.mode === 'add') {
        await createCar(form);
        toast('Car model added!', 'success');
      } else {
        await updateCar(carModal.car._id, form);
        toast('Car model updated!', 'success');
      }
      setCarModal(null);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Error saving car', 'error');
    } finally { setCarLoading(false); }
  };

  const handleDeleteCar = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try { await deleteCar(id); toast('Car deactivated', 'success'); load(); }
    catch { toast('Delete failed', 'error'); }
  };

  // Officer CRUD
  const handleCreateOfficer = async (form) => {
    setOffLoading(true);
    try {
      await createOfficer(form);
      toast(`Officer ${form.name} created!`, 'success');
      setOffModal(false);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Error creating officer', 'error');
    } finally { setOffLoading(false); }
  };

  const handleDeleteOfficer = async (id, name) => {
    if (!window.confirm(`Delete officer "${name}"? Their sales history will also be removed.`)) return;
    try { await deleteOfficer(id); toast('Officer deleted', 'success'); load(); }
    catch { toast('Delete failed', 'error'); }
  };

  const tierColor = (i) => TIER_COLORS[i % TIER_COLORS.length];
  const tierClass = (label) => {
    const l = (label || '').toLowerCase();
    if (l.includes('gold'))   return 'tier-gold';
    if (l.includes('silver')) return 'tier-silver';
    if (l.includes('bronze')) return 'tier-bronze';
    return 'tier-none';
  };

  const activeCars = cars.filter((c) => c.isActive);
  const totalPayout = allSales.reduce((s, e) => s + (e.totalIncentive || 0), 0);
  const topTier = lbR => lbR?.tierHit || '—';

  return (
    <div className="page-wrap">
      <Topnav activeTab={tab} onTabChange={setTab} tabs={TABS} />

      <div className="container" style={{ paddingTop: 96 }}>

        {/* ─── OVERVIEW TAB ─── */}
        {tab === 'overview' && (
          <>
            <div className="page-header">
              <div className="page-header-row">
                <div>
                  <h1>Admin Overview</h1>
                  <p>Manage your incentive engine and monitor officer performance</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select className="form-input" style={{ width: 130 }} value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))}>
                    {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                  <select className="form-input" style={{ width: 100 }} value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))}>
                    {DYNAMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button className="btn btn-ghost btn-sm" onClick={loadSales}>↻ Refresh</button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
              <div className="stat-box stagger-1" style={{ '--accent': 'var(--toyota-red)' }}>
                <div className="stat-icon-wrap" style={{ '--icon-bg': 'rgba(235,10,30,0.08)' }}>🚗</div>
                <div className="stat-value">{activeCars.length}</div>
                <div className="stat-label">Active Car Models</div>
              </div>
              <div className="stat-box stagger-2" style={{ '--accent': 'var(--success)' }}>
                <div className="stat-icon-wrap" style={{ '--icon-bg': 'var(--success-bg)' }}>👤</div>
                <div className="stat-value">{officers.length}</div>
                <div className="stat-label">Sales Officers</div>
              </div>
              <div className="stat-box stagger-3" style={{ '--accent': 'var(--warning)' }}>
                <div className="stat-icon-wrap" style={{ '--icon-bg': 'var(--warning-bg)' }}>📦</div>
                <div className="stat-value">{allSales.reduce((s, e) => s + (e.totalCars || 0), 0)}</div>
                <div className="stat-label">Cars Sold — {MONTHS[viewMonth]}</div>
              </div>
              <div className="stat-box stagger-4" style={{ '--accent': 'var(--info)' }}>
                <div className="stat-icon-wrap" style={{ '--icon-bg': 'var(--info-bg)' }}>💰</div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>₹{totalPayout.toLocaleString('en-IN')}</div>
                <div className="stat-label">Total Payout — {MONTHS[viewMonth]}</div>
              </div>
            </div>

            {/* Two columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Leaderboard */}
              <div className="card">
                <div className="card-header">
                  <h3>🏆 Leaderboard — {MONTHS[viewMonth]} {viewYear}</h3>
                </div>
                {leaderboard.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🏆</div>
                    <h3>No data yet</h3>
                    <p>Officers haven't submitted sales this month.</p>
                  </div>
                ) : (
                  leaderboard.map((e, i) => (
                    <div key={e._id} className="leaderboard-item">
                      <div className={`lb-rank ${i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : 'rn'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </div>
                      <div className="lb-info">
                        <div className="lb-name">{e.officer?.name || 'Officer'}</div>
                        <div className="lb-meta">{e.officer?.employeeId} · {e.totalCars} cars · <span className={`tier-badge ${tierClass(e.tierHit)}`} style={{ fontSize: 10, padding: '2px 8px' }}>{e.tierHit || 'No Tier'}</span></div>
                      </div>
                      <div>
                        <div className="lb-amount">₹{(e.totalIncentive || 0).toLocaleString('en-IN')}</div>
                        <div className="lb-cars">{e.totalCars} cars</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* All Sales Table */}
              <div className="card">
                <div className="card-header">
                  <h3>📋 All Officers — {MONTHS[viewMonth]} {viewYear}</h3>
                  <span className="badge badge-violet">{allSales.length} entries</span>
                </div>
                <div className="table-wrap">
                  {allSales.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <h3>No sales data</h3>
                      <p>No entries for this period.</p>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Officer</th>
                          <th>Cars</th>
                          <th>Tier</th>
                          <th>Payout</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSales.map((e) => (
                          <tr key={e._id}>
                            <td className="td-primary">{e.officer?.name}</td>
                            <td className="td-mono">{e.totalCars}</td>
                            <td>
                              <span className={`tier-badge ${tierClass(e.tierHit)}`}>
                                {e.tierHit || '—'}
                              </span>
                            </td>
                            <td className="text-success font-mono">₹{(e.totalIncentive || 0).toLocaleString('en-IN')}</td>
                            <td>
                              <span className={`badge ${e.status === 'submitted' ? 'badge-emerald' : 'badge-amber'}`}>
                                {e.status === 'submitted' ? '✓ Submitted' : '⏳ Draft'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── SLABS TAB ─── */}
        {tab === 'slabs' && (
          <>
            <div className="page-header">
              <h1>⚡ Slab Configuration</h1>
              <p>Define tiered incentive payouts for your sales team. Changes take effect immediately.</p>
            </div>
            <div className="card">
              <div className="card-body" style={{ padding: 32 }}>
                <SlabEditor
                  initialSlabs={slab?.slabs}
                  initialType={slab?.calculationType}
                  onSave={handleSaveSlab}
                  loading={slabLoading}
                />
              </div>
            </div>
          </>
        )}

        {/* ─── CARS TAB ─── */}
        {tab === 'cars' && (
          <>
            <div className="page-header">
              <div className="page-header-row">
                <div>
                  <h1>🚗 Car Inventory</h1>
                  <p>Configure the models that officers can log sales for</p>
                </div>
                <button className="btn btn-primary" id="add-car-btn" onClick={() => setCarModal({ mode: 'add', car: null })}>
                  ＋ Add Model
                </button>
              </div>
            </div>
            <div className="car-card-grid">
              {cars.map((car) => (
                <div key={car._id} className="car-card" style={{ '--car-c': car.color }}>
                  <div>
                    <div className="car-card-name">{car.modelName}</div>
                    <div className="car-card-meta">
                      {car.baseSuffix && <span>{car.baseSuffix}</span>}
                      {car.variant    && <span>{car.variant}</span>}
                      <span>{car.category}</span>
                      {!car.isActive  && <span style={{ color: 'var(--red)' }}>Inactive</span>}
                    </div>
                    {car.basePrice > 0 && (
                      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                        ₹{car.basePrice.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                  <div className="car-card-actions">
                    <button className="btn btn-ghost btn-sm" id={`edit-car-${car._id}`} onClick={() => setCarModal({ mode: 'edit', car })}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm" id={`del-car-${car._id}`} onClick={() => handleDeleteCar(car._id, car.modelName)}>🗑 Remove</button>
                  </div>
                </div>
              ))}
              {cars.length === 0 && (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <div className="empty-icon">🚗</div>
                  <h3>No car models yet</h3>
                  <p>Add your first car model to get started.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── OFFICERS TAB ─── */}
        {tab === 'officers' && (
          <>
            <div className="page-header">
              <div className="page-header-row">
                <div>
                  <h1>👤 Sales Officers</h1>
                  <p>Manage the officers who can log sales and view incentives</p>
                </div>
                <button className="btn btn-primary" id="add-officer-btn" onClick={() => setOffModal(true)}>＋ Add Officer</button>
              </div>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Employee ID</th>
                      <th>Email</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officers.map((o) => (
                      <tr key={o._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                              {o.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="td-primary">{o.name}</span>
                          </div>
                        </td>
                        <td className="td-mono">{o.employeeId || '—'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{o.email}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOfficer(o._id, o.name)}>🗑 Delete</button>
                        </td>
                      </tr>
                    ))}
                    {officers.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <div className="empty-state">
                            <div className="empty-icon">👤</div>
                            <h3>No officers yet</h3>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {carModal && (
        <CarModal mode={carModal.mode} initial={carModal.car} onClose={() => setCarModal(null)} onSave={handleSaveCar} loading={carLoading} />
      )}
      {offModal && (
        <OfficerModal onClose={() => setOffModal(false)} onSave={handleCreateOfficer} loading={offLoading} />
      )}
    </div>
  );
}
