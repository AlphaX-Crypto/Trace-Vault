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
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './layout.css';

const SECTIONS = [
  {
    title: 'Casework & Registry',
    links: [
      { to: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
      { to: '/cases', label: 'Case Registry', icon: FolderOpen },
      { to: '/cases/new', label: 'Open New Case', icon: PlusCircle }
    ]
  },
  {
    title: 'Forensic Intelligence Modules',
    links: [
      { to: '/graph', label: 'Hop Matrix & Peel-Chain', icon: GitFork },
      { to: '/risk', label: 'Risk Intelligence Engine', icon: ShieldAlert },
      { to: '/vasp', label: 'VASP Attribution & KYC', icon: Building2 },
      { to: '/geospatial', label: 'Geospatial Radar & IPDR', icon: MapPin },
      { to: '/investigations', label: 'Investigation Workspace', icon: Briefcase }
    ]
  },
  {
    title: 'Statutory Evidentiary Vault',
    links: [
      { to: '/evidence', label: 'Evidence Locker (Sec 65B)', icon: FileLock2 },
      { to: '/ledger', label: 'Cryptographic Audit Ledger', icon: FileSpreadsheet },
      { to: '/reports', label: 'Forensic Briefings & Reports', icon: FileText },
      { to: '/disclosure', label: 'Disclosure & SAHYOG', icon: Scale }
    ]
  }
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      {/* Backdrop overlay when drawer is open */}
      <div 
        className={`gov-sidebar-backdrop ${isOpen ? 'active' : ''}`} 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <aside className={`gov-sidebar ${isOpen ? 'open' : ''}`} aria-label="Forensic Navigation Drawer">
        <div className="sidebar-drawer-header">
          <div className="drawer-title-group">
            <span className="drawer-title">FORENSIC SUITE</span>
            <span className="drawer-subtitle">ALL REPOSITORIES & TOOLS</span>
          </div>
          <button className="drawer-close-btn" onClick={onClose} title="Close drawer">
            <X size={15} />
          </button>
        </div>

        <div className="sidebar-nav-group">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              <div className="sidebar-group-title">{sec.title}</div>
              <div className="sidebar-links-list">
                {sec.links.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={14} />
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
            <span>FIPS 140-3 HSM // ONLINE</span>
          </div>
          <button className="btn-signout" onClick={handleSignOut} title="Sign out of system">
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
