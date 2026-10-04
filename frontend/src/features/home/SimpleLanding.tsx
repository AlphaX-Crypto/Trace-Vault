import React, { useState, useEffect } from 'react';

interface SimpleLandingProps {
  onSignInClick: () => void;
  onExploreClick: () => void;
}

interface Node {
  id: string;
  name: string;
  sub: string;
  x: number;
  y: number;
  type: 'origin' | 'hop' | 'contract' | 'rail' | 'endpoint';
}

const GRAPH_NODES: Node[] = [
  { id: 'n1', name: 'Origin Wallet', sub: '0x71c...4982', x: 120, y: 190, type: 'origin' },
  { id: 'n2', name: 'Transfer Hop 1', sub: '0x3b8...e109', x: 300, y: 120, type: 'hop' },
  { id: 'n3', name: 'Transfer Hop 2', sub: '0x92f...a541', x: 300, y: 260, type: 'hop' },
  { id: 'n4', name: 'Contract Pool', sub: '0xd90...c021', x: 500, y: 190, type: 'contract' },
  { id: 'n5', name: 'P2P Counterparty', sub: '0x18d...502b', x: 700, y: 130, type: 'rail' },
  { id: 'n6', name: 'UPI Endpoint', sub: 'vpa98@okhdfcbank', x: 900, y: 130, type: 'endpoint' },
  { id: 'n7', name: 'Settlement Account', sub: 'HDFC A/C ...8192', x: 900, y: 260, type: 'endpoint' }
];

const GRAPH_EDGES = [
  { from: 'n1', to: 'n2', label: '30.0 ETH' },
  { from: 'n1', to: 'n3', label: '12.5 ETH' },
  { from: 'n2', to: 'n4', label: 'Layering' },
  { from: 'n3', to: 'n4', label: 'Layering' },
  { from: 'n4', to: 'n5', label: 'Liquidation' },
  { from: 'n5', to: 'n6', label: 'UPI Settlement' },
  { from: 'n6', to: 'n7', label: 'Account Sweep' }
];

