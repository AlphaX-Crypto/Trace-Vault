import React from 'react';
import { 
  ShieldAlert, 
  Layers, 
  GitCommit, 
  Clock, 
  Search, 
  AlertTriangle,
  ArrowRight,
  Database,
  ExternalLink
} from 'lucide-react';

export default function WorkspaceOverviewTab({ result, onSelectTab }) {
  if (!result) return null;

  const subject = result.subject || {};
  const risk = result.risk_summary || {};
  const graphSummary = result.graph_summary || {};
  const rails = result.rails_analyzed || [];
  const sevClass = (risk.severity || 'low').toLowerCase();

  return (
    <div className="workspace-tab-panel">
      {/* Top Alert / Key Findings Banner */}
      <div className="workspace-card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
        <div className="workspace-card-header">
          <div className="workspace-card-title">
            <ShieldAlert size={16} color="var(--color-accent)" />
            <span>Executive Investigation Assessment</span>
          </div>
          <span className={`severity-pill ${sevClass}`}>{risk.severity || 'UNKNOWN'} RISK</span>
        </div>
        <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-primary-text)' }}>
          <p style={{ margin: '0 0 10px 0' }}>{risk.explanation || 'No summary explanation available.'}</p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--color-secondary-text)' }}>
            <span><strong>Status:</strong> {result.status}</span>
            <span><strong>Analysis Confidence:</strong> {risk.confidence ?? 80}%</span>
            <span><strong>Discovered Paths:</strong> {result.graph_paths?.length || 0}</span>
            <span><strong>Evidence Linked:</strong> {result.evidence_items?.length || 0} items</span>
          </div>
        </div>
      </div>

      {/* Grid: Subject Target & Rails Breakdown */}
      <div className="workspace-grid-2">
        {/* Subject Card */}
        <div className="workspace-card">
          <div className="workspace-card-header">
            <div className="workspace-card-title">
              <Search size={15} />
              <span>Target Subject & Provenance</span>
            </div>
            <span className="workspace-id-badge">{result.investigation_id}</span>
          </div>
          <table className="workspace-table">
            <tbody>
              <tr>
                <td style={{ width: '130px', color: 'var(--color-secondary-text)' }}>Subject Type</td>
                <td><strong style={{ textTransform: 'uppercase' }}>{subject.type || 'N/A'}</strong></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-secondary-text)' }}>Identifier</td>
                <td><span className="mono-hash">{subject.id || 'N/A'}</span></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-secondary-text)' }}>Parent Case</td>
                <td><code>{result.case_id}</code></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-secondary-text)' }}>Rails Evaluated</td>
                <td>
                  <div className="rail-badge-group">
                    {rails.map((r) => (
                      <span key={r} className={`rail-pill ${r.toLowerCase().replace('_', '-')}`}>{r}</span>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-secondary-text)' }}>Provenance</td>
                <td>
                  <span className={`workspace-provenance-tag ${result.source_summary?.[0]?.synthetic ? 'synthetic' : ''}`}>
                    {result.source_summary?.[0]?.source_type || 'MOCK'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Multi-Rail Metrics */}
        <div className="workspace-card">
          <div className="workspace-card-header">
            <div className="workspace-card-title">
              <Layers size={15} />
              <span>Multi-Rail Graph Coverage</span>
            </div>
            <button 
              className="workspace-btn" 
              onClick={() => onSelectTab && onSelectTab('graph')}
            >
              Open Graph <ArrowRight size={13} />
            </button>
          </div>
          <div className="workspace-grid-2" style={{ gap: '10px' }}>
            <div className="ribbon-cell" style={{ padding: '10px 14px' }}>
              <span className="ribbon-label">Total Nodes</span>
              <span className="ribbon-val">{graphSummary.total_nodes ?? 0}</span>
              <span className="ribbon-sub">Entities across all rails</span>
            </div>
            <div className="ribbon-cell" style={{ padding: '10px 14px' }}>
              <span className="ribbon-label">Total Edges</span>
              <span className="ribbon-val">{graphSummary.total_edges ?? 0}</span>
              <span className="ribbon-sub">Transfers & links</span>
            </div>
            <div className="ribbon-cell" style={{ padding: '10px 14px' }}>
              <span className="ribbon-label">Cross-Rail Bridges</span>
              <span className="ribbon-val" style={{ color: graphSummary.cross_rail_association_count > 0 ? '#ec4899' : 'inherit' }}>
                {graphSummary.cross_rail_association_count ?? 0}
              </span>
              <span className="ribbon-sub">Analytical off-ramp / KYC links</span>
            </div>
            <div className="ribbon-cell" style={{ padding: '10px 14px' }}>
              <span className="ribbon-label">VASP Attributions</span>
              <span className="ribbon-val">{result.attribution_candidates?.length ?? 0}</span>
              <span className="ribbon-sub">Identified exchange entities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Findings Overview */}
      <div className="workspace-card">
        <div className="workspace-card-header">
          <div className="workspace-card-title">
            <Database size={15} />
            <span>Domain Intelligence Findings Summary</span>
          </div>
          <button 
            className="workspace-btn" 
            onClick={() => onSelectTab && onSelectTab('intelligence')}
          >
            Detailed Intelligence <ArrowRight size={13} />
          </button>
        </div>

        <div className="workspace-grid-3">
          {/* Crypto Domain */}
          <div style={{ background: 'var(--color-surface-soft)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="rail-pill crypto">CRYPTO RAIL</span>
              <span style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
                {result.crypto_findings ? `${result.crypto_findings.transaction_count} Txs` : 'Omitted'}
              </span>
            </div>
            {result.crypto_findings ? (
              <div style={{ fontSize: '12px', color: 'var(--color-secondary-text)', lineHeight: '1.5' }}>
                <div>Total Volume: <strong>{result.crypto_findings.total_volume} {result.crypto_findings.asset || 'ETH'}</strong></div>
                <div>Peeling Chain: <strong>{result.crypto_findings.peeling_chain_detected ? 'Yes (Detected)' : 'None'}</strong></div>
                <div>Dispersion: <strong>{result.crypto_findings.rapid_dispersion ? 'Rapid Dispersion' : 'Normal'}</strong></div>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: 0 }}>Crypto analysis not engaged or no transactions.</p>
            )}
          </div>

          {/* UPI Domain */}
          <div style={{ background: 'var(--color-surface-soft)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="rail-pill upi">UPI RAIL</span>
              <span style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
                {result.upi_findings ? `${result.upi_findings.transaction_count} Txs` : 'Omitted'}
              </span>
            </div>
            {result.upi_findings ? (
              <div style={{ fontSize: '12px', color: 'var(--color-secondary-text)', lineHeight: '1.5' }}>
                <div>Total Volume: <strong>₹{Number(result.upi_findings.total_volume || 0).toLocaleString()}</strong></div>
                <div>High Velocity: <strong>{result.upi_findings.high_velocity_detected ? 'Detected' : 'Standard'}</strong></div>
                <div>Mule Indicators: <strong>{result.upi_findings.mule_chain_length ? `${result.upi_findings.mule_chain_length} hops` : 'None'}</strong></div>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: 0 }}>UPI analysis not engaged or no records.</p>
            )}
          </div>

          {/* Geospatial Domain */}
          <div style={{ background: 'var(--color-surface-soft)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="rail-pill geo">GEOSPATIAL RAIL</span>
              <span style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
                {result.geospatial_findings ? 'Active' : 'Omitted'}
              </span>
            </div>
            {result.geospatial_findings ? (
              <div style={{ fontSize: '12px', color: 'var(--color-secondary-text)', lineHeight: '1.5' }}>
                <div>Impossible Velocity: <strong>{result.geospatial_findings.impossible_travel_detected ? 'VIOLATION DETECTED' : 'Normal'}</strong></div>
                <div>Max Speed: <strong>{result.geospatial_findings.observed_velocity_kmh ? `${result.geospatial_findings.observed_velocity_kmh} km/h` : 'N/A'}</strong></div>
                <div>Observed Sites: <strong>{result.geospatial_findings.locations?.join(' → ') || 'N/A'}</strong></div>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: 0 }}>Geospatial telemetry not engaged or no signals.</p>
            )}
          </div>
        </div>
      </div>

      {/* Forensic Disclaimer Box */}
      <div className="limitation-box">
        <h4><AlertTriangle size={15} /> Forensic Assessment Standard & Disclaimers</h4>
        <ul>
          <li><strong>Investigative Risk Indicator:</strong> All scores and severity badges reflect objective, rule-based indicators for investigative prioritization, NOT proof of guilt, fraudulent intent, or criminal liability.</li>
          <li><strong>Non-Inferential Identity:</strong> Public ledger wallet addresses and UPI VPAs are analytical nodes. Cross-rail associations reflect data-layer links and do NOT prove single-person beneficial ownership without legal process.</li>
          <li><strong>Evidentiary Status:</strong> Evidence items provided in this workspace are structured investigative records suitable for law enforcement review.</li>
        </ul>
      </div>
    </div>
  );
}
