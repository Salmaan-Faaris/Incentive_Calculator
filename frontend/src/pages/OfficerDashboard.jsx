import { useState, useEffect, useCallback, useRef } from 'react';
import Topnav from '../components/Topnav';
import { getCars, getActiveSlab, getMySales, saveMySales, submitSales, getSalesHistory } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TIER_COLORS = { bronze: '#cd7f32', silver: '#94a3b8', gold: '#f59e0b', platinum: '#06b6d4', diamond: '#10b981', elite: '#7c3aed' };

const currentYear = new Date().getFullYear();
const DYNAMIC_YEARS = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

const TABS = [
  { id: 'calculator', icon: '⚡', label: 'Calculator' },
  { id: 'history',    icon: '🕒', label: 'My History' },
];

/* ══ Pure client-side incentive calculation ══ */
function calculateIncentive(totalCars, slabs, calcType) {
  if (!slabs?.length || totalCars === 0) return { totalIncentive: 0, tierHit: null, appliedRate: 0, breakdown: [] };
  const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);

  if (calcType === 'flat') {
    let applied = null;
    for (const s of sorted) {
      const withinMax = s.maxQty === null || s.maxQty === undefined || totalCars <= s.maxQty;
      if (totalCars >= s.minQty && withinMax) applied = s;
    }
    if (!applied) applied = sorted[sorted.length - 1];
    const total = totalCars * applied.incentivePerCar;
    return {
      totalIncentive: total,
      tierHit: applied.label || 'Tier',
      appliedRate: applied.incentivePerCar,
      appliedSlab: applied,
      breakdown: sorted.map((s, i) => ({
        label: s.label || `Tier ${i + 1}`,
        range: s.maxQty ? `${s.minQty}–${s.maxQty}` : `${s.minQty}+`,
        rate: s.incentivePerCar,
        isActive: s === applied || (s.minQty === applied.minQty && s.incentivePerCar === applied.incentivePerCar),
        cars: 0,
        amount: 0,
      })).map((b) => ({ ...b, amount: b.isActive ? total : 0, cars: b.isActive ? totalCars : 0 })),
    };
  }

  // Progressive
  let rem = totalCars, total = 0;
  const breakdown = [];
  for (const s of sorted) {
    if (rem <= 0) break;
    const maxInBand = s.maxQty != null ? s.maxQty - s.minQty + 1 : Infinity;
    const inBand = Math.min(rem, maxInBand);
    const amt = inBand * s.incentivePerCar;
    total += amt;
    breakdown.push({ label: s.label || 'Tier', range: s.maxQty ? `${s.minQty}–${s.maxQty}` : `${s.minQty}+`, rate: s.incentivePerCar, cars: inBand, amount: amt, isActive: inBand > 0 });
    rem -= inBand;
  }
  const last = [...breakdown].reverse().find((b) => b.isActive);
  return { totalIncentive: total, tierHit: last?.label || null, appliedRate: last?.rate || 0, breakdown };
}

function getNextMilestone(totalCars, slabs) {
  const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);
  for (const s of sorted) {
    if (s.minQty > totalCars) return { carsNeeded: s.minQty - totalCars, nextRate: s.incentivePerCar, nextLabel: s.label || 'Next Tier' };
  }
  return null;
}

/* ══ Animated payout number ══ */
function useAnimatedNumber(value, duration = 400) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const frame = useRef(null);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) frame.current = requestAnimationFrame(animate);
      else prev.current = end;
    };
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [value, duration]);

  return display;
}

