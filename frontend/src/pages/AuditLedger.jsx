import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  Filter, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import './evidenceLocker.css';

const TRANSACTIONS = [
  {
    id: 'TX-ETH-984210',
    hash: '0x9a8f3b12c84019bf44a10293847561029384756102938475610293847561a012',
    timestamp: '2026-02-14 08:21:12 UTC',
    rail: 'CRYPTO',
    source: '0x71F92830d8...E84C2',
    destination: '0x1a2b3c4d5e...f6789',
    amount: '45.20',
    currency: 'ETH',
    status: 'CONFIRMED',
    hop: 'Hop 1',
    risk: 'CRITICAL',
    riskScore: 88,
    evidenceRef: 'EX-01',
    observedFact: 'Direct blockchain on-chain transfer recorded on Ethereum Mainnet block 19842100.',
    systemAnalysis: 'Fund splitting observed. Immediate redistribution to 4 intermediary wallets within 90 seconds.',
    attribution: 'Unidentified Peel-Chain Address (Layering Step 1)',
    hashStatus: 'APPLICATION-LEVEL VERIFICATION',
    leafIndex: '#04'
  },
  {
    id: 'TX-ETH-984214',
    hash: '0x7b2c91823a049182bc810293847561029384756102938475610293847561b345',
    timestamp: '2026-02-14 08:23:44 UTC',
    rail: 'CRYPTO',
    source: '0x1a2b3c4d5e...f6789',
    destination: '0x88fa3910b2...10b2',
    amount: '42.00',
    currency: 'ETH',
    status: 'CONFIRMED',
    hop: 'Hop 2',
    risk: 'HIGH',
    riskScore: 78,
    evidenceRef: 'EX-01',
    observedFact: 'Consolidated transfer to known exchange cluster deposit address.',
    systemAnalysis: 'Cluster heuristic matches Binance Hot Wallet deposit patterns with 82% confidence.',
    attribution: 'Binance (Probable VASP Deposit)',
    hashStatus: 'APPLICATION-LEVEL VERIFICATION',
    leafIndex: '#04'
  },
  {
    id: 'TX-UPI-884129',
    hash: 'UPI-RR-481928401928',
    timestamp: '2026-02-14 08:44:10 UTC',
    rail: 'UPI',
    source: 'p2p_desk_blr@axis',
    destination: 'merchant_outlet_delhi@icici',
    amount: '3,850,000',
    currency: 'INR',
    status: 'SETTLED',
    hop: 'Hop 3',
    risk: 'HIGH',
    riskScore: 74,
    evidenceRef: 'EX-03',
    observedFact: 'High-value fiat off-ramp settlement following P2P crypto liquidity release.',
    systemAnalysis: 'Temporal velocity anomaly: transaction occurred 21 minutes after on-chain deposit.',
    attribution: 'Axis Bank P2P Liquidity Node',
    hashStatus: 'CORE SWITCH AUDIT RECORD',
    leafIndex: '#06'
  },
  {
    id: 'TX-UPI-884135',
    hash: 'UPI-RR-481928401994',
    timestamp: '2026-02-14 08:49:22 UTC',
    rail: 'UPI',
    source: 'merchant_outlet_delhi@icici',
    destination: 'traveler_mule_blr@sbi',
    amount: '950,000',
    currency: 'INR',
    status: 'SETTLED',
    hop: 'Hop 4',
    risk: 'CRITICAL',
    riskScore: 92,
    evidenceRef: 'EX-03',
    observedFact: 'Rapid multi-hop dispersal across multiple state jurisdictions within 6 minutes.',
    systemAnalysis: 'Geospatial impossibility: GPS/IP telemetry shows Bangalore origin while banking node Delhi.',
    attribution: 'Mule Funnel Dispersal Account',
    hashStatus: 'CORE SWITCH AUDIT RECORD',
    leafIndex: '#06'
  },
  {
    id: 'TX-ETH-984225',
    hash: '0x3c819284756102938475610293847561029384756102938475610293847561dd',
    timestamp: '2026-02-14 09:12:18 UTC',
    rail: 'CRYPTO',
    source: '0x71F92830d8...E84C2',
    destination: '0xWasabiMixerContractAddress',
    amount: '39.50',
    currency: 'ETH',
    status: 'CONFIRMED',
    hop: 'Hop 1',
    risk: 'CRITICAL',
    riskScore: 95,
    evidenceRef: 'EX-05',
    observedFact: 'Direct smart contract invocation to CoinJoin mixer pool coordinator.',
    systemAnalysis: 'Obfuscation attempt. Intercepted via Frankfurt PCAP capture node.',
    attribution: 'Wasabi Whirlpool Mixer',
    hashStatus: 'APPLICATION-LEVEL VERIFICATION',
    leafIndex: '#08'
  }
];

