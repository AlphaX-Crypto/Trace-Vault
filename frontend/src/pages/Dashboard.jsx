import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  ShieldAlert, 
  Compass, 
  Plus, 
  ArrowRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Crosshair, 
  Layers, 
  FileText, 
  Coins, 
  Smartphone, 
  CheckCircle2, 
  Building2, 
  ExternalLink 
} from 'lucide-react';
import api from '../services/api';
import { normalizeCase } from '../services/normalizer';
import './dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await api.getCases();
        setCases(Array.isArray(list) ? list.map(normalizeCase) : []);
      } catch (err) {
        console.warn('Dashboard cases loading error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute dynamic stats from loaded cases
  const totalCases = cases.length || 8;
  const criticalCases = cases.filter(
    (c) => c.priority === 'CRITICAL' || c.priority === 'HIGH' || c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL'
  ).length || 3;
  const overallRiskScore = 78.4;

  return (
    <div className="stitch-dashboard">
      {/* 1. Header */}
      <div className="stitch-dash-header">
        <div className="stitch-dash-title-block">
          <h1>Financial Intelligence Operations Center</h1>
          <p>
            <span className="stitch-pulse-dot" />
            Live Multi-Rail Transaction Intelligence & Incident Monitoring
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="button button-secondary"
            onClick={() => navigate('/investigations')}
          >
            <Compass size={14} />
            <span>Investigation Catalog</span>
          </button>
          <button 
            className="button button-primary"
            onClick={() => navigate('/cases/new')}
          >
            <Plus size={14} />
            <span>Open New Case</span>
          </button>
        </div>
      </div>

      {/* 2. Top Hero Grid: Flow Graph (60%) + Risk Arc (40%) */}
      <div className="stitch-hero-grid">
        {/* Left: Flow Graph Monitor Card */}
        <div className="stitch-graph-card">
          <div className="stitch-graph-overlay-badge">
            <div className="stitch-badge-target-icon">
              <Crosshair size={16} />
            </div>
            <div className="stitch-overlay-text">
              <strong>1,842 Events Analyzed</strong>
              <small>Multi-Rail Dispersion & Peeling Mapped across Crypto & UPI</small>
            </div>
          </div>

          {/* Interactive Flow Visual Canvas */}
          <div className="stitch-graph-canvas-container">
            <svg 
              viewBox="0 0 760 340" 
              style={{ width: '100%', height: '100%', maxWidth: '720px' }}
            >
              {/* Background Network Grid Lines */}
              <defs>
                <linearGradient id="cyanTrail" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#24c7c9" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
                </linearGradient>
                <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Connecting Edges */}
              <path d="M 120 220 Q 220 120 310 180 T 490 130 T 640 90" fill="none" stroke="url(#cyanTrail)" strokeWidth="3" filter="url(#cyanGlow)" />
              <path d="M 310 180 L 380 250 L 520 230" fill="none" stroke="rgba(168, 85, 247, 0.6)" strokeWidth="2" strokeDasharray="4,4" />
              <path d="M 120 220 L 210 260 L 310 180" fill="none" stroke="rgba(0, 242, 254, 0.4)" strokeWidth="1.5" />
              <path d="M 490 130 L 580 180" fill="none" stroke="rgba(255, 82, 82, 0.5)" strokeWidth="1.5" />

              {/* Node 1: Suspect Wallet */}
              <circle cx="120" cy="220" r="14" fill="#03070d" stroke="#00f2fe" strokeWidth="2.5" filter="url(#cyanGlow)" />
              <circle cx="120" cy="220" r="6" fill="#00f2fe" />
              <text x="120" y="250" textAnchor="middle" fill="#f0f6fc" fontSize="10.5" fontWeight="600">Suspect Wallet</text>
              <text x="120" y="264" textAnchor="middle" fill="#8b9bb4" fontSize="9" fontFamily="var(--font-mono)">0x71c8...1350</text>

              {/* Node 2: Intermediary Peeling */}
              <circle cx="310" cy="180" r="10" fill="#03070d" stroke="#24c7c9" strokeWidth="2" />
              <circle cx="310" cy="180" r="4" fill="#24c7c9" />
              <text x="310" y="160" textAnchor="middle" fill="#8b9bb4" fontSize="10">Peel Hop 1</text>

              {/* Node 3: CoinDelta VASP Offramp */}
              <circle cx="490" cy="130" r="14" fill="#03070d" stroke="#ec4899" strokeWidth="2.5" filter="url(#cyanGlow)" />
              <circle cx="490" cy="130" r="6" fill="#ec4899" />
              <text x="490" y="105" textAnchor="middle" fill="#ec4899" fontSize="11" fontWeight="700">CoinDelta VASP</text>
              <text x="490" y="120" textAnchor="middle" fill="#8b9bb4" fontSize="9">Off-Ramp Bridge</text>

              {/* Node 4: UPI P2P Desk VPA */}
              <circle cx="380" cy="250" r="11" fill="#03070d" stroke="#a855f7" strokeWidth="2" />
              <circle cx="380" cy="250" r="4" fill="#a855f7" />
              <text x="380" y="276" textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="600">p2p_desk@mockupi</text>

              {/* Node 5: Cashout Mule */}
              <circle cx="520" cy="230" r="11" fill="#03070d" stroke="#ff9100" strokeWidth="2" />
              <circle cx="520" cy="230" r="4" fill="#ff9100" />
              <text x="520" y="254" textAnchor="middle" fill="#8b9bb4" fontSize="10">Mule Account</text>

              {/* Node 6: Terminal Exfiltration */}
              <circle cx="640" cy="90" r="16" fill="#03070d" stroke="#ff1744" strokeWidth="3" filter="url(#cyanGlow)" />
              <circle cx="640" cy="90" r="7" fill="#ff1744" />
              <text x="640" y="65" textAnchor="middle" fill="#ff5252" fontSize="11" fontWeight="750">Cash-Out Endpoint</text>
              <text x="640" y="122" textAnchor="middle" fill="#ff5252" fontSize="9" fontWeight="600">CRITICAL ANOMALY</text>
            </svg>
          </div>

          {/* Right Floating Controls Dock */}
          <div className="stitch-graph-controls-dock">
            <button className="stitch-control-btn" title="Focus Suspect" onClick={() => navigate('/investigations/INV-004/graph')}>
              <Crosshair size={14} />
            </button>
            <button className="stitch-control-btn" title="Multi-Rail Layers" onClick={() => navigate('/investigations/INV-004/graph')}>
              <Layers size={14} />
            </button>
            <button className="stitch-control-btn" title="Expand Graph Console" onClick={() => navigate('/investigations/INV-004/graph')}>
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Right: Incident Risk Arc Monitor Card */}
        <div className="stitch-risk-monitor-card">
          <div className="stitch-risk-card-header">
            <div className="stitch-risk-header-title">
              <div className="stitch-risk-header-icon" />
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--color-primary-text)' }}>Incident Risk Monitor</strong>
                <div style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>Weighted by domain criticality</div>
              </div>
            </div>
            <span className="badge badge-critical">LIVE</span>
          </div>

          {/* Semicircular Radial SVG Arc */}
          <div className="stitch-risk-arc-container">
            <svg viewBox="0 0 240 140" className="stitch-arc-svg">
              <defs>
                <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00e676" />
                  <stop offset="35%" stopColor="#00f2fe" />
                  <stop offset="65%" stopColor="#ff9100" />
                  <stop offset="100%" stopColor="#ff1744" />
                </linearGradient>
              </defs>

              {/* Background Arc Track */}
              <path 
                d="M 30 130 A 90 90 0 0 1 210 130" 
                fill="none" 
                stroke="rgba(35, 60, 92, 0.4)" 
                strokeWidth="12" 
                strokeLinecap="round" 
              />

              {/* Active Risk Stroke */}
              <path 
                d="M 30 130 A 90 90 0 0 1 210 130" 
                fill="none" 
                stroke="url(#riskGradient)" 
                strokeWidth="12" 
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * (overallRiskScore / 100))}
              />

              {/* Gauge Tick Markers */}
              <text x="24" y="138" fill="var(--color-muted-text)" fontSize="9" fontWeight="600">0</text>
              <text x="64" y="70" fill="var(--color-muted-text)" fontSize="9" fontWeight="600">25</text>
              <text x="120" y="32" fill="var(--color-muted-text)" fontSize="9" fontWeight="600">50</text>
              <text x="172" y="70" fill="var(--color-muted-text)" fontSize="9" fontWeight="600">75</text>
              <text x="214" y="138" fill="var(--color-muted-text)" fontSize="9" fontWeight="600">100</text>
            </svg>

            {/* Centered Score */}
            <div className="stitch-arc-center-content">
              <span className="stitch-arc-score-num">{Math.round(overallRiskScore)}</span>
              <span className="stitch-arc-score-label">RISK SCORE</span>
              <span className="stitch-arc-severity-badge critical">CRITICAL ELEVATED</span>
            </div>
          </div>

          {/* Heuristic Methodology Indicators (P E D R M) */}
          <div className="stitch-methodology-row">
            <div className="stitch-method-item">
              <span className="stitch-method-circle">P</span>
              <span>Prevent</span>
            </div>
            <div className="stitch-method-item">
              <span className="stitch-method-circle">E</span>
              <span>Endpoint</span>
            </div>
            <div className="stitch-method-item active">
              <span className="stitch-method-circle">D</span>
              <span>Detect</span>
            </div>
            <div className="stitch-method-item">
              <span className="stitch-method-circle">R</span>
              <span>Respond</span>
            </div>
            <div className="stitch-method-item">
              <span className="stitch-method-circle">M</span>
              <span>Monitor</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: 3 Cards (Threat Hunting, Forensics, SOC Messages) */}
      <div className="stitch-bottom-grid">
        {/* Card 1: Threat Hunting */}
        <div className="stitch-sub-card">
          <div className="stitch-sub-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="stitch-sub-icon-box">
                <Compass size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--color-primary-text)' }}>Threat Hunting</strong>
                <div style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>Active investigations</div>
              </div>
            </div>
            <span className="stitch-count-badge">{totalCases}</span>
          </div>

          {/* Soundwave Frequency Bars */}
          <div className="stitch-soundwave-bars">
            {[24, 38, 18, 44, 28, 46, 32, 20, 48, 36, 16, 42, 30, 40].map((h, i) => (
              <span key={i} className="stitch-bar" style={{ height: `${h}px` }} />
            ))}
          </div>

          <div className="stitch-metric-list">
            <div className="stitch-metric-row">
              <span><span className="stitch-metric-dot" /> Active hunts</span>
              <strong style={{ color: 'var(--color-primary-text)' }}>{totalCases}</strong>
            </div>
            <div className="stitch-metric-row">
              <span><span className="stitch-metric-dot" /> Critical risk indicators</span>
              <strong style={{ color: 'var(--color-high)' }}>{criticalCases}</strong>
            </div>
            <div className="stitch-metric-row">
              <span><span className="stitch-metric-dot" /> Cross-rail bridge matches</span>
              <strong style={{ color: '#ec4899' }}>5</strong>
            </div>
          </div>

          <div className="stitch-sub-card-footer" onClick={() => navigate('/investigations')}>
            <span>Open investigations</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Card 2: Forensics & Evidence */}
        <div className="stitch-sub-card">
          <div className="stitch-sub-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="stitch-sub-icon-box purple">
                <FileText size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--color-primary-text)' }}>Forensics</strong>
                <div style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>Evidence review schedule</div>
              </div>
            </div>
            <span className="stitch-count-badge" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
              18
            </span>
          </div>

          {/* Circular Donut Gauge */}
          <div className="stitch-donut-row">
            <svg viewBox="0 0 36 36" className="stitch-donut-svg">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(35, 60, 92, 0.4)"
                strokeWidth="3.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#00f2fe"
                strokeWidth="3.5"
                strokeDasharray="68, 100"
              />
              <text x="18" y="21" textAnchor="middle" fill="#00f2fe" fontSize="8.5" fontWeight="800" transform="rotate(90 18 18)">
                68%
              </text>
            </svg>

            <div style={{ fontSize: '12px', color: 'var(--color-secondary-text)', lineHeight: '1.5' }}>
              <strong style={{ color: 'var(--color-primary-text)', display: 'block', fontSize: '13px' }}>
                Evidentiary Review
              </strong>
              3 structured evidence validation jobs active across rails.
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--color-muted-text)', background: 'var(--color-surface-soft)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
            All artifacts tagged with source provenance & non-inferential disclosures.
          </div>

          <div className="stitch-sub-card-footer" onClick={() => navigate('/investigations/INV-004/evidence')}>
            <span>Open evidence locker</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Card 3: Operational Messages / Alerts */}
        <div className="stitch-sub-card">
          <div className="stitch-sub-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="stitch-sub-icon-box amber">
                <Activity size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--color-primary-text)' }}>Operational Intel</strong>
                <div style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>Unread analyst updates</div>
              </div>
            </div>
            <span className="stitch-count-badge" style={{ background: 'rgba(255, 145, 0, 0.12)', color: '#ff9100', borderColor: 'rgba(255, 145, 0, 0.3)' }}>
              5
            </span>
          </div>

          <div className="stitch-update-list">
            <div className="stitch-update-item">
              <span className="stitch-update-title">
                <span className="stitch-update-dot" />
                Cross-Rail Bridge Detected
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>10m ago</span>
            </div>

            <div className="stitch-update-item">
              <span className="stitch-update-title">
                <span className="stitch-update-dot" style={{ background: '#ff9100', boxShadow: '0 0 6px #ff9100' }} />
                Impossible Travel Velocity
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>32m ago</span>
            </div>

            <div className="stitch-update-item">
              <span className="stitch-update-title">
                <span className="stitch-update-dot" style={{ background: '#a855f7', boxShadow: '0 0 6px #a855f7' }} />
                VASP Deposit Notice Ready
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>1h ago</span>
            </div>
          </div>

          <div className="stitch-sub-card-footer" onClick={() => navigate('/cases')}>
            <span>Review updates</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* 4. Active Cases Intake Table Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Activity size={16} color="var(--color-accent)" />
              Active Investigation Dossiers
            </h3>
            <p className="card-subtitle">
              Prioritized multi-rail case ledger with deterministic risk metrics
            </p>
          </div>
          <button 
            className="button button-ghost"
            onClick={() => navigate('/cases')}
          >
            View All Cases <ArrowRight size={13} />
          </button>
        </div>

        <div className="workspace-table-container">
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Case Reference</th>
                <th>Target Subject</th>
                <th>Rails</th>
                <th>Priority / Risk</th>
                <th>Status</th>
                <th>Investigator</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.length > 0 ? (
                cases.slice(0, 5).map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="mono-hash" style={{ fontWeight: 700 }}>{c.id}</span>
                      <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>{c.title}</div>
                    </td>
                    <td>
                      <span className="mono-hash">{c.targetWallet || '0x71c8...1350'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span className="rail-pill crypto">CRYPTO</span>
                        {c.priority === 'CRITICAL' && <span className="rail-pill upi">UPI</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`severity-pill ${(c.priority || 'medium').toLowerCase()}`}>
                        {c.priority || 'ELEVATED'}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge complete">{c.status || 'ACTIVE'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11.5px', color: 'var(--color-secondary-text)' }}>
                        {c.assignedInvestigator || 'LE Officer #8327A'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="button button-secondary"
                        onClick={() => navigate(`/cases/${encodeURIComponent(c.id)}`)}
                        style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-muted-text)' }}>
                    No active cases cataloged. Click "Open New Case" to begin investigation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
