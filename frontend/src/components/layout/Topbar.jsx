import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  ShieldAlert, 
  Plus, 
  Compass, 
  Activity, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './layout.css';

const TITLES = {
  '/dashboard': 'Live Intelligence & Incident Operations',
  '/cases': 'Case Registry & Intake Ledger',
  '/cases/new': 'Initiate Multi-Rail Case',
  '/cases/analysis': 'Analysis Engine Progress',
  '/analysis-progress': 'Analysis Engine Progress',
  '/investigations': 'Unified Investigation Catalog',
  '/reports': 'Institutional Reports Dossier'
};

export default function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  let title = TITLES[pathname];
  if (!title) {
    if (pathname.includes('/graph')) title = 'Multi-Rail Transaction Graph';
    else if (pathname.includes('/overview')) title = 'Investigation Overview';
    else if (pathname.includes('/attribution')) title = 'VASP Attribution & Risk';
    else if (pathname.includes('/evidence')) title = 'Structured Evidence Locker';
    else if (pathname.includes('/report') || pathname.includes('/disclosure')) title = 'Case Report & Disclosure';
    else if (pathname.includes('/investigations/')) title = 'Investigator Workspace Console';
    else title = 'Financial Intelligence Platform';
  }

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'TV';

  function handleSearch(e) {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const term = searchTerm.trim();
      // If Ethereum address
      if (term.startsWith('0x') || term.length === 42) {
        navigate(`/cases/new?wallet=${encodeURIComponent(term)}`);
      } else if (term.includes('@')) {
        navigate(`/investigations/INV-002`);
      } else if (term.toUpperCase().startsWith('INV-')) {
        navigate(`/investigations/${encodeURIComponent(term.toUpperCase())}`);
      } else {
        navigate(`/cases?search=${encodeURIComponent(term)}`);
      }
    }
  }

  return (
    <header className="topbar">
      {/* Left: Operations Center Header */}
      <div className="topbar-left">
        <span className="topbar-status-icon">
          <Activity size={16} />
        </span>
        <div className="topbar-title-block">
          <div className="topbar-kicker">TRACEVAULT FINANCIAL INTELLIGENCE</div>
          <strong className="topbar-title">{title}</strong>
        </div>
      </div>

      {/* Center: Search & Quick Scope */}
      <div className="topbar-center">
        <div className="topbar-search-box">
          <Search size={14} className="topbar-search-icon" />
          <input 
            type="text"
            placeholder="Search address, UPI VPA, hash, or case ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            className="topbar-search-input"
          />
        </div>
      </div>

      {/* Right: Actions, Notifications & Avatar */}
      <div className="topbar-actions">
        <button 
          className="topbar-action-btn"
          onClick={() => navigate('/investigations')}
          title="Open Investigation Harness"
        >
          <Compass size={14} />
          <span>Catalog</span>
        </button>

        <button 
          className="topbar-action-btn primary"
          onClick={() => navigate('/cases/new')}
          title="Open New Case Dossier"
        >
          <Plus size={14} />
          <span>New Case</span>
        </button>

        <button className="icon-button notification" aria-label="Notifications" title="System alerts">
          <Bell size={16} />
          <span />
        </button>

        <div 
          className="topbar-avatar" 
          title={`${user?.username || 'Investigator'} (${user?.role || 'INVESTIGATOR'})`}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
