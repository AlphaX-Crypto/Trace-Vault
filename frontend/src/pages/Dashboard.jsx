import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  ShieldAlert, 
  Database, 
  FileLock2, 
  Plus, 
  ArrowRight, 
  Building2, 
  Network,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

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
        console.warn('API connection fallback:', err.message);
        setCases([
          { id: 'CASE-2025-081', name: 'DarkNet Mixer Trace', target: '0x71F92830...E84C2', rail: 'CRYPTO', risk: 'CRITICAL', status: 'OPEN', updated: '10m ago' },
          { id: 'CASE-2025-079', name: 'Ransomware Payment Flow', target: '0x3a1b49c0...f82c', rail: 'MULTI_RAIL', risk: 'HIGH', status: 'UNDER_REVIEW', updated: '1h ago' },
          { id: 'CASE-2025-074', name: 'Exchange Exploit Outflow', target: '0x7c9d110b...e12a', rail: 'CRYPTO', risk: 'CRITICAL', status: 'OPEN', updated: '4h ago' },
          { id: 'CASE-2025-072', name: 'Illicit OTC Settlement', target: 'p2p_desk_blr@axis', rail: 'UPI', risk: 'MEDIUM', status: 'UNDER_REVIEW', updated: '1d ago' },
          { id: 'CASE-2025-068', name: 'Phishing Yield Consolidation', target: '0x12d4a89b...q9Yt', rail: 'CRYPTO', risk: 'LOW', status: 'CLOSED', updated: '3d ago' }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="gov-page">
      {/* Official Header */}
      <div className="gov-page-header">
        <div>
          <h1 className="gov-page-title">Active Investigation Overview</h1>
          <p className="gov-page-subtitle">
            National financial crime investigation portal · Multi-rail transaction tracking across EVM Blockchains and UPI Banking Switches
          </p>
        </div>

        <Link to="/cases/new">
          <button className="btn btn-primary">
            <Plus size={14} />
            <span>Open New Case</span>
          </button>
        </Link>
      </div>

      {/* 4 Formal Stat Cards */}
      <div className="dash-metrics-grid">
        <div className="dash-stat-box">
          <div className="dash-stat-top">
            <span>Active Investigations</span>
            <FolderOpen size={16} />
          </div>
          <div className="dash-stat-val">{cases.length || 12} Cases</div>
          <div className="dash-stat-desc">Assigned across investigative units</div>
        </div>

        <div className="dash-stat-box">
          <div className="dash-stat-top">
            <span>High & Critical Risk</span>
            <ShieldAlert size={16} style={{ color: 'var(--status-critical-text)' }} />
          </div>
          <div className="dash-stat-val" style={{ color: 'var(--status-critical-text)' }}>
            {cases.filter((c) => c.risk === 'CRITICAL' || c.risk === 'HIGH').length || 5} Cases
          </div>
          <div className="dash-stat-desc">Requires immediate supervisor review</div>
        </div>

        <div className="dash-stat-box">
          <div className="dash-stat-top">
            <span>Wallets & VPAs Indexed</span>
            <Database size={16} />
          </div>
          <div className="dash-stat-val">847 Identifiers</div>
          <div className="dash-stat-desc">Across Ethereum, Tron & UPI Switches</div>
        </div>

        <div className="dash-stat-box">
          <div className="dash-stat-top">
            <span>Secured Evidence Exhibits</span>
            <FileLock2 size={16} style={{ color: 'var(--status-low-text)' }} />
          </div>
          <div className="dash-stat-val" style={{ color: 'var(--status-low-text)' }}>14 Exhibits</div>
          <div className="dash-stat-desc">Section 65B certified audit containers</div>
        </div>
      </div>

      {/* Formal Multi-Hop Transaction Tracing Sequence (Structured, no toy canvas!) */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div>
            <h3 className="gov-card-title">Typical Multi-Rail Fund Dispersion Sequence</h3>
            <p className="gov-card-subtitle">
              Standard analytical path linking unhosted cryptocurrency wallets, centralized exchange transit, and domestic banking switches
            </p>
          </div>
          <span className="badge badge-neutral">Standard Investigative Pattern</span>
        </div>
        <div className="gov-card-body">
          <div className="formal-flow-steps">
            <div className="flow-step-item">
              <span className="flow-step-num">STEP 1 · CRYPTO</span>
              <span className="flow-step-name">Suspect Wallet</span>
              <span className="flow-step-meta">0x71F9...E84C2</span>
            </div>

            <div className="flow-step-item">
              <span className="flow-step-num">STEP 2 · ON-CHAIN</span>
              <span className="flow-step-name">Peel-Chain Transfer</span>
              <span className="flow-step-meta">4 Intermediary Hops</span>
            </div>

            <div className="flow-step-item">
              <span className="flow-step-num">STEP 3 · VASP</span>
              <span className="flow-step-name">Exchange Transit</span>
              <span className="flow-step-meta">Binance Deposit Hot Wallet</span>
            </div>

            <div className="flow-step-item">
              <span className="flow-step-num">STEP 4 · BRIDGE</span>
              <span className="flow-step-name">P2P Desk Settlement</span>
              <span className="flow-step-meta">Axis Bank Node</span>
            </div>

            <div className="flow-step-item">
              <span className="flow-step-num">STEP 5 · BANKING</span>
              <span className="flow-step-name">UPI Mule Dispersal</span>
              <span className="flow-step-meta">traveler@sbi (Bengaluru)</span>
            </div>

            <div className="flow-step-item">
              <span className="flow-step-num">STEP 6 · FIAT EXIT</span>
              <span className="flow-step-name">Cashout Exit</span>
              <span className="flow-step-meta">ATM Cash Withdrawal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="dash-two-col">
        {/* Left: Active Investigations Table */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div>
              <h3 className="gov-card-title">Priority Casework Register</h3>
              <p className="gov-card-subtitle">Latest active investigations requiring analytical follow-up</p>
            </div>
            <Link to="/cases" className="btn btn-secondary btn-sm">
              <span>View All Cases</span>
              <ChevronRight size={12} />
            </Link>
          </div>

          <div className="gov-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Investigation Title</th>
                  <th>Primary Target</th>
                  <th>Rail</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cases.slice(0, 5).map((c) => (
                  <tr 
                    key={c.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/cases')}
                  >
                    <td className="mono" style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                      {c.id}
                    </td>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {c.target}
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {c.rail}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        c.risk === 'CRITICAL' ? 'badge-critical' : 
                        c.risk === 'HIGH' ? 'badge-high' : 
                        c.risk === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                      }`}>
                        {c.risk}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: VASP Attribution & Risk Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Risk Level Distribution */}
          <div className="gov-card">
            <div className="gov-card-header">
              <h3 className="gov-card-title">Risk Prioritization Matrix</h3>
            </div>
            <div className="gov-card-body">
              <div className="risk-meter-list">
                <div className="risk-meter-row">
                  <div className="risk-meter-labels">
                    <span style={{ fontWeight: 600, color: 'var(--status-critical-text)' }}>Critical Risk</span>
                    <span className="mono">2 Cases</span>
                  </div>
                  <div className="risk-meter-track">
                    <div className="risk-meter-fill" style={{ width: '40%', backgroundColor: 'var(--status-critical-text)' }} />
                  </div>
                </div>

                <div className="risk-meter-row">
                  <div className="risk-meter-labels">
                    <span style={{ fontWeight: 600, color: 'var(--status-high-text)' }}>High Risk</span>
                    <span className="mono">5 Cases</span>
                  </div>
                  <div className="risk-meter-track">
                    <div className="risk-meter-fill" style={{ width: '65%', backgroundColor: 'var(--status-high-text)' }} />
                  </div>
                </div>

                <div className="risk-meter-row">
                  <div className="risk-meter-labels">
                    <span style={{ fontWeight: 600, color: 'var(--status-medium-text)' }}>Medium Risk</span>
                    <span className="mono">3 Cases</span>
                  </div>
                  <div className="risk-meter-track">
                    <div className="risk-meter-fill" style={{ width: '35%', backgroundColor: 'var(--status-medium-text)' }} />
                  </div>
                </div>

                <div className="risk-meter-row">
                  <div className="risk-meter-labels">
                    <span style={{ fontWeight: 600, color: 'var(--status-low-text)' }}>Low Risk</span>
                    <span className="mono">2 Cases</span>
                  </div>
                  <div className="risk-meter-track">
                    <div className="risk-meter-fill" style={{ width: '20%', backgroundColor: 'var(--status-low-text)' }} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '10px', backgroundColor: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Statutory Notice</span>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Risk scores serve exclusively as analytical indicators for investigative prioritization and do not represent judicial findings of guilt.
                </p>
              </div>
            </div>
          </div>

          {/* VASP Attribution Preview */}
          <div className="gov-card">
            <div className="gov-card-header">
              <h3 className="gov-card-title">VASP Attribution Corroboration</h3>
              <Link to="/vasp" style={{ fontSize: '11px', color: 'var(--primary-color)' }}>
                Details ➔
              </Link>
            </div>
            <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ fontSize: '12px' }}>Binance Global Hot Wallet Cluster</strong>
                  <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deposit: 0x88fa...10b2 · Hop 2</div>
                </div>
                <span className="badge badge-low">82% Match</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ fontSize: '12px' }}>CoinDCX Institutional Liquidity Node</strong>
                  <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bridge to Axis Settlement · Hop 3</div>
                </div>
                <span className="badge badge-medium">68% Match</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
