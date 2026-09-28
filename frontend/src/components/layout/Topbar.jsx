import React from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Sun, 
  Moon, 
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './layout.css';

export default function Topbar({ onToggleSidebar, sidebarOpen }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/graph', label: 'Graph Matrix' },
    { to: '/risk', label: 'Risk Intel' },
    { to: '/geospatial', label: 'Geospatial Radar' },
    { to: '/evidence', label: 'Evidence Locker' },
    { to: '/cases', label: 'Case Registry' }
  ];

  return (
    <header className="gov-topbar">
      {/* Brand & Emblem */}
      <div className="topbar-left">
        <button 
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Close Tools Menu" : "All Tools & Records"}
          aria-label="Toggle forensic menu"
        >
          {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
          <span className="toggle-label">SUITE</span>
        </button>

        <div className="portal-brand" onClick={() => navigate('/dashboard')} role="button" tabIndex={0}>
          <div className="brand-emblem">
            <ShieldCheck size={18} />
          </div>
          <div className="brand-info">
            <span className="brand-name">TRACEVAULT</span>
            <span className="brand-tagline">V3.4 FORENSIC</span>
          </div>
        </div>
      </div>

      {/* Center HUD Navigation Bracket (Matching Reference Video!) */}
      <nav className="topbar-hud-nav" aria-label="HUD Core Navigation">
        <div className="hud-nav-bracket">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `hud-nav-link ${isActive ? 'active' : ''}`}
            >
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Right Controls */}
      <div className="topbar-right">
        {/* Real Theme Switcher with explicit label */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          <span>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
        </button>

        <button
          className="btn-hud-action"
          onClick={() => navigate('/cases/new')}
          title="Open New Investigation Case"
        >
          <span>NEW CASE</span>
          <Plus size={13} />
        </button>

        <div 
          className="user-badge" 
          onClick={() => { logout(); navigate('/login'); }} 
          title="Lead Investigator (Click to Sign Out)"
          role="button"
          tabIndex={0}
        >
          <div className="user-avatar-initials">TJ</div>
          <div className="user-meta">
            <span className="user-title">{user?.name || 'T. JD (Lead Inv.)'}</span>
            <span className="user-dept">FIU / CYBER CELL</span>
          </div>
        </div>
      </div>
    </header>
  );
}
