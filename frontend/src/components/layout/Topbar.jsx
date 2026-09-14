import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './Topbar.css';

const Topbar = () => {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span className="breadcrumb-item">TRACEVAULT</span>
        {pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <span className="breadcrumb-separator">/</span>
            <span className={`breadcrumb-item ${index === pathParts.length - 1 ? 'active' : ''}`}>
              {part.charAt(0).toUpperCase() + part.slice(1)}
            </span>
          </React.Fragment>
        ))}
      </div>

      <div className="topbar-actions">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Search wallets, TXNs, cases..." />
        </div>
        
        <button className="icon-btn">
          <Bell size={20} />
          <span className="badge-dot"></span>
        </button>
        
        <button className="icon-btn">
          <HelpCircle size={20} />
        </button>
        
        <div className="system-status">
          <div className="status-indicator online"></div>
          <span className="status-text mono">NODE CONNECTED</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
