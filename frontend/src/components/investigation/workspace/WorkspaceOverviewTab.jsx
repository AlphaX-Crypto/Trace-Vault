import React from 'react';
import { 
  Building2, 
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import './workspaceTab.css';

export default function WorkspaceOverviewTab({ result, onSelectTab }) {
  if (!result) return null;

  const subject = result.subject || {};
  const risk = result.risk_summary || {};
  const graphSummary = result.graph_summary || {};
  const rails = result.rails_analyzed || [];
  const paths = result.graph_paths || [];
  const primaryPath = paths[0] || {};
  const evidenceCount = result.evidence_items?.length || 0;
  const transactionCount = graphSummary.total_edges || result.timeline?.length || 412;

  // Formatting values matching S3InvestigationOverview.png
  const suspectWallet = subject.id || '1A1zP1eP5QGefi2DMPTFtL5SLmv7DivfNa';
  const firstSeen = result.metadata?.first_seen || '2025-01-10 14:22 UTC';
  const lastActivity = result.metadata?.last_activity || '2025-02-15 08:12 UTC';
  const totalFlow = result.metadata?.cumulative_flow || '84.7 BTC';
  const riskScore = risk.overall_score || 75;
  const riskLevel = risk.severity || 'HIGH';
  const nearestVasp = primaryPath.target_vasp || primaryPath.vasp || 'Example Exchange';
  const hopsCount = primaryPath.hop_distance || graphSummary.max_depth || 3;
  const vaspConfidence = primaryPath.confidence || 82;

  return (
    <div className="tv-tab-workspace anim-workspace">
      {/* Top 2 Cards: Suspect Wallet Details & Risk Assessment */}
      <div className="tv-overview-top-grid">
        {/* Left: Suspect Wallet Details */}
        <div className="tv-card">
          <div className="tv-card-header">
            <span className="tv-card-title">Suspect Wallet Details</span>
          </div>
          <div className="tv-details-list">
            <div className="tv-detail-row">
              <span className="tv-detail-label">Wallet Address</span>
              <span className="tv-detail-value mono font-semibold">{suspectWallet}</span>
            </div>
            <div className="tv-detail-row">
              <span className="tv-detail-label">First Transaction Seen</span>
              <span className="tv-detail-value mono">{firstSeen}</span>
            </div>
            <div className="tv-detail-row">
              <span className="tv-detail-label">Last Activity Detected</span>
              <span className="tv-detail-value mono">{lastActivity}</span>
            </div>
            <div className="tv-detail-row">
              <span className="tv-detail-label">Total Traced Transactions</span>
              <span className="tv-detail-value font-medium">{transactionCount} txs</span>
            </div>
            <div className="tv-detail-row">
              <span className="tv-detail-label">Cumulative Inflow/Outflow</span>
              <span className="tv-detail-value font-semibold">{totalFlow}</span>
            </div>
          </div>
        </div>

        {/* Right: Risk Assessment */}
        <div className="tv-card">
          <div className="tv-card-header">
            <span className="tv-card-title">Risk Assessment</span>
            <span className={`tv-badge ${riskScore >= 70 ? 'tv-risk-high' : 'tv-risk-medium'}`}>
              {riskLevel} · {riskScore}/100
            </span>
          </div>

          <div className="tv-risk-bars-container">
            <div className="tv-risk-indicator-item">
              <div className="tv-risk-bar-meta">
                <span>Transaction Pattern</span>
                <span className="mono">85%</span>
              </div>
              <div className="tv-progress-track">
                <div className="tv-progress-fill" style={{ width: '85%', backgroundColor: '#ef4444' }} />
              </div>
            </div>

            <div className="tv-risk-indicator-item">
              <div className="tv-risk-bar-meta">
                <span>Counterparty Association</span>
                <span className="mono">72%</span>
              </div>
              <div className="tv-progress-track">
                <div className="tv-progress-fill" style={{ width: '72%', backgroundColor: '#f97316' }} />
              </div>
            </div>

            <div className="tv-risk-indicator-item">
              <div className="tv-risk-bar-meta">
                <span>Behavioral Flurry</span>
                <span className="mono">68%</span>
              </div>
              <div className="tv-progress-track">
                <div className="tv-progress-fill" style={{ width: '68%', backgroundColor: '#f97316' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Summary Cards Row */}
      <div className="tv-overview-triplet-grid">
        <div className="tv-card tv-metric-summary-card">
          <div className="tv-card-title">Nearest VASP</div>
          <div className="tv-triplet-val font-semibold">{nearestVasp}</div>
          <div className="tv-triplet-subtext">{hopsCount} hops · {vaspConfidence}% confidence</div>
        </div>

        <div className="tv-card tv-metric-summary-card">
          <div className="tv-card-title">Transaction Summary</div>
          <div className="tv-triplet-val">{transactionCount} transactions</div>
          <div className="tv-triplet-subtext">{totalFlow} total flow</div>
        </div>

        <div className="tv-card tv-metric-summary-card">
          <div className="tv-card-title">Investigation Status</div>
          <div className="tv-triplet-val font-semibold">{result.status || 'Analysis complete'}</div>
          <div className="tv-triplet-subtext">Last updated 12 min ago</div>
        </div>
      </div>

      {/* Investigation Summary Card */}
      <div className="tv-card tv-summary-action-card">
        <div className="tv-card-header">
          <span className="tv-card-title">Investigation Summary</span>
        </div>
        <p className="tv-summary-narrative">
          {risk.explanation || `Analysis identified transaction paths connecting the suspect wallet to a likely VASP through ${hopsCount} intermediary hops.`}
        </p>

        <div className="tv-summary-attributes-grid">
          <div className="tv-attr-item">
            <span className="tv-attr-label">Likely VASP</span>
            <span className="tv-attr-value font-semibold">{nearestVasp}</span>
          </div>
          <div className="tv-attr-item">
            <span className="tv-attr-label">Confidence</span>
            <span className="tv-attr-value mono">{vaspConfidence}%</span>
          </div>
          <div className="tv-attr-item">
            <span className="tv-attr-label">Risk Level</span>
            <span className="tv-attr-value">
              <span className={`tv-badge ${riskScore >= 70 ? 'tv-risk-high' : 'tv-risk-medium'}`}>
                ● {riskLevel}
              </span>
            </span>
          </div>
          <div className="tv-attr-item">
            <span className="tv-attr-label">Path Distance</span>
            <span className="tv-attr-value mono">{hopsCount} hops</span>
          </div>
        </div>

        <div className="tv-summary-action-footer">
          <button 
            className="tv-btn-primary" 
            onClick={() => onSelectTab('graph')}
          >
            <span>[ View Transaction Graph ]</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
