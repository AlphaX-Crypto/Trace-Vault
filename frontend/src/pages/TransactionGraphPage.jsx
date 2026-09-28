import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, GitFork, ShieldCheck, Download } from 'lucide-react';
import CaseHeader from '../components/case/CaseHeader';
import CaseTabs from '../components/case/CaseTabs';
import TransactionGraph from '../components/graph/TransactionGraph';
import Button from '../components/common/Button';
import { useInvestigation } from '../utils/useInvestigation';
import { getLocalScenarioResult } from '../data/investigationScenarios';

export default function TransactionGraphPage() {
  const { id } = useParams();
  const targetId = id || 'INV-004';
  const { investigation: apiInvestigation, loading, error, reload } = useInvestigation(targetId);

  // Fallback to local scenario graph if backend case is not found or empty
  const investigation = apiInvestigation || getLocalScenarioResult(targetId) || {
    id: 'TV-2024-0847',
    name: 'DarkNet Mixer Trace',
    status: 'ACTIVE',
    riskLevel: 'HIGH',
    blockchain: 'Ethereum',
    hops: 3,
    confidence: 82,
    graph: {
      nodes: [
        { id: '0x71F92830d8c019284756102938475610293E84C2', type: 'wallet', data: { label: 'SUSPECT WALLET', address: '0x71F9...E84C2', risk: 'CRITICAL', balance: '84.70 ETH' } },
        { id: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9012', type: 'intermediary', data: { label: 'INTERMEDIARY 1', address: '0x1a2b...9012', risk: 'HIGH', balance: '45.20 ETH' } },
        { id: '0x88fa3910b2c8491029384756102938475610b210', type: 'exchange_deposit', data: { label: 'EXCHANGE DEPOSIT', address: '0x88fa...b210', risk: 'MEDIUM', balance: '42.00 ETH' } },
        { id: 'vasp_binance', type: 'vasp', data: { label: 'BINANCE HOT WALLET', address: 'Binance (Probable)', risk: 'LOW', confidence: '82% Confidence' } },
        { id: 'p2p_desk_blr', type: 'intermediary', data: { label: 'P2P DESK SETTLEMENT', address: 'p2p_desk_blr@axis', risk: 'HIGH', balance: '₹3,850,000' } }
      ],
      edges: [
        { id: 'e1', source: '0x71F92830d8c019284756102938475610293E84C2', target: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9012', label: '45.20 ETH' },
        { id: 'e2', source: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9012', target: '0x88fa3910b2c8491029384756102938475610b210', label: '42.00 ETH' },
        { id: 'e3', source: '0x88fa3910b2c8491029384756102938475610b210', target: 'vasp_binance', label: 'Cluster Match' },
        { id: 'e4', source: 'vasp_binance', target: 'p2p_desk_blr', label: 'Off-Ramp Bridge' }
      ]
    }
  };

  return (
    <div>
      {/* Header bar matching Hop Architecture screenshot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)', marginBottom: '14px' }}>
        <div>
          <div className="eyebrow">MODULE 1 · HOP ARCHITECTURE & NETWORKX TRAVERSAL</div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-primary-text)' }}>
            Hop Architecture & Multi-Rail Graph
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--color-secondary-text)' }}>
            Target: <code className="mono" style={{ color: '#24c7c9' }}>0x71F92830d8...E84C2</code> · Multi-hop traversal connecting Ethereum unhosted wallets to VASP deposit clusters.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="button button-secondary" title="Export graph vector">
            <Download size={13} />
            <span>Export Graph (SVG)</span>
          </button>
        </div>
      </div>

      <TransactionGraph investigation={investigation} />
    </div>
  );
}
