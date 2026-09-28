import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Briefcase,
  Layers,
  GitFork,
  Clock,
  ShieldAlert,
  Building2,
  MapPin,
  FileLock2,
  FileText,
  Scale,
  FileSpreadsheet,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const SECTIONS = [
  {
    title: 'CASES & REGISTRY',
    links: [
      { to: '/cases', label: 'Cases Registry', icon: FolderOpen },
      { to: '/investigations/active', label: 'Active Investigation', icon: Briefcase }
    ]
  },
  {
    title: 'INVESTIGATION TOOLS',
    links: [
      { to: '/transactions', label: 'Transactions', icon: Layers },
      { to: '/graph', label: 'Graph Matrix', icon: GitFork },
      { to: '/timeline', label: 'Timeline', icon: Clock },
      { to: '/risk', label: 'Risk Analysis', icon: ShieldAlert },
      { to: '/attribution', label: 'VASP Attribution', icon: Building2 },
      { to: '/geospatial', label: 'Geospatial Radar', icon: MapPin },
      { to: '/evidence', label: 'Evidence Locker', icon: FileLock2 },
      { to: '/reports', label: 'Reports', icon: FileText }
    ]
  },
  {
    title: 'SYSTEM & AUDIT',
    links: [
      { to: '/disclosure', label: 'Disclosure / SAHYOG', icon: Scale },
      { to: '/audit', label: 'Audit Activity', icon: FileSpreadsheet },
      { to: '/admin', label: 'Administration', icon: Settings }
    ]
  }
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="tv-compact-sidebar" aria-label="Investigation Navigation">
      <div className="sidebar-nav-scroll">
        {SECTIONS.map((sec) => (
          <div key={sec.title} className="sidebar-nav-group">
            <div className="sidebar-group-title micro-label">{sec.title}</div>
            <div className="sidebar-nav-list">
              {sec.links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={14} className="nav-icon" />
                  <span className="nav-label">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button 
          type="button" 
          className="sidebar-signout-btn" 
          onClick={handleSignOut}
          title="Sign out of investigation session"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
