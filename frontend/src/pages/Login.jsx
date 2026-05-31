import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const QUICK = {
  admin:   { email: 'admin@toyotanippon.com',  password: 'admin123',   hint: 'admin@toyotanippon.com / admin123' },
  officer: { email: 'salman@toyotanippon.com', password: 'officer123', hint: 'salman@toyotanippon.com / officer123' },
};

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState('officer');
  const { login }               = useAuth();
  const toast                   = useToast();
  const nav                     = useNavigate();

  const fillQuick = (role) => {
    setSelected(role);
    setEmail(QUICK[role].email);
    setPassword(QUICK[role].password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast('Please enter your credentials', 'error'); return; }
    setLoading(true);
    try {
      const res = await loginApi({ email, password });
      login(res.data.token, res.data.user);
      toast(`Welcome, ${res.data.user.name}!`, 'success');
      nav(res.data.user.role === 'admin' ? '/admin' : '/officer', { replace: true });
    } catch (err) {
      toast(err.response?.data?.error || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Left panel ── */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">⚡</div>
          <span className="login-brand-text">IncentIQ</span>
        </div>

        <div className="login-features" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
          {[
            { icon: '⚡', text: 'Real-time incentive calculation' },
            { icon: '🏅', text: 'Dynamic slab tier configuration' },
            { icon: '🚗', text: 'Vehicle inventory management' },
            { icon: '📊', text: 'Live leaderboard & performance tracking' },
          ].map((f, i) => (
            <div key={i} className="login-feature" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="login-feature-dot">{f.icon}</div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="login-right">
        <h2 className="login-form-title">Sign In</h2>
        <p className="login-form-sub">Access your IncentIQ dashboard</p>

        {/* Role pills */}
        <div className="login-role-pills">
          <div
            id="role-admin"
            className={`role-pill ${selected === 'admin' ? 'active' : ''}`}
            onClick={() => fillQuick('admin')}
          >
            <div className="role-icon">🛡️</div>
            <div className="role-name">Admin</div>
            <div className="role-hint">Configuration Portal</div>
          </div>
          <div
            id="role-officer"
            className={`role-pill ${selected === 'officer' ? 'active' : ''}`}
            onClick={() => fillQuick('officer')}
          >
            <div className="role-icon">🚗</div>
            <div className="role-name">Sales Officer</div>
            <div className="role-hint">Calculator Portal</div>
          </div>
        </div>

        {/* Hint */}
        <div className="quick-login-hint">
          <strong style={{ fontFamily: 'Inter', color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>
            Demo Credentials
          </strong>
          {QUICK[selected].hint}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@toyotanippon.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 6 }}
          >
            {loading
              ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Signing in…</>
              : `Sign In →`}
          </button>
        </form>


      </div>
    </div>
  );
}
