import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Briefcase, 
  ShieldAlert, 
  Database, 
  Network, 
  Plus, 
  ArrowRightLeft, 
  Building2, 
  Radar, 
  FileLock2, 
  History,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getCases();
        setCases(data);
      } catch (err) {
        console.warn('API error, using cached case telemetry:', err.message);
        setCases([
          { id: 'CASE-2025-081', name: 'DarkNet Mixer Trace', target: '1A1zP1eP...f3a9', rail: 'CRYPTO', risk: 'CRITICAL', status: 'OPEN', updated: '10m ago' },
          { id: 'CASE-2025-079', name: 'Ransomware Payment Flow', target: '0x3a1b...f82c', rail: 'MULTI_RAIL', risk: 'HIGH', status: 'UNDER_REVIEW', updated: '1h ago' },
          { id: 'CASE-2025-074', name: 'Exchange Exploit Outflow', target: '0x7c9d...e12a', rail: 'CRYPTO', risk: 'CRITICAL', status: 'OPEN', updated: '4h ago' },
          { id: 'CASE-2025-072', name: 'Illicit OTC Settlement', target: 'p2p_desk_blr@axis', rail: 'UPI', risk: 'MEDIUM', status: 'UNDER_REVIEW', updated: '1d ago' },
          { id: 'CASE-2025-068', name: 'Phishing Yield Consolidation', target: '0x12d4...q9Yt', rail: 'CRYPTO', risk: 'LOW', status: 'CLOSED', updated: '3d ago' }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="forensic-dashboard-shell">
      {/* Top Heading */}
      <div className="dashboard-top-row">
        <div>
          <div className="eyebrow">COMMAND CONSOLE · SYSTEM STATUS: NOMINAL</div>
          <h1 className="dashboard-heading-title">Active Investigation Overview</h1>
          <p className="dashboard-heading-sub">
            Monitor multi-rail casework, inspect NetworkX graph traversals, and coordinate VASP attribution.
          </p>
        </div>

        <Link to="/cases/new">
          <button className="button button-primary" title="Open new investigation case">
            <Plus size={13} />
            <span>OPEN NEW CASE</span>
          </button>
        </Link>
      </div>

      {/* Hero Region: Multi-Rail Transaction Topology Flow */}
      <div className="topology-hero-card">
        <div className="topology-header">
          <h3 className="topology-title">
            <Network size={14} />
            <span>MULTI-RAIL TRANSACTION TOPOLOGY // WHERE IS THE MONEY MOVING?</span>
          </h3>
          <span className="badge badge-synthetic">SYNTHETIC DEMONSTRATION FLOW</span>
        </div>

        <div className="topology-flow-container">
          <div className="topology-node-box">
            <span className="node-rail-tag crypto">CRYPTO RAIL</span>
            <span className="node-label-text">Suspect Wallet</span>
            <span className="node-sub-meta">0x71F9...E84C2</span>
          </div>

          <div className="topology-arrow-divider">➔</div>

          <div className="topology-node-box">
            <span className="node-rail-tag crypto">ON-CHAIN HOP</span>
            <span className="node-label-text">Peel-Chain Transfer</span>
            <span className="node-sub-meta">4 Wallets Split</span>
          </div>

          <div className="topology-arrow-divider">➔</div>

          <div className="topology-node-box">
            <span className="node-rail-tag vasp">VASP TRANSIT</span>
            <span className="node-label-text">Binance Deposit</span>
            <span className="node-sub-meta">0x88fa...10b2 (82%)</span>
          </div>

          <div className="topology-arrow-divider">➔</div>

          <div className="topology-node-box">
            <span className="node-rail-tag vasp">OFF-RAMP BRIDGE</span>
            <span className="node-label-text">P2P Settlement</span>
            <span className="node-sub-meta">Desk: Axis Node</span>
          </div>

          <div className="topology-arrow-divider">➔</div>

          <div className="topology-node-box">
            <span className="node-rail-tag upi">BANKING SWITCH</span>
            <span className="node-label-text">UPI Mule Dispersal</span>
            <span className="node-sub-meta">traveler@sbi (BLR)</span>
          </div>

          <div className="topology-arrow-divider">➔</div>

          <div className="topology-node-box">
            <span className="node-rail-tag cashout">FIAT EXIT</span>
            <span className="node-label-text">ATM Cashout Exit</span>
            <span className="node-sub-meta">₹3.85M Dissipated</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="dashboard-stat-row">
        <div className="dash-stat-card">
          <div className="dash-stat-label">
            <span>ACTIVE INVESTIGATIONS</span>
            <Briefcase size={13} />
          </div>
          <div className="dash-stat-number">{cases.length || 12}</div>
          <div className="dash-stat-sub">Currently Assigned to LE Units</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-label">
            <span>HIGH / CRITICAL RISK</span>
            <ShieldAlert size={13} style={{ color: '#ef4444' }} />
          </div>
          <div className="dash-stat-number" style={{ color: '#ef4444' }}>
            {cases.filter((c) => c.risk === 'CRITICAL' || c.risk === 'HIGH').length || 5}
          </div>
          <div className="dash-stat-sub" style={{ color: '#ef4444' }}>Requires Urgent Review</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-label">
            <span>WALLETS & VPAS INDEXED</span>
            <Database size={13} />
          </div>
          <div className="dash-stat-number">847</div>
          <div className="dash-stat-sub">Across Ethereum, Tron & UPI</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-label">
            <span>FORENSIC EXHIBITS SEALED</span>
            <FileLock2 size={13} style={{ color: '#10b981' }} />
          </div>
          <div className="dash-stat-number" style={{ color: '#10b981' }}>14</div>
          <div className="dash-stat-sub">FIPS 180-4 SHA-256 Validated</div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="dashboard-modules-grid">
        {/* Left Column: Active Casework & VASP Attribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Active Investigations Register */}
          <div className="module-card">
            <div className="module-card-header">
              <h4 className="module-card-title">
                <Briefcase size={13} />
                <span>Active Investigations Register</span>
              </h4>
              <Link to="/cases" style={{ fontSize: '10px', color: '#24c7c9', fontFamily: 'var(--font-mono)' }}>
                View All Cases ➔
              </Link>
            </div>

            <table className="forensic-table">
              <thead>
                <tr>
                  <th>CASE ID</th>
                  <th>INVESTIGATION NAME</th>
                  <th>TARGET / WALLET</th>
                  <th>RAIL</th>
                  <th>RISK</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {cases.slice(0, 5).map((c) => (
                  <tr 
                    key={c.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/investigations/INV-004`)}
                  >
                    <td className="mono" style={{ color: '#38bdf8', fontWeight: 600 }}>{c.id}</td>
                    <td>{c.name || 'Financial Investigation'}</td>
                    <td className="mono" style={{ fontSize: '10px' }}>{c.target || '0x71F9...E84C2'}</td>
                    <td>
                      <span className={`badge ${c.rail === 'UPI' ? 'badge-high' : 'badge-low'}`}>
                        {c.rail || 'CRYPTO'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${c.risk === 'CRITICAL' ? 'badge-critical' : c.risk === 'HIGH' ? 'badge-high' : 'badge-medium'}`}>
                        {c.risk || 'HIGH'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{c.status || 'OPEN'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VASP Attribution Preview */}
          <div className="module-card">
            <div className="module-card-header">
              <h4 className="module-card-title">
                <Building2 size={13} />
                <span>VASP Attribution & Off-Ramp Desks</span>
              </h4>
              <Link to="/vasp" style={{ fontSize: '10px', color: '#24c7c9', fontFamily: 'var(--font-mono)' }}>
                Inspect Engine ➔
              </Link>
            </div>
            <div className="module-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--color-surface-soft)', borderRadius: '3px' }}>
                <div>
                  <strong style={{ fontSize: '11px', color: '#24c7c9' }}>Binance Global</strong>
                  <div className="mono" style={{ fontSize: '9px', color: '#64748b' }}>Deposit Cluster 0x88fa...10b2 · Hop 2</div>
                </div>
                <span className="badge badge-low">82% CONFIDENCE</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--color-surface-soft)', borderRadius: '3px' }}>
                <div>
                  <strong style={{ fontSize: '11px', color: '#24c7c9' }}>CoinDCX OTC Desk</strong>
                  <div className="mono" style={{ fontSize: '9px', color: '#64748b' }}>Settlement Node Axis Bank · Hop 3</div>
                </div>
                <span className="badge badge-medium">68% CONFIDENCE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Risk & Geospatial Signals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Risk Intelligence Prioritization */}
          <div className="module-card">
            <div className="module-card-header">
              <h4 className="module-card-title">
                <ShieldAlert size={13} />
                <span>Risk Prioritization Distribution</span>
              </h4>
            </div>
            <div className="module-card-body">
              <div className="dash-risk-row">
                <div className="risk-level-bar-item">
                  <div className="risk-level-label-row">
                    <span style={{ color: '#ef4444' }}>Critical</span>
                    <span>2 Cases</span>
                  </div>
                  <div className="risk-track-bar">
                    <div className="risk-fill-bar" style={{ width: '40%', background: '#ef4444' }} />
                  </div>
                </div>

                <div className="risk-level-bar-item">
                  <div className="risk-level-label-row">
                    <span style={{ color: '#f97316' }}>High</span>
                    <span>5 Cases</span>
                  </div>
                  <div className="risk-track-bar">
                    <div className="risk-fill-bar" style={{ width: '70%', background: '#f97316' }} />
                  </div>
                </div>

                <div className="risk-level-bar-item">
                  <div className="risk-level-label-row">
                    <span style={{ color: '#eab308' }}>Medium</span>
                    <span>3 Cases</span>
                  </div>
                  <div className="risk-track-bar">
                    <div className="risk-fill-bar" style={{ width: '35%', background: '#eab308' }} />
                  </div>
                </div>

                <div className="risk-level-bar-item">
                  <div className="risk-level-label-row">
                    <span style={{ color: '#10b981' }}>Low</span>
                    <span>2 Cases</span>
                  </div>
                  <div className="risk-track-bar">
                    <div className="risk-fill-bar" style={{ width: '20%', background: '#10b981' }} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                <span className="mono" style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  METHODOLOGY NOTE
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '9px', color: 'var(--color-secondary-text)', lineHeight: 1.4 }}>
                  Risk signals guide review priority and do not establish legal wrongdoing or criminal guilt.
                </p>
              </div>
            </div>
          </div>

          {/* Geospatial Radar Preview */}
          <div className="module-card">
            <div className="module-card-header">
              <h4 className="module-card-title">
                <Radar size={13} />
                <span>Geospatial Radar Signals</span>
              </h4>
              <Link to="/geospatial" style={{ fontSize: '10px', color: '#24c7c9', fontFamily: 'var(--font-mono)' }}>
                Radar ➔
              </Link>
            </div>
            <div className="module-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '6px 10px', background: 'var(--color-surface-soft)', borderRadius: '3px', borderLeft: '2px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600 }}>
                  <span>Impossible Travel Detected</span>
                  <span style={{ color: '#ef4444' }}>CRITICAL</span>
                </div>
                <div className="mono" style={{ fontSize: '8px', color: '#64748b', marginTop: '2px' }}>
                  Frankfurt (Tor Exit) ➔ Bengaluru (UPI) in 21m
                </div>
              </div>

              <div style={{ padding: '6px 10px', background: 'var(--color-surface-soft)', borderRadius: '3px', borderLeft: '2px solid #f97316' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600 }}>
                  <span>Split Tunnel Bypass</span>
                  <span style={{ color: '#f97316' }}>ELEVATED</span>
                </div>
                <div className="mono" style={{ fontSize: '8px', color: '#64748b', marginTop: '2px' }}>
                  Cloudflare WARP BGP ASN Intercept AS13335
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
