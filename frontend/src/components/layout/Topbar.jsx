import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  Sun, 
  Moon, 
  Bell 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './layout.css';

export default function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleKeyDown(e) {
    if (e.key === 'Enter' && query.trim()) {
      const q = query.trim();
      if (q.startsWith('0x') || q.includes('@')) {
        navigate(`/graph`);
      } else {
        navigate(`/cases`);
      }
    }
  }

  return (
    <header className="forensic-header">
      {/* Brand & Wordmark */}
      <div className="header-left">
        <div className="header-brand" onClick={() => navigate('/dashboard')}>
          <div className="brand-badge">
            <ShieldCheck size={16} />
          </div>
          <div className="brand-text">
            <span className="brand-title">TRACEVAULT</span>
            <span className="brand-subtitle">FORENSIC & JUDICIAL</span>
          </div>
        </div>

        {/* Docket & Classification Pills from Screenshot */}
        <div className="header-docket-pill">
          <span>DOCKET:</span>
          <strong>TV-2026-041 // OP. CYPHER-RANSOM</strong>
        </div>

        <div className="header-security-badge confidential">
          CONFIDENTIAL // LE ONLY
        </div>

        <div className="header-security-badge certified">
          SEC 65B SEALED CERTIFIED
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="header-center">
        <div className="forensic-search-bar">
          <Search size={13} className="search-icon" />
          <input
            type="text"
            className="mono"
            placeholder="Query Hash, Rail, Wallet..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* Right Controls, Theme Toggle & Investigator Profile */}
      <div className="header-right">
        <button
          className="header-quick-action-btn"
          onClick={() => navigate('/cases/new')}
          title="Open new case"
        >
          <Plus size={12} />
          <span>QUICK ACTION</span>
        </button>

        <button 
          className="header-icon-btn" 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button className="header-icon-btn" title="Notifications">
          <Bell size={14} />
        </button>

        <div className="header-user-dossier">
          <div className="user-avatar-tag">TJ</div>
          <div className="user-details">
            <span className="user-name">T. JD</span>
            <span className="user-role">Sr. LE #8327A</span>
          </div>
        </div>
      </div>
    </header>
  );
}
