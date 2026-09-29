import React, { useState, useEffect } from 'react';

interface ApplicationShellPlaceholderProps {
  onReturnToHero: () => void;
}

export const ApplicationShellPlaceholder: React.FC<ApplicationShellPlaceholderProps> = ({
  onReturnToHero
}) => {
  const [activeTab, setActiveTab] = useState('CASES');
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 60);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`app-shell-root ${entered ? 'shell-entered' : 'shell-pre-enter'}`}
      role="main"
      aria-label="TRACEVAULT Investigation Workstation"
    >
      {/* Top Institutional Header */}
      <header className="shell-header">
        <div className="shell-header-left">
          <div className="shell-emblem" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#24c7c9" strokeWidth="1.75" />
              <path d="M12 7l-5 3v4l5 3 5-3v-4l-5-3z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />
            </svg>
          </div>
          <div className="shell-brand-group">
            <span className="shell-title">TRACEVAULT</span>
            <span className="shell-subtitle">DIRECTORATE OF FINANCIAL FORENSIC INTELLIGENCE</span>
          </div>
        </div>

        {/* Global Workstation Navigation */}
        <nav className="shell-nav" aria-label="Investigation Shell Tabs">
          {['CASES', 'INVESTIGATION', 'TRANSACTIONS', 'GRAPH INTELLIGENCE', 'EVIDENCE VAULT', 'COMPLIANCE'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shell-nav-item ${isActive ? 'active' : ''}`}
              >
                {tab}
                {isActive && <div className="nav-active-bar" />}
              </button>
            );
          })}
        </nav>

        {/* Right Officer Status & Hero Round-Trip */}
        <div className="shell-header-right">
          <div className="officer-badge">
            <span className="status-dot-green" aria-hidden="true" />
            <span className="officer-label">AUTHORIZED OFFICER:</span>
            <span className="officer-name">INSP. SAMARTH [LEA-DELHI]</span>
          </div>
          <button
            type="button"
            onClick={onReturnToHero}
            className="shell-exit-btn"
            aria-label="Return to Cinematic Hero"
          >
            HERO VIEW ↺
          </button>
        </div>
      </header>

      {/* Sub-header Context & Statutory Standards Bar */}
      <div className="shell-subheader">
        <div className="subheader-left">
          <span className="statute-tag">NCFL REPOSITORY</span>
          <span className="subheader-text">CENTRAL FINANCIAL INTELLIGENCE PLATFORM</span>
          <span className="statute-badge">SECTION 91 CRPC / BNS 94</span>
          <span className="statute-badge">SEC 65B EVIDENCE PRESERVED</span>
        </div>
        <div className="subheader-right">
          <span className="system-status-indicator">
            <span className="pulse-dot" /> SYSTEM OPERATIONAL
          </span>
          <span className="node-id">PORTAL NODE: DL-CENTRAL-01</span>
        </div>
      </div>

      {/* Main Workstation Canvas */}
      <main className="shell-main-canvas">
        <div className="workspace-card">
          <div className="card-header-bar">
            <div className="header-badge-group">
              <span className="status-indicator-dot" />
              <span className="card-label">INSTITUTIONAL INVESTIGATION WORKSTATION</span>
            </div>
            <span className="protocol-reference">SEC-65B-HASH-VERIFIED</span>
          </div>

          <div className="card-body">
            <h2 className="workspace-heading">
              Investigation Environment Ready
            </h2>
            <p className="workspace-description">
              Secure operational workstation initialized for multi-chain financial tracing, suspect entity attribution, 
              transaction flow analysis, and court-admissible forensic reporting.
            </p>

            {/* High Visibility Formal Operational Metrics */}
            <div className="telemetry-grid">
              <div className="telemetry-tile">
                <span className="tile-title">ACTIVE MATTERS</span>
                <span className="tile-value text-white">14 Cases</span>
                <span className="tile-sub">Assigned for Investigation</span>
              </div>
              <div className="telemetry-tile">
                <span className="tile-title">TRACE TARGET VOLUME</span>
                <span className="tile-value text-cyan">₹48.24 Cr</span>
                <span className="tile-sub">Flagged Suspicious Outflow</span>
              </div>
              <div className="telemetry-tile">
                <span className="tile-title">IDENTIFIED ENTITIES</span>
                <span className="tile-value text-green">1,280 Nodes</span>
                <span className="tile-sub">Exchanges, Mixers, Wallets</span>
              </div>
              <div className="telemetry-tile">
                <span className="tile-title">STATUTORY NOTICES</span>
                <span className="tile-value text-amber">28 Issued</span>
                <span className="tile-sub">Section 91 Intermediary Directives</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="card-footer-bar">
            <div className="footer-left">
              <span className="footer-meta">AUTHORITY: CENTRAL LAW ENFORCEMENT & REGULATORY AGENCIES</span>
            </div>
            <div className="footer-right">
              <button
                type="button"
                onClick={onReturnToHero}
                className="secondary-btn"
              >
                Re-play Hero Overview ↺
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .app-shell-root {
          width: 100vw;
          height: 100vh;
          background: var(--tv-canvas);
          color: #f1f5f9;
          font-family: var(--tv-font-sans);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.85s var(--tv-ease-smooth), opacity 0.85s var(--tv-ease-smooth), filter 0.85s var(--tv-ease-smooth);
        }

        .shell-pre-enter {
          transform: translateY(32px);
          opacity: 0;
          filter: blur(16px);
        }

        .shell-entered {
          transform: translateY(0);
          opacity: 1;
          filter: blur(0px);
        }

        /* Top Header */
        .shell-header {
          height: 60px;
          background: #080f15;
          border-bottom: 1px solid var(--tv-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          z-index: 30;
        }

        .shell-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .shell-brand-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .shell-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.1em;
          line-height: 1.1;
        }

        .shell-subtitle {
          font-size: 10px;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0.08em;
        }

        .shell-nav {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .shell-nav-item {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-family: var(--tv-font-sans);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.05em;
          padding: 20px 14px;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }

        .shell-nav-item:hover {
          color: #ffffff;
        }

        .shell-nav-item.active {
          color: #ffffff;
          font-weight: 600;
        }

        .nav-active-bar {
          position: absolute;
          bottom: 0;
          left: 14px;
          right: 14px;
          height: 2px;
          background: var(--tv-cyan);
          box-shadow: 0 0 10px var(--tv-cyan);
        }

        .shell-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .officer-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0d1722;
          padding: 6px 14px;
          border: 1px solid var(--tv-border);
          border-radius: 4px;
          font-size: 12px;
        }

        .status-dot-green {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .officer-label {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 500;
        }

        .officer-name {
          color: #ffffff;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .shell-exit-btn {
          background: #0e1822;
          border: 1px solid var(--tv-border);
          color: #cbd5e1;
          font-family: var(--tv-font-sans);
          font-size: 11px;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 4px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .shell-exit-btn:hover {
          border-color: var(--tv-cyan);
          color: var(--tv-cyan);
        }

        /* Subheader */
        .shell-subheader {
          height: 42px;
          background: #060b10;
          border-bottom: 1px solid var(--tv-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          font-size: 11px;
        }

        .subheader-left, .subheader-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .statute-tag {
          color: #24c7c9;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .subheader-text {
          color: #94a3b8;
        }

        .statute-badge {
          background: rgba(36, 199, 201, 0.08);
          color: #cbd5e1;
          padding: 3px 8px;
          border: 1px solid rgba(36, 199, 201, 0.25);
          border-radius: 3px;
          font-size: 10px;
          font-weight: 500;
        }

        .system-status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #10b981;
          font-weight: 600;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }

        .node-id {
          color: #64748b;
        }

        /* Main Workspace Canvas */
        .shell-main-canvas {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(36, 199, 201, 0.04) 0%, transparent 65%);
        }

        .workspace-card {
          width: 100%;
          max-width: 960px;
          background: #0a131b;
          border: 1px solid var(--tv-border);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
        }

        .card-header-bar {
          padding: 16px 24px;
          background: #080f15;
          border-bottom: 1px solid var(--tv-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-badge-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--tv-cyan);
          box-shadow: 0 0 8px var(--tv-cyan);
        }

        .card-label {
          font-size: 11px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: 0.1em;
        }

        .protocol-reference {
          font-size: 11px;
          color: #64748b;
          letter-spacing: 0.05em;
        }

        .card-body {
          padding: 36px;
        }

        .workspace-heading {
          font-size: 26px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }

        .workspace-description {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.6;
          max-width: 720px;
          margin-bottom: 32px;
        }

        .telemetry-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .telemetry-tile {
          background: #060c12;
          border: 1px solid var(--tv-border);
          border-radius: 6px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tile-title {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
        }

        .tile-value {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .text-white { color: #ffffff; }
        .text-cyan { color: #24c7c9; }
        .text-green { color: #10b981; }
        .text-amber { color: #f59e0b; }

        .tile-sub {
          font-size: 11px;
          color: #64748b;
          line-height: 1.3;
        }

        .card-footer-bar {
          padding: 18px 28px;
          background: #080f15;
          border-top: 1px solid var(--tv-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .footer-meta {
          font-size: 11px;
          color: #64748b;
          letter-spacing: 0.05em;
        }

        .secondary-btn {
          background: #111e2a;
          border: 1px solid var(--tv-border);
          color: #ffffff;
          font-family: var(--tv-font-sans);
          font-size: 12px;
          font-weight: 600;
          padding: 9px 18px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .secondary-btn:hover {
          background: #182a3c;
          border-color: var(--tv-cyan);
        }

        @media (max-width: 1024px) {
          .telemetry-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
