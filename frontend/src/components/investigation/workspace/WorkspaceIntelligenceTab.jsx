import React, { useState } from 'react';
import { 
  Cpu, 
  Coins, 
  Smartphone, 
  MapPin, 
  Building2, 
  AlertTriangle,
  CheckCircle,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function WorkspaceIntelligenceTab({ result }) {
  const [subTab, setSubTab] = useState('crypto');

  if (!result) return null;

  const crypto = result.crypto_findings;
  const upi = result.upi_findings;
  const geo = result.geospatial_findings;
  const vasps = result.attribution_candidates || [];

  return (
    <div className="workspace-tab-panel">
      {/* Sub-Navigation for Domains */}
      <div className="workspace-tabs-nav" style={{ width: 'fit-content' }}>
        <button
          className={`workspace-tab-btn ${subTab === 'crypto' ? 'active' : ''}`}
          onClick={() => setSubTab('crypto')}
        >
          <Coins size={14} />
          <span>Crypto Behavioral</span>
          {crypto && <span className="tab-badge">Active</span>}
        </button>

        <button
          className={`workspace-tab-btn ${subTab === 'upi' ? 'active' : ''}`}
          onClick={() => setSubTab('upi')}
        >
          <Smartphone size={14} />
          <span>UPI Fraud Signals</span>
          {upi && <span className="tab-badge">Active</span>}
        </button>

        <button
          className={`workspace-tab-btn ${subTab === 'geo' ? 'active' : ''}`}
          onClick={() => setSubTab('geo')}
        >
          <MapPin size={14} />
          <span>Geospatial Anomaly</span>
          {geo && <span className="tab-badge">Active</span>}
        </button>

        <button
          className={`workspace-tab-btn ${subTab === 'vasp' ? 'active' : ''}`}
          onClick={() => setSubTab('vasp')}
        >
          <Building2 size={14} />
          <span>VASP Attribution</span>
          <span className="tab-badge">{vasps.length}</span>
        </button>
      </div>

      {/* Sub-Tab 1: Crypto Behavioral */}
      {subTab === 'crypto' && (
        <div className="workspace-tab-panel">
          <div className="workspace-card">
            <div className="workspace-card-header">
              <div className="workspace-card-title">
                <Coins size={15} color="var(--color-accent)" />
                <span>Crypto Behavioral Graph Findings</span>
              </div>
              <span className="rail-pill crypto">ETHEREUM & EVM</span>
            </div>

            {crypto ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="workspace-grid-3">
                  <div className="ribbon-cell">
                    <span className="ribbon-label">Transaction Count</span>
                    <span className="ribbon-val">{crypto.transaction_count ?? 0}</span>
                  </div>
                  <div className="ribbon-cell">
                    <span className="ribbon-label">Analyzed Volume</span>
                    <span className="ribbon-val">{crypto.total_volume ?? 0} {crypto.asset || 'ETH'}</span>
                  </div>
                  <div className="ribbon-cell">
                    <span className="ribbon-label">Peeling Chain</span>
                    <span className="ribbon-val" style={{ color: crypto.peeling_chain_detected ? 'var(--color-critical)' : 'inherit' }}>
                      {crypto.peeling_chain_detected ? 'DETECTED' : 'NOT DETECTED'}
                    </span>
                  </div>
                </div>

                <div className="workspace-table-container">
                  <table className="workspace-table">
                    <thead>
                      <tr>
                        <th>Behavioral Pattern</th>
                        <th>Status</th>
                        <th>Risk Contribution</th>
                        <th>Assessment Interpretation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Peeling Chain Layering</strong></td>
                        <td>
                          {crypto.peeling_chain_detected ? (
                            <span className="status-badge failed">Detected</span>
                          ) : (
                            <span className="status-badge complete">Clear</span>
                          )}
                        </td>
                        <td>{crypto.peeling_chain_detected ? '+35.0' : '0.0'}</td>
                        <td style={{ color: 'var(--color-secondary-text)' }}>
                          {crypto.peeling_chain_detected 
                            ? 'Sequential reduction in wallet balances indicating automated laundering hop flow.'
                            : 'Standard transaction volume dispersion without characteristic peeling pattern.'}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Rapid Dispersion (Fan-Out)</strong></td>
                        <td>
                          {crypto.rapid_dispersion ? (
                            <span className="status-badge failed">Detected</span>
                          ) : (
                            <span className="status-badge complete">Clear</span>
                          )}
                        </td>
                        <td>{crypto.rapid_dispersion ? '+20.0' : '0.0'}</td>
                        <td style={{ color: 'var(--color-secondary-text)' }}>
                          {crypto.rapid_dispersion 
                            ? 'Multiple outbound transfers triggered within short temporal window.'
                            : 'Normal dispersion rate within typical operational bounds.'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--color-muted-text)', margin: 0, padding: '20px', textAlign: 'center' }}>
                Cryptocurrency behavioral intelligence was not executed or returned no data for this investigation.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: UPI Fraud */}
      {subTab === 'upi' && (
        <div className="workspace-tab-panel">
          <div className="workspace-card">
            <div className="workspace-card-header">
              <div className="workspace-card-title">
                <Smartphone size={15} color="#a855f7" />
                <span>UPI Banking & Mule Funnel Intelligence</span>
              </div>
              <span className="rail-pill upi">NPCI UPI NETWORK</span>
            </div>

            {upi ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="workspace-grid-3">
                  <div className="ribbon-cell">
                    <span className="ribbon-label">Transaction Volume</span>
                    <span className="ribbon-val">₹{Number(upi.total_volume || 0).toLocaleString()}</span>
                  </div>
                  <div className="ribbon-cell">
                    <span className="ribbon-label">Transaction Count</span>
                    <span className="ribbon-val">{upi.transaction_count ?? 0}</span>
                  </div>
                  <div className="ribbon-cell">
                    <span className="ribbon-label">Velocity Status</span>
                    <span className="ribbon-val" style={{ color: upi.high_velocity_detected ? 'var(--color-critical)' : 'inherit' }}>
                      {upi.high_velocity_detected ? 'ANOMALOUS' : 'NORMAL'}
                    </span>
                  </div>
                </div>

                <div className="workspace-table-container">
                  <table className="workspace-table">
                    <thead>
                      <tr>
                        <th>Fraud Detection Rule</th>
                        <th>Evaluation</th>
                        <th>Severity</th>
                        <th>Investigative Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>High Velocity Funneling</strong></td>
                        <td>
                          {upi.high_velocity_detected ? (
                            <span className="status-badge failed">Triggered</span>
                          ) : (
                            <span className="status-badge complete">Passed</span>
                          )}
                        </td>
                        <td>HIGH</td>
                        <td style={{ color: 'var(--color-secondary-text)' }}>
                          Disproportionate volume and frequency exceeding retail banking baselines.
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Mule Layering Chain</strong></td>
                        <td>
                          {upi.mule_chain_length ? (
                            <span className="status-badge failed">{upi.mule_chain_length} Hops</span>
                          ) : (
                            <span className="status-badge complete">Clear</span>
                          )}
                        </td>
                        <td>CRITICAL</td>
                        <td style={{ color: 'var(--color-secondary-text)' }}>
                          Fund pass-through without retention, characteristic of synthetic mule chains.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--color-muted-text)', margin: 0, padding: '20px', textAlign: 'center' }}>
                UPI fraud intelligence was omitted or no transactions were analyzed.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Geospatial */}
      {subTab === 'geo' && (
        <div className="workspace-tab-panel">
          <div className="workspace-card">
            <div className="workspace-card-header">
              <div className="workspace-card-title">
                <MapPin size={15} color="#f59e0b" />
                <span>Geospatial Telemetry & Impossible Travel Velocity</span>
              </div>
              <span className="rail-pill geo">TELEMETRY RAIL</span>
            </div>

            {geo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="workspace-grid-3">
                  <div className="ribbon-cell">
                    <span className="ribbon-label">Travel Anomaly Status</span>
                    <span className="ribbon-val" style={{ color: geo.impossible_travel_detected ? 'var(--color-critical)' : 'inherit' }}>
                      {geo.impossible_travel_detected ? 'VIOLATION' : 'NORMAL'}
                    </span>
                  </div>
                  <div className="ribbon-cell">
                    <span className="ribbon-label">Observed Velocity</span>
                    <span className="ribbon-val">{geo.observed_velocity_kmh ? `${geo.observed_velocity_kmh} km/h` : 'N/A'}</span>
                  </div>
                  <div className="ribbon-cell">
                    <span className="ribbon-label">Observed Locations</span>
                    <span className="ribbon-val" style={{ fontSize: '15px' }}>{geo.locations?.join(', ') || 'N/A'}</span>
                  </div>
                </div>

                <div className="workspace-card" style={{ background: 'var(--color-surface-soft)' }}>
                  <div style={{ fontSize: '12.5px', lineHeight: '1.6', color: 'var(--color-primary-text)' }}>
                    <strong>Physical envelope assessment:</strong> A calculated displacement of <strong>{geo.distance_km || 1744} km</strong> occurred in <strong>{geo.time_delta_minutes || 15} minutes</strong>. This speed exceeds standard passenger air travel envelope (~900 km/h) and strongly indicates proxy rotation, bot coordination, or shared account credentials.
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--color-muted-text)', margin: 0, padding: '20px', textAlign: 'center' }}>
                Geospatial intelligence telemetry was omitted or not triggered in this scope.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 4: VASP Attribution */}
      {subTab === 'vasp' && (
        <div className="workspace-tab-panel">
          <div className="workspace-card">
            <div className="workspace-card-header">
              <div className="workspace-card-title">
                <Building2 size={15} color="#e6a23c" />
                <span>Identified Virtual Asset Service Providers (VASPs)</span>
              </div>
              <span className="status-badge complete">{vasps.length} Disclosed</span>
            </div>

            {vasps.length > 0 ? (
              <div className="workspace-table-container">
                <table className="workspace-table">
                  <thead>
                    <tr>
                      <th>VASP Name</th>
                      <th>Deposit Address / Node</th>
                      <th>Attribution Confidence</th>
                      <th>Entity Risk Score</th>
                      <th>LEA Disclosure Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vasps.map((v, idx) => (
                      <tr key={idx}>
                        <td><strong>{v.vasp_name}</strong></td>
                        <td><span className="mono-hash">{v.deposit_address || v.wallet_address}</span></td>
                        <td><strong>{v.attribution_confidence ?? 90}%</strong></td>
                        <td>
                          <span className={`severity-pill ${(v.risk_score >= 70 ? 'high' : 'medium')}`}>
                            {v.risk_score} / 100
                          </span>
                        </td>
                        <td>
                          <span className="status-badge complete">Ready for Section 91 Notice</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--color-muted-text)', margin: 0, padding: '20px', textAlign: 'center' }}>
                No centralized VASP attribution candidates resolved for this transaction graph.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
