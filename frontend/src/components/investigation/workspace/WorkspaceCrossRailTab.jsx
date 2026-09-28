import React from 'react';
import { 
  GitBranch, 
  ArrowRight, 
  ShieldAlert, 
  Coins, 
  Smartphone, 
  Building2, 
  AlertTriangle,
  FileCheck,
  Percent
} from 'lucide-react';

export default function WorkspaceCrossRailTab({ result }) {
  if (!result) return null;

  const crossAssocs = result.cross_rail_associations || [];
  const hasBridge = crossAssocs.length > 0;
  const isSynthetic = result.source_summary?.[0]?.synthetic || false;

  return (
    <div className="workspace-tab-panel">
      {/* Top Banner */}
      <div className="workspace-card" style={{ borderLeft: '4px solid #ec4899' }}>
        <div className="workspace-card-header">
          <div className="workspace-card-title">
            <GitBranch size={16} color="#ec4899" />
            <span>Cross-Rail Financial Correlation & Off-Ramp Analysis</span>
          </div>
          {isSynthetic && (
            <span className="workspace-provenance-tag synthetic">
              SYNTHETIC DEMONSTRATION ASSOCIATION
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--color-primary-text)' }}>
          Cross-rail correlation identifies analytical links between public cryptocurrency ledger transfers and national UPI banking settlement endpoints, bridging off-ramp exchange orders, OTC desks, and merchant rails.
        </p>
      </div>

      {/* Visual Flow Diagram */}
      {hasBridge ? (
        crossAssocs.map((assoc, idx) => {
          const srcClean = assoc.source_node_id?.replace(/^(wallet:|upi:|vasp:)/, '') || assoc.source_node_id;
          const tgtClean = assoc.target_node_id?.replace(/^(wallet:|upi:|vasp:)/, '') || assoc.target_node_id;

          return (
            <div key={idx} className="cross-rail-flow-panel">
              {/* Crypto Source Box */}
              <div className="cross-rail-box crypto">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="rail-pill crypto">SOURCE RAIL</span>
                  <Coins size={16} color="var(--color-accent)" />
                </div>
                <div>
                  <span className="ribbon-label">Cryptocurrency Deposit Node</span>
                  <div className="mono-hash" style={{ wordBreak: 'break-all', marginTop: '4px', fontSize: '12px' }}>
                    {srcClean}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
                  Blockchain Asset: <strong>ETH / USDT</strong>
                </div>
              </div>

              {/* Arrow / Bridge Indicator */}
              <div className="bridge-connector-arrow">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', color: '#ec4899', fontWeight: 700 }}>
                    ANALYTICAL BRIDGE
                  </span>
                  <ArrowRight size={22} color="#ec4899" />
                  <span style={{ fontSize: '11px', color: 'var(--color-secondary-text)', fontWeight: 600 }}>
                    {assoc.confidence ?? 85}% Confidence
                  </span>
                </div>
              </div>

              {/* Central Bridge Box */}
              <div className="cross-rail-box bridge">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="rail-pill cross-rail">BRIDGE MECHANISM</span>
                  <Building2 size={16} color="#ec4899" />
                </div>
                <div>
                  <span className="ribbon-label">Correlation Evidence</span>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary-text)', marginTop: '4px' }}>
                    {assoc.source || 'Exchange Off-Ramp Audit Log'}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
                  {assoc.description}
                </div>
              </div>

              {/* Arrow */}
              <div className="bridge-connector-arrow">
                <ArrowRight size={22} color="#a855f7" />
              </div>

              {/* UPI Destination Box */}
              <div className="cross-rail-box upi">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="rail-pill upi">TARGET RAIL</span>
                  <Smartphone size={16} color="#a855f7" />
                </div>
                <div>
                  <span className="ribbon-label">UPI Settlement Handle</span>
                  <div className="mono-hash" style={{ wordBreak: 'break-all', marginTop: '4px', fontSize: '12px', color: '#c084fc' }}>
                    {tgtClean}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
                  Settlement Network: <strong>NPCI UPI Switch</strong>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="workspace-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--color-muted-text)' }}>
          <GitBranch size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
          <h4 style={{ margin: '0 0 6px 0', color: 'var(--color-secondary-text)' }}>No Cross-Rail Associations Discovered</h4>
          <p style={{ margin: 0, fontSize: '12px' }}>
            Activities on the crypto and UPI rails are concurrent or independent with no verified bridge or off-ramp correlation.
          </p>
        </div>
      )}

      {/* Cross-Rail Association Table */}
      {hasBridge && (
        <div className="workspace-card">
          <div className="workspace-card-header">
            <div className="workspace-card-title">
              <FileCheck size={15} />
              <span>Cross-Rail Association Records</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>Non-Inferential Legal Safeguard</span>
          </div>

          <div className="workspace-table-container">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Source Crypto Node</th>
                  <th>Target UPI VPA</th>
                  <th>Association Type</th>
                  <th>Confidence Score</th>
                  <th>Verification Evidence</th>
                </tr>
              </thead>
              <tbody>
                {crossAssocs.map((assoc, idx) => (
                  <tr key={idx}>
                    <td><span className="mono-hash">{assoc.source_node_id}</span></td>
                    <td><span className="mono-hash" style={{ color: '#c084fc' }}>{assoc.target_node_id}</span></td>
                    <td>
                      <span className="rail-pill cross-rail">Analytical Association</span>
                    </td>
                    <td><strong>{assoc.confidence ?? 85}%</strong></td>
                    <td style={{ color: 'var(--color-secondary-text)' }}>{assoc.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mandatory Non-Inferential Disclaimer */}
      <div className="limitation-box">
        <h4><AlertTriangle size={15} /> Non-Inferential Association Notice</h4>
        <ul>
          <li><strong>Analytical Association Only:</strong> Linking a crypto wallet address to a UPI VPA is based on exchange off-ramp matching and internal accounting logs. It does NOT assert that both accounts are controlled by the same legal person or verified identity.</li>
          <li><strong>Synthetic Associations:</strong> Where marked <code>SYNTHETIC DEMONSTRATION ASSOCIATION</code>, correlations are generated under controlled test harness conditions for algorithm validation.</li>
        </ul>
      </div>
    </div>
  );
}
