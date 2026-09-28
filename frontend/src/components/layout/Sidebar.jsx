import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  BriefcaseBusiness, 
  Compass, 
  Layers, 
  Share2, 
  ShieldAlert, 
  Building2, 
  MapPin, 
  FileText, 
  FileBarChart, 
  ShieldCheck, 
  Terminal, 
  LogOut, 
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './layout.css';
import './sidebarAuth.css';

const NAV_GROUPS = [
  {
    group: 'WORKSPACE',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
      { to: '/cases', label: 'Cases', icon: BriefcaseBusiness },
      { to: '/investigations', label: 'Investigations', icon: Compass }
    ]
  },
  {
    group: 'INTELLIGENCE',
    items: [
      { to: '/investigations/INV-004', label: 'Unified Console', icon: Layers },
      { to: '/cases/CASE-2026-001/graph', label: 'Transaction Graph', icon: Share2 },
      { to: '/investigations/INV-004/risk', label: 'Risk & Fraud', icon: ShieldAlert },
      { to: '/case/CASE-2026-001/attribution', label: 'VASP Attribution', icon: Building2 },
      { to: '/investigations/INV-005/intelligence', label: 'Geospatial Radar', icon: MapPin }
    ]
  },
  {
    group: 'EVIDENCE & OUTPUT',
    items: [
      { to: '/investigations/INV-004/evidence', label: 'Evidence Locker', icon: FileText },
      { to: '/reports', label: 'Reports Dossier', icon: FileBarChart },
      { to: '/cases/CASE-2026-001/disclosure', label: 'Disclosure / SAHYOG', icon: Send }
    ]
  },
  {
    group: 'GOVERNANCE',
    items: [
      { to: '/investigations/INV-004/audit', label: 'Audit / Activity', icon: Terminal }
    ]
  }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleSignOut() {
    await logout();
    navigate('/login', { replace: true });
  }

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'TV';
  const displayName = user?.username ? user.username.toUpperCase() : 'INVESTIGATOR';
  const roleDisplay = user?.role || 'INVESTIGATOR';

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand">
        <span className="brand-mark">
          <ShieldCheck />
        </span>
        <span className="brand-copy">
          <strong>TRACEVAULT</strong>
          <small>FINANCIAL INTELLIGENCE</small>
        </span>
      </div>

      {/* Nav Groups */}
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {NAV_GROUPS.map(({ group, items }) => (
          <div key={group} className="nav-group-section">
            <p className="nav-label">{group}</p>
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink 
                key={to} 
                to={to} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Operational Engine Status */}
      <div className="sidebar-context">
        <span className="context-pulse" />
        <div>
          <span>Multi-Rail Indexer</span>
          <small>Operational</small>
        </div>
      </div>

      {/* User Session Footer */}
      <div className="sidebar-user">
        <div className="avatar">{initials}</div>
        <div>
          <strong>{displayName}</strong>
          <small>{roleDisplay} · LE ID #{user?.id ? `832${user.id}` : '8327A'}</small>
        </div>
        <button
          className="sidebar-signout"
          type="button"
          aria-label="Sign out"
          title="Sign out"
          onClick={handleSignOut}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
