import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Search, 
  Download, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  CheckCircle2, 
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import './transactionGraphPage.css';

const FLOW_HOPS = [
  {
    hop: 0,
    role: 'SUSPECT SEED WALLET',
    address: '0x71F92830d8c019284756102938475610293E84C2',
    shortAddress: '0x71F9...E84C2',
    rail: 'CRYPTO',
    asset: '84.70 ETH',
    fiatValue: '₹18,800,000',
    risk: 'CRITICAL',
    riskTag: 'crit',
    pattern: 'Direct Exfiltration / Ransom Origin',
    timestamp: '2026-02-14 08:21:12 UTC',
    txHash: '0x9a8f3b12c84019bf44a10293847561029384756102938475610293847561a012',
    blockHeight: '19,842,100',
    attribution: 'Unhosted Primary Threat Actor',
    jurisdiction: 'Unknown / Cross-Border',
    subpoenaStatus: 'Red Notice Drafted'
  },
  {
    hop: 1,
    role: 'PEEL-CHAIN SPLIT',
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9012',
    shortAddress: '0x1a2b...9012',
    rail: 'CRYPTO',
    asset: '45.20 ETH',
    fiatValue: '₹10,034,400',
    risk: 'HIGH',
    riskTag: 'high',
    pattern: 'Rapid Peel-Chain Layering (<90s)',
    timestamp: '2026-02-14 08:23:44 UTC',
    txHash: '0x7b2c91823a049182bc810293847561029384756102938475610293847561b345',
    blockHeight: '19,842,112',
    attribution: 'Layering Sybil Node',
    jurisdiction: 'Offshore Relay',
    subpoenaStatus: 'Node Fingerprinted'
  },
  {
    hop: 2,
    role: 'CONSOLIDATION CLUSTER',
    address: '0x88fa3910b2c8491029384756102938475610b210',
    shortAddress: '0x88fa...b210',
    rail: 'CRYPTO',
    asset: '42.00 ETH',
    fiatValue: '₹9,324,000',
    risk: 'HIGH',
    riskTag: 'high',
    pattern: 'Consolidated Deposit Sweep',
    timestamp: '2026-02-14 08:35:02 UTC',
    txHash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90121a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
    blockHeight: '19,842,145',
    attribution: 'Unidentified Transit Intermediary',
    jurisdiction: 'Offshore',
    subpoenaStatus: 'Address Blacklisted'
  },
  {
    hop: 3,
    role: 'VASP DEPOSIT GATEWAY',
    address: 'Binance Hot Wallet Cluster #4',
    shortAddress: 'Binance (0x28C...5F2)',
    rail: 'CRYPTO',
    asset: '42.00 ETH',
    fiatValue: '₹9,324,000',
    risk: 'MEDIUM',
    riskTag: 'med',
    pattern: 'Centralized Exchange Deposit',
    timestamp: '2026-02-14 08:41:19 UTC',
    txHash: '0x3c819284756102938475610293847561029384756102938475610293847561dd',
    blockHeight: '19,842,188',
    attribution: 'Binance (Probable Deposit Wallet)',
    jurisdiction: 'Seychelles / Cayman Islands',
    subpoenaStatus: 'Section 91 Notice Served'
  },
  {
    hop: 4,
    role: 'P2P LIQUIDITY OFF-RAMP',
    address: 'p2p_desk_blr@axis',
    shortAddress: 'p2p_desk_blr@axis',
    rail: 'CROSS',
    asset: '₹3,850,000 INR',
    fiatValue: '₹3,850,000',
    risk: 'HIGH',
    riskTag: 'high',
    pattern: 'Cross-Rail Crypto-to-Fiat Bridge',
    timestamp: '2026-02-14 08:44:10 UTC',
    txHash: 'UPI-RR-481928401928',
    blockHeight: 'Axis Bank CBS / Core NPCI Switch',
    attribution: 'Axis Bank P2P Liquidity Node',
    jurisdiction: 'India (Karnataka State Jurisdiction)',
    subpoenaStatus: 'Bank Account Freezing Notice'
  },
  {
    hop: 5,
    role: 'MULE FUNNEL CASHOUT',
    address: 'merchant_outlet_delhi@icici',
    shortAddress: 'merchant_delhi@icici',
    rail: 'UPI',
    asset: '₹950,000 INR',
    fiatValue: '₹950,000',
    risk: 'CRITICAL',
    riskTag: 'crit',
    pattern: 'ATM Rapid Split Cashout',
    timestamp: '2026-02-14 08:49:22 UTC',
    txHash: 'UPI-RR-481928401994',
    blockHeight: 'ICICI Switch / NPCI Batch 992',
    attribution: 'Identified Mule Funnel Account',
    jurisdiction: 'India (Delhi NCT Jurisdiction)',
    subpoenaStatus: 'LE Warrant Executed'
  }
];

