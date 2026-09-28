import React, { useState } from 'react';
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
import './workspaceTab.css';

export default function WorkspaceReportTab({ result }) {
  if (!result) return null;

  const subject = result.subject || {};
  const risk = result.risk_summary || {};
  const paths = result.graph_paths || [];
  const vasps = result.attribution_candidates || [];
  const evidence = result.evidence_items || [];
  const [investigatorNotes, setInvestigatorNotes] = useState(
    'Initial multi-hop trace complete. Section 91 CrPC notice submitted to domestic telecom operator. Awaiting formal VASP compliance disclosure.'
  );

  function handlePrint() {
    window.print();
  }

  function handleExportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `REPORT-${result.investigation_id || 'TRACE'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  return (
    <div className="tv-tab-workspace anim-workspace">
      {/* Action Bar */}
      <div className="tv-card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="tv-card-title">Investigation Report</span>
            <div className="text-muted" style={{ fontSize: '11px' }}>
              Structured investigative dossier prepared for law enforcement review
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="tv-btn-secondary" onClick={handlePrint}>
              <Printer size={13} />
              <span>Print Report</span>
            </button>
            <button className="tv-btn-primary" onClick={handleExportJSON}>
              <Download size={13} />
              <span>Export Dossier (JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Professional Investigation Report Document */}
      <div className="tv-card" style={{ padding: '36px 44px', display: 'flex', flexDirection: 'column', gap: '26px' }}>
        {/* Document Header */}
        <div style={{ borderBottom: '2px solid var(--border-strong)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="font-bold" style={{ fontSize: '16px', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              TRACEVAULT INVESTIGATION REPORT
            </div>
            <div className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
              OFFICIAL FINANCIAL FORENSIC INTELLIGENCE DOSSIER
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <div>DOSSIER ID: <span className="mono font-semibold text-primary">{result.investigation_id || 'INV-001'}</span></div>
            <div>CASE REF: <span className="mono font-semibold text-primary">{result.case_id || 'CASE-2026-001'}</span></div>
            <div className="mono text-muted">DATE: {new Date().toISOString().slice(0, 10)}</div>
          </div>
        </div>

        {/* 1. CASE INFORMATION */}
        <div className="tv-report-section">
          <div className="tv-report-section-heading">1. CASE INFORMATION</div>
          <table className="tv-table" style={{ width: '100%', marginTop: '8px' }}>
            <tbody>
              <tr>
                <td style={{ width: '200px' }} className="text-muted">Case Identifier</td>
                <td className="mono font-semibold">{result.case_id || 'CASE-2026-001'}</td>
              </tr>
              <tr>
                <td className="text-muted">Investigation ID</td>
                <td className="mono">{result.investigation_id || 'INV-001'}</td>
              </tr>
              <tr>
                <td className="text-muted">Subject Identifier</td>
                <td className="mono">{subject.id || '0x71c8...1350'} ({subject.type || 'wallet'})</td>
              </tr>
              <tr>
                <td className="text-muted">Evaluated Rails</td>
                <td>{(result.rails_analyzed || ['CRYPTO', 'UPI']).join(', ')}</td>
              </tr>
              <tr>
                <td className="text-muted">Investigation Status</td>
                <td><span className="tv-badge tv-risk-low">{result.status || 'ACTIVE'}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. OBSERVED FACTS */}
        <div className="tv-report-section">
          <div className="tv-report-section-heading">2. OBSERVED FACTS</div>
          <p style={{ margin: '8px 0 0', fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
            1. An initial value transfer of 45.20 ETH was initiated from suspect wallet {subject.id || '0x71c8...1350'} to intermediate address 0x1a2b...9012.<br />
            2. Within 90 seconds, the intermediate node peeled and forwarded 42.00 ETH to consolidation deposit address 0x88fa...10b2.<br />
            3. Deposit sweep transaction confirmed into known custody cluster operated by Binance Exchange on Hop 3.<br />
            4. Subsequent domestic P2P liquidation order of ₹3,40,000 recorded through Axis Bank UPI rail within 23 minutes of on-chain deposit.
          </p>
        </div>

        {/* 3. TRANSACTION TRACE */}
        <div className="tv-report-section">
          <div className="tv-report-section-heading">3. TRANSACTION TRACE</div>
          <div className="tv-table-wrapper" style={{ marginTop: '8px' }}>
            <table className="tv-table">
              <thead>
                <tr>
                  <th>HOP</th>
                  <th>TX HASH / IDENTIFIER</th>
                  <th>RAIL</th>
                  <th>SOURCE</th>
                  <th>DESTINATION</th>
                  <th>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono">Hop 1</td>
                  <td className="mono font-medium">0x9a8f3b...1a012</td>
                  <td><span className="tv-badge tv-rail-crypto">CRYPTO</span></td>
                  <td className="mono">0x71c8...1350</td>
                  <td className="mono">0x1a2b...9012</td>
                  <td className="mono font-semibold">45.20 ETH</td>
                </tr>
                <tr>
                  <td className="mono">Hop 2</td>
                  <td className="mono font-medium">0x7b2c91...1b345</td>
                  <td><span className="tv-badge tv-rail-crypto">CRYPTO</span></td>
                  <td className="mono">0x1a2b...9012</td>
                  <td className="mono">0x88fa...10b2</td>
                  <td className="mono font-semibold">42.00 ETH</td>
                </tr>
                <tr>
                  <td className="mono">Hop 3</td>
                  <td className="mono font-medium">0x4d5e6f...4b5c</td>
                  <td><span className="tv-badge tv-rail-crypto">CRYPTO</span></td>
                  <td className="mono">0x88fa...10b2</td>
                  <td className="mono">Binance HotWallet</td>
                  <td className="mono font-semibold">42.00 ETH</td>
                </tr>
                <tr>
                  <td className="mono">Hop 4</td>
                  <td className="mono font-medium">UPI-REF-20260214-998412</td>
                  <td><span className="tv-badge tv-rail-upi">UPI</span></td>
                  <td className="mono">p2p_desk_blr@axis</td>
                  <td className="mono">fastmule@okaxis</td>
                  <td className="mono font-semibold">₹3,40,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. SYSTEM ANALYSIS */}
        <div className="tv-report-section">
          <div className="tv-report-section-heading">4. SYSTEM ANALYSIS</div>
          <p style={{ margin: '8px 0 0', fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
            The automated pipeline normalized ledger events across both decentralized Ethereum network blocks and NPCI banking switches. Multi-hop breadth-first traversal established direct connectivity across 4 intermediary hops with 82% confidence of exchange exit.
          </p>
        </div>

        {/* 5. ATTRIBUTION */}
        <div className="tv-report-section">
          <div className="tv-report-section-heading">5. POTENTIAL VASP ATTRIBUTION</div>
          <p style={{ margin: '8px 0 0', fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
            <strong>Primary Candidate:</strong> Binance Custody Hub (82% Attribution Confidence)<br />
            <strong>Registry Source:</strong> TRACEVAULT VASP Cluster Registry (Verified Hot Wallet #4)<br />
            <strong>Status:</strong> Investigator Review Required. Graph proximity indicates structural interaction with exchange custody infrastructure, not verified identity of account holder.
          </p>
        </div>

        {/* 6. RISK INDICATORS */}
        <div className="tv-report-section">
          <div className="tv-report-section-heading">6. RISK INDICATORS</div>
          <p style={{ margin: '8px 0 0', fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
            Overall Risk Score: <strong>{risk.overall_score || 78} / 100 ({risk.severity || 'HIGH'})</strong><br />
            • RAPID DISPERSION (+20): Funds transferred within 90 seconds of block inclusion.<br />
            • HIGH VELOCITY (+20): 3 hops traversed in under 15 minutes.<br />
            • MIXER INTERACTION (+15): Secondary linkage to OFAC CoinJoin coordinator.<br />
            • IMPOSSIBLE VELOCITY (+8): 18-second delta between Germany IP and India broadband.
          </p>
        </div>

        {/* 7. GEOSPATIAL SIGNALS */}
        <div className="tv-report-section">
          <div className="tv-report-section-heading">7. GEOSPATIAL SIGNALS</div>
          <p style={{ margin: '8px 0 0', fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
            • Endpoint 1: 185.220.101.5 (Frankfurt, Germany) · Tor Exit Relay · 50.1109° N, 8.6821° E<br />
            • Endpoint 2: 122.166.42.18 (Bengaluru, India) · Bharti Airtel Leased Line · 12.9716° N, 77.5946° E<br />
            <em>Note: Geospatial signals denote telecommunication routing points and do not verify individual physical presence.</em>
          </p>
        </div>

        {/* 8. EVIDENCE REFERENCES */}
        <div className="tv-report-section">
          <div className="tv-report-section-heading">8. EVIDENCE REFERENCES</div>
          <p style={{ margin: '8px 0 0', fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
            • <code>EX-01</code>: Ledger Hop-Level Transaction Trail 84.70 ETH (SHA-256 Verified)<br />
            • <code>EX-02</code>: Frankfurt Proxy Node Network Telemetry Dump (SHA-256 Verified)<br />
            • <code>EX-03</code>: Bharti Airtel Broadband IPDR Record & Cellular Tower Log (SHA-256 Verified)<br />
            • <code>EX-04</code>: VASP Hot Wallet Deposit Clustering Signature (SHA-256 Verified)
          </p>
        </div>

        {/* 9. REASONING TRACE */}
        <div className="tv-report-section">
          <div className="tv-report-section-heading">9. REASONING TRACE</div>
          <p style={{ margin: '8px 0 0', fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
            Analytical reasoning follows deterministic graph traversal from suspect origin through peeling clusters to exchange deposit. Temporal correlation of P2P cash-out provides corroborating evidence of liquidity conversion.
          </p>
        </div>

        {/* 10. LIMITATIONS */}
        <div className="tv-report-section">
          <div className="tv-report-section-heading">10. INVESTIGATIVE LIMITATIONS</div>
          <p style={{ margin: '8px 0 0', fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
            1. Unhosted wallets do not possess intrinsic identity binding; KYC confirmation requires subpoena to Binance.<br />
            2. Tor network routing prevents singular origin attribution without ISP cross-correlation.<br />
            3. UPI beneficiary accounts may represent unwitting mule accounts rather than primary conspirators.
          </p>
        </div>

        {/* 11. INVESTIGATOR NOTES */}
        <div className="tv-report-section">
          <div className="tv-report-section-heading">11. INVESTIGATOR NOTES & DIRECTIVES</div>
          <textarea
            className="tv-form-textarea"
            rows={3}
            value={investigatorNotes}
            onChange={(e) => setInvestigatorNotes(e.target.value)}
            style={{ marginTop: '8px' }}
          />
        </div>
      </div>
    </div>
  );
}
