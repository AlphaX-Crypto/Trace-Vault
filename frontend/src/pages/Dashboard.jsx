import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  Layers, 
  Building2, 
  Lock,
  Search,
  Cpu,
  Radio,
  FileSpreadsheet,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  FileText,
  MapPin,
  CheckCircle2,
  X,
  Download
} from 'lucide-react';
import api from '../services/api';
import './dashboard.css';

const RAIL_DATA = {
  EVM: {
    title: 'Ethereum EVM NetworkX Traversal Engine',
    tag: 'ETH MAINNET // ACTIVE',
    ref: '0x9a8f3b12...561a012',
    description: 'Autonomous graph traversal computing multi-hop peel-chains, co-spend heuristics, and smart contract mixer pool interaction trees in real-time.',
    hops: [
      {
        hop: 'HOP 00',
        name: 'Seed Inflow',
        address: '0x71c8564804d3e20e8b7c7b80267f5df7325b3b29',
        amount: '140.00 ETH (₹3.92 Cr)',
        risk: '96/100 • CRITICAL',
        riskClass: 'critical',
        note: 'Source of illicit funds from unhosted ransomware wallet'
      },
      {
        hop: 'HOP 01',
        name: 'Peel-Chain Layer',
        address: '0x3a9f029c7b82410a8c2918471029481920381048',
        amount: '42.50 ETH (₹1.19 Cr)',
        risk: '88/100 • HIGH',
        riskClass: 'high',
        note: 'Peel ratio 88.4% retained, 11.6% gas burn across 6 sub-transfers'
      },
      {
        hop: 'HOP 02',
        name: 'P2P Counterparty',
        address: 'rahul98@paytm // 0x88921a9c...',
        amount: '₹38,50,000 INR',
        risk: '82/100 • HIGH',
        riskClass: 'high',
        note: 'Instant fiat off-ramp settlement on domestic UPI payment switch'
      },
      {
        hop: 'HOP 03',
        name: 'VASP Deposit',
        address: 'Binance Hot Wallet #4',
        amount: '15.20 ETH ($42,560 USD)',
        risk: '12/100 • IDENTIFIED',
        riskClass: 'low',
        note: 'Reporting Entity KYC match ready for Section 91 CrPC notice service'
      }
    ],
    stats: [
      { label: 'THROUGHPUT', value: '14,200 TPS Graph Traversal' },
      { label: 'DEPTH HORIZON', value: 'Up to 12 Hops Deep' },
      { label: 'MEMPOOL MONITOR', value: 'Sub-second Zero-Confirmation' },
      { label: 'EVM CORRIDORS', value: 'ETH, Arbitrum, Optimism, Polygon' }
    ]
  },
  UPI: {
    title: 'NPCI Core Switch UPI Telemetry Engine',
    tag: 'NPCI BATCH 992 // LIVE',
    ref: 'UPI-RR-481928401928',
    description: 'Rule-based explainable risk engine correlating Virtual Payment Addresses (VPAs), IMPS/NEFT batches, and rapid multi-state dispersal funnels.',
    hops: [
      {
        hop: 'HOP 00',
        name: 'Syndicate VPA',
        address: 'fastmule@okaxis',
        amount: '₹48,20,000 INR',
        risk: '94/100 • CRITICAL',
        riskClass: 'critical',
        note: 'Mule account registered with forged Aadhaar document'
      },
      {
        hop: 'HOP 01',
        name: 'Dispersal Layer',
        address: 'smurf91@paytm, kiran7@ybl',
        amount: '₹14,50,000 INR (18 splits)',
        risk: '91/100 • CRITICAL',
        riskClass: 'critical',
        note: 'Structured smurfing under ₹50,000 threshold to evade AML alerts'
      },
      {
        hop: 'HOP 02',
        name: 'Aggregator Node',
        address: 'apex.trader@icici',
        amount: '₹32,00,000 INR',
        risk: '85/100 • HIGH',
        riskClass: 'high',
        note: 'Current account showing 42 transactions per minute velocity'
      },
      {
        hop: 'HOP 03',
        name: 'ATM Cash Out',
        address: 'ATM Terminal DL-0941',
        amount: '₹9,80,000 Cash',
        risk: '78/100 • ELEVATED',
        riskClass: 'high',
        note: 'Physical withdrawal in South Delhi within 14 minutes of inflow'
      }
    ],
    stats: [
      { label: 'TRANSACTION VELOCITY', value: '42 Tx / Minute Peak' },
      { label: 'GEOSPATIAL AUDIT', value: 'BTS Cell Tower Triangulation' },
      { label: 'SETTLEMENT LATENCY', value: '<240ms NPCI Core' },
      { label: 'BANK NODES', value: 'Axis, ICICI, SBI, HDFC' }
    ]
  },
  VASP: {
    title: 'VASP Gateway & KYC Attestation Engine',
    tag: 'FIU-IND COMPLIANT // REG-04',
    ref: 'FIU-CRY-0082-CERT',
    description: 'Deterministic clustering attribution linking unhosted crypto deposits to FIU-IND registered Reporting Entities with automated Section 91 notices.',
    hops: [
      {
        hop: 'HOP 00',
        name: 'Unhosted Origin',
        address: '0x184a8b7c91029384710293847102938471029384',
        amount: '68.40 ETH',
        risk: '92/100 • SUSPICIOUS',
        riskClass: 'critical',
        note: 'Direct withdrawal from Tornado Cash mixer contracts'
      },
      {
        hop: 'HOP 01',
        name: 'Intermediary Hop',
        address: '0x559281a98c7b8291039481920394810293847192',
        amount: '68.32 ETH',
        risk: '87/100 • HIGH',
        riskClass: 'high',
        note: 'Single transit wallet active for less than 4 minutes'
      },
      {
        hop: 'HOP 02',
        name: 'VASP Deposit Memo',
        address: 'Binance Main Deposit Pool',
        amount: '68.25 ETH ($191,100 USD)',
        risk: '45/100 • VASP IDENTIFIED',
        riskClass: 'medium',
        note: 'Internal memo tag matched to KYC UID #IND-89104-BN'
      },
      {
        hop: 'HOP 03',
        name: 'Legal Subpoena Served',
        address: 'Nodal Officer // Binance India',
        amount: 'Sec 91 CrPC Notice',
        risk: '05/100 • PROCESSED',
        riskClass: 'low',
        note: 'Account freeze executed and full KYC dossier requisitioned'
      }
    ],
    stats: [
      { label: 'CLUSTER ACCURACY', value: '88% - 96% Confidence' },
      { label: 'FIU REGISTRY', value: '28 Registered Exchanges' },
      { label: 'SUBPOENA CYCLE', value: 'Instant Sec 91 CrPC Pack' },
      { label: 'FREEZE PROTOCOL', value: 'Automated MLAT Draft' }
    ]
  }
};

