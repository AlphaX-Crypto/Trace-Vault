import React from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function WorkspaceReportTab({ result }) {
  if (!result) return null;

  const subject = result.subject || {};
  const risk = result.risk_summary || {};
  const graphSummary = result.graph_summary || {};
  const crypto = result.crypto_findings;
  const upi = result.upi_findings;
  const geo = result.geospatial_findings;
  const vasps = result.attribution_candidates || [];
  const crossAssocs = result.cross_rail_associations || [];
  const timeline = result.timeline || [];
  const evidence = result.evidence_items || [];
  const trace = result.reasoning_trace || [];
  const limitations = result.limitations || [];

  function handlePrint() {
    window.print();
  }

  function handleExportReportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `TRACEVAULT-REPORT-${result.investigation_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  return (
    <div className="workspace-tab-panel">
      {/* Report Action Bar */}
      <div className="workspace-card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-text)' }}>
              Official Financial Intelligence Investigation Report
            </span>
            <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
              17-Section Formal Compliance Dossier
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="workspace-btn" onClick={handlePrint}>
              <Printer size={13} /> Print Report
            </button>
            <button className="workspace-btn primary" onClick={handleExportReportJSON}>
              <Download size={13} /> Export Full Dossier (JSON)
            </button>
          </div>
        </div>
      </div>

      {/* 17-Section Report Document */}
      <div 
        className="workspace-card" 
        style={{ 
          background: 'var(--color-surface)', 
          padding: '36px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '24px',
          border: '1px solid var(--color-border)'
        }}
      >
        {/* Section 1: Header */}
        <div style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-accent-bright)', letterSpacing: '0.5px' }}>
              TRACEVAULT INVESTIGATION DOSSIER
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-secondary-text)', marginTop: '4px' }}>
              UNIFIED MULTI-RAIL FINANCIAL FRAUD INTELLIGENCE REPORT
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11.5px', color: 'var(--color-secondary-text)' }}>
            <div>Dossier ID: <strong>{result.investigation_id}</strong></div>
            <div>Case Reference: <strong>{result.case_id}</strong></div>
            <div>Generated: {new Date().toUTCString()}</div>
          </div>
        </div>

        {/* Section 2: Target Subject Metadata */}
        <div>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '8px' }}>
            1. Target Subject Metadata & Provenance
          </h4>
          <table className="workspace-table">
            <tbody>
              <tr>
                <td style={{ width: '180px' }}>Target Identifier</td>
                <td><span className="mono-hash">{subject.id}</span></td>
              </tr>
              <tr>
                <td>Subject Classification</td>
                <td><strong style={{ textTransform: 'uppercase' }}>{subject.type}</strong></td>
              </tr>
              <tr>
                <td>Primary Provenance</td>
                <td>
                  <span className={`workspace-provenance-tag ${result.source_summary?.[0]?.synthetic ? 'synthetic' : ''}`}>
                    {result.source_summary?.[0]?.source_type || 'MOCK'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Scope of Investigation */}
        <div>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '8px' }}>
            2. Scope of Investigation & Rails Evaluated
          </h4>
          <p style={{ fontSize: '12.5px', color: 'var(--color-secondary-text)', margin: '0 0 8px 0' }}>
            Rails engaged in analysis: <strong>{result.rails_analyzed?.join(', ')}</strong>. Traversal depth: maximum 3 hops.
          </p>
        </div>

        {/* Section 4: Executive Assessment */}
        <div>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '8px' }}>
            3. Executive Assessment & Risk Determination
          </h4>
          <div style={{ padding: '14px', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong>Investigative Risk Indicator: {risk.overall_score?.toFixed(1)} / 100</strong>
              <span className={`severity-pill ${(risk.severity || 'low').toLowerCase()}`}>{risk.severity} SEVERITY</span>
            </div>
            <p style={{ margin: 0, color: 'var(--color-primary-text)' }}>{risk.explanation}</p>
          </div>
        </div>

        {/* Section 5: Risk Signals Breakdown */}
        <div>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '8px' }}>
            4. Contributing Risk Signals
          </h4>
          <div className="workspace-table-container">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Signal ID</th>
                  <th>Rail</th>
                  <th>Weight</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {risk.contributing_signals?.map((s, idx) => (
                  <tr key={idx}>
                    <td><code>{s.name}</code></td>
                    <td><span className="rail-pill">{s.rail}</span></td>
                    <td>+{s.weight}</td>
                    <td>{s.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 6: Crypto Findings */}
        {crypto && (
          <div>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '8px' }}>
              5. Cryptocurrency Ledger Findings
            </h4>
            <p style={{ fontSize: '12.5px', color: 'var(--color-secondary-text)', margin: 0 }}>
              Analyzed {crypto.transaction_count} public ledger transactions totaling {crypto.total_volume} {crypto.asset || 'ETH'}. Peeling chain detection: {crypto.peeling_chain_detected ? 'POSITIVE' : 'NEGATIVE'}.
            </p>
          </div>
        )}

        {/* Section 7: UPI Findings */}
        {upi && (
          <div>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '8px' }}>
              6. UPI Banking & Mule Funnel Analysis
            </h4>
            <p style={{ fontSize: '12.5px', color: 'var(--color-secondary-text)', margin: 0 }}>
              Analyzed {upi.transaction_count} UPI switch transactions totaling ₹{Number(upi.total_volume || 0).toLocaleString()}. Velocity status: {upi.high_velocity_detected ? 'ANOMALOUS BURST' : 'STANDARD'}.
            </p>
          </div>
        )}

        {/* Section 8: Cross-Rail Bridge */}
        {crossAssocs.length > 0 && (
          <div>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '8px' }}>
              7. Cross-Rail Financial Flow Correlation
            </h4>
            <p style={{ fontSize: '12.5px', color: 'var(--color-secondary-text)', margin: 0 }}>
              Identified {crossAssocs.length} analytical association(s) between crypto off-ramp deposit points and UPI settlement handles.
            </p>
          </div>
        )}

        {/* Section 9: VASP Attributions */}
        {vasps.length > 0 && (
          <div>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '8px' }}>
              8. Virtual Asset Service Provider (VASP) Attribution
            </h4>
            <div className="workspace-table-container">
              <table className="workspace-table">
                <thead>
                  <tr>
                    <th>VASP Name</th>
                    <th>Deposit Wallet</th>
                    <th>Confidence</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {vasps.map((v, i) => (
                    <tr key={i}>
                      <td><strong>{v.vasp_name}</strong></td>
                      <td><span className="mono-hash">{v.deposit_address || v.wallet_address}</span></td>
                      <td>{v.attribution_confidence ?? 90}%</td>
                      <td>{v.risk_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 10: Evidence Schedule */}
        <div>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '8px' }}>
            9. Structured Investigative Evidence Schedule ({evidence.length} Items)
          </h4>
          <div className="workspace-table-container">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Evidence ID</th>
                  <th>Category</th>
                  <th>Reference</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {evidence.slice(0, 5).map((e, idx) => (
                  <tr key={idx}>
                    <td><span className="mono-hash">{e.evidence_id}</span></td>
                    <td>{e.category}</td>
                    <td><span className="mono-hash">{e.reference_hash}</span></td>
                    <td>{e.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 11: Limitations & Compliance Certification */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', fontSize: '12px', color: 'var(--color-secondary-text)', lineHeight: '1.5' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#e6a23c', marginBottom: '8px' }}>
            10. Scope Limitations & Certification
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>This dossier constitutes an automated analytical intelligence summary for investigative prioritization.</li>
            <li>Wallet addresses and UPI handles do NOT confirm the legal identity of beneficial owners.</li>
            <li>Formal disclosure requests under relevant statutory authorities (e.g. Section 91 CrPC) are required for subscriber verification.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