/* ══ Tier Meter ══ */
function TierMeter({ slabs, totalCars, calcType }) {
  if (!slabs?.length) return null;
  const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);

  const tierColorForLabel = (label) => {
    const l = (label || '').toLowerCase();
    if (l.includes('gold'))     return '#f59e0b';
    if (l.includes('silver'))   return '#94a3b8';
    if (l.includes('bronze'))   return '#cd7f32';
    if (l.includes('platinum')) return '#06b6d4';
    return '#7c3aed';
  };

  const result = calculateIncentive(totalCars, slabs, calcType);
  const milestone = getNextMilestone(totalCars, slabs);

  return (
    <div>
      {/* Progress Track */}
      <div className="tier-meter">
        <div className="tier-meter-header">
          <h4>Incentive Tier Progress</h4>
          {result.tierHit && (
            <span className={`tier-badge ${result.tierHit?.toLowerCase().includes('gold') ? 'tier-gold' : result.tierHit?.toLowerCase().includes('silver') ? 'tier-silver' : result.tierHit?.toLowerCase().includes('bronze') ? 'tier-bronze' : 'tier-badge badge-violet'}`}>
              🏅 {result.tierHit}
            </span>
          )}
        </div>

        <div className="tier-track">
          {sorted.map((s, i) => {
            const color = tierColorForLabel(s.label);
            const maxInSeg = s.maxQty ?? (s.minQty + 3);
            const fill = totalCars >= s.minQty
              ? (totalCars >= (s.maxQty ?? Infinity) ? 1 : (totalCars - s.minQty) / (maxInSeg - s.minQty))
              : 0;

            return (
              <div
                key={i}
                className={`tier-segment ${fill >= 1 ? 'done' : fill > 0 ? 'partial' : ''} ${fill > 0 ? 'active' : ''}`}
                style={{ '--seg-color': color, '--fill': fill }}
              >
                <div style={{
                  height: '100%',
                  background: color,
                  width: `${Math.min(fill * 100, 100)}%`,
                  borderRadius: 5,
                  transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: fill > 0 ? `0 0 8px ${color}` : 'none',
                }} />
              </div>
            );
          })}
        </div>

        <div className="tier-labels">
          {sorted.map((s, i) => {
            const color = tierColorForLabel(s.label);
            const isActive = totalCars >= s.minQty;
            return (
              <div key={i} className={`tier-seg-label ${isActive ? 'active' : ''}`} style={{ '--seg-color': color }}>
                {s.label || `T${i + 1}`}
                <br />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, opacity: 0.7 }}>
                  {s.minQty}–{s.maxQty ?? '∞'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone */}
      {milestone ? (
        <div className="milestone-banner" style={{ margin: '0 24px 20px' }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <span>
            <strong>{milestone.carsNeeded} more car{milestone.carsNeeded !== 1 ? 's' : ''}</strong> to unlock{' '}
            <strong style={{ color: '#f59e0b' }}>{milestone.nextLabel}</strong> tier at{' '}
            <strong>₹{(milestone.nextRate || 0).toLocaleString('en-IN')}/car</strong>
          </span>
        </div>
      ) : totalCars > 0 && (
        <div className="milestone-banner top-tier" style={{ margin: '0 24px 20px' }}>
          <span style={{ fontSize: 20 }}>🏆</span>
          <span><strong>You're at the top tier!</strong> Maximum incentive rate achieved.</span>
        </div>
      )}
    </div>
  );
}

/* ══ MAIN OFFICER DASHBOARD ══ */
export default function OfficerDashboard() {
  const { user } = useAuth();
  const toast    = useToast();
  const [tab, setTab] = useState('calculator');

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  const [cars,    setCars]    = useState([]);
  const [slab,    setSlab]    = useState(null);
  const [quantities, setQties] = useState({}); // carId -> qty
  const [saving, setSaving]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [history, setHistory] = useState([]);
  const [prevPayout, setPrevPayout] = useState(0);
  const [payoutHighlight, setPayoutHighlight] = useState(false);

  // Load cars + slab
  useEffect(() => {
    Promise.all([getCars(), getActiveSlab()])
      .then(([cR, sR]) => { setCars(cR.data.data); setSlab(sR.data.data); })
      .catch(() => toast('Failed to load data', 'error'));
  }, []);

  // Load existing entry when month/year changes
  useEffect(() => {
    getMySales(month, year)
      .then((r) => {
        const entry = r.data.data;
        const qmap = {};
        (entry.entries || []).forEach((e) => { qmap[e.carModelId?._id || e.carModelId] = e.quantity; });
        setQties(qmap);
        setSubmitted(entry.status === 'submitted');
      })
      .catch(() => {});
  }, [month, year]);

  // Load history for history tab
  useEffect(() => {
    if (tab === 'history') {
      getSalesHistory().then((r) => setHistory(r.data.data)).catch(() => {});
    }
  }, [tab]);

  const totalCars = Object.values(quantities).reduce((s, v) => s + (parseInt(v) || 0), 0);
  const slabs = slab?.slabs || [];
  const calcType = slab?.calculationType || 'flat';
  const calc = calculateIncentive(totalCars, slabs, calcType);
  const milestone = getNextMilestone(totalCars, slabs);

  const animatedPayout = useAnimatedNumber(calc.totalIncentive);

  // Highlight on change
  useEffect(() => {
    if (calc.totalIncentive !== prevPayout) {
      setPayoutHighlight(true);
      setTimeout(() => setPayoutHighlight(false), 500);
      setPrevPayout(calc.totalIncentive);
    }
  }, [calc.totalIncentive]);

  const setQty = (carId, val) => {
    const v = Math.max(0, parseInt(val) || 0);
    setQties((q) => ({ ...q, [carId]: v }));
  };

  const increment = (carId) => setQties((q) => ({ ...q, [carId]: (parseInt(q[carId]) || 0) + 1 }));
  const decrement = (carId) => setQties((q) => ({ ...q, [carId]: Math.max(0, (parseInt(q[carId]) || 0) - 1) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(quantities)
        .filter(([, v]) => parseInt(v) > 0)
        .map(([carModelId, quantity]) => ({ carModelId, quantity: parseInt(quantity) }));
      await saveMySales({ month, year, entries });
      toast('Progress saved! 💾', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (!window.confirm(`Submit your sales for ${MONTHS[month]} ${year}? This will finalize your incentive.`)) return;
    setSubmitting(true);
    try {
      await handleSave();
      await submitSales({ month, year });
      setSubmitted(true);
      toast('Sales submitted successfully! 🎉', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Submit failed', 'error');
    } finally { setSubmitting(false); }
  };

  const tierClass = (label) => {
    const l = (label || '').toLowerCase();
    if (l.includes('gold'))   return 'tier-gold';
    if (l.includes('silver')) return 'tier-silver';
    if (l.includes('bronze')) return 'tier-bronze';
    return 'badge badge-violet';
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="page-wrap">
      <Topnav activeTab={tab} onTabChange={setTab} tabs={TABS} />

      <div className="container" style={{ paddingTop: 96 }}>

        {/* ─── CALCULATOR TAB ─── */}
        {tab === 'calculator' && (
          <>
            {/* Header */}
            <div className="page-header">
              <div className="page-header-row">
                <div>
                  <h1>Incentive Calculator</h1>
                  <p>Log your car sales and watch your incentive compute in real time</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select className="form-input" style={{ width: 140 }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                    {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                  <select className="form-input" style={{ width: 100 }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                    {DYNAMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {submitted && (
              <div className="alert alert-success" style={{ marginBottom: 24 }}>
                <span>✅</span>
                <span><strong>Sales submitted</strong> for {MONTHS[month]} {year}. Your incentive of <strong>₹{calc.totalIncentive.toLocaleString('en-IN')}</strong> has been locked in.</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>

              {/* Left: Car Inputs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>Cars Sold This Month</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {Object.values(quantities).some((v) => parseInt(v) > 0) && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setQties({})}>✕ Reset</button>
                    )}
                  </div>
                </div>

                <div className="car-input-grid">
                  {cars.map((car) => {
                    const qty = parseInt(quantities[car._id]) || 0;
                    const contribution = qty > 0 && calc.totalIncentive > 0
                      ? (qty / totalCars) * calc.totalIncentive
                      : 0;

                    return (
                      <div
                        key={car._id}
                        className={`car-input-card ${qty > 0 ? 'has-value' : ''}`}
                        style={{ '--car-color': car.color }}
                      >
                        {/* Color stripe */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: car.color, opacity: qty > 0 ? 1 : 0, transition: 'opacity 0.25s' }} />

                        <div>
                          <div className="car-name">{car.modelName}</div>
                          <div className="car-meta">
                            {[car.baseSuffix, car.variant, car.category].filter(Boolean).join(' · ')}
                          </div>
                        </div>

                        {/* Qty Control */}
                        <div className="qty-control">
                          <button className="qty-btn" id={`dec-${car._id}`} onClick={() => decrement(car._id)} disabled={submitted}>−</button>
                          <input
                            type="number"
                            className="qty-value"
                            value={qty || ''}
                            placeholder="0"
                            min="0"
                            onChange={(e) => setQty(car._id, e.target.value)}
                            disabled={submitted}
                            id={`qty-${car._id}`}
                          />
                          <button className="qty-btn" id={`inc-${car._id}`} onClick={() => increment(car._id)} disabled={submitted}>＋</button>
                        </div>

                        {/* Contribution */}
                        <div className="car-contribution">
                          <span>{qty} unit{qty !== 1 ? 's' : ''}</span>
                          {qty > 0 && (
                            <span className="contrib-value">
                              ₹{Math.round(contribution).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {cars.length === 0 && (
                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                      <div className="empty-icon">🚗</div>
                      <h3>No car models available</h3>
                      <p>Ask your admin to add car models.</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!submitted && cars.length > 0 && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <button className="btn btn-ghost" id="save-draft-btn" onClick={handleSave} disabled={saving}>
                      {saving ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</> : '💾 Save Draft'}
                    </button>
                    <button
                      className="btn btn-emerald btn-lg"
                      id="submit-sales-btn"
                      onClick={handleSubmit}
                      disabled={submitting || totalCars === 0}
                    >
                      {submitting ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Submitting…</> : '✓ Submit Final Sales'}
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Live Incentive Panel */}
              <div style={{ position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
                <div className="card" style={{ overflow: 'visible' }}>

                  {/* Payout Hero */}
                  <div className="payout-hero">
                    <div className="payout-label">Monthly Incentive</div>
                    <div className={`payout-amount ${payoutHighlight ? 'highlight' : ''}`}>
                      ₹{animatedPayout.toLocaleString('en-IN')}
                    </div>
                    <div className="payout-period">{MONTHS[month]} {year}</div>
                  </div>

                  {/* Tier Meter */}
                  {slabs.length > 0 && <TierMeter slabs={slabs} totalCars={totalCars} calcType={calcType} />}

                  {/* Breakdown */}
                  <div style={{ padding: '0 0 8px' }}>
                    <div style={{ padding: '16px 24px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                      Tier Breakdown
                    </div>
                    {calc.breakdown.length === 0 ? (
                      <div style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: 13 }}>
                        Start logging sales to see your tier breakdown.
                      </div>
                    ) : (
                      calc.breakdown.map((b, i) => {
                        const colors = ['#cd7f32', '#94a3b8', '#f59e0b', '#06b6d4', '#10b981', '#7c3aed'];
                        const c = colors[i % colors.length];
                        return (
                          <div key={i} className={`breakdown-row ${!b.isActive ? 'inactive' : ''}`}>
                            <div className="slab-row-label">
                              <div className="dot" style={{ '--tier-c': c, background: c, boxShadow: b.isActive ? `0 0 6px ${c}` : 'none' }} />
                              <span>
                                <span style={{ fontWeight: 700 }}>{b.label}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{b.range} cars</span>
                              </span>
                            </div>
                            <div className="slab-row-rate">₹{(b.rate || 0).toLocaleString()}/car</div>
                            <div className="slab-row-amount" style={{ color: b.isActive ? 'var(--text-primary)' : 'var(--text-disabled)' }}>
                              {b.isActive && b.amount > 0 ? `₹${b.amount.toLocaleString('en-IN')}` : '—'}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Summary Row */}
                  <div className="calc-summary">
                    <div className="calc-summary-grid">
                      <div>
                        <div className="calc-stat-label">Total Cars</div>
                        <div className="calc-stat-value">{totalCars}</div>
                      </div>
                      <div>
                        <div className="calc-stat-label">Rate / Car</div>
                        <div className="calc-stat-value highlight">
                          {totalCars > 0 ? `₹${(calc.appliedRate || 0).toLocaleString()}` : '—'}
                        </div>
                      </div>
                    </div>

                    {calc.tierHit && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Tier</span>
                        <span className={`tier-badge ${calc.tierHit?.toLowerCase().includes('gold') ? 'tier-gold' : calc.tierHit?.toLowerCase().includes('silver') ? 'tier-silver' : calc.tierHit?.toLowerCase().includes('bronze') ? 'tier-bronze' : 'tier-none'}`}>
                          🏅 {calc.tierHit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── HISTORY TAB ─── */}
        {tab === 'history' && (
          <>
            <div className="page-header">
              <h1>My Sales History</h1>
              <p>View your past monthly performance and incentives</p>
            </div>

            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🕒</div>
                <h3>No history yet</h3>
                <p>Submit your first month's sales to see them here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {history.map((h) => (
                  <div key={h._id} className="card" style={{ overflow: 'visible' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, padding: '20px 24px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>
                            {MONTHS[h.month]} {h.year}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                            {h.totalCars} cars sold · {h.status === 'submitted' ? '✅ Submitted' : '⏳ Draft'}
                          </div>
                        </div>
                        {h.tierHit && (
                          <span className={`tier-badge ${h.tierHit?.toLowerCase().includes('gold') ? 'tier-gold' : h.tierHit?.toLowerCase().includes('silver') ? 'tier-silver' : h.tierHit?.toLowerCase().includes('bronze') ? 'tier-bronze' : ''}`}>
                            🏅 {h.tierHit}
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'JetBrains Mono', color: 'var(--emerald)' }}>
                          ₹{(h.totalIncentive || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Incentive</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
