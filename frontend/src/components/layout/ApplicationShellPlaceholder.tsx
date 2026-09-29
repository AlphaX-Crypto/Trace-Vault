import React, { useState } from 'react';

interface ApplicationShellPlaceholderProps {
  onReturnToHero: () => void;
}

export const ApplicationShellPlaceholder: React.FC<ApplicationShellPlaceholderProps> = ({
  onReturnToHero
}) => {
  const [activeTab, setActiveTab] = useState('CASES');

  return (
    <div className="app-shell-root" role="main" aria-label="TRACEVAULT Investigation Workstation">
      {/* Top Institutional Header */}
      <header className="shell-header">
        <div className="shell-header-left">
          <div className="shell-emblem" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#24c7c9" strokeWidth="1.5" />
              <path d="M12 7l-5 3v4l5 3 5-3v-4l-5-3z" stroke="rgba(255,255,255,0.8)" strokeWidth="1" />
            </svg>
          </div>
          <span className="shell-title font-mono font-semibold text-white tracking-wider">
            TRACEVAULT
          </span>
          <span className="shell-divider">/</span>
          <span className="shell-subtitle font-mono text-xs text-[#94a3b8]">
            FORENSIC WORKSTATION
          </span>
        </div>

        {/* Global Workstation Navigation */}
        <nav className="shell-nav" aria-label="Investigation Shell Tabs">
          {['CASES', 'INVESTIGATION', 'GRAPH', 'EVIDENCE', 'AUDIT'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shell-nav-item font-mono text-xs tracking-wider uppercase ${
                  isActive ? 'active' : ''
                }`}
              >
                {tab}
                {isActive && <div className="nav-active-bar" />}
              </button>
            );
          })}
        </nav>

        {/* Right Officer Status & Hero Round-Trip */}
        <div className="shell-header-right font-mono text-xs">
          <div className="officer-badge">
            <span className="status-dot-green" aria-hidden="true" />
            <span className="text-[#94a3b8]">OFFICER:</span>
            <span className="text-white font-medium">SAMARTH [LEA-DELHI]</span>
          </div>
          <button
            type="button"
            onClick={onReturnToHero}
            className="shell-exit-btn"
            aria-label="Return to Cinematic Hero"
          >
            HERO OVERVIEW ↺
          </button>
        </div>
      </header>

      {/* Sub-header Breadcrumb & Operational State */}
      <div className="shell-subheader font-mono text-xs">
        <div className="subheader-left">
          <span className="text-[#64748b]">CONTEXT:</span>
          <span className="text-white">SYSTEM_ENTRY // SESSION_ESTABLISHED</span>
          <span className="badge-tag">SEC 65B ENABLED</span>
        </div>
        <div className="subheader-right text-[#64748b]">
          <span>NETWORK: BHARAT-FORENSIC-NET</span>
          <span>LATENCY: 12ms</span>
        </div>
      </div>

      {/* Main Workstation Canvas */}
      <main className="shell-main-canvas">
        <div className="workspace-hero-transition-card">
          <div className="card-header-bar">
            <span className="card-label font-mono text-xs text-[#24c7c9]">
              ● SYSTEM INITIALIZATION COMPLETE
            </span>
            <span className="card-id font-mono text-xs text-[#64748b]">
              KERNEL NX-3.7.1
            </span>
          </div>

          <div className="card-body">
            <h2 className="workspace-heading">
              Investigation Console Ready
            </h2>
            <p className="workspace-description">
              Application transition successfully established from the cinematic entry. 
              The technical shell, color tokens, typography, and motion foundation are active.
            </p>

            <div className="telemetry-grid font-mono text-xs">
              <div className="telemetry-tile">
                <span className="tile-title">DATA PIPELINE</span>
                <span className="tile-value text-white">CONNECTED</span>
                <span className="tile-sub text-[#64748b]">POSTGRESQL // PORT 5432</span>
              </div>
              <div className="telemetry-tile">
                <span className="tile-title">GRAPH ENGINE</span>
                <span className="tile-value text-[#24c7c9]">ACTIVE</span>
                <span className="tile-sub text-[#64748b]">FASTAPI NETWORKX // PORT 8000</span>
              </div>
              <div className="telemetry-tile">
                <span className="tile-title">BACKEND API</span>
                <span className="tile-value text-[#10b981]">OPERATIONAL</span>
                <span className="tile-sub text-[#64748b]">NODE.JS EXPRESS // PORT 5000</span>
              </div>
              <div className="telemetry-tile">
                <span className="tile-title">NEXT PHASE</span>
                <span className="tile-value text-[#f59e0b]">PHASE C READY</span>
                <span className="tile-sub text-[#64748b]">CASE REGISTRY & AUTH</span>
              </div>
            </div>
          </div>

          <div className="card-footer-bar">
            <div className="footer-left font-mono text-xs text-[#64748b]">
              <span>ID: TV-SYS-INIT-2026</span>
            </div>
            <div className="footer-right">
              <button
                type="button"
                onClick={onReturnToHero}
                className="return-btn font-mono text-xs"
              >
                RE-RUN HERO SEQUENCE ↻
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
          color: var(--tv-text-primary);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: shellFadeIn 0.65s var(--tv-ease-smooth) forwards;
        }

        @keyframes shellFadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .shell-header {
          height: 56px;
          background: var(--tv-panel);
          border-bottom: 1px solid var(--tv-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 30;
        }

        .shell-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .shell-emblem {
          display: flex;
          align-items: center;
        }

        .shell-divider {
          color: var(--tv-border);
        }

        .shell-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .shell-nav-item {
          background: transparent;
          border: none;
          color: var(--tv-text-muted);
          padding: 18px 14px;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }

        .shell-nav-item:hover {
          color: var(--tv-text-primary);
        }

        .shell-nav-item.active {
          color: var(--tv-text-primary);
        }

        .nav-active-bar {
          position: absolute;
          bottom: 0;
          left: 14px;
          right: 14px;
          height: 2px;
          background: var(--tv-cyan);
          box-shadow: 0 0 8px var(--tv-cyan);
        }

        .shell-header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .officer-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--tv-card);
          padding: 6px 12px;
          border: 1px solid var(--tv-border);
          border-radius: 4px;
        }

        .status-dot-green {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--tv-risk-low);
          box-shadow: 0 0 6px var(--tv-risk-low);
        }

        .shell-exit-btn {
          background: transparent;
          border: 1px solid var(--tv-border);
          color: var(--tv-text-secondary);
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .shell-exit-btn:hover {
          border-color: var(--tv-cyan);
          color: var(--tv-cyan);
        }

        .shell-subheader {
          height: 38px;
          background: #080f15;
          border-bottom: 1px solid var(--tv-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }

        .subheader-left, .subheader-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .badge-tag {
          background: rgba(36, 199, 201, 0.1);
          color: var(--tv-cyan);
          padding: 2px 6px;
          border: 1px solid rgba(36, 199, 201, 0.3);
          border-radius: 3px;
          font-size: 10px;
        }

        .shell-main-canvas {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          position: relative;
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(36, 199, 201, 0.03) 0%, transparent 60%);
        }

        .workspace-hero-transition-card {
          width: 100%;
          max-width: 860px;
          background: var(--tv-card);
          border: 1px solid var(--tv-border);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
        }

        .card-header-bar {
          padding: 14px 20px;
          background: #0a1219;
          border-bottom: 1px solid var(--tv-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-body {
          padding: 32px;
        }

        .workspace-heading {
          font-size: 26px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .workspace-description {
          font-size: 14px;
          color: var(--tv-text-secondary);
          line-height: 1.6;
          max-width: 640px;
          margin-bottom: 32px;
        }

        .telemetry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .telemetry-tile {
          background: #091017;
          border: 1px solid var(--tv-border);
          border-radius: 6px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .tile-title {
          color: var(--tv-text-muted);
          font-size: 10px;
          letter-spacing: 0.1em;
        }

        .tile-value {
          font-size: 14px;
          font-weight: 600;
        }

        .tile-sub {
          font-size: 10px;
        }

        .card-footer-bar {
          padding: 16px 24px;
          background: #0a1219;
          border-top: 1px solid var(--tv-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .return-btn {
          background: #142230;
          border: 1px solid var(--tv-border);
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .return-btn:hover {
          background: #1a2c3e;
          border-color: var(--tv-cyan);
        }
      `}</style>
    </div>
  );
};
