import React, { useState } from 'react';
import { 
  ArrowRight, 
  ExternalLink, 
  Copy, 
  Check, 
  FileText, 
  ShieldAlert, 
  Info,
  X
} from 'lucide-react';
import './workspaceTab.css';

export default function WorkspaceTransactionsTab({ result }) {
  if (!result) return null;

  // Extract or synthesize deterministic transactions from investigation
  const subjectId = result.subject?.id || '0x71c83408a6cf2372e9a5957b6d193d56f6c91350';
  
  const rawTransactions = [
    {
      id: 'tx-01',
      timestamp: '2026-02-14 08:21:12 UTC',
      hash: '0x9a8f3b12c84019bf44a10293847561029384756102938475610293847561a012',
      rail: 'CRYPTO',
      source: subjectId,
      destination: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9012',
      amount: '45.20 ETH',
      status: 'CONFIRMED',
      hop: 1,
      signals: ['PEEL_CHAIN_DISPERSION', 'HIGH_VELOCITY'],
      observedFact: 'Direct peeling split originating from suspect seed wallet into rapid intermediary address within 90 seconds.',
      block: '19842100',
      evidenceId: 'EX-01'
    },
    {
      id: 'tx-02',
      timestamp: '2026-02-14 08:23:44 UTC',
      hash: '0x7b2c91823a049182bc810293847561029384756102938475610293847561b345',
      rail: 'CRYPTO',
      source: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9012',
      destination: '0x88fa3910b2c8491029384756102938475610b210',
      amount: '42.00 ETH',
      status: 'CONFIRMED',
      hop: 2,
      signals: ['CONSOLIDATION_SWEEP'],
      observedFact: 'Consolidated value transfer forwarding peeled funds toward known VASP deposit cluster.',
      block: '19842112',
      evidenceId: 'EX-01'
    },
    {
      id: 'tx-03',
      timestamp: '2026-02-14 08:35:02 UTC',
      hash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90121a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
      rail: 'CRYPTO',
      source: '0x88fa3910b2c8491029384756102938475610b210',
      destination: '0x28c6c06298d514db089934071355e5743bf21d60',
      amount: '42.00 ETH',
      status: 'CONFIRMED',
      hop: 3,
      signals: ['VASP_DEPOSIT_MATCH', 'RAPID_EXIT'],
      observedFact: 'Deposit confirmed into centralized exchange Binance Hot Wallet cluster with KYC attribution candidate.',
      block: '19842145',
      evidenceId: 'EX-04'
    },
    {
      id: 'tx-04',
      timestamp: '2026-02-14 08:44:10 UTC',
      hash: 'UPI-REF-20260214-998412',
      rail: 'UPI',
      source: 'p2p_desk_blr@axis',
      destination: 'fastmule@okaxis',
      amount: '₹3,40,000',
      status: 'SETTLED',
      hop: 4,
      signals: ['CROSS_RAIL_CORRELATION', 'P2P_OFFRAMP'],
      observedFact: 'Subsequent fiat liquidation matching fiat equivalent of crypto deposit executed via immediate P2P transfer.',
      block: 'NPCI-BATCH-8841',
      evidenceId: 'EX-03'
    },
    {
      id: 'tx-05',
      timestamp: '2026-02-14 08:52:19 UTC',
      hash: 'UPI-REF-20260214-998488',
      rail: 'UPI',
      source: 'fastmule@okaxis',
      destination: 'cashout_merchant@icici',
      amount: '₹3,38,500',
      status: 'SETTLED',
      hop: 5,
      signals: ['MULE_TERMINAL_EXIT', 'COMMISSION_STRIP'],
      observedFact: 'Funneled dispersal through mule layer exiting to merchant settlement account with 0.4% commission retained.',
      block: 'NPCI-BATCH-8849',
      evidenceId: 'EX-03'
    }
  ];

  const [selectedTx, setSelectedTx] = useState(rawTransactions[0]);
  const [copiedHash, setCopiedHash] = useState(false);

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  }

  function getRailBadge(rail) {
    if (rail === 'CRYPTO') return <span className="tv-badge tv-rail-crypto">CRYPTO</span>;
    if (rail === 'UPI') return <span className="tv-badge tv-rail-upi">UPI</span>;
    return <span className="tv-badge tv-rail-cross">{rail}</span>;
  }

  return (
    <div className="tv-transactions-workspace anim-workspace">
      {/* Ledger Table Container */}
      <div className="tv-tx-table-container">
        <div className="tv-tx-table-header">
          <span className="tv-section-title">Investigation Transaction Ledger</span>
          <span className="tv-tx-count-subtext">{rawTransactions.length} recorded operations</span>
        </div>

        <div className="tv-table-wrapper">
          <table className="tv-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>TRANSACTION</th>
                <th>RAIL</th>
                <th>SOURCE</th>
                <th>DESTINATION</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>HOP</th>
                <th>SIGNALS</th>
              </tr>
            </thead>
            <tbody>
              {rawTransactions.map((tx) => {
                const isSelected = selectedTx?.id === tx.id;
                return (
                  <tr 
                    key={tx.id} 
                    onClick={() => setSelectedTx(tx)}
                    className={`tv-tx-row ${isSelected ? 'selected' : ''}`}
                  >
                    <td className="mono tv-tx-time">{tx.timestamp}</td>
                    <td className="mono tv-tx-hash" title={tx.hash}>
                      {tx.hash.length > 18 ? `${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}` : tx.hash}
                    </td>
                    <td>{getRailBadge(tx.rail)}</td>
                    <td className="mono tv-addr-cell" title={tx.source}>
                      {tx.source.length > 14 ? `${tx.source.slice(0, 8)}...${tx.source.slice(-4)}` : tx.source}
                    </td>
                    <td className="mono tv-addr-cell" title={tx.destination}>
                      {tx.destination.length > 14 ? `${tx.destination.slice(0, 8)}...${tx.destination.slice(-4)}` : tx.destination}
                    </td>
                    <td className="mono font-semibold">{tx.amount}</td>
                    <td>
                      <span className="tv-badge tv-risk-low">{tx.status}</span>
                    </td>
                    <td className="mono font-semibold">Hop {tx.hop}</td>
                    <td>
                      <div className="tv-signals-tag-list">
                        {tx.signals.map((sig) => (
                          <span key={sig} className="tv-signal-tag mono">{sig}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right-Side Transaction Detail Inspector */}
      {selectedTx && (
        <div className="tv-tx-inspector anim-panel-slide">
          <div className="tv-inspector-header">
            <span className="tv-inspector-title">Transaction Inspector</span>
            <span className="tv-badge tv-badge-mono">Hop {selectedTx.hop}</span>
          </div>

          <div className="tv-inspector-scroll">
            {/* Observed Fact */}
            <div className="tv-inspector-section">
              <div className="tv-inspector-section-label">OBSERVED FACT</div>
              <p className="tv-inspector-narrative">
                {selectedTx.observedFact}
              </p>
            </div>

            {/* Transaction Details */}
            <div className="tv-inspector-section">
              <div className="tv-inspector-section-label">TRANSACTION DETAILS</div>
              <div className="tv-inspector-kv">
                <span className="tv-inspector-k">Identifier</span>
                <div className="tv-inspector-v-row">
                  <span className="mono tv-inspector-mono-val">{selectedTx.hash}</span>
                  <button 
                    onClick={() => handleCopy(selectedTx.hash)}
                    className="tv-icon-copy-btn"
                    title="Copy identifier"
                  >
                    {copiedHash ? <Check size={12} color="var(--risk-low)" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="tv-inspector-kv">
                <span className="tv-inspector-k">Block / Batch</span>
                <span className="mono font-medium">{selectedTx.block}</span>
              </div>

              <div className="tv-inspector-kv">
                <span className="tv-inspector-k">Timestamp</span>
                <span className="mono">{selectedTx.timestamp}</span>
              </div>

              <div className="tv-inspector-kv">
                <span className="tv-inspector-k">Rail System</span>
                <span>{getRailBadge(selectedTx.rail)}</span>
              </div>

              <div className="tv-inspector-kv">
                <span className="tv-inspector-k">Amount</span>
                <span className="mono font-semibold" style={{ fontSize: '13px' }}>{selectedTx.amount}</span>
              </div>

              <div className="tv-inspector-kv">
                <span className="tv-inspector-k">Status</span>
                <span className="tv-badge tv-risk-low">{selectedTx.status}</span>
              </div>
            </div>

            {/* Related Nodes */}
            <div className="tv-inspector-section">
              <div className="tv-inspector-section-label">RELATED NODES</div>
              <div className="tv-related-node-box">
                <span className="tv-node-role">SOURCE NODE</span>
                <span className="mono tv-inspector-mono-val">{selectedTx.source}</span>
              </div>
              <div className="tv-related-node-box" style={{ marginTop: '8px' }}>
                <span className="tv-node-role">DESTINATION NODE</span>
                <span className="mono tv-inspector-mono-val">{selectedTx.destination}</span>
              </div>
            </div>

            {/* Related Signals */}
            <div className="tv-inspector-section">
              <div className="tv-inspector-section-label">RELATED SIGNALS</div>
              <div className="tv-inspector-signals-list">
                {selectedTx.signals.map((sig) => (
                  <div key={sig} className="tv-signal-card">
                    <span className="tv-signal-name mono font-semibold">{sig}</span>
                    <span className="tv-signal-desc">
                      Pattern triggered by algorithmic heuristic validation across transaction telemetry.
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence References */}
            <div className="tv-inspector-section">
              <div className="tv-inspector-section-label">EVIDENCE REFERENCES</div>
              <div className="tv-evidence-ref-card">
                <FileText size={14} className="text-secondary" />
                <div className="tv-evidence-ref-info">
                  <span className="mono font-semibold">{selectedTx.evidenceId}</span>
                  <span className="text-muted" style={{ fontSize: '11px' }}>Cryptographic exhibit sealed in evidence locker</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
