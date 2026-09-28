import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  Layers, 
  Building2, 
  Lock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Radio,
  FileSpreadsheet,
  Globe2,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import './Dashboard.css';

const RAIL_SHOWCASE_DATA = {
  EVM: {
    title: 'Ethereum EVM NetworkX Traversal Engine',
    description: 'Autonomous graph traversal computing multi-hop peel-chains, co-spend heuristics, and smart contract mixer pool interaction trees in real-time.',
    specs: [
      { label: 'THROUGHPUT', value: '14,200 TPS Graph Traversal' },
      { label: 'DEPTH HORIZON', value: 'Up to 12 Hops Deep' },
      { label: 'MEMPOOL MONITOR', value: 'Sub-second Zero-Confirmation' },
      { label: 'EVM CORRIDORS', value: 'ETH, Arbitrum, Optimism, Polygon' }
    ],
    statusTag: 'ACTIVE // ETH MAINNET',
    hash: '0x9a8f3b12...561a012'
  },
  UPI: {
    title: 'NPCI Core Switch UPI Telemetry Engine',
    description: 'Rule-based explainable risk engine correlating Virtual Payment Addresses (VPAs), IMPS/NEFT batches, and rapid multi-state dispersal funnels.',
    specs: [
      { label: 'TRANSACTION VELOCITY', value: '42 Tx / Minute Peak' },
      { label: 'GEOSPATIAL AUDIT', value: 'BTS Cell Tower Telemetry' },
      { label: 'SETTLEMENT LATENCY', value: '<240ms NPCI Core' },
      { label: 'BANK NODES', value: 'Axis, ICICI, SBI, HDFC' }
    ],
    statusTag: 'LIVE // NPCI BATCH 992',
    hash: 'UPI-RR-481928401928'
  },
  VASP: {
    title: 'VASP Gateway & KYC Attestation Engine',
    description: 'Deterministic clustering attribution linking unhosted crypto deposits to FIU-IND registered Reporting Entities with automated Section 91 notices.',
    specs: [
      { label: 'CLUSTER ACCURACY', value: '82% - 96% Confidence' },
      { label: 'FIU REGISTRY', value: '28 Registered Exchanges' },
      { label: 'SUBPOENA CYCLE', value: 'Instant Sec 91 CrPC Pack' },
      { label: 'FREEZE PROTOCOL', value: 'Automated MLAT Draft' }
    ],
    statusTag: 'COMPLIANT // FIU-IND',
    hash: 'FIU-CRY-0082-CERT'
  }
};

