import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  Sun, 
  Moon, 
  CircleDot,
  UserCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './SystemHeader.css';

export default function SystemHeader({ activeCaseId = 'CASE-2026-001', onReplayIntro }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');

  function handleSearch(e) {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/graph?target=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="tv-system-header">
      {/* Left: Brand & Version */}
      <div className="header-left">
        <div 
          className="brand-block" 
          onClick={() => navigate('/cases')} 
          role="button" 
          tabIndex={0}
        >
          <div className="brand-icon">
            <ShieldCheck size={16} />
          </div>
          <div className="brand-text">
            <span className="brand-name">TRACEVAULT</span>
            <span className="brand-ver technical">v3.4.0</span>
          </div>
        </div>

        {/* Case Context Indicator */}
        <div 
          className="case-context-pill"
          onClick={() => navigate(`/cases/${activeCaseId}`)}
          role="button"
          tabIndex={0}
          title="Active Investigation Context"
        >
          <span className="context-label micro-label">CASE</span>
          <span className="context-id technical">{activeCaseId}</span>
          <span className="context-name">Operation CryptoSweep</span>
          <ChevronRight size={12} className="context-arrow" />
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="header-center">
        <div className="global-search-box">
          <Search size={13} className="search-icon" />
          <input
            type="text"
            className="global-search-input"
            placeholder="Search wallet (0x...), tx hash, UPI ID, or case ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          <kbd className="search-shortcut technical">↵</kbd>
        </div>
      </div>

      {/* Right: Telemetry & Investigator Profile */}
      <div className="header-right">
        {onReplayIntro && (
          <button 
            type="button" 
            className="header-intro-replay-btn" 
            onClick={onReplayIntro} 
            title="Replay cinematic introduction"
          >
            <Sparkles size={12} />
            <span className="micro-label">INTRO</span>
          </button>
        )}

        <div className="system-health-indicator">
          <span className="health-dot" />
          <span className="health-label technical">SYSTEM ONLINE</span>
        </div>

        <button
          type="button"
          className="header-theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          <span className="micro-label">{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
        </button>

        <div className="investigator-profile">
          <div className="profile-avatar technical">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'JD'}
          </div>
          <div className="profile-details">
            <span className="profile-name">{user?.name || 'T. JD (Lead Inv.)'}</span>
            <span className="profile-dept micro-label">CENTRAL CYBER CELL</span>
          </div>
        </div>
      </div>
    </header>
  );
}
