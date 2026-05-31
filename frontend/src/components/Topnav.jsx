import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topnav({ activeTab, onTabChange, tabs }) {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/login', { replace: true });
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <nav className="topnav">
      {/* Brand */}
      <div className="nav-brand">
        <div className="nav-logo">⚡</div>
        <span className="nav-brand-name">
          Incent<span>IQ</span>
        </span>
      </div>

      <div className="nav-divider" />

      <span className={`nav-badge ${isAdmin ? 'admin' : 'officer'}`}>
        {isAdmin ? '🛡 Admin' : '🚗 Sales Officer'}
      </span>

      {/* Tabs */}
      {tabs && tabs.length > 1 && (
        <div className="nav-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => onTabChange(t.id)}
              id={`tab-${t.id}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="nav-right">
        {/* Toyota Nippon label */}
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Toyota Nippon
        </span>

        <div className="nav-divider" />

        <div className="nav-user">
          <div className="nav-avatar">{initials}</div>
          <span className="nav-user-name">{user?.name}</span>
          {user?.employeeId && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              {user.employeeId}
            </span>
          )}
        </div>

        <button className="btn-logout" id="logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}