const DEFAULT_CASES = [
  {
    id: 'TV-2026-CR-0891',
    name: 'Operation IronChain — Hawala Syndicate',
    target: '0x71c8564804d3e20e8b7c7b80267f5df7325b3b29',
    rail: 'ETH + UPI',
    volume: '₹4.85 Cr',
    riskScore: 96,
    status: 'S.91 SERVED'
  },
  {
    id: 'TV-2026-CR-0844',
    name: 'Mule Ring Layering — Axis/Paytm Funnel',
    target: 'fastmule@okaxis',
    rail: 'NPCI UPI',
    volume: '₹1.42 Cr',
    riskScore: 91,
    status: 'FROZEN'
  },
  {
    id: 'TV-2026-CR-0792',
    name: 'CoinJoin Mixer Outflow Attribution',
    target: '0x3a9f029c7b82410a8c2918471029481920381048',
    rail: 'ETH EVM',
    volume: '₹2.18 Cr',
    riskScore: 84,
    status: 'UNDER TRACE'
  },
  {
    id: 'TV-2026-CR-0715',
    name: 'VASP Off-Ramp Smurfing Cluster',
    target: 'Binance HotWallet #4',
    rail: 'VASP / P2P',
    volume: '₹6.30 Cr',
    riskScore: 78,
    status: 'KYC REQUISITION'
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedRail, setSelectedRail] = useState('EVM');
  const [selectedHopIndex, setSelectedHopIndex] = useState(0);
  const [searchTarget, setSearchTarget] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [cases, setCases] = useState(DEFAULT_CASES);
  const [showSubpoenaModal, setShowSubpoenaModal] = useState(false);

  useEffect(() => {
    async function loadCases() {
      try {
        const data = await api.getCases();
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((c, idx) => ({
            id: c.case_id || `TV-2026-CR-0${890 - idx}`,
            name: c.case_name || c.title || `Investigation Docket #${idx + 1}`,
            target: c.suspect_wallet || c.target || '0x71c8...b29',
            rail: c.rail || 'ETH + UPI',
            volume: c.volume || '₹3.40 Cr',
            riskScore: c.risk_score || (95 - idx * 5),
            status: c.status || 'UNDER TRACE'
          }));
          setCases(formatted);
        }
      } catch (err) {
        console.warn('Using default cases fallback:', err);
      }
    }
    loadCases();
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchTarget.trim()) {
      navigate(`/graph?target=${encodeURIComponent(searchTarget.trim())}`);
    } else {
      navigate('/graph');
    }
  }

  function handleQuickPreset(targetStr) {
    setSearchTarget(targetStr);
    navigate(`/graph?target=${encodeURIComponent(targetStr)}`);
  }

  const activeRail = RAIL_DATA[selectedRail];
  const activeHop = activeRail.hops[selectedHopIndex] || activeRail.hops[0];

  return (
    <div className="dash-container">
      {/* 1. Executive Master Header */}
      <section className="dash-header-section anim-fade-in">
        <div className="dash-eyebrow-tag">
          <span className="eyebrow-bullet">■■■</span>
          <span>NATIONAL FINANCIAL FORENSIC INTELLIGENCE PLATFORM</span>
          <span className="eyebrow-sep">•</span>
          <span className="eyebrow-highlight">S.91 / S.65B STATUTORY ENGINE</span>
        </div>

        <h1 className="dash-main-title">
          Multi-Rail Forensic Intelligence <span className="title-faded">for Sovereign Investigations</span>
        </h1>

        <p className="dash-main-subtitle">
          Autonomous graph traversal, peel-chain heuristic tracking, VASP attribution, and NPCI UPI banking switch forensics.
        </p>

        {/* Universal Target Investigation Workbench Bar */}
        <form className="universal-search-bar" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Enter suspect Wallet (0x...), UPI ID (user@upi), Bank A/C, Phone, or Docket #..."
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
            />
          </div>

          <div className="search-filter-select">
            <select 
              value={selectedFilter} 
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="rail-select"
            >
              <option value="ALL">All Financial Rails</option>
              <option value="ETH">Ethereum EVM</option>
              <option value="UPI">NPCI UPI</option>
              <option value="VASP">VASP Exchanges</option>
            </select>
          </div>

          <button type="submit" className="search-action-btn">
            <span>EXECUTE FORENSIC TRACE</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Quick Suspect Presets */}
        <div className="quick-presets-row">
          <span className="presets-label">QUICK TARGET PRESETS:</span>
          <button 
            type="button" 
            className="preset-pill"
            onClick={() => handleQuickPreset('0x71c8564804d3e20e8b7c7b80267f5df7325b3b29')}
          >
            <span>⚡ 0x71c8...b29 (Hawala Mule)</span>
          </button>
          <button 
            type="button" 
            className="preset-pill"
            onClick={() => handleQuickPreset('fastmule@okaxis')}
          >
            <span>⚡ fastmule@okaxis (P2P Structuring)</span>
          </button>
          <button 
            type="button" 
            className="preset-pill"
            onClick={() => handleQuickPreset('0x3a9f029c7b82410a8c2918471029481920381048')}
          >
            <span>⚡ 0x3a9f...c12 (Peel-Chain Layer)</span>
          </button>
        </div>
      </section>

      {/* 2. Executive Forensic Metrics Bento Grid (4 Columns) */}
      <section className="dash-bento-metrics-row anim-fade-in anim-stagger-1">
        <div className="bento-stat-card">
          <div className="stat-card-header">
            <span className="stat-tag">[ 01 // ACTIVE CASEWORK ]</span>
            <span className="status-badge status-critical">18 Active</span>
          </div>
          <div className="stat-main-value">18 Dockets</div>
          <div className="stat-sub-text">4 Critical Priority · 7 State Cyber Units Active</div>
        </div>

        <div className="bento-stat-card">
          <div className="stat-card-header">
            <span className="stat-tag">[ 02 // CROSS-RAIL VOLUME ]</span>
            <span className="status-badge status-success">Traversed</span>
          </div>
          <div className="stat-main-value">₹48.92 Cr</div>
          <div className="stat-sub-text">84.70 ETH + ₹3.85M UPI Dispersal Traversed</div>
        </div>

        <div className="bento-stat-card">
          <div className="stat-card-header">
            <span className="stat-tag">[ 03 // VASP ATTRIBUTION ]</span>
            <span className="status-badge status-warning">88% Match</span>
          </div>
          <div className="stat-main-value">Binance #4</div>
          <div className="stat-sub-text">FIU-IND Registered Hot Wallet Attributed</div>
        </div>

        <div className="bento-stat-card">
          <div className="stat-card-header">
            <span className="stat-tag">[ 04 // EVIDENCE VAULT ]</span>
            <span className="status-badge status-info">Sec 65B</span>
          </div>
          <div className="stat-main-value">34 Sealed</div>
          <div className="stat-sub-text">FIPS 180-4 SHA-256 Merkle Provenance Guaranteed</div>
        </div>
      </section>

      {/* 3. Multi-Rail Intelligence Workbench (Video Frame 8s & 11s Layout) */}
      <section className="dash-workbench-section anim-fade-in anim-stagger-2">
        <div className="section-title-group">
          <div className="dash-eyebrow-tag">
            <span className="eyebrow-bullet">■■■</span>
            <span>AUTONOMOUS MULTI-RAIL PIPELINE</span>
          </div>
          <h2 className="section-title">Cross-Rail Forensic Intelligence Engine</h2>
          <p className="section-desc">
            Select an investigation rail to inspect active traversal heuristics, counterparty clusters, and statutory intervention status.
          </p>
        </div>

        {/* 3 Tab Mode Switcher (Matching Video Frame 8s) */}
        <div className="rail-mode-tabs-container">
          <button 
            type="button"
            className={`rail-mode-tab ${selectedRail === 'EVM' ? 'active' : ''}`}
            onClick={() => { setSelectedRail('EVM'); setSelectedHopIndex(0); }}
          >
            <Cpu size={16} />
            <div className="tab-text-group">
              <span className="tab-title">ETHEREUM EVM TRACE</span>
              <span className="tab-subtitle">Unhosted Wallets & Peel-Chains</span>
            </div>
          </button>

          <button 
            type="button"
            className={`rail-mode-tab ${selectedRail === 'UPI' ? 'active' : ''}`}
            onClick={() => { setSelectedRail('UPI'); setSelectedHopIndex(0); }}
          >
            <Radio size={16} />
            <div className="tab-text-group">
              <span className="tab-title">NPCI UPI FAST-RAIL</span>
              <span className="tab-subtitle">VPA Multiplexing & Mule Rings</span>
            </div>
          </button>

          <button 
            type="button"
            className={`rail-mode-tab ${selectedRail === 'VASP' ? 'active' : ''}`}
            onClick={() => { setSelectedRail('VASP'); setSelectedHopIndex(0); }}
          >
            <Building2 size={16} />
            <div className="tab-text-group">
              <span className="tab-title">VASP GATEWAY & S.91</span>
              <span className="tab-subtitle">FIU Reporting Entities & Subpoenas</span>
            </div>
          </button>
        </div>

        {/* Split Bento Workbench (Matching Video Frame 11s) */}
        <div className="workbench-bento-grid">
          {/* Left Large Card: Live Hop Progression Visualizer (58% width) */}
          <div className="featured-traversal-card">
            <div className="card-top-header">
              <div className="header-meta">
                <span className="card-tag">• LIVE FORENSIC HOP SEQUENCE</span>
                <span className="corridor-badge">{activeRail.tag}</span>
              </div>
              <span className="case-ref">REF: {activeRail.ref}</span>
            </div>

            <div className="interactive-hop-timeline">
              {activeRail.hops.map((item, idx) => (
                <div 
                  key={item.hop} 
                  className={`hop-timeline-node ${selectedHopIndex === idx ? 'selected' : ''}`}
                  onClick={() => setSelectedHopIndex(idx)}
                >
                  <div className="hop-step-pill">{item.hop}</div>
                  <div className="hop-node-body">
                    <div className="node-title">{item.name}</div>
                    <div className="node-addr">{item.address.slice(0, 18)}...</div>
                    <div className="node-amt">{item.amount}</div>
                  </div>
                  {idx < activeRail.hops.length - 1 && (
                    <div className="hop-connector-line">
                      <div className="pulse-bead" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Hop Inspector Detail Box */}
            <div className="hop-inspector-detail-box">
              <div className="inspector-header">
                <div>
                  <span className="inspector-title">SELECTED ENTITY TELEMETRY // {activeHop.hop}: {activeHop.name}</span>
                  <div className="inspector-addr">{activeHop.address}</div>
                </div>
                <span className={`risk-indicator risk-${activeHop.riskClass}`}>
                  {activeHop.risk}
                </span>
              </div>
              <p className="inspector-notes">{activeHop.note}</p>
            </div>

            <div className="card-bottom-actions">
              <button 
                type="button" 
                className="btn-link-action"
                onClick={() => navigate('/graph')}
              >
                <span>OPEN IN FULL GRAPH MATRIX</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right Stacked Bento Cards (42% width) */}
          <div className="stacked-bento-column">
            {/* Card 1: Statutory Action & Subpoena Generator */}
            <div className="bento-action-card">
              <div className="card-top-header">
                <span className="card-tag">• STATUTORY INTERVENTION</span>
                <span className="status-badge status-warning">Section 91 CrPC</span>
              </div>

              <h3 className="bento-card-title">Automated Subpoena Dispatch</h3>
              <p className="bento-card-desc">
                Pre-configured judicial requisition ready for automated service to FIU-IND Nodal Officers.
              </p>

              <div className="subpoena-spec-box">
                <div className="spec-row">
                  <span className="spec-lbl">RECIPIENT VASP:</span>
                  <span className="spec-val">Binance Holdings Ltd (FIU #004)</span>
                </div>
                <div className="spec-row">
                  <span className="spec-lbl">DEMAND:</span>
                  <span className="spec-val">KYC Dossier, IP Logs, Immediate Account Freeze</span>
                </div>
              </div>

              <button 
                type="button" 
                className="btn-bento-action"
                onClick={() => setShowSubpoenaModal(true)}
              >
                <span>DRAFT COURT SUBPOENA</span>
                <Plus size={13} />
              </button>
            </div>

            {/* Card 2: Behavioral Risk & IPDR Intelligence */}
            <div className="bento-action-card">
              <div className="card-top-header">
                <span className="card-tag">• THREAT HEURISTICS</span>
                <span className="status-badge status-critical">Risk 94/100</span>
              </div>

              <h3 className="bento-card-title">Telecom IPDR & Behavioral Radar</h3>
              <p className="bento-card-desc">
                Heuristic velocity models flag rapid peel-chain dispersal and anomalous mobile cell session hops.
              </p>

              <div className="threat-metrics-list">
                <div className="threat-item">
                  <span className="threat-lbl">Peel-Chain Structuring:</span>
                  <span className="threat-val">92% Match</span>
                </div>
                <div className="threat-item">
                  <span className="threat-lbl">SIM-Box / Proxy Telemetry:</span>
                  <span className="threat-val">Airtel ASN 24560 (Delhi NCR)</span>
                </div>
              </div>

              <button 
                type="button" 
                className="btn-bento-secondary"
                onClick={() => navigate('/geospatial')}
              >
                <span>VIEW GEOSPATIAL RADAR</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Active Investigation Registry Table (Clean, Formal Government Cyber Table) */}
      <section className="dash-registry-section anim-fade-in anim-stagger-3">
        <div className="registry-table-header">
          <div>
            <h3 className="registry-title">Active Investigation Dockets & Suspect Registry</h3>
            <span className="registry-sub">Multi-rail criminal investigation registry with continuous mempool surveillance</span>
          </div>

          <div className="registry-header-actions">
            <button 
              type="button" 
              className="btn-pill-secondary btn-sm"
              onClick={() => navigate('/reports')}
            >
              <FileSpreadsheet size={13} />
              <span>Export Master Dossier</span>
            </button>
            <button 
              type="button" 
              className="btn-pill-primary btn-sm"
              onClick={() => navigate('/cases/new')}
            >
              <Plus size={13} />
              <span>Open New Case</span>
            </button>
          </div>
        </div>

        <div className="registry-table-wrapper">
          <table className="formal-cyber-table">
            <thead>
              <tr>
                <th>Docket ID</th>
                <th>Investigation Title</th>
                <th>Primary Suspect / Target</th>
                <th>Financial Rail</th>
                <th>Volume Traced</th>
                <th>Risk Index</th>
                <th>Statutory Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td className="mono font-bold" style={{ color: 'var(--text-primary)' }}>{c.id}</td>
                  <td>{c.name}</td>
                  <td className="mono muted">{c.target}</td>
                  <td>
                    <span className="rail-tag">{c.rail}</span>
                  </td>
                  <td className="mono font-bold">{c.volume}</td>
                  <td>
                    <span className={`risk-badge risk-${c.riskScore > 85 ? 'critical' : c.riskScore > 70 ? 'high' : 'medium'}`}>
                      {c.riskScore}/100
                    </span>
                  </td>
                  <td>
                    <span className="status-pill">{c.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      type="button" 
                      className="table-action-btn"
                      onClick={() => navigate(`/graph?target=${encodeURIComponent(c.target)}`)}
                      title="Inspect in Graph Matrix"
                    >
                      <span>Inspect</span>
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Subpoena Requisition Modal */}
      {showSubpoenaModal && (
        <div className="modal-backdrop">
          <div className="subpoena-modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-tag">[ STATUTORY REQUISITION // SEC 91 CrPC ]</span>
                <h3 className="modal-title">Formal Judicial Notice Service Draft</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowSubpoenaModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="notice-preview-box">
                <div className="notice-stamp">OFFICIAL NOTICE // CYBER CRIME CELL</div>
                <p>
                  <strong>TO:</strong> Nodal Officer, Binance Holdings Ltd (FIU-IND Registration RE-004)<br />
                  <strong>SUBJECT:</strong> Requisition under Section 91, Code of Criminal Procedure, 1973.<br />
                  <strong>INVESTIGATION DOCKET:</strong> TV-2026-CR-0891 (Operation IronChain)
                </p>
                <p>
                  Whereas information has been received regarding suspicious multi-rail fund dissipation originating from unhosted address <code>0x71c8564804d3e20e8b7c7b80267f5df7325b3b29</code> with direct deposit endpoints attributed to Binance Hot Wallet #4.
                </p>
                <p>
                  You are hereby requisitioned to furnish complete KYC documents, transaction logs, device IPDR sessions, and execute an immediate administrative freeze on associated accounts within 24 hours of receipt.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-pill-secondary"
                onClick={() => setShowSubpoenaModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-pill-primary"
                onClick={() => {
                  alert('Section 91 CrPC Notice dispatched cryptographically with RFC 3161 timestamp and committed to Evidence Locker.');
                  setShowSubpoenaModal(false);
                  navigate('/evidence');
                }}
              >
                <Download size={13} />
                <span>Sign & Export Certified Notice (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
