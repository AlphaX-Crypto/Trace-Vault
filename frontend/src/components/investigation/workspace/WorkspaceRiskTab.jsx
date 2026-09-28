import React from 'react';
import { 
  ShieldAlert, 
  BarChart2, 
  Sliders, 
  HelpCircle, 
  CheckCircle2, 
  Info,
  Scale
} from 'lucide-react';

export default function WorkspaceRiskTab({ result }) {
  if (!result) return null;

  const risk = result.risk_summary || {};
  const signals = risk.contributing_signals || [];
  const sourceScores = risk.source_scores || {};
  const sevClass = (risk.severity || 'low').toLowerCase();

  return (
    <div className="workspace-tab-panel">
      {/* Top Aggregation Header */}
      <div className="workspace-grid-3">
        <div className="workspace-card" style={{ textAlign: 'center', justifyContent: 'center' }}>
          <span className="ribbon-label">Unified Investigative Risk Score</span>
          <div style={{ fontSize: '42px', fontWeight: 800, margin: '8px 0', color: risk.overall_score >= 80 ? 'var(--color-critical)' : risk.overall_score >= 50 ? 'var(--color-high)' : 'var(--color-low)' }}>
            {risk.overall_score?.toFixed(1) ?? '0.0'}
            <span style={{ fontSize: '18px', color: 'var(--color-muted-text)', fontWeight: 400 }}> / 100</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className={`severity-pill ${sevClass}`}>{risk.severity || 'LOW'} SEVERITY</span>
          </div>
        </div>

        <div className="workspace-card" style={{ gridColumn: 'span 2' }}>
          <div className="workspace-card-header">
            <div className="workspace-card-title">
              <Scale size={15} />
              <span>Multi-Rail Domain Risk Contribution</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
              Confidence: <strong>{risk.confidence ?? 80}%</strong>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            <div className="ribbon-cell">
              <span className="ribbon-label">Crypto Rail</span>
              <span className="ribbon-val">{sourceScores.CRYPTO != null ? `${sourceScores.CRYPTO.toFixed(1)}` : 'N/A'}</span>
              <span className="ribbon-sub">Public Ledger Risk</span>
            </div>
            <div className="ribbon-cell">
              <span className="ribbon-label">UPI Rail</span>
              <span className="ribbon-val">{sourceScores.UPI != null ? `${sourceScores.UPI.toFixed(1)}` : 'N/A'}</span>
              <span className="ribbon-sub">Banking Velocity Risk</span>
            </div>
            <div className="ribbon-cell">
              <span className="ribbon-label">Geospatial</span>
              <span className="ribbon-val">{sourceScores.GEOSPATIAL != null ? `${sourceScores.GEOSPATIAL.toFixed(1)}` : 'N/A'}</span>
              <span className="ribbon-sub">Velocity Anomaly</span>
            </div>
            <div className="ribbon-cell">
              <span className="ribbon-label">Cross-Rail / VASP</span>
              <span className="ribbon-val">{sourceScores.CROSS_RAIL != null ? `${sourceScores.CROSS_RAIL.toFixed(1)}` : sourceScores.VASP != null ? `${sourceScores.VASP.toFixed(1)}` : '0.0'}</span>
              <span className="ribbon-sub">Off-Ramp Bridge Factor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deterministic Explanation */}
      <div className="workspace-card">
        <div className="workspace-card-header">
          <div className="workspace-card-title">
            <Info size={15} />
            <span>Deterministic Score Explanation</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>Traceability Rule Matrix v3.0</span>
        </div>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--color-primary-text)' }}>
          {risk.explanation || 'No detailed score explanation generated.'}
        </p>
      </div>

      {/* Contributing Signals Table */}
      <div className="workspace-card">
        <div className="workspace-card-header">
          <div className="workspace-card-title">
            <BarChart2 size={15} />
            <span>Contributing Risk Signals ({signals.length})</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>Additive & Weighted Heuristics</span>
        </div>

        <div className="workspace-table-container">
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Signal Identifier</th>
                <th>Domain Rail</th>
                <th>Calculated Weight</th>
                <th>Technical Description</th>
              </tr>
            </thead>
            <tbody>
              {signals.length > 0 ? (
                signals.map((sig, idx) => (
                  <tr key={idx}>
                    <td>
                      <code>{sig.name || `SIGNAL-${idx + 1}`}</code>
                    </td>
                    <td>
                      <span className={`rail-pill ${(sig.rail || 'multi_rail').toLowerCase().replace('_', '-')}`}>
                        {sig.rail || 'MULTI_RAIL'}
                      </span>
                    </td>
                    <td>
                      <strong>+{sig.weight ?? 15.0}</strong>
                    </td>
                    <td style={{ color: 'var(--color-secondary-text)' }}>
                      {sig.description || 'Observed investigative behavioral anomaly.'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-muted-text)', padding: '24px' }}>
                    No elevated risk signals triggered. Baseline control thresholds maintained.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confidence & Methodological Rationale */}
      <div className="workspace-card">
        <div className="workspace-card-header">
          <div className="workspace-card-title">
            <Sliders size={15} />
            <span>Confidence Assessment Rationale</span>
          </div>
          <span className="status-badge complete">DETERMINISTIC PIPELINE</span>
        </div>
        <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--color-secondary-text)' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            Overall risk evaluation reflects a calibrated confidence score of <strong>{risk.confidence ?? 80}%</strong>.
            Confidence is determined strictly by deterministic data completeness:
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Direct blockchain indexer verification of transaction cryptographic hashes and block depth.</li>
            <li>Core banking switch telemetry (RRNs, timestamps, settlement states).</li>
            <li>Registered VASP attribution cluster confidence from verified deposit hot wallets.</li>
            <li>Synthetic or simulated demonstration records are explicitly discounted or marked with scenario disclosures.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
