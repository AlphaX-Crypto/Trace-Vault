import React, { useState } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  Network, 
  MapPin, 
  FileText, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import '../components/investigation/workspace/workspaceTab.css';

export default function EntityDossier() {
  const [copied, setCopied] = useState(false);

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="tv-dashboard-container anim-workspace">
      {/* 1. ENTITY HEADER */}
      <div className="tv-card" style={{ marginBottom: '16px' }}>
        <div className="tv-card-header">
          <div>
            <span className="tv-card-title">Entity Intelligence Dossier</span>
            <div className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
              DOSSIER ID: DOS-2026-081 · SUBJECT: UNHOSTED CRYPTO CLUSTER &amp; CORRELATED UPI VPA
            </div>
          </div>
          <span className="tv-badge tv-synthetic-badge font-semibold">
            SYNTHETIC DEMONSTRATION DATA
          </span>
        </div>

        <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          This dossier aggregates multi-rail intelligence across unhosted Ethereum seed wallets, intermediate peeling relays, VASP exchange deposit clusters, and domestic UPI VPA endpoints. All identifiers are synthetic demonstration instances for forensic evaluation.
        </p>
      </div>

      <div className="tv-tab-workspace">
        {/* 2. RELATIONSHIPS & NETWORK */}
        <div className="tv-card">
          <div className="tv-card-header">
            <span className="tv-card-title">Relationships &amp; Network Clusters</span>
            <span className="tv-badge tv-badge-mono">4 Intermediary Hops</span>
          </div>

          <div className="tv-table-wrapper">
            <table className="tv-table">
              <thead>
                <tr>
                  <th>CLUSTER / NODE</th>
                  <th>RELATIONSHIP ROLE</th>
                  <th>RAIL</th>
                  <th>IDENTIFIER</th>
                  <th>HOP DISTANCE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">Primary Seed</td>
                  <td>Target Suspect Origin</td>
                  <td><span className="tv-badge tv-rail-crypto">CRYPTO</span></td>
                  <td className="mono font-semibold">0x71c8...1350</td>
                  <td className="mono">0 (Origin)</td>
                </tr>
                <tr>
                  <td className="font-medium">Peel Split Node</td>
                  <td>Layering Intermediary</td>
                  <td><span className="tv-badge tv-rail-crypto">CRYPTO</span></td>
                  <td className="mono">0x1a2b...9012</td>
                  <td className="mono">Hop 1</td>
                </tr>
                <tr>
                  <td className="font-medium">Deposit Sweep Node</td>
                  <td>Consolidation Relay</td>
                  <td><span className="tv-badge tv-rail-crypto">CRYPTO</span></td>
                  <td className="mono">0x88fa...10b2</td>
                  <td className="mono">Hop 2</td>
                </tr>
                <tr>
                  <td className="font-medium">Exchange Custody</td>
                  <td>VASP Hot Wallet</td>
                  <td><span className="tv-badge tv-rail-crypto">CRYPTO</span></td>
                  <td className="mono">Binance Custody Hub</td>
                  <td className="mono">Hop 3</td>
                </tr>
                <tr>
                  <td className="font-medium">P2P Settler</td>
                  <td>Correlated Off-Ramp VPA</td>
                  <td><span className="tv-badge tv-rail-upi">UPI</span></td>
                  <td className="mono">p2p_desk_blr@axis</td>
                  <td className="mono">Hop 4</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. TRANSACTIONS & VASP ASSOCIATIONS 2-Column Grid */}
        <div className="tv-overview-top-grid">
          {/* Transactions */}
          <div className="tv-card">
            <div className="tv-card-header">
              <span className="tv-card-title">Transactions</span>
              <span className="tv-badge tv-badge-mono">5 Operations</span>
            </div>
            <div className="tv-details-list">
              <div className="tv-detail-row">
                <span className="mono tv-detail-label">0x9a8f...1a012</span>
                <span className="mono font-semibold">45.20 ETH (Hop 1)</span>
              </div>
              <div className="tv-detail-row">
                <span className="mono tv-detail-label">0x7b2c...1b345</span>
                <span className="mono font-semibold">42.00 ETH (Hop 2)</span>
              </div>
              <div className="tv-detail-row">
                <span className="mono tv-detail-label">0x4d5e...4b5c</span>
                <span className="mono font-semibold">42.00 ETH (Hop 3)</span>
              </div>
              <div className="tv-detail-row">
                <span className="mono tv-detail-label">UPI-REF-998412</span>
                <span className="mono font-semibold">₹3,40,000 (Hop 4)</span>
              </div>
            </div>
          </div>

          {/* VASP Associations */}
          <div className="tv-card">
            <div className="tv-card-header">
              <span className="tv-card-title">Potential VASP Associations</span>
              <span className="tv-badge tv-risk-low">82% Confidence</span>
            </div>
            <div className="tv-details-list">
              <div className="tv-detail-row">
                <span className="tv-detail-label">Candidate</span>
                <span className="font-semibold text-primary">Binance Custody Hub</span>
              </div>
              <div className="tv-detail-row">
                <span className="tv-detail-label">Type</span>
                <span>Centralized VASP</span>
              </div>
              <div className="tv-detail-row">
                <span className="tv-detail-label">Registry Source</span>
                <span>TRACEVAULT Cluster Registry</span>
              </div>
              <div className="tv-detail-row">
                <span className="tv-detail-label">Legal Status</span>
                <span className="tv-badge" style={{ color: 'var(--risk-high)', backgroundColor: 'var(--status-high-bg)', borderColor: 'var(--status-high-border)' }}>
                  Investigator Review Required
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. RISK & BEHAVIOR */}
        <div className="tv-overview-top-grid">
          {/* Risk */}
          <div className="tv-card">
            <div className="tv-card-header">
              <span className="tv-card-title">Risk Analysis</span>
              <span className="tv-badge tv-risk-critical">Critical · 88 / 100</span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              High-velocity layering across 4 hops within 23 minutes. Rapid conversion into domestic fiat off-ramp with structured round amounts.
            </p>
          </div>

          {/* Behavior */}
          <div className="tv-card">
            <div className="tv-card-header">
              <span className="tv-card-title">Observed Behavior</span>
              <span className="tv-badge tv-badge-mono">Programmatic</span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              Consistent with algorithmic peeling scripts: precise round split followed by change address sweep into custodial liquidity pool.
            </p>
          </div>
        </div>

        {/* 5. GEOSPATIAL SIGNALS & EVIDENCE */}
        <div className="tv-overview-top-grid">
          {/* Geospatial Signals */}
          <div className="tv-card">
            <div className="tv-card-header">
              <span className="tv-card-title">Geospatial Signals</span>
              <span className="tv-badge tv-risk-high">Speed Anomaly</span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              Tor exit relay (Frankfurt, DE) recorded 18s before broadband session in Bengaluru (IN). Denotes network-level proxy routing evasion.
            </p>
          </div>

          {/* Evidence */}
          <div className="tv-card">
            <div className="tv-card-header">
              <span className="tv-card-title">Evidence References</span>
              <span className="tv-badge tv-risk-low">4 Sealed Exhibits</span>
            </div>
            <div className="tv-details-list">
              <div className="tv-detail-row">
                <span className="mono tv-detail-label">EX-01</span>
                <span>Ledger Transaction Trail</span>
              </div>
              <div className="tv-detail-row">
                <span className="mono tv-detail-label">EX-03</span>
                <span>Broadband IPDR &amp; Tower Log</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
