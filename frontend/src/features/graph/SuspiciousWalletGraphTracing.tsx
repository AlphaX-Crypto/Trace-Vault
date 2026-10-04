import React, { useState, useEffect } from 'react';

interface GraphNode {
  id: string;
  label: string;
  sublabel: string;
  type: 'crypto-origin' | 'crypto-hop' | 'mixer' | 'p2p' | 'upi' | 'bank';
  x: number;
  y: number;
  risk: number; // 0-100
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  volume: string;
  timestamp: string;
  details: {
    address: string;
    chain?: string;
    vpa?: string;
    bank?: string;
    totalReceived: string;
    totalSent: string;
    txCount: number;
    flags: string[];
    summary: string;
  };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  amount: string;
  label: string;
  rail: 'crypto' | 'cross-rail' | 'banking';
}

const NODES: GraphNode[] = [
  {
    id: 'n1',
    label: 'Origin Target',
    sublabel: '0x71C...4982',
    type: 'crypto-origin',
    x: 80,
    y: 200,
    risk: 98,
    riskLevel: 'CRITICAL',
    volume: '42.50 ETH (~$148,750)',
    timestamp: '2026-09-29 08:14 UTC',
    details: {
      address: '0x71C2a8F09403dE4B07B4f114B5C1089b0A124982',
      chain: 'Ethereum Mainnet',
      totalReceived: '55.20 ETH',
      totalSent: '54.80 ETH',
      txCount: 142,
      flags: ['Stolen Funds Inflow', 'High Velocity Outflow', 'Darknet Affinity'],
      summary: 'Primary suspect address identified in multi-source financial fraud report. Dispersed funds within 18 minutes of receipt.'
    }
  },
  {
    id: 'n2',
    label: 'Peel Hop 1',
    sublabel: '0x3B8...e109',
    type: 'crypto-hop',
    x: 280,
    y: 120,
    risk: 84,
    riskLevel: 'HIGH',
    volume: '30.00 ETH (~$105,000)',
    timestamp: '2026-09-29 08:22 UTC',
    details: {
      address: '0x3B89a421c90038Fe942dF4426511aF890987e109',
      chain: 'Ethereum Mainnet',
      totalReceived: '42.50 ETH',
      totalSent: '42.49 ETH',
      txCount: 19,
      flags: ['Rapid Peeling Chain', 'Intermediate Transit'],
      summary: 'Ephemeral transit wallet created purely to fragment transaction amounts and obscure direct lineage.'
    }
  },
  {
    id: 'n3',
    label: 'Peel Hop 2',
    sublabel: '0x92F...a541',
    type: 'crypto-hop',
    x: 280,
    y: 280,
    risk: 79,
    riskLevel: 'HIGH',
    volume: '12.50 ETH (~$43,750)',
    timestamp: '2026-09-29 08:25 UTC',
    details: {
      address: '0x92Fa54117bBc9800cFe419208472532410a0a541',
      chain: 'Ethereum Mainnet',
      totalReceived: '12.50 ETH',
      totalSent: '12.48 ETH',
      txCount: 8,
      flags: ['Direct Smart Contract Call', 'Gas Sponsored'],
      summary: 'Second-tier peeling address routing remaining balances directly to privacy liquidity pool.'
    }
  },
  {
    id: 'n4',
    label: 'Privacy Mixer',
    sublabel: 'Tornado.Cash 10 ETH',
    type: 'mixer',
    x: 500,
    y: 200,
    risk: 99,
    riskLevel: 'CRITICAL',
    volume: '30.00 ETH Pool',
    timestamp: '2026-09-29 08:35 UTC',
    details: {
      address: '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b',
      chain: 'Smart Contract / Ethereum',
      totalReceived: '412,890 ETH',
      totalSent: '412,870 ETH',
      txCount: 28410,
      flags: ['OFAC Sanctioned Entity', 'Smart Contract Mixer', 'Anonymization Pool'],
      summary: 'Zero-knowledge obfuscation pool used to break cryptographic deposit-withdrawal linkages.'
    }
  },
  {
    id: 'n5',
    label: 'P2P Off-Ramp Desk',
    sublabel: '0x18D...502b',
    type: 'p2p',
    x: 720,
    y: 130,
    risk: 88,
    riskLevel: 'HIGH',
    volume: '85,000 USDT',
    timestamp: '2026-09-29 09:10 UTC',
    details: {
      address: '0x18D502bfa4917C59039E6103Ac3e16441b45502b',
      chain: 'Tron / USDT TRC-20',
      totalReceived: '1,420,000 USDT',
      totalSent: '1,419,200 USDT',
      txCount: 1640,
      flags: ['Unregistered Money Transmitter', 'P2P Exchange Desk', 'Cross-Rail Gateway'],
      summary: 'Over-the-counter liquidity provider converting washed cryptocurrency into domestic fiat currency payouts.'
    }
  },
  {
    id: 'n6',
    label: 'UPI Subject VPA',
    sublabel: 'vpa98@okhdfcbank',
    type: 'upi',
    x: 930,
    y: 130,
    risk: 95,
    riskLevel: 'CRITICAL',
    volume: '₹71,40,000 (INR)',
    timestamp: '2026-09-29 09:42 UTC',
    details: {
      address: 'vpa98@okhdfcbank',
      vpa: 'vpa98@okhdfcbank',
      bank: 'HDFC Bank Ltd',
      totalReceived: '₹71,40,000',
      totalSent: '₹71,35,000',
      txCount: 86,
      flags: ['Rapid In-Out Turnover', 'Multiple P2P Crypto Citations', 'High Velocity Pattern'],
      summary: 'Recipient beneficiary VPA receiving INR settlements directly corresponding to crypto liquidation orders.'
    }
  },
  {
    id: 'n7',
    label: 'Beneficiary Bank Account',
    sublabel: 'HDFC A/C: ****8192',
    type: 'bank',
    x: 930,
    y: 280,
    risk: 92,
    riskLevel: 'CRITICAL',
    volume: '₹53,00,000 Cash Withdrawal',
    timestamp: '2026-09-29 10:05 UTC',
    details: {
      address: 'HDFC Bank A/C 501004928192',
      bank: 'HDFC Bank (Branch: Mumbai Fort)',
      totalReceived: '₹53,00,000',
      totalSent: '₹52,80,000 (Cash ATM/Counter)',
      txCount: 14,
      flags: ['Immediate Cash Depletion', 'High Velocity Dispersal', 'Layering Target'],
      summary: 'Final domestic banking account where UPI funds were rapidly cashed out via sequential ATM and branch withdrawals.'
    }
  }
];

