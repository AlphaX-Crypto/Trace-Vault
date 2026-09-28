import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  GitFork,
  ShieldAlert,
  Building2,
  MapPin,
  Briefcase,
  FileLock2,
  FileSpreadsheet,
  FileText,
  Scale,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './layout.css';

const SECTIONS = [
  {
    title: 'Casework',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/cases', label: 'Case Registry', icon: FolderOpen },
      { to: '/cases/new', label: 'Open New Case', icon: PlusCircle }
    ]
  },
  {
    title: 'Intelligence & Tracing',
    links: [
      { to: '/graph', label: 'Hop Trace & Ledger', icon: GitFork },
      { to: '/risk', label: 'Risk Intelligence', icon: ShieldAlert },
      { to: '/vasp', label: 'VASP Attribution', icon: Building2 },
      { to: '/geospatial', label: 'Geospatial & IP Logs', icon: MapPin },
      { to: '/investigations', label: 'Investigation Workspace', icon: Briefcase }
    ]
  },
  {
    title: 'Evidentiary Records',
    links: [
      { to: '/evidence', label: 'Evidence Locker', icon: FileLock2 },
      { to: '/ledger', label: 'Audit Ledger (Sec 65B)', icon: FileSpreadsheet },
      { to: '/reports', label: 'Reports & Briefings', icon: FileText },
      { to: '/disclosure', label: 'Disclosure / SAHYOG', icon: Scale }
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
    <aside className="gov-sidebar" aria-label="Portal Navigation">
      <div className="sidebar-nav-group">
        {SECTIONS.map((sec) => (
          <div key={sec.title}>
            <div className="sidebar-group-title">{sec.title}</div>
            <div className="sidebar-links-list">
              {sec.links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-bottom-panel">
        <div className="system-status-indicator">
          <span className="status-dot" />
          <span>System Status: Online & Secured</span>
        </div>
        <button className="btn-signout" onClick={handleSignOut} title="Sign out of system">
          <LogOut size={12} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
