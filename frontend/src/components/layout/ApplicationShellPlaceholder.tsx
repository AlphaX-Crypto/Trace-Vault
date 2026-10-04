import React, { useState, useEffect } from 'react';

interface ApplicationShellPlaceholderProps {
  onReturnToHero: () => void;
}

interface CaseItem {
  id: string;
  title: string;
  sourceTarget: string;
  endpoint: string;
  volume: string;
  risk: number;
  status: 'IN PROGRESS' | 'IDENTIFIED' | 'UNDER REVIEW';
  updatedAt: string;
}

const SAMPLE_CASES: CaseItem[] = [
  {
    id: 'CASE-2026-8819',
    title: 'Peel Chain Dispersal & Domestic VPA Routing',
    sourceTarget: '0x71C...4982 (ETH)',
    endpoint: 'vpa98@okhdfcbank',
    volume: '₹1,24,00,000 (42.5 ETH)',
    risk: 98,
    status: 'IN PROGRESS',
    updatedAt: '12m ago'
  },
  {
    id: 'CASE-2026-8794',
    title: 'Tornado Cash Smart Contract Liquidity Extraction',
    sourceTarget: '0xd90...c021 (Contract)',
    endpoint: 'Multiple VPAs (Axis Bank)',
    volume: '₹3,48,50,000 (120 ETH)',
    risk: 96,
    status: 'IDENTIFIED',
    updatedAt: '45m ago'
  },
  {
    id: 'CASE-2026-8651',
    title: 'P2P Merchant Cross-Rail Arbitrage Scam',
    sourceTarget: 'TRC20: TLyG...409v',
    endpoint: 'p2pmerchant@icici',
    volume: '₹2,92,00,000 (350k USDT)',
    risk: 88,
    status: 'IN PROGRESS',
    updatedAt: '2h ago'
  },
  {
    id: 'CASE-2026-8520',
    title: 'Phishing Seed Drainer to Bank Sweep',
    sourceTarget: 'bc1q9...812j (BTC)',
    endpoint: 'cashout_swift@sbi',
    volume: '₹1,56,80,000 (18.2 BTC)',
    risk: 82,
    status: 'UNDER REVIEW',
    updatedAt: '5h ago'
  }
];

