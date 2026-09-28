import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Check, 
  Copy, 
  Download, 
  CheckCircle2, 
  Lock,
  ExternalLink
} from 'lucide-react';
import './workspaceTab.css';

export default function WorkspaceEvidenceTab({ result }) {
  const caseId = result?.case_id || 'CASE-2026-001';

  const defaultExhibits = [
    {
      id: 'EX-01',
      title: 'Ledger Hop-Level Transaction Trail 84.70 ETH',
      description: 'Hop-level analytical trace capturing 3-tier layering flow across Ethereum blocks 19842100-19842145.',
      type: 'Blockchain Ledger Extract',
      source: 'Ethereum Archive Node RPC',
      caseId: caseId,
      timestamp: '2026-02-14 08:39:04 UTC',
      verification: 'SHA-256 Verified',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      relatedTx: '0x9a8f3b...1a012',
      relatedNode: '0x71c8...1350 (Suspect)',
      auditRef: 'AUD-LOG-2026-8812'
    },
    {
      id: 'EX-02',
      title: 'Frankfurt Proxy Node Network Telemetry (185.220.101.5)',
      description: 'Captured layer-4 network session telemetry recording relay routing and timing attributes.',
      type: 'Network Telemetry Capture',
      source: 'Border Gateway NetFlow Telemetry',
      caseId: caseId,
      timestamp: '2026-02-14 09:12:18 UTC',
      verification: 'SHA-256 Verified',
      hash: 'a89f33b1e7c913506bf87b99c099307ef117d91cb3229b46e382ff207b5a8e22',
      relatedTx: '0x7b2c91...1b345',
      relatedNode: '185.220.101.5 (Tor Exit)',
      auditRef: 'AUD-LOG-2026-8819'
    },
    {
      id: 'EX-03',
      title: 'Bharti Airtel Broadband IPDR Record & Cellular Sector Log',
      description: 'Subscriber IPDR production corroborating concurrent session endpoint in Bengaluru.',
      type: 'Telecom Regulatory Record',
      source: 'Telecom Provider Requisition',
      caseId: caseId,
      timestamp: '2026-02-14 14:02:44 UTC',
      verification: 'SHA-256 Verified',
      hash: '5d41402abc4b2a76b9719d911017ef8429abcc8042fa790b4d1c1a92fe12999f',
      relatedTx: 'UPI-REF-20260214-998412',
      relatedNode: '122.166.42.18 (Bengaluru)',
      auditRef: 'AUD-LOG-2026-8834'
    },
    {
      id: 'EX-04',
      title: 'VASP Hot Wallet Deposit Clustering Signature',
      description: 'Algorithmic attribution dossier linking deposit address 0x88fa...10b2 to Binance Custody Hub.',
      type: 'VASP Attribution Schedule',
      source: 'TRACEVAULT VASP Cluster Registry',
      caseId: caseId,
      timestamp: '2026-02-14 19:44:01 UTC',
      verification: 'SHA-256 Verified',
      hash: '7f83b1657ff1fc53a80289128fef8231bc7891209ccbb01824efac028129bc88',
      relatedTx: '0x4d5e6f...4b5c',
      relatedNode: '0x88fa...10b2 (Deposit)',
      auditRef: 'AUD-LOG-2026-8848'
    }
  ];

  const [selectedExhibit, setSelectedExhibit] = useState(defaultExhibits[0]);
  const [copiedHash, setCopiedHash] = useState(false);

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  }

  return (
    <div className="tv-tab-workspace anim-workspace">
      {/* HEADER: Evidence Summary */}
      <div className="tv-card">
        <div className="tv-card-header">
          <div>
            <span className="tv-card-title">Structured Investigative Evidence</span>
            <p className="tv-section-subtitle">
              Cryptographically indexed evidentiary register and chain of custody tracking.
            </p>
          </div>
          <span className="tv-badge tv-risk-low">
            <ShieldCheck size={12} style={{ marginRight: '3px' }} />
            Chain of Custody Active
          </span>
        </div>

        <div className="tv-overview-triplet-grid" style={{ marginTop: '8px' }}>
          <div className="tv-attr-item">
            <span className="tv-attr-label">CATALOGED EXHIBITS</span>
            <span className="tv-attr-value mono font-semibold">{defaultExhibits.length} Sealed Exhibits</span>
          </div>
          <div className="tv-attr-item">
            <span className="tv-attr-label">HASH VERIFICATION</span>
            <span className="tv-attr-value font-medium" style={{ color: 'var(--risk-low)' }}>
              100% SHA-256 Matched
            </span>
          </div>
          <div className="tv-attr-item">
            <span className="tv-attr-label">PARENT CASE</span>
            <span className="tv-attr-value mono">{caseId}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column: MASTER EVIDENCE REGISTER + RIGHT INSPECTOR */}
      <div className="tv-transactions-workspace">
        {/* MASTER EVIDENCE REGISTER */}
        <div className="tv-tx-table-container">
          <div className="tv-tx-table-header">
            <span className="tv-section-title">Master Evidence Register</span>
            <span className="tv-tx-count-subtext">Click row to inspect forensic provenance</span>
          </div>

          <div className="tv-table-wrapper">
            <table className="tv-table">
              <thead>
                <tr>
                  <th>EXHIBIT ID</th>
                  <th>DESCRIPTION</th>
                  <th>TYPE</th>
                  <th>SOURCE</th>
                  <th>CASE</th>
                  <th>TIMESTAMP</th>
                  <th>VERIFICATION</th>
                </tr>
              </thead>
              <tbody>
                {defaultExhibits.map((ex) => {
                  const isSelected = selectedExhibit.id === ex.id;
                  return (
                    <tr
                      key={ex.id}
                      onClick={() => setSelectedExhibit(ex)}
                      className={`tv-tx-row ${isSelected ? 'selected' : ''}`}
                    >
                      <td className="mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {ex.id}
                      </td>
                      <td style={{ maxWidth: '280px', color: 'var(--text-primary)' }}>
                        <div className="font-medium" style={{ fontSize: '12px' }}>{ex.title}</div>
                        <div className="text-muted" style={{ fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ex.description}
                        </div>
                      </td>
                      <td>
                        <span className="tv-badge tv-badge-mono">{ex.type}</span>
                      </td>
                      <td className="text-secondary" style={{ fontSize: '11px' }}>{ex.source}</td>
                      <td className="mono text-muted">{ex.caseId}</td>
                      <td className="mono tv-tx-time">{ex.timestamp}</td>
                      <td>
                        <span className="tv-badge tv-risk-low">
                          <CheckCircle2 size={11} style={{ marginRight: '3px' }} />
                          {ex.verification}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT-SIDE INSPECTOR */}
        {selectedExhibit && (
          <div className="tv-tx-inspector anim-panel-slide">
            <div className="tv-inspector-header">
              <span className="tv-inspector-title">Exhibit Inspector</span>
              <span className="tv-badge tv-badge-mono font-semibold">{selectedExhibit.id}</span>
            </div>

            <div className="tv-inspector-scroll">
              <div className="tv-inspector-section">
                <div className="tv-inspector-section-label">EXHIBIT TITLE</div>
                <div className="font-semibold" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {selectedExhibit.title}
                </div>
                <p className="tv-inspector-narrative" style={{ marginTop: '4px' }}>
                  {selectedExhibit.description}
                </p>
              </div>

              <div className="tv-inspector-section">
                <div className="tv-inspector-section-label">PROVENANCE & SOURCE</div>
                <div className="tv-inspector-kv">
                  <span className="tv-inspector-k">Primary Source</span>
                  <span className="font-medium">{selectedExhibit.source}</span>
                </div>
                <div className="tv-inspector-kv">
                  <span className="tv-inspector-k">Exhibit Type</span>
                  <span className="tv-badge tv-badge-mono">{selectedExhibit.type}</span>
                </div>
                <div className="tv-inspector-kv">
                  <span className="tv-inspector-k">Sealed Timestamp</span>
                  <span className="mono">{selectedExhibit.timestamp}</span>
                </div>
              </div>

              <div className="tv-inspector-section">
                <div className="tv-inspector-section-label">FORENSIC CORRELATIONS</div>
                <div className="tv-inspector-kv">
                  <span className="tv-inspector-k">Related Transaction</span>
                  <span className="mono tv-inspector-mono-val">{selectedExhibit.relatedTx}</span>
                </div>
                <div className="tv-inspector-kv">
                  <span className="tv-inspector-k">Related Node</span>
                  <span className="mono tv-inspector-mono-val">{selectedExhibit.relatedNode}</span>
                </div>
              </div>

              <div className="tv-inspector-section">
                <div className="tv-inspector-section-label">CRYPTOGRAPHIC VERIFICATION</div>
                <div className="tv-inspector-kv">
                  <span className="tv-inspector-k">Status</span>
                  <span className="tv-badge tv-risk-low">{selectedExhibit.verification}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <span className="tv-inspector-k">SHA-256 Digest</span>
                  <div className="tv-inspector-v-row">
                    <span className="mono tv-inspector-mono-val font-semibold">{selectedExhibit.hash}</span>
                    <button onClick={() => handleCopy(selectedExhibit.hash)} className="tv-icon-copy-btn">
                      {copiedHash ? <Check size={12} color="var(--risk-low)" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="tv-inspector-section">
                <div className="tv-inspector-section-label">AUDIT REFERENCES</div>
                <div className="tv-evidence-ref-card">
                  <Lock size={13} className="text-secondary" />
                  <div className="tv-evidence-ref-info">
                    <span className="mono font-semibold">{selectedExhibit.auditRef}</span>
                    <span className="text-muted" style={{ fontSize: '10.5px' }}>Immutable ledger sequence index</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
