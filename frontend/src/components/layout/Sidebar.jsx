import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Scale,
  Settings,
  LogOut,
  X,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './layout.css';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    logout();
    navigate('/login', { replace: true });
  }

  const userName = user?.name || 'Jimmy Dane';
  const userRole = user?.badge_id || 'LE ID #8327A';
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'JD';

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className={`tv-sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`tv-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo and Brand */}
        <div className="tv-sidebar-brand" onClick={() => { navigate('/dashboard'); onClose?.(); }}>
          <div className="tv-logo-box">
            <div className="tv-logo-square" />
          </div>
          <div className="tv-brand-text">
            <span className="tv-brand-title">TRACEVAULT</span>
            <span className="tv-brand-subtitle">SECURE LOGISTICS LAYER</span>
          </div>
          {onClose && (
            <button className="tv-sidebar-close-btn" onClick={onClose} aria-label="Close navigation">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Primary Navigation */}
        <nav className="tv-sidebar-nav" aria-label="Primary Platform Navigation">
          <div className="tv-nav-section-title">PLATFORM</div>
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className={({ isActive }) => `tv-nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/cases"
            onClick={onClose}
            className={({ isActive }) => `tv-nav-item ${isActive ? 'active' : ''}`}
          >
            <FolderOpen size={15} />
            <span>Cases</span>
          </NavLink>

          <NavLink
            to="/reports"
            onClick={onClose}
            className={({ isActive }) => `tv-nav-item ${isActive ? 'active' : ''}`}
          >
            <FileText size={15} />
            <span>Reports</span>
          </NavLink>

          <div className="tv-nav-section-title" style={{ marginTop: '20px' }}>SYSTEM & LEGAL</div>
          <NavLink
            to="/disclosure"
            onClick={onClose}
            className={({ isActive }) => `tv-nav-item ${isActive ? 'active' : ''}`}
          >
            <Scale size={15} />
            <span>Disclosure / SAHYOG</span>
          </NavLink>

          <NavLink
            to="/audit"
            onClick={onClose}
            className={({ isActive }) => `tv-nav-item ${isActive ? 'active' : ''}`}
          >
            <FileSpreadsheet size={15} />
            <span>Audit Ledger</span>
          </NavLink>
        </nav>

        {/* Bottom Panel */}
        <div className="tv-sidebar-bottom">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) => `tv-nav-item tv-nav-settings ${isActive ? 'active' : ''}`}
          >
            <Settings size={15} />
            <span>Settings</span>
          </NavLink>

          <div className="tv-user-card">
            <div className="tv-user-avatar">{userInitials}</div>
            <div className="tv-user-info">
              <div className="tv-user-name" title={userName}>{userName}</div>
              <div className="tv-user-role mono">{userRole}</div>
            </div>
            <button 
              className="tv-btn-signout" 
              onClick={handleSignOut} 
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