export default function TransactionGraphPage() {
  const { id } = useParams();
  const caseId = id || 'TV-2024-0847';
  
  const [selectedHop, setSelectedHop] = useState(FLOW_HOPS[0]);
  const [railFilter, setRailFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState('');

  const filteredHops = FLOW_HOPS.filter((item) => {
    const matchesRail = railFilter === 'ALL' || item.rail === railFilter;
    const matchesSearch = !searchQuery || 
      item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.attribution.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRail && matchesSearch;
  });

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  }

  return (
    <div className="flow-page">
      {/* Official Government Header */}
      <div className="flow-header">
        <div className="flow-header-left">
          <span className="flow-eyebrow">
            National Financial Crime Intelligence · Forensic Hop Ledger
          </span>
          <h1 className="flow-title">
            Multi-Hop Flow Matrix & Transaction Ledger
          </h1>
          <p className="flow-subtitle">
            Docket Ref: <strong>{caseId}</strong> · Correlating unhosted crypto peel-chains with banking VASP off-ramps and UPI core switch settlements.
          </p>
        </div>

        <div className="flow-header-actions">
          <button className="btn-secondary" onClick={() => handleCopy(JSON.stringify(FLOW_HOPS, null, 2))}>
            <Copy size={13} />
            <span>{copiedText ? 'Copied' : 'Copy JSON'}</span>
          </button>
          <button className="btn-primary" onClick={() => alert('Exporting Official Multi-Hop Annexure (FIPS 180-4 compliant)...')}>
            <Download size={13} />
            <span>Export Forensic Annexure</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="flow-metrics-grid">
        <div className="flow-metric-card">
          <span className="flow-metric-label">Monitored Outflow</span>
          <span className="flow-metric-value">84.70 ETH</span>
          <span className="flow-metric-sub">₹18,800,000 INR Total Exposure</span>
        </div>

        <div className="flow-metric-card">
          <span className="flow-metric-label">Trace Depth</span>
          <span className="flow-metric-value">5 Hops</span>
          <span className="flow-metric-sub">On-Chain & Switch Traversal</span>
        </div>

        <div className="flow-metric-card">
          <span className="flow-metric-label">VASP Gateway Match</span>
          <span className="flow-metric-value" style={{ color: '#15803d' }}>Binance #4</span>
          <span className="flow-metric-sub">42.00 ETH · 82% Cluster Match</span>
        </div>

        <div className="flow-metric-card">
          <span className="flow-metric-label">Identified Off-Ramp</span>
          <span className="flow-metric-value" style={{ color: '#b91c1c' }}>₹3,850,000</span>
          <span className="flow-metric-sub">Axis Bank P2P · Account Frozen</span>
        </div>
      </div>

      {/* Step-by-Step Flow Pipeline */}
      <div className="flow-pipeline-card">
        <div className="flow-pipeline-header">
          <span className="flow-pipeline-title">
            <Layers size={14} />
            Sequential Multi-Rail Flow Progression (Hop 0 to Hop 5)
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Click any step to inspect forensic parameters
          </span>
        </div>

        <div className="flow-steps-container">
          {FLOW_HOPS.map((h, idx) => (
            <React.Fragment key={h.hop}>
              <div 
                className={`flow-step-box ${selectedHop.hop === h.hop ? 'active' : ''}`}
                onClick={() => setSelectedHop(h)}
              >
                <div className="flow-step-top">
                  <span className="flow-step-num">Hop {h.hop}</span>
                  <span className={`flow-step-tag ${h.riskTag}`}>{h.risk}</span>
                </div>
                <div className="flow-step-role">{h.role}</div>
                <div className="flow-step-address">{h.shortAddress}</div>
                <div className="flow-step-amount">{h.asset}</div>
              </div>
              {idx < FLOW_HOPS.length - 1 && (
                <div className="flow-step-arrow">
                  <ArrowRight size={14} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Split Ledger & Inspector Workspace */}
      <div className="flow-workspace-grid">
        {/* Left: Forensic Ledger Table */}
        <div className="flow-ledger-container">
          <div className="flow-filter-bar">
            <div className="flow-search-box">
              <Search size={13} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Filter address, hash, or role..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flow-rail-tabs">
              <button 
                className={`flow-rail-btn ${railFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setRailFilter('ALL')}
              >
                All Rails
              </button>
              <button 
                className={`flow-rail-btn ${railFilter === 'CRYPTO' ? 'active' : ''}`}
                onClick={() => setRailFilter('CRYPTO')}
              >
                Crypto
              </button>
              <button 
                className={`flow-rail-btn ${railFilter === 'UPI' ? 'active' : ''}`}
                onClick={() => setRailFilter('UPI')}
              >
                UPI
              </button>
              <button 
                className={`flow-rail-btn ${railFilter === 'CROSS' ? 'active' : ''}`}
                onClick={() => setRailFilter('CROSS')}
              >
                Cross-Rail
              </button>
            </div>
          </div>

          <table className="flow-table">
            <thead>
              <tr>
                <th>Hop</th>
                <th>Role / Entity</th>
                <th>Transferred Value</th>
                <th>Pattern / Heuristic</th>
                <th>Risk Tier</th>
                <th>Legal Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHops.map((item) => (
                <tr 
                  key={item.hop} 
                  className={selectedHop.hop === item.hop ? 'selected' : ''}
                  onClick={() => setSelectedHop(item)}
                >
                  <td className="mono" style={{ fontWeight: 700 }}>Hop {item.hop}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.role}</div>
                    <div className="mono muted" style={{ fontSize: '10px' }}>{item.shortAddress}</div>
                  </td>
                  <td>
                    <div className="mono" style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{item.asset}</div>
                    <div className="muted" style={{ fontSize: '10px' }}>{item.fiatValue}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--text-secondary)' }}>{item.pattern}</div>
                    <div className="muted" style={{ fontSize: '10px' }}>{item.rail} Rail</div>
                  </td>
                  <td>
                    <span className={`flow-step-tag ${item.riskTag}`}>{item.risk}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {item.subpoenaStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Selected Hop Forensic Inspector */}
        <div className="flow-inspector">
          <div className="inspector-header">
            <h3 className="inspector-title">Forensic Node Inspector</h3>
            <span className={`flow-step-tag ${selectedHop.riskTag}`}>Hop {selectedHop.hop} · {selectedHop.risk}</span>
          </div>

          <div className="inspector-row">
            <span className="inspector-label">Entity Classification</span>
            <span className="inspector-value" style={{ fontWeight: 600 }}>{selectedHop.role}</span>
          </div>

          <div className="inspector-row">
            <span className="inspector-label">Account / Address Identifier</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="inspector-value mono" style={{ fontSize: '11px' }}>{selectedHop.address}</span>
              <button 
                className="btn-secondary" 
                style={{ padding: '2px 6px', height: '22px' }}
                onClick={() => handleCopy(selectedHop.address)}
                title="Copy Address"
              >
                <Copy size={11} />
              </button>
            </div>
          </div>

          <div className="inspector-row">
            <span className="inspector-label">Transaction Hash / Reference</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="inspector-value mono" style={{ fontSize: '10px', color: 'var(--primary-color)' }}>
                {selectedHop.txHash}
              </span>
              <button 
                className="btn-secondary" 
                style={{ padding: '2px 6px', height: '22px' }}
                onClick={() => handleCopy(selectedHop.txHash)}
                title="Copy Transaction Hash"
              >
                <Copy size={11} />
              </button>
            </div>
          </div>

          <div className="inspector-badge-box">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="inspector-label">Ledger Confirmation:</span>
              <span className="mono" style={{ fontSize: '10px', fontWeight: 600 }}>{selectedHop.blockHeight}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="inspector-label">Timestamp (UTC):</span>
              <span className="mono" style={{ fontSize: '10px' }}>{selectedHop.timestamp}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="inspector-label">Attribution Evidence:</span>
              <span style={{ fontSize: '10px', fontWeight: 600 }}>{selectedHop.attribution}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="inspector-label">Jurisdiction:</span>
              <span style={{ fontSize: '10px' }}>{selectedHop.jurisdiction}</span>
            </div>
          </div>

          <div className="inspector-actions">
            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => alert(`Generated Section 91 Subpoena for ${selectedHop.address}`)}
            >
              <ShieldCheck size={13} />
              <span>Issue Section 91 Subpoena Notice</span>
            </button>
            <button 
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => alert(`Exporting Hop ${selectedHop.hop} evidentiary bundle with SHA-256 seal.`)}
            >
              <FileText size={13} />
              <span>Export Evidentiary Certificate (Sec 65B)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