const SPOTLIGHT_ITEMS = [
  {
    id: 'spot-1',
    date: 'MARCH 28, 2026',
    title: 'Peel-Chain Layering Signature Identified (Corridor ETH-9842)',
    summary: 'A high-frequency fund-splitting sequence was intercepted traversing 4 intermediate unhosted wallets within 90 seconds. Cluster heuristic attributed the ultimate deposit endpoint to Binance Hot Wallet #4 with 82% confidence.'
  },
  {
    id: 'spot-2',
    date: 'MARCH 26, 2026',
    title: 'Cross-Rail Crypto-to-UPI Arbitrage Anomaly Flagged',
    summary: 'Temporal velocity correlation detected a fiat off-ramp settlement on Axis Bank P2P desk occurred exactly 21 minutes after an on-chain Wasabi Mixer unspent output release. Section 91 CrPC freeze notice served.'
  },
  {
    id: 'spot-3',
    date: 'MARCH 24, 2026',
    title: 'Geospatial Impossibility Travel Flag (6,400 km in 18 seconds)',
    summary: 'Simultaneous telecom cell IPDR logs revealed an active subscriber session in Bangalore while transaction routing originated from a Frankfurt Tor exit node. Section 65B forensic certificate exported.'
  },
  {
    id: 'spot-4',
    date: 'MARCH 21, 2026',
    title: 'Automated FIPS 180-4 Merkle Root Ledger Attestation',
    summary: 'All 14 exhibits in Docket TV-2026-041 were committed to write-once hardware enclaves with RFC 3161 timestamps, establishing an unbroken chain of custody admissible in judicial proceedings.'
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRail, setSelectedRail] = useState('EVM');
  const [openSpotlight, setOpenSpotlight] = useState('spot-1');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const data = await api.getCases();
        setCases(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load dashboard cases:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const activeRailData = RAIL_SHOWCASE_DATA[selectedRail];

  return (
    <div className="dash-page">
      {/* Laser beam scanner line */}
      <div className="grid-beam-scanner" aria-hidden="true" />

      {/* Hero Command Header with Floating Cyber Core */}
      <section className="dash-hero anim-fade-in">
        <div className="dash-hero-left">
          <div className="dash-eyebrow">
            <span>[ 01 // NATIONAL FORENSIC COMMAND PLATFORM ]</span>
            <span>•</span>
            <span style={{ color: '#4ade80' }}>HSM IMMUTABLE ENCLAVE ACTIVE</span>
          </div>
          <h1 className="dash-hero-title">
            Autonomous Multi-Rail Financial Intelligence
          </h1>
          <p className="dash-hero-desc">
            Unified forensic tracing infrastructure traversing Ethereum unhosted wallets, peel-chain layering corridors, VASP deposit clusters, and NPCI core UPI banking switches.
          </p>

          <div className="dash-hero-actions">
            <Link to="/cases/new" className="btn-pill btn-pill-primary">
              <Plus size={14} />
              <span>Open New Case</span>
            </Link>
            <Link to="/graph" className="btn-pill btn-pill-secondary">
              <Layers size={13} />
              <span>Multi-Hop Matrix</span>
            </Link>
            <Link to="/evidence" className="btn-pill btn-pill-secondary">
              <Lock size={13} />
              <span>Evidence Vault</span>
            </Link>
          </div>
        </div>

        {/* Floating 3D Enclave Hologram (Matching video hero core) */}
        <div className="hero-hologram-card">
          <div className="hologram-header">
            <span className="bento-tag">[ FIPS 140-3 HARDWARE VAULT ]</span>
            <span className="tag tag-low">ONLINE</span>
          </div>

          <div className="hologram-visual-wrapper">
            <div className="hologram-cube">
              <div className="cube-face cube-front" />
              <div className="cube-face cube-back" />
              <div className="cube-face cube-right" />
              <div className="cube-face cube-left" />
              <div className="cube-face cube-top" />
              <div className="cube-face cube-bottom" />
            </div>
          </div>

          <div className="hologram-footer">
            <div>
              <div className="mono muted" style={{ fontSize: '9px' }}>ACTIVE MERKLE ROOT</div>
              <div className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                0x7a8f...9b2c
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono muted" style={{ fontSize: '9px' }}>PROVENANCE</div>
              <div className="mono" style={{ fontSize: '11px', fontWeight: 700, color: '#4ade80' }}>
                100% UNBROKEN
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top 4 Bento Metric Cards */}
      <section className="dash-metrics-grid anim-fade-in anim-stagger-1">
        <div className="bento-metric-box">
          <div className="bento-metric-top">
            <span className="bento-metric-tag">[ 01 // CASEWORK ]</span>
            <span className="tag tag-critical">18 Active</span>
          </div>
          <div className="bento-metric-val">18 Cases</div>
          <div className="bento-metric-sub">4 Critical Severity · 7 State Units</div>
        </div>

        <div className="bento-metric-box">
          <div className="bento-metric-top">
            <span className="bento-metric-tag">[ 02 // TRAVERSED VALUE ]</span>
            <span className="tag tag-low">Cross-Rail</span>
          </div>
          <div className="bento-metric-val">₹48.20 Cr</div>
          <div className="bento-metric-sub">84.70 ETH + ₹3.85M UPI Dispersal</div>
        </div>

        <div className="bento-metric-box">
          <div className="bento-metric-top">
            <span className="bento-metric-tag">[ 03 // VASP ATTRIBUTION ]</span>
            <span className="tag tag-high">Probable</span>
          </div>
          <div className="bento-metric-val">82% Match</div>
          <div className="bento-metric-sub">Binance Hot Wallet #4 Identified</div>
        </div>

        <div className="bento-metric-box">
          <div className="bento-metric-top">
            <span className="bento-metric-tag">[ 04 // STATUTORY VAULT ]</span>
            <span className="tag tag-low">Sec 65B</span>
          </div>
          <div className="bento-metric-val">100% Sealed</div>
          <div className="bento-metric-sub">FIPS 180-4 SHA-256 Merkle Provenance</div>
        </div>
      </section>

      {/* Interactive Rail Engine Showcase (Like "Universal ZQL Wallets" in video) */}
      <section className="rail-showcase-section anim-fade-in anim-stagger-2">
        <div className="rail-showcase-header">
          <span className="bento-tag">[ 02 // MULTI-RAIL INTELLIGENCE ENGINES ]</span>
          <h2 className="rail-showcase-title">Autonomous Rail Telemetry Architecture</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Switch between financial rail pipelines to inspect real-time traversal heuristics, throughput, and cryptographic attestation.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="rail-tabs-control">
          <button 
            className={`rail-tab-btn ${selectedRail === 'EVM' ? 'active' : ''}`}
            onClick={() => setSelectedRail('EVM')}
          >
            <Cpu size={13} />
            <span>[ 01 // ETHEREUM EVM ENGINE ]</span>
          </button>
          <button 
            className={`rail-tab-btn ${selectedRail === 'UPI' ? 'active' : ''}`}
            onClick={() => setSelectedRail('UPI')}
          >
            <Radio size={13} />
            <span>[ 02 // NPCI UPI CORE SWITCH ]</span>
          </button>
          <button 
            className={`rail-tab-btn ${selectedRail === 'VASP' ? 'active' : ''}`}
            onClick={() => setSelectedRail('VASP')}
          >
            <Building2 size={13} />
            <span>[ 03 // VASP FIAT OFF-RAMP ]</span>
          </button>
        </div>

        {/* Active Display Panel with Animated Specs */}
        <div className="rail-display-panel">
          <div className="rail-details-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="tag tag-low">{activeRailData.statusTag}</span>
              <span className="mono muted" style={{ fontSize: '10px' }}>REF: {activeRailData.hash}</span>
            </div>
            <h3>{activeRailData.title}</h3>
            <p>{activeRailData.description}</p>
            <Link to="/graph" className="btn-pill btn-pill-primary" style={{ height: '32px', fontSize: '11px', padding: '0 14px' }}>
              <span>Traverse This Rail</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="rail-specs-grid">
            {activeRailData.specs.map((s, idx) => (
              <div key={idx} className="spec-item">
                <span className="spec-label">{s.label}</span>
                <span className="spec-value">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sequential Multi-Rail Flow Progression Bento Section */}
      <section className="dash-flow-section anim-fade-in anim-stagger-3">
        <div className="dash-section-header">
          <h2 className="dash-section-title">
            <Layers size={15} />
            <span>Multi-Rail Dispersion Corridor (Hop 0 → Hop 5)</span>
          </h2>
          <Link to="/graph" className="btn-pill btn-pill-secondary" style={{ height: '28px', fontSize: '11px', padding: '0 12px' }}>
            <span>View Full Ledger</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="bento-flow-grid">
          <div className="bento-flow-card" onClick={() => navigate('/graph')}>
            <div className="bento-flow-top">
              <span className="bento-flow-num">[ 00 ]</span>
              <span className="tag tag-critical">SEED</span>
            </div>
            <div>
              <div className="bento-flow-role">Threat Actor</div>
              <div className="bento-flow-target">0x71F9...E84C2</div>
            </div>
            <div className="bento-flow-val">84.70 ETH</div>
          </div>

          <div className="bento-flow-card" onClick={() => navigate('/graph')}>
            <div className="bento-flow-top">
              <span className="bento-flow-num">[ 01 ]</span>
              <span className="tag tag-high">SPLIT</span>
            </div>
            <div>
              <div className="bento-flow-role">Peel-Chain</div>
              <div className="bento-flow-target">0x1a2b...9012</div>
            </div>
            <div className="bento-flow-val">45.20 ETH</div>
          </div>

          <div className="bento-flow-card" onClick={() => navigate('/graph')}>
            <div className="bento-flow-top">
              <span className="bento-flow-num">[ 02 ]</span>
              <span className="tag tag-high">SWEEP</span>
            </div>
            <div>
              <div className="bento-flow-role">Consolidation</div>
              <div className="bento-flow-target">0x88fa...b210</div>
            </div>
            <div className="bento-flow-val">42.00 ETH</div>
          </div>

          <div className="bento-flow-card" onClick={() => navigate('/graph')}>
            <div className="bento-flow-top">
              <span className="bento-flow-num">[ 03 ]</span>
              <span className="tag tag-medium">GATEWAY</span>
            </div>
            <div>
              <div className="bento-flow-role">VASP Cluster</div>
              <div className="bento-flow-target">Binance #4</div>
            </div>
            <div className="bento-flow-val">42.00 ETH</div>
          </div>

          <div className="bento-flow-card" onClick={() => navigate('/graph')}>
            <div className="bento-flow-top">
              <span className="bento-flow-num">[ 04 ]</span>
              <span className="tag tag-high">P2P BRIDGE</span>
            </div>
            <div>
              <div className="bento-flow-role">Off-Ramp Desk</div>
              <div className="bento-flow-target">p2p_blr@axis</div>
            </div>
            <div className="bento-flow-val">₹3,850,000</div>
          </div>

          <div className="bento-flow-card" onClick={() => navigate('/graph')}>
            <div className="bento-flow-top">
              <span className="bento-flow-num">[ 05 ]</span>
              <span className="tag tag-critical">MULE CASH</span>
            </div>
            <div>
              <div className="bento-flow-role">Mule Funnel</div>
              <div className="bento-flow-target">outlet@icici</div>
            </div>
            <div className="bento-flow-val">₹950,000</div>
          </div>
        </div>
      </section>

      {/* Interactive Spotlight Intelligence Disclosures (Like "In the Spotlight" from Video) */}
      <section className="spotlight-section anim-fade-in anim-stagger-4">
        <div className="dash-section-header">
          <h2 className="dash-section-title">
            <span>In the Forensic Spotlight · Key Operational Disclosures</span>
          </h2>
          <span className="bento-tag">[ REAL-TIME INTELLIGENCE FEED ]</span>
        </div>

        {SPOTLIGHT_ITEMS.map((item) => {
          const isOpen = openSpotlight === item.id;
          return (
            <div 
              key={item.id} 
              className={`spotlight-item ${isOpen ? 'open' : ''}`}
              onClick={() => setOpenSpotlight(isOpen ? null : item.id)}
            >
              <div className="spotlight-header">
                <div>
                  <div className="spotlight-date">{item.date}</div>
                  <h3 className="spotlight-title">{item.title}</h3>
                </div>
                <div className="spotlight-expand-icon">
                  <Plus size={14} />
                </div>
              </div>

              {isOpen && (
                <div className="spotlight-body">
                  <p style={{ margin: '0 0 10px 0' }}>{item.summary}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-pill btn-pill-secondary" 
                      style={{ height: '26px', fontSize: '10px', padding: '0 10px' }}
                      onClick={(e) => { e.stopPropagation(); navigate('/graph'); }}
                    >
                      Inspect Ledger Proof
                    </button>
                    <button 
                      className="btn-pill btn-pill-secondary" 
                      style={{ height: '26px', fontSize: '10px', padding: '0 10px' }}
                      onClick={(e) => { e.stopPropagation(); navigate('/evidence'); }}
                    >
                      View Merkle Exhibit
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Two-Column Command Grid: Cases Table & VASP Attributions */}
      <section className="dash-main-grid anim-fade-in anim-stagger-5">
        {/* Left Column: Active Cases Table */}
        <div className="bento-card">
          <div className="gov-card-header">
            <h3 className="gov-card-title">Priority Casework Registry</h3>
            <Link to="/cases" style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>View All 18 Cases</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <table className="gov-table">
            <thead>
              <tr>
                <th>Docket ID</th>
                <th>Target Reference</th>
                <th>Rail Scope</th>
                <th>Risk Tier</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono" style={{ fontWeight: 700 }}>TV-2024-0847</td>
                <td>
                  <div style={{ fontWeight: 600 }}>DarkNet Mixer Peel Trace</div>
                  <div className="mono muted" style={{ fontSize: '10px' }}>0x71F9...E84C2</div>
                </td>
                <td><span className="rail-badge crypto">CRYPTO</span></td>
                <td><span className="tag tag-critical">CRITICAL (88)</span></td>
                <td>
                  <Link to="/graph" className="btn-secondary" style={{ padding: '3px 10px', height: '24px', fontSize: '10px' }}>
                    Open Hop
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="mono" style={{ fontWeight: 700 }}>TV-2026-0041</td>
                <td>
                  <div style={{ fontWeight: 600 }}>Cross-Rail Ransom Liquidity</div>
                  <div className="mono muted" style={{ fontSize: '10px' }}>p2p_desk_blr@axis</div>
                </td>
                <td><span className="rail-badge upi">CROSS-RAIL</span></td>
                <td><span className="tag tag-high">HIGH (74)</span></td>
                <td>
                  <Link to="/geospatial" className="btn-secondary" style={{ padding: '3px 10px', height: '24px', fontSize: '10px' }}>
                    Telemetry
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="mono" style={{ fontWeight: 700 }}>TV-2026-0092</td>
                <td>
                  <div style={{ fontWeight: 600 }}>Rapid Funnel Mule Network</div>
                  <div className="mono muted" style={{ fontSize: '10px' }}>merchant_delhi@icici</div>
                </td>
                <td><span className="rail-badge upi">UPI</span></td>
                <td><span className="tag tag-critical">CRITICAL (92)</span></td>
                <td>
                  <Link to="/evidence" className="btn-secondary" style={{ padding: '3px 10px', height: '24px', fontSize: '10px' }}>
                    Exhibits
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right Column: VASP Partners & Corroboration Wall */}
        <div className="bento-card">
          <div className="gov-card-header">
            <h3 className="gov-card-title">Corroborated VASP & Gateway Endpoints</h3>
            <span className="bento-tag">[ FIU-IND REPORTING ENTITIES ]</span>
          </div>

          <div className="vasp-wall-list">
            <div className="vasp-wall-item">
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Binance (Hot Wallet #4)</div>
                <div className="mono muted" style={{ fontSize: '10px' }}>Deposit Cluster · 42.00 ETH Inflow</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="tag tag-low">82% Match</span>
                <div className="muted" style={{ fontSize: '10px', marginTop: '3px' }}>S.91 Served</div>
              </div>
            </div>

            <div className="vasp-wall-item">
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>CoinDCX (Settlement Pool)</div>
                <div className="mono muted" style={{ fontSize: '10px' }}>FIU-IND Reg #FIU-CRY-0082</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="tag tag-low">94% Match</span>
                <div className="muted" style={{ fontSize: '10px', marginTop: '3px' }}>KYC Confirmed</div>
              </div>
            </div>

            <div className="vasp-wall-item">
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Axis Bank Core Gateway</div>
                <div className="mono muted" style={{ fontSize: '10px' }}>P2P Fiat Off-Ramp Desk (BLR)</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="tag tag-critical">Frozen</span>
                <div className="muted" style={{ fontSize: '10px', marginTop: '3px' }}>₹3.85M Locked</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono muted" style={{ fontSize: '10px' }}>CERTIFIED PRODUCTION ORDERS</span>
            <button className="btn-pill btn-pill-secondary" style={{ height: '28px', fontSize: '10px', padding: '0 12px' }} onClick={() => alert('Generating Consolidated VASP Attestation Package...')}>
              <span>Generate Package</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
