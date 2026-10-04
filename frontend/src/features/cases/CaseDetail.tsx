import React, { useState } from 'react';
import { CaseData } from './CreateCaseModal';

interface CaseDetailProps {
  caseData: CaseData;
  onBackToRegistry: () => void;
  onOpenTransactions: () => void;
  onOpenGraph: () => void;
  onOpenRisk?: () => void;
  onOpenReport?: () => void;
}

export const CaseDetail: React.FC<CaseDetailProps> = ({
  caseData,
  onBackToRegistry,
  onOpenTransactions,
  onOpenGraph,
  onOpenRisk,
  onOpenReport
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'Overview' | 'Transactions' | 'Graph' | 'Timeline' | 'Risk' | 'Attribution' | 'Geospatial' | 'Evidence' | 'Report'>('Overview');

  const handleTabClick = (tab: typeof activeSubTab) => {
    setActiveSubTab(tab);
    if (tab === 'Transactions') onOpenTransactions();
    if (tab === 'Graph') onOpenGraph();
    if (tab === 'Risk' && onOpenRisk) onOpenRisk();
    if (tab === 'Report' && onOpenReport) onOpenReport();
  };

  return (
    <div className="case-detail-root">
      {/* Top Breadcrumb & Actions */}
      <div className="detail-top-nav">
        <button type="button" onClick={onBackToRegistry} className="btn-back">
          ← Cases
        </button>
        <div className="case-badge-row">
          <span className="case-id-badge font-mono">{caseData.id}</span>
          <span className={`case-priority-badge priority-${caseData.priority.toLowerCase()}`}>
            {caseData.priority} Priority
          </span>
          <span className="case-status-badge">{caseData.status}</span>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="case-header-card">
        <div className="header-main">
          <h1 className="case-title">{caseData.title}</h1>
          <p className="case-description">{caseData.description}</p>
        </div>

        <div className="case-meta-grid">
          <div className="meta-item">
            <span className="meta-label">INVESTIGATION TYPE</span>
            <span className="meta-val">{caseData.type}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">STARTING IDENTIFIER</span>
            <span className="meta-val font-mono">{caseData.targetIdentifier}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">ASSIGNED INVESTIGATOR</span>
            <span className="meta-val">{caseData.investigator}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">OPENED DATE</span>
            <span className="meta-val font-mono">{caseData.createdAt}</span>
          </div>
        </div>
      </div>

      {/* Case Navigation Tabs */}
      <div className="case-tabs-bar">
        {(['Overview', 'Transactions', 'Graph', 'Timeline', 'Risk', 'Attribution', 'Geospatial', 'Evidence', 'Report'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabClick(tab)}
            className={`case-tab-btn ${activeSubTab === tab ? 'active' : ''}`}
          >
            {tab}
            {(tab === 'Transactions' || tab === 'Graph' || tab === 'Risk') && <span className="tab-pill">Workspace →</span>}
          </button>
        ))}
      </div>

      {/* Overview Body */}
      <div className="case-overview-grid">
        {/* Left Column: Quick Entry to Dedicated Workspaces */}
        <div className="workspace-shortcuts">
          {/* Investigation Report Shortcut Card */}
          {onOpenReport && (
            <div className="shortcut-card" onClick={onOpenReport}>
              <div className="shortcut-top">
                <span className="shortcut-tag font-mono">SYNTHESIZED FINDINGS</span>
                <h3 className="shortcut-title">Investigation Report</h3>
                <p className="shortcut-desc">
                  View synthesized findings, trace paths, heuristic risk signals, VASP attributions, evidence register, and investigator notes.
                </p>
              </div>
              <button type="button" className="btn-launch font-sans">
                Open Investigation Report Workspace →
              </button>
            </div>
          )}

          {/* Risk Analysis Shortcut Card */}
          {onOpenRisk && (
            <div className="shortcut-card" onClick={onOpenRisk}>
              <div className="shortcut-top">
                <span className="shortcut-tag tag-risk font-mono">DETERMINISTIC SIGNALS</span>
                <h3 className="shortcut-title">Risk Analysis (Score 72 HIGH)</h3>
                <p className="shortcut-desc">
                  Inspect explainable signals: 4-hop peeling fragmentation, Tornado Cash pool interaction, and structured domestic UPI transfers.
                </p>
              </div>
              <button type="button" className="btn-launch font-sans">
                Open Risk Analysis Workspace →
              </button>
            </div>
          )}

          {/* Transactions Shortcut Card */}
          <div className="shortcut-card" onClick={onOpenTransactions}>
            <div className="shortcut-top">
              <span className="shortcut-tag">DEDICATED WORKSPACE</span>
              <h3 className="shortcut-title">Transaction Explorer</h3>
              <p className="shortcut-desc">
                Inspect 24 ingested transactions, filter by rail or direction, and trace intermediate peeling hops.
              </p>
            </div>
            <button type="button" className="btn-launch">
              Open Transactions Workspace →
            </button>
          </div>

          {/* Graph Shortcut Card */}
          <div className="shortcut-card" onClick={onOpenGraph}>
            <div className="shortcut-top">
              <span className="shortcut-tag">DEDICATED WORKSPACE</span>
              <h3 className="shortcut-title">Transaction Graph</h3>
              <p className="shortcut-desc">
                Follow multi-hop flows from subject address to likely VASP attribution and domestic UPI off-ramps.
              </p>
            </div>
            <button type="button" className="btn-launch">
              Open Graph Workspace →
            </button>
          </div>
        </div>

        {/* Right Column: Case Ledger Activity Preview */}
        <div className="case-activity-card">
          <h3 className="activity-title">Case Ledger Summary</h3>
          <div className="activity-metrics">
            <div className="metric-box">
              <span className="m-label">TOTAL VOLUME</span>
              <span className="m-val font-mono">42.50 ETH (~₹1.24 Cr)</span>
            </div>
            <div className="metric-box">
              <span className="m-label">IDENTIFIED HOPS</span>
              <span className="m-val font-mono">4 Crypto // 2 Banking</span>
            </div>
            <div className="metric-box">
              <span className="m-label">LINKED VASP / VPA</span>
              <span className="m-val font-mono text-blue">vpa98@okhdfcbank</span>
            </div>
            <div className="metric-box">
              <span className="m-label">EVIDENCE ITEMS</span>
              <span className="m-val font-mono">8 Verified Records</span>
            </div>
          </div>

          <div className="timeline-preview">
            <span className="timeline-heading">RECENT MATTER EVENTS</span>
            <div className="event-row">
              <span className="event-dot" />
              <div className="event-info">
                <span className="event-text">Initial crypto outflow of 42.50 ETH ingested from subject address.</span>
                <span className="event-time font-mono">2026-09-29 08:14 UTC</span>
              </div>
            </div>
            <div className="event-row">
              <span className="event-dot" />
              <div className="event-info">
                <span className="event-text">Peeling chain hop routed through Tornado Cash liquidity contract.</span>
                <span className="event-time font-mono">2026-09-29 08:35 UTC</span>
              </div>
            </div>
            <div className="event-row">
              <span className="event-dot" />
              <div className="event-info">
                <span className="event-text">P2P liquidation correlated to domestic UPI handle vpa98@okhdfcbank.</span>
                <span className="event-time font-mono">2026-09-29 09:42 UTC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .case-detail-root {
          max-width: 1440px;
          width: 100%;
          margin: 0 auto;
          padding: 32px 32px 64px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: 'Inter', sans-serif;
          background-color: #f8fafc;
        }

        .detail-top-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .btn-back {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 7px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-back:hover {
          color: #1e293b;
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .case-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .case-id-badge {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #2563eb;
          font-size: 12px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 6px;
        }

        .case-priority-badge {
          font-size: 11.5px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 9999px;
        }

        .priority-critical {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
        }

        .priority-high {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fde68a;
        }

        .priority-medium {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .case-status-badge {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #059669;
          font-size: 11.5px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 9999px;
        }

        /* Header Card */
        .case-header-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .case-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        .case-description {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          max-width: 820px;
        }

        .case-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }

        @media (max-width: 900px) {
          .case-meta-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
          letter-spacing: 0.08em;
        }

        .meta-val {
          font-size: 13.5px;
          color: #111827;
          font-weight: 600;
        }

        /* Tabs Bar */
        .case-tabs-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 6px;
          overflow-x: auto;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .case-tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: #64748b;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: 6px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .case-tab-btn:hover {
          color: #111827;
          background: #f8fafc;
        }

        .case-tab-btn.active {
          color: #2563eb;
          background: #eff6ff;
          font-weight: 600;
        }

        .tab-pill {
          font-size: 10.5px;
          color: #2563eb;
          background: #dbeafe;
          padding: 1px 6px;
          border-radius: 4px;
        }

        /* Grid */
        .case-overview-grid {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .case-overview-grid {
            grid-template-columns: 1fr;
          }
        }

        .workspace-shortcuts {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .shortcut-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: all 0.15s ease;
        }

        .shortcut-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .shortcut-tag {
          font-size: 10px;
          color: #2563eb;
          font-weight: 600;
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 6px;
        }

        .shortcut-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .shortcut-desc {
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.5;
        }

        .tag-risk {
          color: #d97706;
        }

        .btn-launch {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #2563eb;
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: 6px;
          cursor: pointer;
          align-self: flex-start;
          transition: all 0.15s ease;
        }

        .shortcut-card:hover .btn-launch {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        /* Activity Card */
        .case-activity-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .activity-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }

        .activity-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .metric-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .m-label {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
          letter-spacing: 0.06em;
        }

        .m-val {
          font-size: 13.5px;
          font-weight: 600;
          color: #111827;
        }

        .timeline-preview {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .timeline-heading {
          font-size: 10.5px;
          color: #64748b;
          font-weight: 600;
          letter-spacing: 0.08em;
        }

        .event-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .event-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563eb;
          margin-top: 5px;
        }

        .event-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .event-text {
          font-size: 13px;
          color: #334155;
        }

        .event-time {
          font-size: 11.5px;
          color: #64748b;
        }

        .font-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .text-blue {
          color: #2563eb;
        }
      `}</style>
    </div>
  );
};