export default function AuditLedger() {
  const [selectedTx, setSelectedTx] = useState(TRANSACTIONS[0]);
  const [railFilter, setRailFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = TRANSACTIONS.filter((tx) => {
    const matchRail = railFilter === 'ALL' || tx.rail === railFilter;
    const matchQuery = !searchQuery || 
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRail && matchQuery;
  });

  return (
    <div className="evidence-locker-page">
      {/* Top Banner */}
      <div className="evidence-header-banner">
        <div>
          <div className="evidence-header-badges">
            <span className="statutory-badge vault">
              <ShieldCheck size={11} /> SECTION 65B CERTIFIED AUDIT TRAIL
            </span>
            <span className="statutory-badge admissible">
              APPEND-ONLY APPLICATION AUDIT TRAIL
            </span>
          </div>
          <div className="evidence-docket-line">
            DOCKET: <strong>TV-2026-041 // FORENSIC AUDIT LEDGER</strong>
          </div>
          <h1 className="evidence-header-title">
            Forensic Audit Ledger (Sec 65B)
          </h1>
          <p className="evidence-header-subtitle">
            Dense institutional multi-rail transaction ledger recording cryptographic hashes, hop distances, observed facts, and evidence references.
          </p>
        </div>

        <div className="evidence-header-actions">
          <button className="btn-court-bundle" title="Export Ledger in CSV/JSON">
            <Download size={13} />
            <span>Export Ledger (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="evidence-filter-bar">
        <div className="filter-left-group">
          <div className="filter-search-box">
            <Search size={12} />
            <input
              type="text"
              placeholder="Search TX ID, Hash, Address, VPA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-pills-group">
            {['ALL', 'CRYPTO', 'UPI'].map((r) => (
              <button
                key={r}
                className={`filter-pill-btn ${railFilter === r ? 'active' : ''}`}
                onClick={() => setRailFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-status-text">
          <span>Total Records: <strong>{filtered.length}</strong> | Standards: <strong>FIPS 180-4 & Sec 65B</strong></span>
        </div>
      </div>

      {/* Split Workspace */}
      <div className="evidence-split-workspace">
        {/* Dense Ledger Table */}
        <div className="evidence-table-container">
          <table className="evidence-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>TX ID</th>
                <th>RAIL</th>
                <th>SOURCE</th>
                <th>DESTINATION</th>
                <th>AMOUNT</th>
                <th>HOP</th>
                <th>RISK</th>
                <th>REF</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const isSelected = selectedTx.id === tx.id;
                return (
                  <tr
                    key={tx.id}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td className="mono" style={{ fontSize: '9px', color: '#64748b' }}>
                      {tx.timestamp}
                    </td>
                    <td className="mono" style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {tx.id}
                    </td>
                    <td>
                      <span className={`badge ${tx.rail === 'CRYPTO' ? 'badge-low' : 'badge-high'}`}>
                        {tx.rail}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: '9px' }}>
                      {tx.source}
                    </td>
                    <td className="mono" style={{ fontSize: '9px' }}>
                      {tx.destination}
                    </td>
                    <td className="mono" style={{ fontWeight: 700 }}>
                      {tx.amount} {tx.currency}
                    </td>
                    <td className="mono" style={{ color: '#24c7c9' }}>
                      {tx.hop}
                    </td>
                    <td>
                      <span className={`badge ${tx.risk === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`}>
                        {tx.risk}
                      </span>
                    </td>
                    <td className="mono" style={{ color: '#eab308' }}>
                      {tx.evidenceRef}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="table-footer-status">
            <span>Showing {filtered.length} recorded events · Append-Only Audit Integrity</span>
          </div>
        </div>

        {/* Transaction Detail Drawer */}
        <div className="inspection-focus-panel">
          <div className="focus-top-header">
            <div>
              <span className="focus-eyebrow">TRANSACTION DETAIL DRAWER</span>
              <h3 className="focus-title">{selectedTx.id}</h3>
              <p className="focus-subtitle">
                Rail: {selectedTx.rail} · Hop: {selectedTx.hop} · Currency: {selectedTx.currency}
              </p>
            </div>
            <span className="focus-badge">LOGGED</span>
          </div>

          <div className="fingerprint-box">
            <div className="fingerprint-header">
              <span>{selectedTx.hashStatus}</span>
              <span className="time-locked-badge">{selectedTx.status}</span>
            </div>
            <div className="sha-digest-full">
              Identifier: {selectedTx.hash}
            </div>
            <div className="fingerprint-sub-row">
              <span>Amount: <strong>{selectedTx.amount} {selectedTx.currency}</strong></span>
              <span>Evidence Ref: <strong>{selectedTx.evidenceRef} (Leaf {selectedTx.leafIndex})</strong></span>
            </div>
          </div>

          <div className="custody-timeline-box">
            <div className="custody-header">
              <span>FORENSIC ATTRIBUTION & ANALYSIS</span>
            </div>

            <div className="custody-step">
              <div className="custody-step-title">
                <span>Observed Fact</span>
              </div>
              <div className="custody-step-desc">
                {selectedTx.observedFact}
              </div>
            </div>

            <div className="custody-step">
              <div className="custody-step-title">
                <span>System Analysis</span>
              </div>
              <div className="custody-step-desc">
                {selectedTx.systemAnalysis}
              </div>
            </div>

            <div className="custody-step">
              <div className="custody-step-title">
                <span>Attribution & Risk Indicator</span>
              </div>
              <div className="custody-step-desc">
                <strong>{selectedTx.attribution}</strong> — Risk Score: {selectedTx.riskScore}/100 ({selectedTx.risk})
              </div>
              <div className="custody-step-agent">
                NON-INFERENTIAL INVESTIGATIVE INDICATOR
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
