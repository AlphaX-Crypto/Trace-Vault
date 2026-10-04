import React from 'react';
import { CaseData } from '../cases/CreateCaseModal';

interface ApplicationHomeProps {
  cases: CaseData[];
  onOpenCases: () => void;
  onOpenTransactions: () => void;
  onOpenGraph: () => void;
  onOpenEvidence: () => void;
}

export const ApplicationHome: React.FC<ApplicationHomeProps> = ({
  cases,
  onOpenCases,
  onOpenTransactions,
  onOpenGraph,
  onOpenEvidence
}) => {
  return (
    <div className="app-home-root">
      {/* Welcome & Context Banner */}
      <div className="home-context-header">
        <div>
          <h1 className="context-title">Financial Investigation Overview</h1>
          <p className="context-subtitle">
            Active multi-chain tracing workspace with connected domestic UPI fraud correlation.
          </p>
        </div>

        <div className="context-meta-pills">
          <span className="live-status-pill">
            <span className="dot-green" /> Multi-Chain Engine Online
          </span>
          <span className="stat-pill font-mono">18 Networks Synced</span>
        </div>
      </div>

      {/* Primary Overview Cards Grid (The 6 core application entry points) */}
      <div className="overview-cards-grid">
        {/* Card 1: CASES */}
        <article className="overview-nav-card" onClick={onOpenCases}>
          <div className="card-top-row">
            <span className="card-category-label">CASE REGISTRY</span>
            <span className="card-stat-badge font-mono">{cases.length} Active</span>
          </div>
          <h2 className="card-headline">Active Investigations</h2>
          <p className="card-snippet">
            Priority matters under active review including multi-hop crypto peeling chains and mule accounts.
          </p>
          <div className="card-recent-item font-mono">
            Recent: {cases[0]?.title || 'CASE-2026-001'}
          </div>
          <button type="button" className="btn-card-action">
            Open Cases →
          </button>
        </article>

        {/* Card 2: INVESTIGATIONS */}
        <article className="overview-nav-card" onClick={onOpenCases}>
          <div className="card-top-row">
            <span className="card-category-label">MATTER PIPELINE</span>
            <span className="card-stat-badge font-mono">3 In Triage</span>
          </div>
          <h2 className="card-headline">Investigation Pipeline</h2>
          <p className="card-snippet">
            Direct intake of suspected fraud reports with automated counterparty clustering and hop identification.
          </p>
          <div className="card-recent-item font-mono">
            Latest triage: Suspect VPA linkage (12m ago)
          </div>
          <button type="button" className="btn-card-action">
            Open Investigations →
          </button>
        </article>

        {/* Card 3: TRANSACTIONS */}
        <article className="overview-nav-card" onClick={onOpenTransactions}>
          <div className="card-top-row">
            <span className="card-category-label">TRANSACTION EXPLORER</span>
            <span className="card-stat-badge font-mono">24 Ingested</span>
          </div>
          <h2 className="card-headline">Transaction Activity</h2>
          <p className="card-snippet">
            Full-ledger multi-rail explorer for inspecting EVM, Tron, Bitcoin, and domestic bank clearing entries.
          </p>
          <div className="card-recent-item font-mono">
            Latest: 42.50 ETH → mule98@okhdfcbank
          </div>
          <button type="button" className="btn-card-action">
            View Transactions →
          </button>
        </article>

        {/* Card 4: GRAPH */}
        <article className="overview-nav-card highlight-graph-card" onClick={onOpenGraph}>
          <div className="card-top-row">
            <span className="card-category-label text-blue">RELATIONSHIP GRAPH</span>
            <span className="card-stat-badge font-mono text-blue">3-Hop Trace</span>
          </div>
          <h2 className="card-headline">Transaction Graph Workspace</h2>
          <p className="card-snippet">
            Interactive multi-hop visual graph mapping suspect wallet movements through peeling chains to likely VASPs.
          </p>
          <div className="card-recent-item font-mono">
            Focus: 0x71F9A...F84C2 → Example Exchange
          </div>
          <button type="button" className="btn-card-action btn-graph-action">
            Open Graph Workspace →
          </button>
        </article>

        {/* Card 5: RISK */}
        <article className="overview-nav-card" onClick={onOpenCases}>
          <div className="card-top-row">
            <span className="card-category-label">RISK ENGINE</span>
            <span className="card-stat-badge font-mono text-amber">High Concern</span>
          </div>
          <h2 className="card-headline">Risk Signals & Heuristics</h2>
          <p className="card-snippet">
            Autonomous detection of mixer deposits, peeling chains, rapid velocity sweeps, and high-risk counterparties.
          </p>
          <div className="card-recent-item font-mono">
            Flag: Tornado Cash Pool interaction detected
          </div>
          <button type="button" className="btn-card-action">
            View Risk Signals →
          </button>
        </article>

        {/* Card 6: EVIDENCE */}
        <article className="overview-nav-card" onClick={onOpenEvidence}>
          <div className="card-top-row">
            <span className="card-category-label">EVIDENCE VAULT</span>
            <span className="card-stat-badge font-mono">18 Items</span>
          </div>
          <h2 className="card-headline">Evidentiary Repository</h2>
          <p className="card-snippet">
            Append-only chronological audit logs, verified transaction hashes, and structured investigative exports.
          </p>
          <div className="card-recent-item font-mono">
            Last export: SHA-256 verified dossier
          </div>
          <button type="button" className="btn-card-action">
            View Evidence →
          </button>
        </article>
      </div>

      {/* Secondary Quick Explorer Grid */}
      <div className="secondary-explorer-grid">
        {/* Metric & Bar Chart Card */}
        <div className="mini-explorer-card">
          <div className="card-head-line">
            <span className="head-title">Traced Volume (24h)</span>
            <span className="period-tag font-mono">12d ▾</span>
          </div>
          <div className="metric-val-row">
            <span className="big-stat font-sans">24,049,204</span>
            <span className="stat-change">+1.23%</span>
          </div>
          <div className="mini-bars" aria-hidden="true">
            {[42, 64, 30, 80, 52, 90, 60, 100, 48, 76, 58].map((h, i) => (
              <div key={i} className="mini-bar-track">
                <div className="mini-bar" style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Recent Transactions Card */}
        <div className="mini-explorer-card">
          <div className="card-head-line">
            <span className="head-title">Recent Ledger Events</span>
            <span className="see-all-btn" onClick={onOpenTransactions}>Open All →</span>
          </div>
          <div className="recent-rows-list">
            <div className="r-row" onClick={onOpenTransactions}>
              <span className="r-icon">⇄</span>
              <div className="r-text">
                <span className="r-hash font-mono">0x8ef2...7b659f</span>
                <span className="r-desc font-mono">0x71F9... → 0x84C2...</span>
              </div>
              <span className="r-amt font-mono">42.50 ETH</span>
            </div>
            <div className="r-row" onClick={onOpenTransactions}>
              <span className="r-icon">⇄</span>
              <div className="r-text">
                <span className="r-hash font-mono">TRC20_7216...502b</span>
                <span className="r-desc font-mono">0x18D... → mule98@okhdfcbank</span>
              </div>
              <span className="r-amt font-mono">85,000 USDT</span>
            </div>
            <div className="r-row" onClick={onOpenTransactions}>
              <span className="r-icon">⇄</span>
              <div className="r-text">
                <span className="r-hash font-mono">UPI_REF_9182...</span>
                <span className="r-desc font-mono">vpa98 → HDFC A/C 8192</span>
              </div>
              <span className="r-amt font-mono">₹53.00 L</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .app-home-root {
          max-width: 1440px;
          width: 100%;
          margin: 0 auto;
          padding: 24px 32px 64px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
        }

        .home-context-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .context-title {
          font-size: 22px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.015em;
          margin-bottom: 4px;
        }

        .context-subtitle {
          font-size: 13.5px;
          color: #64748b;
        }

        .context-meta-pills {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .live-status-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 12.5px;
          color: #1e293b;
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .dot-green {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
        }

        .stat-pill {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        /* 6 Core Cards Grid */
        .overview-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 1100px) {
          .overview-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 680px) {
          .overview-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .overview-nav-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .overview-nav-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .highlight-graph-card {
          border-color: #cbd5e1;
        }

        .highlight-graph-card:hover {
          border-color: #2563eb;
        }

        .card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-category-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.05em;
        }

        .card-stat-badge {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #334155;
          font-size: 11.5px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .card-headline {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          line-height: 1.35;
        }

        .card-snippet {
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
          flex: 1;
        }

        .card-recent-item {
          font-size: 11.5px;
          color: #475569;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 6px 10px;
          border-radius: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-card-action {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #2563eb;
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: 6px;
          cursor: pointer;
          align-self: flex-start;
          margin-top: 4px;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }

        .overview-nav-card:hover .btn-card-action {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        .btn-graph-action {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;
        }

        /* Secondary Explorer Grid */
        .secondary-explorer-grid {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 16px;
        }

        @media (max-width: 1000px) {
          .secondary-explorer-grid {
            grid-template-columns: 1fr;
          }
        }

        .mini-explorer-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .card-head-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .head-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .period-tag, .see-all-btn {
          font-size: 12px;
          color: #64748b;
          cursor: pointer;
          font-weight: 500;
        }

        .see-all-btn:hover {
          color: #2563eb;
        }

        .metric-val-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .big-stat {
          font-size: 28px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.02em;
        }

        .stat-change {
          font-size: 12.5px;
          color: #10b981;
          font-weight: 500;
        }

        .mini-bars {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 90px;
        }

        .mini-bar-track {
          flex: 1;
          height: 100%;
          display: flex;
          align-items: flex-end;
          background: #f8fafc;
          border-radius: 4px;
        }

        .mini-bar {
          width: 100%;
          background: #2563eb;
          border-radius: 4px 4px 0 0;
          opacity: 0.85;
          transition: opacity 0.15s;
        }

        .mini-bar:hover {
          opacity: 1;
        }

        .recent-rows-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .r-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }

        .r-row:hover {
          background: #ffffff;
          border-color: #cbd5e1;
        }

        .r-icon {
          font-size: 13px;
          color: #2563eb;
          margin-right: 10px;
        }

        .r-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .r-hash {
          font-size: 12.5px;
          color: #111827;
          font-weight: 500;
        }

        .r-desc {
          font-size: 11px;
          color: #64748b;
        }

        .r-amt {
          font-size: 12px;
          color: #111827;
          font-weight: 600;
        }

        .font-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .text-blue {
          color: #2563eb;
        }

        .text-amber {
          color: #d97706;
        }
      `}</style>
    </div>
  );
};
