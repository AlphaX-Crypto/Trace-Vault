import React from 'react';

interface Capability {
  id: string;
  tag: string;
  title: string;
  description: string;
  metrics: { label: string; value: string }[];
  features: string[];
}

const CAPABILITIES: Capability[] = [
  {
    id: 'crypto-tracing',
    tag: 'MULTI-CHAIN INTELLIGENCE',
    title: 'Crypto Wallet Tracing & Hop Analysis',
    description: 'Autonomous transaction graphing across EVM, Tron, Bitcoin, and Solana. Unravel complex peeling chains and detect interaction with privacy mixers in seconds.',
    metrics: [
      { label: 'CHAINS SUPPORTED', value: '18 Networks' },
      { label: 'HOP DEPTH', value: 'Up to 24 Hops' }
    ],
    features: [
      'Peeling chain detection & recursive unmasking',
      'Smart contract mixer and bridge attribution',
      'Entity clustering across multi-input transactions',
      'Direct integration with VASP deposit addresses'
    ]
  },
  {
    id: 'upi-fraud',
    tag: 'DOMESTIC BANKING RAILS',
    title: 'UPI Flow & Account Network Analysis',
    description: 'Correlation of flagged UPI handles (VPAs), layered recipient accounts, and rapid cash-out patterns across domestic payment aggregators.',
    metrics: [
      { label: 'RESOLUTION SPEED', value: '< 250ms' },
      { label: 'PATTERN RECOGNITION', value: 'High Precision' }
    ],
    features: [
      'Automated recipient account clustering & network detection',
      'Real-time velocity spike & rapid withdrawal alerts',
      'VPA to linked bank account resolution',
      'Cross-bank sweep & layering identification'
    ]
  },
  {
    id: 'cross-rail',
    tag: 'CROSS-RAIL CORRELATION',
    title: 'Crypto-to-UPI Off-Ramp Correlation',
    description: 'Bridge pseudo-anonymous blockchain addresses with domestic banking identities by cross-referencing P2P escrow timings, trade volumes, and fiat settlements.',
    metrics: [
      { label: 'CORRELATION ENGINE', value: 'Temporal + Volume' },
      { label: 'MATCH CONFIDENCE', value: 'Score 0-100' }
    ],
    features: [
      'P2P exchange order book timeline alignment',
      'Volume-calibrated transaction pair matching',
      'Off-ramp merchant liquidity monitoring',
      'Cross-jurisdictional financial flow reconstruction'
    ]
  },
  {
    id: 'evidence-dossier',
    tag: 'EVIDENTIARY AUDIT',
    title: 'Investigation Dossier & Case Vault',
    description: 'Generate comprehensive investigative dossiers with cryptographic integrity digests, verified transaction timelines, and structured audit logs.',
    metrics: [
      { label: 'AUDIT LOG', value: 'Append-Only SHA-256' },
      { label: 'EXPORT FORMATS', value: 'PDF, JSON, CSV' }
    ],
    features: [
      'Cryptographically signed audit logs for every trace',
      'Vectorized transaction graph export for investigative exhibits',
      'Automated statutory notice templates (Section 91 / BNS)',
      'Secure multi-investigator evidence repository'
    ]
  }
];

export const PlatformCapabilities: React.FC = () => {
  return (
    <section id="capabilities" className="capabilities-wrapper" aria-label="TraceVault Platform Capabilities">
      <div className="capabilities-header">
        <div className="eyebrow-badge">
          <span className="dot" />
          <span>INVESTIGATION SUITE</span>
        </div>
        <h2 className="title">Engineered for Complex Financial Investigations</h2>
        <p className="subtitle">
          TraceVault provides institutional-grade tracing capabilities combining blockchain analytics with domestic banking rail correlation.
        </p>
      </div>

      <div className="capabilities-grid">
        {CAPABILITIES.map((cap) => (
          <article key={cap.id} className="cap-card">
            <div className="card-top">
              <span className="cap-tag font-mono">{cap.tag}</span>
              <h3 className="cap-title">{cap.title}</h3>
              <p className="cap-desc">{cap.description}</p>
            </div>

            <div className="cap-metrics">
              {cap.metrics.map((m, idx) => (
                <div key={idx} className="metric-box">
                  <span className="metric-k font-mono">{m.label}</span>
                  <span className="metric-v font-mono">{m.value}</span>
                </div>
              ))}
            </div>

            <div className="cap-features">
              <span className="features-label font-mono">CORE CAPABILITIES</span>
              <ul className="features-list">
                {cap.features.map((feat, i) => (
                  <li key={i} className="feature-item">
                    <span className="bullet">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <style>{`
        .capabilities-wrapper {
          width: 100%;
          max-width: 1560px;
          margin: 0 auto;
          padding: 80px 48px;
          background: #050a0e;
        }

        .capabilities-header {
          max-width: 820px;
          margin-bottom: 48px;
        }

        .eyebrow-badge {
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

        .eyebrow-badge .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #24c7c9;
          box-shadow: 0 0 8px #24c7c9;
        }

        .title {
          font-size: 32px;
          font-weight: 600;
          color: #ffffff;
          line-height: 1.25;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }

        .subtitle {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.6;
        }

        .capabilities-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        @media (max-width: 900px) {
          .capabilities-grid {
            grid-template-columns: 1fr;
          }
        }

        .cap-card {
          background: #0a1219;
          border: 1px solid #16222f;
          border-radius: 12px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cap-card:hover {
          border-color: rgba(36, 199, 201, 0.35);
          background: #0e1822;
          transform: translateY(-2px);
        }

        .card-top {
          margin-bottom: 24px;
        }

        .cap-tag {
          font-size: 10px;
          color: #24c7c9;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
          display: block;
        }

        .cap-title {
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 12px;
          line-height: 1.35;
        }

        .cap-desc {
          font-size: 13.5px;
          color: #94a3b8;
          line-height: 1.6;
        }

        .cap-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: #050a0e;
          border: 1px solid #16222f;
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 24px;
        }

        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .metric-k {
          font-size: 9.5px;
          color: #64748b;
          letter-spacing: 0.06em;
        }

        .metric-v {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
        }

        .cap-features {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 20px;
        }

        .features-label {
          font-size: 9.5px;
          color: #64748b;
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 12px;
        }

        .features-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 12.5px;
          color: #cbd5e1;
          line-height: 1.4;
        }

        .bullet {
          color: #24c7c9;
          font-size: 12px;
          font-weight: bold;
        }
      `}</style>
    </section>
  );
};