export const SimpleLanding: React.FC<SimpleLandingProps> = ({
  onSignInClick,
  onExploreClick
}) => {
  const [activeNode, setActiveNode] = useState<string>('n1');

  // Gentle traversal cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNode((prev) => {
        const idx = GRAPH_NODES.findIndex((n) => n.id === prev);
        return GRAPH_NODES[(idx + 1) % GRAPH_NODES.length].id;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const selected = GRAPH_NODES.find((n) => n.id === activeNode) || GRAPH_NODES[0];

  return (
    <div className="landing-root">
      {/* ========================================================
          SECTION 1: HERO VIEWPORT (Clean, Light, Professional)
         ======================================================== */}
      <section className="hero-section" aria-label="TraceVault Introduction">
        {/* Minimal Clean Header */}
        <header className="hero-header">
          <div className="brand">
            <div className="brand-logo-circle">TV</div>
            <span className="brand-name">TraceVault</span>
          </div>
          <div className="header-actions">
            <button type="button" onClick={onSignInClick} className="btn-signin-outline">
              Sign In
            </button>
            <button type="button" onClick={onSignInClick} className="btn-signin-primary">
              Open Workstation
            </button>
          </div>
        </header>

        {/* Hero Centerpiece: Clean Product Identity */}
        <div className="hero-center-container">
          <div className="hero-identity-cluster">
            <span className="hero-brand-eyebrow">FINANCIAL INVESTIGATION PLATFORM</span>
            <h1 className="hero-headline">
              Crypto Wallet Tracing
              <br />
              &amp; UPI Fraud Detection
            </h1>
            <p className="hero-supporting">
              A precise workstation for intelligence officers and financial investigators to trace multi-hop transactions across blockchain networks and domestic banking rails.
            </p>
            <div className="hero-cta-group">
              <button type="button" onClick={onSignInClick} className="btn-cta-primary">
                Access Platform →
              </button>
              <button
                type="button"
                onClick={() => {
                  const traceSec = document.getElementById('trace-section');
                  traceSec?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-cta-secondary"
              >
                Inspect Ledger Flow
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Cue */}
        <div className="hero-scroll-cue">
          <span className="scroll-cue-text">Scroll to inspect multi-rail transaction trace</span>
          <span className="scroll-cue-arrow" aria-hidden="true">↓</span>
        </div>
      </section>

      {/* ========================================================
          SECTION 2: TRANSACTION TRACE GRAPH
         ======================================================== */}
      <section id="trace-section" className="trace-section" aria-label="Transaction and Relationship Graph">
        <div className="trace-inner">
          <div className="trace-header">
            <span className="trace-eyebrow">TRANSACTION TRACE WORKSPACE</span>
            <h2 className="trace-title">Follow the movement of funds across connected financial rails</h2>
            <p className="trace-subtitle">
              Reconstructing fund flows from origin crypto addresses through intermediate peeling hops to domestic UPI endpoints.
            </p>
          </div>

          {/* Dedicated Graph Visual Canvas */}
          <div className="graph-card-wrapper">
            <div className="graph-card">
              <svg className="graph-svg" viewBox="0 0 1020 380" preserveAspectRatio="xMidYMid meet">
                {/* Edges */}
                <g className="edges-layer">
                  {GRAPH_EDGES.map((edge, idx) => {
                    const src = GRAPH_NODES.find((n) => n.id === edge.from);
                    const tgt = GRAPH_NODES.find((n) => n.id === edge.to);
                    if (!src || !tgt) return null;

                    const isConnected = activeNode === edge.from || activeNode === edge.to;
                    const dx = tgt.x - src.x;
                    const c1x = src.x + dx * 0.5;
                    const c1y = src.y;
                    const c2x = src.x + dx * 0.5;
                    const c2y = tgt.y;
                    const d = `M ${src.x} ${src.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tgt.x} ${tgt.y}`;

                    return (
                      <g key={idx}>
                        <path
                          d={d}
                          fill="none"
                          stroke={isConnected ? '#2563eb' : '#cbd5e1'}
                          strokeWidth={isConnected ? '2' : '1.25'}
                        />
                        <text
                          x={(src.x + tgt.x) / 2}
                          y={(src.y + tgt.y) / 2 - 8}
                          fill={isConnected ? '#1e293b' : '#64748b'}
                          fontSize="11"
                          fontWeight={isConnected ? '600' : '500'}
                          fontFamily="Inter, sans-serif"
                          textAnchor="middle"
                        >
                          {edge.label}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Nodes */}
                <g className="nodes-layer">
                  {GRAPH_NODES.map((node) => {
                    const isActive = activeNode === node.id;
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => setActiveNode(node.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {isActive && (
                          <circle
                            r="22"
                            fill="#eff6ff"
                            stroke="#2563eb"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                        )}
                        <circle
                          r="15"
                          fill="#ffffff"
                          stroke={isActive ? '#2563eb' : '#94a3b8'}
                          strokeWidth={isActive ? '2' : '1.5'}
                        />
                        <circle
                          r="5"
                          fill={isActive ? '#2563eb' : '#64748b'}
                        />
                        <text
                          y="30"
                          fill={isActive ? '#0f172a' : '#475569'}
                          fontSize="11.5"
                          fontWeight={isActive ? '600' : '500'}
                          fontFamily="Inter, sans-serif"
                          textAnchor="middle"
                        >
                          {node.name}
                        </text>
                        <text
                          y="45"
                          fill="#64748b"
                          fontSize="10"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {node.sub}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Quiet Node Highlight Caption */}
              <div className="graph-caption-bar">
                <span className="caption-prefix">Active Entity:</span>
                <span className="caption-title">{selected.name}</span>
                <span className="caption-hash font-mono">{selected.sub}</span>
              </div>
            </div>
          </div>

          {/* Simple Explore CTA */}
          <div className="trace-action-cluster">
            <button
              type="button"
              onClick={onExploreClick}
              className="btn-explore-primary"
            >
              <span>Open Investigation Console</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Standard Product Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            TraceVault Financial Intelligence • v2.4
          </div>
          <div className="footer-links">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Documentation</span>
            <span>API Status: Operational</span>
          </div>
        </div>
      </footer>

      <style>{`
        .landing-root {
          position: relative;
          width: 100%;
          min-height: 100vh;
          background-color: #ffffff;
          color: #111827;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-x: hidden;
        }

        /* Hero Viewport */
        .hero-section {
          position: relative;
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 0 40px 48px 40px;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
        }

        .hero-header {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-logo-circle {
          width: 36px;
          height: 36px;
          background: #2563eb;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: -0.02em;
        }

        .brand-name {
          font-size: 17px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.01em;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-signin-outline {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #1e293b;
          font-size: 13.5px;
          font-weight: 500;
          padding: 8px 18px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-signin-outline:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .btn-signin-primary {
          background: #2563eb;
          border: 1px solid #2563eb;
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 500;
          padding: 8px 18px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-signin-primary:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        .hero-center-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 0;
        }

        .hero-identity-cluster {
          max-width: 780px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .hero-brand-eyebrow {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: #2563eb;
          background: #eff6ff;
          padding: 4px 14px;
          border-radius: 9999px;
          border: 1px solid #dbeafe;
        }

        .hero-headline {
          font-size: clamp(38px, 4.8vw, 56px);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.15;
          color: #111827;
        }

        .hero-supporting {
          font-size: clamp(15px, 1.25vw, 17px);
          font-weight: 400;
          color: #64748b;
          line-height: 1.6;
          max-width: 620px;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 10px;
        }

        .btn-cta-primary {
          background: #2563eb;
          color: #ffffff;
          border: 1px solid #2563eb;
          font-size: 14px;
          font-weight: 600;
          padding: 12px 26px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-cta-primary:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        .btn-cta-secondary {
          background: #ffffff;
          color: #334155;
          border: 1px solid #e2e8f0;
          font-size: 14px;
          font-weight: 500;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-cta-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .hero-scroll-cue {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: #94a3b8;
          font-size: 12px;
          user-select: none;
        }

        .scroll-cue-arrow {
          font-size: 14px;
        }

        /* Section 2: Trace */
        .trace-section {
          width: 100%;
          min-height: 100vh;
          padding: 80px 40px 100px 40px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .trace-inner {
          max-width: 1140px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 36px;
        }

        .trace-header {
          text-align: center;
          max-width: 680px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .trace-eyebrow {
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: #2563eb;
        }

        .trace-title {
          font-size: clamp(26px, 3.2vw, 34px);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #111827;
          line-height: 1.25;
        }

        .trace-subtitle {
          font-size: 14.5px;
          color: #64748b;
          line-height: 1.6;
        }

        .graph-card-wrapper {
          width: 100%;
        }

        .graph-card {
          width: 100%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 32px 24px 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .graph-svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .graph-caption-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding-top: 14px;
          border-top: 1px solid #f1f5f9;
          font-size: 12.5px;
        }

        .caption-prefix {
          color: #64748b;
        }

        .caption-title {
          color: #111827;
          font-weight: 600;
        }

        .caption-hash {
          color: #2563eb;
          background: #eff6ff;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .trace-action-cluster {
          margin-top: 8px;
        }

        .btn-explore-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 24px;
          background: #2563eb;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-explore-primary:hover {
          background: #1d4ed8;
        }

        .btn-arrow {
          font-size: 15px;
          transition: transform 0.15s ease;
        }

        .btn-explore-primary:hover .btn-arrow {
          transform: translateX(3px);
        }

        .landing-footer {
          width: 100%;
          border-top: 1px solid #e2e8f0;
          padding: 24px 40px;
          background: #ffffff;
        }

        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12.5px;
          color: #64748b;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-brand {
          font-weight: 500;
          color: #475569;
        }

        .footer-links {
          display: flex;
          gap: 20px;
        }
      `}</style>
    </div>
  );
};