const EDGES: GraphEdge[] = [
  { id: 'e1', source: 'n1', target: 'n2', amount: '30.00 ETH', label: 'Hop 1', rail: 'crypto' },
  { id: 'e2', source: 'n1', target: 'n3', amount: '12.50 ETH', label: 'Hop 2', rail: 'crypto' },
  { id: 'e3', source: 'n2', target: 'n4', amount: '30.00 ETH', label: 'Mixer Deposit', rail: 'crypto' },
  { id: 'e4', source: 'n3', target: 'n4', amount: '12.50 ETH', label: 'Mixer Deposit', rail: 'crypto' },
  { id: 'e5', source: 'n4', target: 'n5', amount: '85,000 USDT', label: 'OTC Liquidation', rail: 'crypto' },
  { id: 'e6', source: 'n5', target: 'n6', amount: '₹71.4L Fiat', label: 'P2P UPI Settlement', rail: 'cross-rail' },
  { id: 'e7', source: 'n6', target: 'n7', amount: '₹53.0L Transfer', label: 'Internal Bank Sweep', rail: 'banking' }
];

export const SuspiciousWalletGraphTracing: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('n1');
  const [isFilterHighRisk, setIsFilterHighRisk] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isAutoTracing, setIsAutoTracing] = useState<boolean>(true);

  const selectedNode = NODES.find((n) => n.id === selectedNodeId) || NODES[0];

  // Auto-step through nodes in sequence for a live tracing demonstration
  useEffect(() => {
    if (!isAutoTracing) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % NODES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isAutoTracing]);

  const getNodeColor = (type: GraphNode['type'], risk: number) => {
    if (type === 'crypto-origin') return '#f59e0b'; // Amber anchor
    if (type === 'mixer') return '#ef4444'; // Red alert
    if (type === 'upi') return '#24c7c9'; // Primary cyan
    if (type === 'bank') return '#a855f7'; // Purple entity
    if (risk >= 80) return '#f43f5e';
    return '#38bdf8';
  };

  const getRiskBadgeColor = (level: GraphNode['riskLevel']) => {
    switch (level) {
      case 'CRITICAL': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.4)' };
      case 'HIGH': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)' };
      case 'MODERATE': return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)' };
      case 'LOW': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.4)' };
    }
  };

  return (
    <section id="graph-tracing" className="graph-section-wrapper" aria-label="Suspicious Wallet and UPI Graph Tracing">
      {/* Section Header */}
      <div className="section-head">
        <div className="section-badge">
          <span className="badge-dot" />
          <span>CONNECTED TRANSACTION INTELLIGENCE</span>
        </div>
        <h2 className="section-title">
          Tracing Suspicious Crypto Wallets & Linking UPI Fraud
        </h2>
        <p className="section-description">
          Automated multi-hop graph engine follows peeling chains across mixer contracts, identifies P2P off-ramp counterparties, 
          and resolves pseudo-anonymous crypto flows into named domestic UPI accounts.
        </p>
      </div>

      {/* Graph Control & Live Telemetry Bar */}
      <div className="telemetry-bar">
        <div className="telemetry-item">
          <span className="telemetry-k">ORIGIN TARGET</span>
          <span className="telemetry-v font-mono text-amber">0x71C...4982</span>
        </div>
        <div className="telemetry-divider" />
        <div className="telemetry-item">
          <span className="telemetry-k">TOTAL DISPERSED</span>
          <span className="telemetry-v font-mono text-white">42.50 ETH (~₹1.24 Cr)</span>
        </div>
        <div className="telemetry-divider" />
        <div className="telemetry-item">
          <span className="telemetry-k">TRACE HOPS</span>
          <span className="telemetry-v font-mono text-cyan">4 Crypto // 2 Banking</span>
        </div>
        <div className="telemetry-divider" />
        <div className="telemetry-item">
          <span className="telemetry-k">LINKED ENDPOINT</span>
          <span className="telemetry-v font-mono text-critical">vpa98@okhdfcbank</span>
        </div>

        <div className="telemetry-actions">
          <button
            type="button"
            onClick={() => setIsAutoTracing((prev) => !prev)}
            className={`control-btn ${isAutoTracing ? 'control-btn-active' : ''}`}
          >
            {isAutoTracing ? '❚❚ Pause Pulse' : '▶ Replay Trace'}
          </button>
          <button
            type="button"
            onClick={() => setIsFilterHighRisk((prev) => !prev)}
            className={`control-btn ${isFilterHighRisk ? 'control-btn-active' : ''}`}
          >
            {isFilterHighRisk ? 'Show All Hops' : 'Filter Critical Only'}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas & Inspector Split */}
      <div className="graph-canvas-container">
        {/* SVG Interactive Topology Canvas */}
        <div className="svg-canvas-pane">
          <svg className="graph-svg" viewBox="0 0 1080 400" preserveAspectRatio="xMidYMid meet">
            <defs>
              {/* Radial gradient background grid effect */}
              <linearGradient id="edge-crypto-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#24c7c9" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="edge-cross-rail-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#24c7c9" stopOpacity="0.9" />
              </linearGradient>
              {/* Drop shadows for glowing nodes */}
              <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Decorative background grid matrix */}
            <g className="grid-layer" opacity="0.12">
              {Array.from({ length: 11 }).map((_, i) => (
                <line key={`grid-v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="400" stroke="#24c7c9" strokeWidth="0.5" strokeDasharray="3 6" />
              ))}
              {Array.from({ length: 5 }).map((_, i) => (
                <line key={`grid-h-${i}`} x1="0" y1={i * 100} x2="1080" y2={i * 100} stroke="#24c7c9" strokeWidth="0.5" strokeDasharray="3 6" />
              ))}
            </g>

            {/* Edges with flowing photon particles */}
            <g className="edges-layer">
              {EDGES.map((edge) => {
                const srcNode = NODES.find((n) => n.id === edge.source);
                const tgtNode = NODES.find((n) => n.id === edge.target);
                if (!srcNode || !tgtNode) return null;

                // Bezier curve calculations
                const dx = tgtNode.x - srcNode.x;
                const c1x = srcNode.x + dx * 0.5;
                const c1y = srcNode.y;
                const c2x = srcNode.x + dx * 0.5;
                const c2y = tgtNode.y;
                const pathD = `M ${srcNode.x} ${srcNode.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tgtNode.x} ${tgtNode.y}`;

                const isConnectedToSelected = selectedNodeId === edge.source || selectedNodeId === edge.target;
                const strokeColor = edge.rail === 'cross-rail' ? 'url(#edge-cross-rail-grad)' : edge.rail === 'banking' ? '#a855f7' : '#24c7c9';

                return (
                  <g key={edge.id} className="edge-group">
                    {/* Underlying path track */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isConnectedToSelected ? strokeColor : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth={isConnectedToSelected ? '2.5' : '1.5'}
                      strokeDasharray={edge.rail === 'cross-rail' ? '4 3' : 'none'}
                    />

                    {/* Animated Photon Pulse running along the line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="3.5"
                      className="photon-trail"
                      style={{
                        strokeDasharray: '12 140',
                        animation: `flowPulse ${edge.rail === 'cross-rail' ? '1.8s' : '2.4s'} linear infinite`
                      }}
                    />

                    {/* Midpoint transfer tag */}
                    <text
                      x={(srcNode.x + tgtNode.x) / 2}
                      y={(srcNode.y + tgtNode.y) / 2 - 8}
                      fill={isConnectedToSelected ? '#ffffff' : '#64748b'}
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      className="edge-label"
                    >
                      {edge.amount}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Nodes */}
            <g className="nodes-layer">
              {NODES.map((node, index) => {
                if (isFilterHighRisk && node.risk < 85) return null;

                const isSelected = selectedNodeId === node.id;
                const isAutoActive = activeStep === index;
                const nodeColor = getNodeColor(node.type, node.risk);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setIsAutoTracing(false);
                    }}
                    style={{ cursor: 'pointer' }}
                    className="graph-node-group"
                  >
                    {/* Pulsing selection aura */}
                    {(isSelected || isAutoActive) && (
                      <circle
                        r="32"
                        fill="none"
                        stroke={nodeColor}
                        strokeWidth="1.5"
                        opacity="0.4"
                        className="pulse-aura"
                      />
                    )}

                    {/* Outer node disc */}
                    <circle
                      r="22"
                      fill="#0a1219"
                      stroke={nodeColor}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      filter={node.risk >= 90 ? 'url(#glow-red)' : node.type === 'crypto-origin' ? 'url(#glow-amber)' : 'url(#glow-cyan)'}
                    />

                    {/* Inner core glyph */}
                    <circle r="8" fill={nodeColor} opacity="0.9" />

                    {/* Node Type Indicator icon / initial */}
                    <text
                      y="3.5"
                      fill="#000000"
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="Inter, sans-serif"
                      textAnchor="middle"
                    >
                      {node.type === 'crypto-origin' ? 'ORG' : node.type === 'mixer' ? 'MIX' : node.type === 'upi' ? 'UPI' : node.type === 'bank' ? 'BNK' : 'HOP'}
                    </text>

                    {/* Primary Node Label */}
                    <text
                      y="36"
                      fill={isSelected ? '#ffffff' : '#e2e8f0'}
                      fontSize="11"
                      fontWeight="600"
                      fontFamily="Inter, sans-serif"
                      textAnchor="middle"
                    >
                      {node.label}
                    </text>

                    {/* Monospace Sublabel (Address / VPA) */}
                    <text
                      y="49"
                      fill="#94a3b8"
                      fontSize="9.5"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                    >
                      {node.sublabel}
                    </text>

                    {/* Risk Tag */}
                    <rect
                      x="-18"
                      y="-33"
                      width="36"
                      height="14"
                      rx="3"
                      fill={node.risk >= 85 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}
                      stroke={node.risk >= 85 ? '#ef4444' : '#f59e0b'}
                      strokeWidth="0.8"
                    />
                    <text
                      y="-23"
                      fill={node.risk >= 85 ? '#ef4444' : '#f59e0b'}
                      fontSize="8"
                      fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                    >
                      {node.risk}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Canvas Bottom Legend */}
          <div className="canvas-legend">
            <span className="legend-item">
              <span className="legend-dot bg-amber" /> Crypto Origin
            </span>
            <span className="legend-item">
              <span className="legend-dot bg-red" /> Privacy Mixer
            </span>
            <span className="legend-item">
              <span className="legend-dot bg-cyan" /> Cross-Rail P2P
            </span>
            <span className="legend-item">
              <span className="legend-dot bg-emerald" /> UPI Subject VPA
            </span>
            <span className="legend-item">
              <span className="legend-dot bg-purple" /> Banking Terminal
            </span>
          </div>
        </div>

        {/* Right Inspector Dossier */}
        <aside className="inspector-pane" aria-label="Selected Entity Inspector">
          <div className="inspector-header">
            <div className="inspector-title-row">
              <span className="inspector-eyebrow">ENTITY INSPECTION</span>
              {(() => {
                const style = getRiskBadgeColor(selectedNode.riskLevel);
                return (
                  <span
                    className="risk-badge"
                    style={{ background: style.bg, color: style.text, borderColor: style.border }}
                  >
                    RISK {selectedNode.risk}/100 • {selectedNode.riskLevel}
                  </span>
                );
              })()}
            </div>
            <h3 className="inspector-name">{selectedNode.label}</h3>
            <p className="inspector-identifier font-mono">{selectedNode.details.address}</p>
          </div>

          <div className="inspector-body">
            <div className="inspector-summary-box">
              <p className="summary-text">{selectedNode.details.summary}</p>
            </div>

            {/* Telemetry Metrics */}
            <div className="inspector-metrics-grid">
              <div className="metric-cell">
                <span className="metric-label">VOLUME TRACED</span>
                <span className="metric-val text-white font-mono">{selectedNode.volume}</span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">TRANSACTIONS</span>
                <span className="metric-val text-cyan font-mono">{selectedNode.details.txCount} Records</span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">FIRST DETECTED</span>
                <span className="metric-val text-white font-mono">{selectedNode.timestamp}</span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">NETWORK RAIL</span>
                <span className="metric-val text-white font-mono">{selectedNode.details.chain || selectedNode.details.bank || 'Cross-Rail'}</span>
              </div>
            </div>

            {/* Suspicious Risk Flags */}
            <div className="flags-section">
              <span className="flags-heading">DETECTED RISK SIGNALS</span>
              <div className="flags-list">
                {selectedNode.details.flags.map((flag, i) => (
                  <span key={i} className="flag-chip">
                    <span className="flag-bullet">▲</span> {flag}
                  </span>
                ))}
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="inspector-actions">
              <button
                type="button"
                className="action-btn-primary"
                onClick={() => alert(`Initiating recursive 3-hop trace on ${selectedNode.details.address}`)}
              >
                Expand Recursive Hops →
              </button>
              <button
                type="button"
                className="action-btn-secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(selectedNode.details.address);
                  alert('Address copied to clipboard.');
                }}
              >
                Copy Address
              </button>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .graph-section-wrapper {
          position: relative;
          width: 100%;
          max-width: 1560px;
          margin: 0 auto;
          padding: 80px 48px;
          background: #050a0e;
        }

        .section-head {
          margin-bottom: 32px;
          max-width: 820px;
        }

        .section-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          background: rgba(36, 199, 201, 0.08);
          border: 1px solid rgba(36, 199, 201, 0.25);
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: #24c7c9;
          letter-spacing: 0.08em;
          margin-bottom: 16px;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #24c7c9;
          box-shadow: 0 0 8px #24c7c9;
        }

        .section-title {
          font-size: 32px;
          font-weight: 600;
          color: #ffffff;
          line-height: 1.25;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }

        .section-description {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.6;
        }

        /* Telemetry Bar */
        .telemetry-bar {
          display: flex;
          align-items: center;
          background: #0a1219;
          border: 1px solid #16222f;
          border-radius: 8px;
          padding: 14px 24px;
          margin-bottom: 24px;
          gap: 24px;
          flex-wrap: wrap;
        }

        .telemetry-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .telemetry-k {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #64748b;
          letter-spacing: 0.06em;
        }

        .telemetry-v {
          font-size: 13px;
          font-weight: 600;
        }

        .telemetry-divider {
          width: 1px;
          height: 28px;
          background: #16222f;
        }

        .telemetry-actions {
          margin-left: auto;
          display: flex;
          gap: 10px;
        }

        .control-btn {
          background: #0e1822;
          border: 1px solid #16222f;
          color: #94a3b8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .control-btn:hover {
          color: #ffffff;
          border-color: #24c7c9;
        }

        .control-btn-active {
          background: rgba(36, 199, 201, 0.12);
          border-color: #24c7c9;
          color: #24c7c9;
        }

        /* Split Canvas Layout */
        .graph-canvas-container {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          background: #0a1219;
          border: 1px solid #16222f;
          border-radius: 12px;
          overflow: hidden;
        }

        @media (max-width: 1100px) {
          .graph-canvas-container {
            grid-template-columns: 1fr;
          }
        }

        .svg-canvas-pane {
          position: relative;
          background: radial-gradient(circle at 40% 50%, #0d1924 0%, #060b10 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px;
          min-height: 480px;
        }

        .graph-svg {
          width: 100%;
          height: auto;
          display: block;
        }

        @keyframes flowPulse {
          0% {
            stroke-dashoffset: 152;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .pulse-aura {
          animation: auraExpand 2s infinite ease-out;
        }

        @keyframes auraExpand {
          0% {
            r: 22;
            opacity: 0.8;
          }
          100% {
            r: 38;
            opacity: 0;
          }
        }

        .canvas-legend {
          display: flex;
          align-items: center;
          gap: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 11px;
          color: #94a3b8;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .bg-amber { background: #f59e0b; }
        .bg-red { background: #ef4444; }
        .bg-cyan { background: #24c7c9; }
        .bg-emerald { background: #10b981; }
        .bg-purple { background: #a855f7; }

        /* Right Inspector Panel */
        .inspector-pane {
          background: #0e1822;
          border-left: 1px solid #16222f;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .inspector-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .inspector-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #64748b;
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .risk-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid;
          letter-spacing: 0.05em;
        }

        .inspector-name {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .inspector-identifier {
          font-size: 11px;
          color: #24c7c9;
          word-break: break-all;
          margin-bottom: 16px;
        }

        .inspector-summary-box {
          background: rgba(5, 10, 14, 0.6);
          border: 1px solid #16222f;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 20px;
        }

        .summary-text {
          font-size: 12.5px;
          color: #94a3b8;
          line-height: 1.5;
        }

        .inspector-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .metric-cell {
          background: #0a1219;
          border: 1px solid #16222f;
          border-radius: 6px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #64748b;
          letter-spacing: 0.05em;
        }

        .metric-val {
          font-size: 12px;
          font-weight: 600;
        }

        .flags-section {
          margin-bottom: 24px;
        }

        .flags-heading {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #64748b;
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 8px;
        }

        .flags-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .flag-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          color: #e2e8f0;
          background: rgba(239, 68, 68, 0.08);
          border-left: 2px solid #ef4444;
          padding: 6px 10px;
          border-radius: 2px;
        }

        .flag-bullet {
          color: #ef4444;
          font-size: 9px;
        }

        .inspector-actions {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .action-btn-primary {
          background: #24c7c9;
          color: #050a0e;
          font-size: 13px;
          font-weight: 600;
          padding: 10px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: background 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn-primary:hover {
          background: #2ee6e9;
        }

        .action-btn-secondary {
          background: #0a1219;
          border: 1px solid #16222f;
          color: #cbd5e1;
          font-size: 12px;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn-secondary:hover {
          border-color: #24c7c9;
          color: #ffffff;
        }

        .text-amber { color: #f59e0b; }
        .text-white { color: #ffffff; }
        .text-cyan { color: #24c7c9; }
        .text-critical { color: #ef4444; }
      `}</style>
    </section>
  );
};
