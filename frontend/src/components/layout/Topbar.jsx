import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  Sun, 
  Moon, 
  UserCheck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './layout.css';

export default function Topbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleSearch(e) {
    if (e.key === 'Enter' && query.trim()) {
      navigate('/cases');
    }
  }

  return (
    <header className="gov-topbar">
      {/* Brand & Emblem */}
      <div className="topbar-left">
        <div className="portal-brand" onClick={() => navigate('/dashboard')} role="button" tabIndex={0}>
          <div className="brand-emblem">
            <ShieldCheck size={20} />
          </div>
          <div className="brand-info">
            <span className="brand-name">TRACEVAULT</span>
            <span className="brand-tagline">Financial Investigation & Attribution Platform</span>
          </div>
        </div>
      </div>

      {/* Center Search */}
      <div className="topbar-center">
        <div className="portal-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search Case ID, Wallet Address, or VPA..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="topbar-right">
        {/* Real Theme Switcher with explicit label */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/cases/new')}
        >
          <Plus size={13} />
          <span>New Case</span>
        </button>

        <div className="user-badge">
          <div className="user-avatar-initials">TJ</div>
          <div className="user-meta">
            <span className="user-title">{user?.name || 'T. JD (Sr. Investigator)'}</span>
            <span className="user-dept">Central Cyber Crime Cell</span>
          </div>
        </div>
      </div>
    </header>
  );
}
