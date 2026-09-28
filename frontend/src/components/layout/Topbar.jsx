import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Menu,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './layout.css';

export default function Topbar({ onToggleSidebar, sidebarOpen }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Determine page title based on path
  const path = location.pathname;
  let pageTitle = 'Dashboard';
  if (path.startsWith('/cases/new')) pageTitle = 'New Case';
  else if (path.startsWith('/cases') || path === '/ledger') pageTitle = 'Cases Ledger';
  else if (path.startsWith('/investigations') || path.includes('/overview')) pageTitle = 'Investigation Workspace';
  else if (path.startsWith('/graph')) pageTitle = 'Transaction Graph';
  else if (path.startsWith('/risk')) pageTitle = 'Risk Analysis';
  else if (path.startsWith('/attribution') || path.startsWith('/vasp')) pageTitle = 'Attribution';
  else if (path.startsWith('/geospatial')) pageTitle = 'Geospatial Radar';
  else if (path.startsWith('/evidence')) pageTitle = 'Evidence Locker';
  else if (path.startsWith('/reports') || path.startsWith('/report')) pageTitle = 'Forensic Reports';
  else if (path.startsWith('/disclosure')) pageTitle = 'Disclosure / SAHYOG';
  else if (path.startsWith('/audit')) pageTitle = 'Audit Ledger';
  else if (path.startsWith('/entity')) pageTitle = 'Entity Dossier';
  else if (path.startsWith('/settings')) pageTitle = 'Settings & Administration';

  function handleSearch(e) {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/cases?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  }

  const userName = user?.name || 'T-JD';
  const shortBadge = user?.badge_id?.replace(/[^a-zA-Z0-9]/g, '') || 'T-JD';

  return (
    <header className="tv-header">
      <div className="tv-header-left">
        <button 
          className="tv-mobile-menu-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu size={18} />
        </button>
        <h1 className="tv-page-title">{pageTitle}</h1>
      </div>

      <div className="tv-header-right">
        {/* Search input from screenshot */}
        <form onSubmit={handleSearch} className="tv-search-form">
          <Search size={14} className="tv-search-icon" />
          <input
            type="text"
            className="tv-header-search-input"
            placeholder="Search system..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        {/* Notifications */}
        <button className="tv-header-icon-btn" title="System Notifications" aria-label="Notifications">
          <Bell size={15} />
        </button>

        {/* Theme Toggle */}
        <button 
          className="tv-header-icon-btn tv-theme-toggle" 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* User Pill Badge matching reference screenshot: Circle T, T-JD Investigator */}
        <div className="tv-user-pill-badge" title={`Signed in as ${userName} (${user?.role || 'Lead Investigator'})`}>
          <div className="tv-avatar-circle">T</div>
          <div className="tv-user-pill-text">
            <span className="tv-user-pill-name">{shortBadge.slice(0, 5) || 'T-JD'}</span>
            <span className="tv-user-pill-role">Investigator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
