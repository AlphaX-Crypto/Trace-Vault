import React from 'react';
import { 
  Building2, 
  ShieldAlert, 
  HelpCircle, 
  AlertCircle, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import './workspaceTab.css';

export default function WorkspaceAttributionTab({ result }) {
  if (!result) return null;

  const attributionCandidates = [
    {
      candidate: 'Binance Custody Hub',
      entityType: 'Centralized Virtual Asset Service Provider (VASP)',
      hopDistance: 3,
      supportingPath: '0x71c8...1350 → 0x1a2b...9012 → 0x88fa...10b2 → Binance HotWallet',
      registrySource: 'TRACEVAULT VASP Cluster Registry (Verified Hot Wallet #4)',
      confidence: '82%',
      reasoning: 'Destination address 0x28c6...1d60 matches known multi-sig deposit sweep structure operated by Binance. Intermediate node 0x88fa...10b2 identified as single-use deposit forwarder.',
      reviewStatus: 'Investigator Review Required'
    },
    {
      candidate: 'Wasabi Whirlpool Coordinator Pool',
      entityType: 'CoinJoin Privacy Enhancing Service',
      hopDistance: 2,
      supportingPath: '0x71c8...1350 → 0x1a2b...9012 → Wasabi Pool 0x48a1...99e1',
      registrySource: 'OFAC Sanctions & Mixer Heuristics Index',
      confidence: '78%',
      reasoning: 'Denomination matching and equal-sized output structure characteristic of 0.05 BTC Whirlpool rounds observed on Hop 2.',
      reviewStatus: 'Investigator Review Required'
    },
    {
      candidate: 'Axis Bank P2P Merchant Escrow',
      entityType: 'Commercial Payment Aggregator',
      hopDistance: 4,
      supportingPath: 'Cross-Rail Correlated Order → p2p_desk_blr@axis → fastmule@okaxis',
      registrySource: 'NPCI Master Merchant Registry',
      confidence: '74%',
      reasoning: 'UPI VPA registered under licensed payment aggregator gateway with high-frequency fiat off-ramp settlement behavior.',
      reviewStatus: 'Investigator Review Required'
    }
  ];

  return (
    <div className="tv-tab-workspace anim-workspace">
      {/* Notice Banner */}
      <div className="tv-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
        <div className="tv-card-header">
          <span className="tv-card-title">Potential VASP Association & Entity Attribution</span>
          <span className="tv-badge tv-badge-mono">Graph-Derived Association</span>
        </div>
        <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
          Attribution candidates are established through transaction path proximity, clustering heuristics, and known registry signatures. Proximity alone does not confirm legal identity or criminal responsibility. All findings represent investigative leads requiring corroboration.
        </p>
      </div>

      {/* Attribution Candidates Cards */}
      <div className="tv-attribution-cards-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {attributionCandidates.map((item, idx) => (
          <div key={idx} className="tv-card">
            <div className="tv-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={16} color="var(--accent-primary)" />
                <span className="font-semibold" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {item.candidate}
                </span>
                <span className="tv-badge tv-badge-mono">{item.entityType}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="tv-badge" style={{ color: 'var(--risk-high)', backgroundColor: 'var(--status-high-bg)', borderColor: 'var(--status-high-border)' }}>
                  {item.reviewStatus}
                </span>
                <span className="tv-badge tv-risk-low mono">
                  Confidence: {item.confidence}
                </span>
              </div>
            </div>

            <div className="tv-summary-attributes-grid" style={{ marginBottom: '14px' }}>
              <div className="tv-attr-item">
                <span className="tv-attr-label">HOP DISTANCE</span>
                <span className="tv-attr-value mono font-medium">{item.hopDistance} intermediary hops</span>
              </div>
              <div className="tv-attr-item">
                <span className="tv-attr-label">ATTRIBUTION CONFIDENCE</span>
                <span className="tv-attr-value mono font-semibold" style={{ color: 'var(--risk-low)' }}>
                  {item.confidence}
                </span>
              </div>
              <div className="tv-attr-item" style={{ gridColumn: 'span 2' }}>
                <span className="tv-attr-label">REGISTRY SOURCE</span>
                <span className="tv-attr-value font-medium">{item.registrySource}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span className="tv-attr-label">SUPPORTING PATH</span>
              <div className="mono font-medium" style={{ fontSize: '11.5px', color: 'var(--text-primary)', padding: '6px 10px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                {item.supportingPath}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
              <span className="tv-attr-label">INVESTIGATIVE REASONING</span>
              <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                {item.reasoning}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