export const ApplicationShellPlaceholder: React.FC<ApplicationShellPlaceholderProps> = ({
  onReturnToHero
}) => {
  const [activeTab, setActiveTab] = useState('CASES');
  const [entered, setEntered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 60);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      id="workspace"
      className={`app-shell-root ${entered ? 'shell-entered' : 'shell-pre-enter'}`}
      role="main"
      aria-label="TraceVault Investigation Workstation"
    >
      {/* Top Header */}
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
            <span className="shell-subtitle">INVESTIGATION WORKSTATION</span>
          </div>
        </div>

        {/* Workstation Navigation Tabs */}
        <nav className="shell-nav" aria-label="Investigation Shell Tabs">
          {['CASES', 'CRYPTO TRACER', 'UPI DETECTOR', 'CORRELATION ENGINE', 'EVIDENCE VAULT'].map((tab) => {
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

        {/* User Session & Hero Return */}
        <div className="shell-header-right">
          <div className="analyst-badge">
            <span className="status-dot-green" aria-hidden="true" />
            <span className="analyst-label font-mono">ANALYST:</span>
            <span className="analyst-name font-mono">SAMARTH // WORKSPACE ACTIVE</span>
          </div>
          <button
            type="button"
            onClick={onReturnToHero}
            className="shell-exit-btn"
            aria-label="Return to Overview"
          >
            ← OVERVIEW
          </button>
        </div>
      </header>

      {/* Sub-header Context Bar */}
      <div className="shell-subheader">
        <div className="subheader-left">
          <span className="status-tag">ACTIVE REPOSITORY</span>
          <span className="subheader-text">MULTI-CHAIN TRANSACTION TRACING & DOMESTIC VPA RECONSTRUCTION</span>
        </div>
        <div className="subheader-right">
          <span className="system-status-indicator font-mono">
            <span className="pulse-dot" /> MULTI-CHAIN ENGINE ONLINE
          </span>
        </div>
      </div>

      {/* Main Workstation Canvas */}
      <main className="shell-main-canvas">
        {/* Search & Filter Header */}
        <div className="workspace-search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search suspect wallet address (0x...), transaction hash, or UPI VPA (e.g. user@bank)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input font-mono"
            />
          </div>
          <button
            type="button"
            className="search-action-btn"
            onClick={() => alert(`Initiating multi-rail trace on: ${searchQuery || '0x71C2a8F09403dE4B07B4f114B5C1089b0A124982'}`)}
          >
            Trace Target →
          </button>
        </div>

        {/* Telemetry Tiles */}
        <div className="telemetry-grid">
          <div className="telemetry-tile">
            <span className="tile-title font-mono">ACTIVE MATTERS</span>
            <span className="tile-value text-white font-mono">14 Cases</span>
            <span className="tile-sub">Under active investigation</span>
          </div>
          <div className="telemetry-tile">
            <span className="tile-title font-mono">TOTAL TRACED VOLUME</span>
            <span className="tile-value text-cyan font-mono">₹48.24 Cr</span>
            <span className="tile-sub">Across 18 blockchains</span>
          </div>
          <div className="telemetry-tile">
            <span className="tile-title font-mono">UPI VPAS FLAGGED</span>
            <span className="tile-value text-amber font-mono">68 VPAs</span>
            <span className="tile-sub">Linked to crypto cash-outs</span>
          </div>
          <div className="telemetry-tile">
            <span className="tile-title font-mono">CROSS-RAIL ACCURACY</span>
            <span className="tile-value text-green font-mono">99.2%</span>
            <span className="tile-sub">Temporal volume matching</span>
          </div>
        </div>

        {/* Case Registry Table */}
        <div className="cases-table-container">
          <div className="table-header-bar">
            <span className="table-title">PRIORITY INVESTIGATION MATTERS</span>
            <span className="table-meta font-mono">SHOWING 4 RECENT MATTERS</span>
          </div>

          <table className="cases-table">
            <thead>
              <tr>
                <th>CASE ID</th>
                <th>INVESTIGATION TITLE</th>
                <th>CRYPTO SOURCE</th>
                <th>UPI / BANK DESTINATION</th>
                <th>VOLUME</th>
                <th>RISK</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_CASES.map((item) => (
                <tr key={item.id} className="case-row">
                  <td className="font-mono text-cyan">{item.id}</td>
                  <td className="case-title-cell">{item.title}</td>
                  <td className="font-mono text-amber">{item.sourceTarget}</td>
                  <td className="font-mono text-white">{item.endpoint}</td>
                  <td className="font-mono">{item.volume}</td>
                  <td>
                    <span className={`risk-pill ${item.risk >= 90 ? 'risk-critical' : 'risk-high'}`}>
                      {item.risk}/100
                    </span>
                  </td>
                  <td>
                    <span className="status-badge font-mono">{item.status}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="inspect-btn"
                      onClick={() => alert(`Opening graph investigation for ${item.id}`)}
                    >
                      Inspect Graph →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <style>{`
        .app-shell-root {
          width: 100%;
          min-height: 100vh;
          background: #050a0e;
          color: #f1f5f9;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .shell-pre-enter {
          transform: translateY(24px);
          opacity: 0;
        }

        .shell-entered {
          transform: translateY(0);
          opacity: 1;
        }

        /* Top Header */
        .shell-header {
          height: 64px;
          background: #0a1219;
          border-bottom: 1px solid #16222f;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .shell-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .shell-brand-group {
          display: flex;
          flex-direction: column;
        }

        .shell-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.08em;
        }

        .shell-subtitle {
          font-size: 10px;
          color: #24c7c9;
          letter-spacing: 0.06em;
          font-family: 'JetBrains Mono', monospace;
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
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.04em;
          padding: 22px 14px;
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
          background: #24c7c9;
          box-shadow: 0 0 10px #24c7c9;
        }

        .shell-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .analyst-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0e1822;
          border: 1px solid #16222f;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
        }

        .status-dot-green {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }

        .analyst-label {
          color: #64748b;
          font-weight: 600;
        }

        .analyst-name {
          color: #e2e8f0;
        }

        .shell-exit-btn {
          background: #0e1822;
          border: 1px solid #16222f;
          color: #cbd5e1;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .shell-exit-btn:hover {
          border-color: #24c7c9;
          color: #24c7c9;
        }

        /* Subheader */
        .shell-subheader {
          height: 38px;
          background: #070e14;
          border-bottom: 1px solid #16222f;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          font-size: 11px;
        }

        .subheader-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-tag {
          font-family: 'JetBrains Mono', monospace;
          color: #24c7c9;
          font-weight: 600;
        }

        .subheader-text {
          color: #64748b;
        }

        .system-status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #10b981;
          font-size: 10px;
        }

        .pulse-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10b981;
        }

        /* Main Workspace Canvas */
        .shell-main-canvas {
          max-width: 1560px;
          width: 100%;
          margin: 0 auto;
          padding: 32px 40px 64px 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* Search Bar */
        .workspace-search-bar {
          display: flex;
          gap: 12px;
          background: #0a1219;
          border: 1px solid #16222f;
          padding: 12px 16px;
          border-radius: 8px;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .search-icon {
          font-size: 14px;
        }

        .search-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 13px;
        }

        .search-input::placeholder {
          color: #64748b;
        }

        .search-action-btn {
          background: #24c7c9;
          color: #050a0e;
          font-size: 13px;
          font-weight: 600;
          border: none;
          border-radius: 4px;
          padding: 0 20px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .search-action-btn:hover {
          background: #3ee8eb;
        }

        /* Telemetry Grid */
        .telemetry-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 900px) {
          .telemetry-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .telemetry-tile {
          background: #0a1219;
          border: 1px solid #16222f;
          border-radius: 8px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .tile-title {
          font-size: 10px;
          color: #64748b;
          letter-spacing: 0.06em;
        }

        .tile-value {
          font-size: 22px;
          font-weight: 700;
        }

        .tile-sub {
          font-size: 12px;
          color: #94a3b8;
        }

        /* Cases Table */
        .cases-table-container {
          background: #0a1219;
          border: 1px solid #16222f;
          border-radius: 8px;
          overflow: hidden;
        }

        .table-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid #16222f;
        }

        .table-title {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: 0.04em;
        }

        .table-meta {
          font-size: 11px;
          color: #64748b;
        }

        .cases-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .cases-table th {
          text-align: left;
          padding: 12px 24px;
          background: #070e14;
          color: #64748b;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          border-bottom: 1px solid #16222f;
        }

        .cases-table td {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: #cbd5e1;
        }

        .case-row:hover td {
          background: #0e1822;
        }

        .case-title-cell {
          font-weight: 500;
          color: #ffffff;
        }

        .risk-pill {
          display: inline-block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .risk-critical {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .risk-high {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .status-badge {
          font-size: 10px;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.06);
          padding: 3px 6px;
          border-radius: 3px;
        }

        .inspect-btn {
          background: transparent;
          border: 1px solid #16222f;
          color: #24c7c9;
          font-size: 11.5px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .inspect-btn:hover {
          background: rgba(36, 199, 201, 0.1);
          border-color: #24c7c9;
        }

        .text-white { color: #ffffff; }
        .text-cyan { color: #24c7c9; }
        .text-amber { color: #f59e0b; }
        .text-green { color: #10b981; }
      `}</style>
    </div>
  );
};
