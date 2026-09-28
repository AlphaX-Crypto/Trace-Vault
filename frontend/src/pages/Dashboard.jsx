import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  Layers, 
  Building2, 
  ExternalLink, 
  Lock,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="dash-page">
      {/* Hero Command Header */}
      <section className="dash-hero">
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
        </div>

        <div className="dash-hero-actions">
          <Link to="/cases/new" className="btn-pill btn-pill-primary">
            <Plus size={14} />
            <span>Open New Case</span>
          </Link>
          <Link to="/evidence" className="btn-pill btn-pill-secondary">
            <Lock size={13} />
            <span>Evidence Vault</span>
          </Link>
        </div>
      </section>

      {/* Top 4 Bento Metric Cards */}
      <section className="dash-metrics-grid">
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

      {/* Sequential Multi-Rail Flow Progression Bento Section */}
      <section className="dash-flow-section">
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
          <div className="bento-flow-card" onClick={() => navigate('/graph')} style={{ cursor: 'pointer' }}>
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

          <div className="bento-flow-card" onClick={() => navigate('/graph')} style={{ cursor: 'pointer' }}>
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

          <div className="bento-flow-card" onClick={() => navigate('/graph')} style={{ cursor: 'pointer' }}>
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

          <div className="bento-flow-card" onClick={() => navigate('/graph')} style={{ cursor: 'pointer' }}>
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

          <div className="bento-flow-card" onClick={() => navigate('/graph')} style={{ cursor: 'pointer' }}>
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

          <div className="bento-flow-card" onClick={() => navigate('/graph')} style={{ cursor: 'pointer' }}>
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

      {/* Two-Column Command Grid: Cases Table & VASP Attributions */}
      <section className="dash-main-grid">
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
              <tr>
                <td className="mono" style={{ fontWeight: 700 }}>TV-2026-0118</td>
                <td>
                  <div style={{ fontWeight: 600 }}>Synthetic Identity Layering</div>
                  <div className="mono muted" style={{ fontSize: '10px' }}>0x4f12...99bc</div>
                </td>
                <td><span className="rail-badge crypto">CRYPTO</span></td>
                <td><span className="tag tag-medium">MEDIUM (58)</span></td>
                <td>
                  <Link to="/entity" className="btn-secondary" style={{ padding: '3px 10px', height: '24px', fontSize: '10px' }}>
                    Dossier
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

            <div className="vasp-wall-item">
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>ICICI Core Banking Node</div>
                <div className="mono muted" style={{ fontSize: '10px' }}>Merchant Outlet Funnel (DEL)</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="tag tag-critical">Warrant</span>
                <div className="muted" style={{ fontSize: '10px', marginTop: '3px' }}>ATM Dispersal</div>
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
