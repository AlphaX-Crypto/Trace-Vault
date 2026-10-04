import React, { useState, useEffect } from 'react';
import { GraphWorkspace } from '../graph/GraphWorkspace';
import { RiskAnalysisWorkspace } from '../risk/RiskAnalysisWorkspace';
import { UPIFraudWorkspace } from '../upi/UPIFraudWorkspace';
import { VASPAttributionWorkspace } from '../attribution/VASPAttributionWorkspace';
import { GeospatialWorkspace } from '../geospatial/GeospatialWorkspace';
import { EvidenceWorkspace } from '../evidence/EvidenceWorkspace';
import { ReportWorkspace } from '../report/ReportWorkspace';
import { DisclosureWorkspace } from '../disclosure/DisclosureWorkspace';
import { TransactionExplorer } from '../transactions/TransactionExplorer';
import { api, DataSourceState } from '../../api/client';

interface SimpleWorkspaceProps {
  onSignOut: () => void;
}

export const SimpleWorkspace: React.FC<SimpleWorkspaceProps> = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedTxHash, setSelectedTxHash] = useState<string | undefined>(undefined);
  const [selectedGraphEntityId, setSelectedGraphEntityId] = useState<string | undefined>(undefined);
  const [prefilledDisclosureVasp, setPrefilledDisclosureVasp] = useState<string | undefined>(undefined);
  const [prefilledDisclosureSubject, setPrefilledDisclosureSubject] = useState<string | undefined>(undefined);
  const [txOriginTab, setTxOriginTab] = useState<'Risk' | 'UPI Fraud' | 'Attribution' | 'Geospatial' | 'Evidence' | 'Report' | 'Disclosure'>('Risk');
  const [searchQuery, setSearchQuery] = useState('');
  const [dataSource, setDataSource] = useState<DataSourceState>('DEMO_SYNTHETIC');
  const [backendErrorMsg, setBackendErrorMsg] = useState<string | null>(null);
  const [liveCases, setLiveCases] = useState<any[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string>('CASE-2026-001');



  const tableRows = [
    {
      id: 'HOP-2026-918',
      chain: 'Ethereum',
      hash: '0x8ef2a9103c8b7b659fe10938bfe41209b0a124982',
      from: '0x71F9A6809403dE...89b0A1',
      to: '0x84C2EF17BD0038...87e109',
      size: '17.42 kB',
      txs: 12,
      gas: '42.50 ETH',
      status: 'Flagged Peeling',
      age: '1 min ago'
    },
    {
      id: 'HOP-2026-917',
      chain: 'Ethereum',
      hash: '0xad9f7c992014...4c1e3e0984da',
      from: '0x84C2EF17BD0038...87e109',
      to: '0x3AF17828C403dE...828C4',
      size: '18.25 kB',
      txs: 10,
      gas: '12.50 ETH',
      status: 'Layering Hop',
      age: '1 min ago'
    },
    {
      id: 'HOP-2026-916',
      chain: 'Tornado Pool',
      hash: '0x90272f6a8819...cf746f120938',
      from: '0x6D11A04913k...E813C',
      to: '0x891C79028A...0D55E (Mixer)',
      size: '6.12 kB',
      txs: 120,
      gas: '30.00 ETH',
      status: 'Anonymized',
      age: '1 min ago'
    },
    {
      id: 'HOP-2026-915',
      chain: 'Tron TRC-20',
      hash: '0x721629e59041...9e96521948fc',
      from: '0x18D50244C...45502b',
      to: 'vpa98@okhdfcbank',
      size: '65.86 kB',
      txs: 45,
      gas: '85,000 USDT',
      status: 'P2P Liquidated',
      age: '1 min ago'
    },
    {
      id: 'HOP-2026-914',
      chain: 'UPI Domestic',
      hash: 'TX-UPI-001 (UPI_REF_9182049281920)',
      from: 'otc_desk@okhdfcbank',
      to: 'vpa98@okhdfcbank',
      size: '3.81 kB',
      txs: 2,
      gas: '₹49,500.00',
      status: 'Rapid Pass-Through',
      age: '2 mins ago'
    },
    {
      id: 'HOP-2026-913',
      chain: 'HDFC Banking',
      hash: 'NEFT_CLEARING_881920384',
      from: 'HDFC A/C ...8192',
      to: 'Cash ATM Dispersal',
      size: '29.7 kB',
      txs: 1,
      gas: '₹53.00 L',
      status: 'Cash Outflow',
      age: '2 mins ago'
    }
  ];

  const casesList = [
    {
      id: 'CASE-2026-001',
      title: 'Cross-Rail Peeling Chain to Domestic VPA Sweep',
      description: 'Multi-hop laundering across Ethereum peeling wallets and domestic UPI accounts.',
      type: 'Cross-Rail',
      priority: 'Critical',
      targetIdentifier: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
      status: 'Active',
      updatedAt: '12m ago',
      createdAt: '2026-03-30',
      investigator: 'Inspector Samarth'
    },
    {
      id: 'CASE-2026-002',
      title: 'Tornado Cash Smart Contract Extraction',
      description: 'Mixer contract extraction associated with flagged smart contracts.',
      type: 'Crypto',
      priority: 'High',
      targetIdentifier: '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b',
      status: 'Active',
      updatedAt: '45m ago',
      createdAt: '2026-03-29',
      investigator: 'Inspector Samarth'
    },
    {
      id: 'CASE-2026-003',
      title: 'P2P Merchant Rapid Dispersal Fraud',
      description: 'Rapid dispersal of high-velocity VPA accounts through domestic banking gateways.',
      type: 'UPI',
      priority: 'Medium',
      targetIdentifier: 'vpa98@okhdfcbank',
      status: 'Review',
      updatedAt: '2h ago',
      createdAt: '2026-03-28',
      investigator: 'Inspector Samarth'
    }
  ];

  useEffect(() => {
    let isMounted = true;
    async function initBackend() {
      try {
        const isHealthy = await api.checkHealth();
        if (!isHealthy) {
          if (isMounted) {
            setDataSource('DEMO_SYNTHETIC');
          }
          return;
        }

        // Try fetching cases from live backend
        const res = await api.get<any[]>('/api/cases');
        if (!isMounted) return;

        if (res.success && Array.isArray(res.data)) {
          setDataSource('LIVE_BACKEND');
          setBackendErrorMsg(null);
          setLiveCases(res.data);
        } else {
          setDataSource('DEMO_SYNTHETIC');
        }
      } catch (err: any) {
        if (isMounted) {
          setDataSource('BACKEND_UNAVAILABLE');
          setBackendErrorMsg(err?.message || 'Failed to reach API gateway');
        }
      }
    }
    initBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedCases = liveCases.length > 0
    ? liveCases.map((c) => ({
        id: c.case_id || c.id,
        title: c.title || 'Investigation Case',
        description: c.description || 'Forensic case record',
        type: c.case_type || c.type || 'Cross-Rail',
        priority: c.priority || 'Medium',
        targetIdentifier: c.target_identifier || c.targetIdentifier || 'N/A',
        status: c.status || 'Active',
        updatedAt: c.updated_at ? new Date(c.updated_at).toLocaleTimeString() : 'Just now',
        createdAt: c.created_at || '2026-03-30',
        investigator: c.investigator || 'Inspector Samarth'
      }))
    : casesList;

  const navItems = [
    {
      id: 'Dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      )
    },
    {
      id: 'Transactions',
      label: 'Transactions',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3 4 7l4 4" />
          <path d="M4 7h16" />
          <path d="m16 21 4-4-4-4" />
          <path d="M20 17H4" />
        </svg>
      )
    },
    {
      id: 'Cases',
      label: 'Cases',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      )
    },
    {
      id: 'Graph',
      label: 'Graph Workspace',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="18" cy="18" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M9 6h6" />
          <path d="M6 9v6" />
          <path d="M9 18h6" />
          <path d="M18 9v6" />
        </svg>
      )
    },
    {
      id: 'Risk',
      label: 'Risk Analysis',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    },
    {
      id: 'UPI Fraud',
      label: 'UPI Fraud',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <line x1="6" y1="15" x2="10" y2="15" />
        </svg>
      )
    },
    {
      id: 'Attribution',
      label: 'VASP Attribution',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'Geospatial',
      label: 'Geospatial',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )
    },
    {
      id: 'Evidence',
      label: 'Evidence',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    },
    {
      id: 'Report',
      label: 'Reports',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
      )
    },
    {
      id: 'Disclosure',
      label: 'Disclosure / SAHYOG',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      )
    }
  ];

  return (
    <div className="app-shell-root">
      {/* ========================================================
          PERMANENT LEFT SIDEBAR (EXACT MATCH REFERENCE 1, 3, 4)
         ======================================================== */}
      <aside className="app-sidebar" aria-label="Main Navigation">
        {/* Brand Circle Badge */}
        <div className="sidebar-brand-row" onClick={() => setActiveTab('Dashboard')}>
          <div className="brand-circle-badge">TV</div>
          <span className="brand-text">TraceVault</span>
        </div>

        {/* Section 1: Navigation */}
        <div className="sidebar-section-heading">Navigation</div>
        <nav className="sidebar-nav-group">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
                {isActive && <div className="nav-active-pill-bar" />}
              </button>
            );
          })}
        </nav>

        {/* Section 2: Active Matters / Rails (Exact Reference Visual Layout) */}
        <div className="sidebar-section-heading">Active Matters</div>
        <div className="sidebar-balances-list">
          <div className="balance-item" onClick={() => setActiveTab('Cases')} style={{ cursor: 'pointer' }}>
            <span className="balance-flag-circle eth-rail-dot">Ξ</span>
            <span className="balance-val">Cross-Rail Peeling</span>
          </div>
          <div className="balance-item" onClick={() => setActiveTab('UPI Fraud')} style={{ cursor: 'pointer' }}>
            <span className="balance-flag-circle upi-rail-dot">₹</span>
            <span className="balance-val">Domestic UPI Flow</span>
          </div>
          <div className="balance-item" onClick={() => setActiveTab('Risk')} style={{ cursor: 'pointer' }}>
            <span className="balance-flag-circle mixer-rail-dot">🌪</span>
            <span className="balance-val">Tornado Mixer Pool</span>
          </div>
          <button
            type="button"
            className="btn-add-balance"
            onClick={() => setActiveTab('Cases')}
          >
            <span className="plus-circle">+</span>
            <span>New Investigation Case</span>
          </button>
        </div>

        {/* Bottom Pinned: Profile Settings & Sign Out */}
        <div className="sidebar-bottom-pinned">
          <div className="profile-settings-btn" onClick={onSignOut}>
            <div className="profile-avatar-circle">S</div>
            <div className="profile-info-col">
              <span className="profile-name">Samarth</span>
              <span className="profile-role">Lead Investigator</span>
            </div>
            <svg className="settings-gear" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
        </div>
      </aside>

      {/* ========================================================
          MAIN WORKSPACE BODY
         ======================================================== */}
      <div className="app-workspace-body">
        {/* Top Header Row (Reference 1, 3, 4) */}
        <header className="workspace-top-bar">
          <div className="top-title-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="top-title font-sans">{activeTab}</h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '4px',
                background: dataSource === 'LIVE_BACKEND' ? '#ECFDF5' : dataSource === 'BACKEND_UNAVAILABLE' ? '#FEF2F2' : '#F1F5F9',
                color: dataSource === 'LIVE_BACKEND' ? '#047857' : dataSource === 'BACKEND_UNAVAILABLE' ? '#B91C1C' : '#475569',
                border: `1px solid ${dataSource === 'LIVE_BACKEND' ? '#A7F3D0' : dataSource === 'BACKEND_UNAVAILABLE' ? '#FECACA' : '#CBD5E1'}`
              }}
              title={backendErrorMsg || undefined}
            >
              {dataSource === 'LIVE_BACKEND' ? '● LIVE BACKEND' : dataSource === 'BACKEND_UNAVAILABLE' ? '✕ BACKEND OFFLINE (FIXTURE)' : '○ DEMO / SYNTHETIC'}
            </span>
          </div>

          <div className="top-controls-right">
            <div className="search-pill-box">
              <svg className="search-pill-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" x2="16.65" y1="21" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Type to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-pill-input font-sans"
              />
            </div>

            <button type="button" className="icon-bell-btn" title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </button>

            <div className="header-avatar-circle" title="Investigator Profile">
              <span>S</span>
            </div>
          </div>
        </header>

        {/* ========================================================
            VIEW ROUTER
           ======================================================== */}
        <div className="workspace-scroll-area">
          {/* VIEW 1: DASHBOARD (EXACT REPLICA OF REFERENCE 1 & REFERENCE 2) */}
          {activeTab === 'Dashboard' && (
            <main className="dashboard-content-container">
              {/* Top Hero Big Number & Action */}
              <div className="dashboard-hero-row">
                <div className="hero-balance-col">
                  <div className="hero-huge-number font-sans">
                    24,049,204 <span className="text-secondary font-mono" style={{ fontSize: '24px', fontWeight: 500 }}>USDT / INR Eq.</span>
                  </div>
                  <div className="hero-balance-sub font-sans">
                    Total Suspicious Volume Traced Across Active Cases <span className="currency-pill">MULTI-RAIL</span>
                  </div>
                </div>

                <div className="hero-action-col">
                  <button
                    type="button"
                    onClick={() => setActiveTab('Cases')}
                    className="btn-hero-action font-sans"
                  >
                    <span className="plus-symbol">+</span>
                    <span>New Investigation Case</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Content Grid: Left (Multi-Rail Peeling Velocity Chart) vs Right (Active Case Dossier & Recent Forensic Activity) */}
              <div className="dashboard-two-col-grid">
                {/* Left Card: Fund Flow & Peeling Velocity (Exact Reference 1 Area Chart Visual Structure) */}
                <section className="clean-white-card">
                  <div className="card-top-header">
                    <div>
                      <h2 className="card-title font-sans">Fund Flow &amp; Peeling Velocity</h2>
                      <p className="card-sub-description font-sans">Crypto ingress volume vs domestic UPI cash-out egress over time.</p>
                    </div>
                    <button type="button" className="btn-icon-minimal" title="Investigation Timeline">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" y1="16" x2="16" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                    </button>
                  </div>

                  {/* Clean SVG Bar Graph with varying density/intensity of blue */}
                  <div className="chart-canvas-box">
                    <svg className="chart-svg-view" viewBox="0 0 540 220" preserveAspectRatio="none">
                      {/* Grid guideline levels */}
                      <line x1="0" y1="40" x2="540" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="90" x2="540" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="140" x2="540" y2="140" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="190" x2="540" y2="190" stroke="#e2e8f0" strokeWidth="1" />

                      {/* Bar 1 (08:00) */}
                      <rect x="25" y="115" width="28" height="75" rx="4" fill="#93c5fd" opacity="0.85" />
                      <text x="39" y="206" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="Inter, sans-serif">08:00</text>

                      {/* Bar 2 (09:00) */}
                      <rect x="75" y="80" width="28" height="110" rx="4" fill="#60a5fa" opacity="0.9" />
                      <text x="89" y="206" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="Inter, sans-serif">09:00</text>

                      {/* Bar 3 (10:00) */}
                      <rect x="125" y="130" width="28" height="60" rx="4" fill="#bfdbfe" opacity="0.8" />
                      <text x="139" y="206" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="Inter, sans-serif">10:00</text>

                      {/* Bar 4 (11:00) */}
                      <rect x="175" y="65" width="28" height="125" rx="4" fill="#3b82f6" opacity="0.95" />
                      <text x="189" y="206" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="Inter, sans-serif">11:00</text>

                      {/* Bar 5 (12:00) */}
                      <rect x="225" y="100" width="28" height="90" rx="4" fill="#60a5fa" opacity="0.9" />
                      <text x="239" y="206" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="Inter, sans-serif">12:00</text>

                      {/* Bar 6 (13:00) - Peak / Highlight */}
                      <rect x="275" y="38" width="28" height="152" rx="4" fill="#1d4ed8" />
                      <text x="289" y="206" textAnchor="middle" fill="#111827" fontWeight="600" fontSize="10.5" fontFamily="Inter, sans-serif">13:00</text>

                      {/* Bar 7 (14:00) */}
                      <rect x="325" y="75" width="28" height="115" rx="4" fill="#2563eb" opacity="0.95" />
                      <text x="339" y="206" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="Inter, sans-serif">14:00</text>

                      {/* Bar 8 (15:00) */}
                      <rect x="375" y="120" width="28" height="70" rx="4" fill="#93c5fd" opacity="0.85" />
                      <text x="389" y="206" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="Inter, sans-serif">15:00</text>

                      {/* Bar 9 (16:00) */}
                      <rect x="425" y="90" width="28" height="100" rx="4" fill="#3b82f6" opacity="0.9" />
                      <text x="439" y="206" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="Inter, sans-serif">16:00</text>

                      {/* Bar 10 (17:00) */}
                      <rect x="475" y="140" width="28" height="50" rx="4" fill="#dbeafe" opacity="0.9" />
                      <text x="489" y="206" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="Inter, sans-serif">17:00</text>
                    </svg>

                    {/* Tooltip Card Overlay over the peak bar */}
                    <div className="chart-tooltip-badge" style={{ left: '53.5%', top: '15%' }}>
                      <span className="tooltip-time">13:00 UTC Peak Hop #1</span>
                      <span className="tooltip-amount">42.50 ETH Outflow</span>
                    </div>
                  </div>

                  {/* Summary Metric Rows */}
                  <div className="chart-metrics-footer">
                    <div className="metric-row-split">
                      <div className="metric-col-left">
                        <span className="indicator-dot blue-dot" />
                        <span className="metric-name">On-Chain Crypto Ingress</span>
                      </div>
                      <div className="metric-col-right">
                        <span className="metric-val">142.50 ETH</span>
                        <span className="metric-tag tag-green">+12 Hops ↗</span>
                      </div>
                    </div>

                    <div className="metric-row-split">
                      <div className="metric-col-left">
                        <span className="indicator-dot green-dot" />
                        <span className="metric-name">Domestic UPI &amp; Banking Egress</span>
                      </div>
                      <div className="metric-col-right">
                        <span className="metric-val">₹53.00 Lakhs</span>
                        <span className="metric-tag tag-pink">High Velocity ↘</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('Report')}
                      className="btn-detailed-report font-sans"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                      </svg>
                      <span>Generate Full Forensic Dossier</span>
                    </button>
                  </div>
                </section>

                {/* Right Card: Active Case Dossier & Recent Forensic Activity (Exact Reference 1 Visual Layout) */}
                <section className="clean-white-card">
                  <div className="card-top-header">
                    <div>
                      <h2 className="card-title font-sans">Active Investigation Target</h2>
                      <p className="card-sub-description font-sans">CASE-2026-001 Priority Target Dossier</p>
                    </div>
                    <button type="button" className="btn-icon-minimal" onClick={() => setActiveTab('Cases')} title="All Cases">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <line x1="2" x2="22" y1="10" y2="10" />
                      </svg>
                    </button>
                  </div>

                  {/* Active Case Dossier Box (Exact Visual Match to Reference 1 Card Widget) */}
                  <div className="wallet-card-carousel">
                    <button type="button" className="carousel-nav-btn" onClick={() => setActiveTab('Cases')} title="Previous Matter">‹</button>
                    
                    <div className="fintech-credit-card">
                      <div className="card-network-row">
                        <span className="visa-text">CASE-2026-001</span>
                      </div>
                      <div className="card-num-text font-mono" title="Subject Wallet Address">
                        0x71F9...89b0A1
                      </div>
                      <div className="card-balance-row">
                        <div className="cb-col">
                          <span className="cb-label">Correlated Domestic VPA</span>
                          <span className="cb-val font-mono">vpa98@okhdfcbank</span>
                        </div>
                        <div className="cb-col">
                          <span className="cb-label">Risk Rating</span>
                          <span className="cb-val font-mono">72 / 100</span>
                        </div>
                      </div>
                    </div>

                    <button type="button" className="carousel-nav-btn" onClick={() => setActiveTab('Cases')} title="Next Matter">›</button>
                  </div>

                  {/* Quick Forensic Action Buttons (Exact Reference 1 4-Button Grid) */}
                  <div className="card-quick-actions-row">
                    <button type="button" className="action-pill-btn" onClick={() => setActiveTab('Graph')}>
                      <div className="icon-circle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="6" cy="6" r="3" />
                          <circle cx="18" cy="18" r="3" />
                          <path d="M9 6h6" /><path d="M6 9v6" />
                        </svg>
                      </div>
                      <span>Visual Graph</span>
                    </button>

                    <button type="button" className="action-pill-btn" onClick={() => setActiveTab('Risk')}>
                      <div className="icon-circle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <span>Risk Signals</span>
                    </button>

                    <button type="button" className="action-pill-btn" onClick={() => setActiveTab('UPI Fraud')}>
                      <div className="icon-circle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                      </div>
                      <span>UPI Activity</span>
                    </button>

                    <button type="button" className="action-pill-btn" onClick={() => setActiveTab('Disclosure')}>
                      <div className="icon-circle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <span>Requisition</span>
                    </button>
                  </div>

                  {/* Recent Forensic Activity Section (Exact Reference 1 List Style) */}
                  <div className="latest-tx-header">
                    <span className="lt-title font-sans">Recent Forensic Activity</span>
                  </div>

                  <div className="latest-tx-list">
                    <div className="tx-item-row" onClick={() => setActiveTab('Transactions')}>
                      <div className="tx-brand-icon blue-bg">Ξ</div>
                      <div className="tx-info-col">
                        <span className="tx-title">Flagged Peeling Hop (0x8ef2...24982)</span>
                        <span className="tx-sub">Ethereum Mainnet · 1 min ago</span>
                      </div>
                      <div className="tx-amount-col negative">
                        42.50 ETH
                      </div>
                    </div>

                    <div className="tx-item-row" onClick={() => setActiveTab('UPI Fraud')}>
                      <div className="tx-brand-icon blue-dark-bg">₹</div>
                      <div className="tx-info-col">
                        <span className="tx-title">Rapid UPI Pass-Through (vpa98@okhdfcbank)</span>
                        <span className="tx-sub">Domestic NPCI Relay · 2 mins ago</span>
                      </div>
                      <div className="tx-amount-col negative">
                        ₹49,500.00
                      </div>
                    </div>

                    <div className="tx-item-row" onClick={() => setActiveTab('Attribution')}>
                      <div className="tx-brand-icon black-bg">◈</div>
                      <div className="tx-info-col">
                        <span className="tx-title">Candidate VASP Identified (Example Exchange)</span>
                        <span className="tx-sub">Liquidation Corridor · 82% Confidence</span>
                      </div>
                      <div className="tx-amount-col negative">
                        3 Hops
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Bottom Table Card (Reference 4 / Blocks & Verified Traces) */}
              <section className="clean-white-card full-width-table-card">
                <div className="card-top-header">
                  <div>
                    <h2 className="card-title font-sans">Recent Multi-Rail Traces &amp; Verification</h2>
                    <p className="card-sub-description font-sans">All incoming &amp; outgoing multi-hop fund movements across crypto and domestic rails.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('Transactions')}
                    className="btn-detailed-report"
                    style={{ width: 'auto', margin: 0, padding: '6px 14px' }}
                  >
                    View All Transactions →
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="reference-styled-table">
                    <thead>
                      <tr>
                        <th>Hop / Case ID</th>
                        <th>Network Rail</th>
                        <th>Source Address</th>
                        <th>Destination Entity</th>
                        <th>Payload Size</th>
                        <th>Tx Count</th>
                        <th>Traced Value</th>
                        <th>Status</th>
                        <th>Age</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr key={row.id} onClick={() => setActiveTab('Graph')} style={{ cursor: 'pointer' }}>
                          <td className="font-mono font-medium">{row.id}</td>
                          <td><span className="rail-pill">{row.chain}</span></td>
                          <td className="font-mono text-secondary">{row.from}</td>
                          <td className="font-mono text-secondary">{row.to}</td>
                          <td className="text-secondary">{row.size}</td>
                          <td className="text-secondary">{row.txs}</td>
                          <td className="font-mono font-medium">{row.gas}</td>
                          <td>
                            <span className="status-badge-clean">{row.status}</span>
                          </td>
                          <td className="text-secondary">{row.age}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Footer */}
              <footer className="dashboard-footer-bar">
                <div className="footer-links">
                  <a href="#privacy">Privacy Policy</a>
                  <a href="#license">License</a>
                  <a href="#api">API</a>
                  <a href="#help">Help Center</a>
                  <span className="copyright-text">© 2026 TraceVault. All rights reserved</span>
                </div>
                <div className="footer-lang-theme">
                  <span>English 🌐</span>
                  <span className="theme-toggle-icon">🌙</span>
                </div>
              </footer>
            </main>
          )}

          {/* VIEW 2: GRAPH WORKSPACE */}
          {activeTab === 'Graph' && (
            <div className="sub-workspace-wrapper">
              <GraphWorkspace
                activeCaseId={activeCaseId}
                onBack={() => setActiveTab('Dashboard')}
                onOpenTransactions={() => setActiveTab('Transactions')}
                onOpenRisk={() => setActiveTab('Risk')}
                onOpenEvidence={() => setActiveTab('Evidence')}
                initialSelectedId={selectedGraphEntityId}
              />
            </div>
          )}

          {/* VIEW 3: TRANSACTIONS WORKSPACE */}
          {activeTab === 'Transactions' && (
            <div className="sub-workspace-wrapper">
              <TransactionExplorer
                activeCaseId={activeCaseId}
                onBack={() => setActiveTab('Dashboard')}
                onViewInGraph={(_tx) => {
                  setSelectedGraphEntityId('suspect');
                  setActiveTab('Graph');
                }}
                onOpenRisk={() => setActiveTab('Risk')}
                onOpenUPI={() => setActiveTab('UPI Fraud')}
                onOpenEvidence={() => setActiveTab('Evidence')}
                initialSearchHash={selectedTxHash}
                txOriginTab={txOriginTab}
                onClearTxFilter={() => setSelectedTxHash(undefined)}
              />
            </div>
          )}

          {/* VIEW 4: CASES WORKSPACE */}
          {activeTab === 'Cases' && (
            <main className="dashboard-content-container">
              <div className="section-title-row">
                <div>
                  <h1 className="section-main-title font-sans">Investigation Case Registry</h1>
                  <p className="section-main-sub">Formal financial intelligence matters under active forensic review.</p>
                </div>
                <button type="button" className="btn-primary-action" onClick={() => setActiveTab('Report')}>
                  Generate Report →
                </button>
              </div>

              <section className="clean-white-card full-width-table-card">
                <div className="table-wrapper">
                  <table className="reference-styled-table">
                    <thead>
                      <tr>
                        <th>Case Reference</th>
                        <th>Investigation Matter</th>
                        <th>Classification</th>
                        <th>Target Subject Identifier</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Last Active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedCases.map((c) => (
                        <tr key={c.id} onClick={() => setActiveCaseId(c.id)} style={{ cursor: 'pointer' }}>
                          <td className="font-mono font-medium">{c.id}</td>
                          <td className="font-medium">{c.title}</td>
                          <td><span className="rail-pill">{c.type}</span></td>
                          <td className="font-mono text-secondary">{c.targetIdentifier}</td>
                          <td><span className="priority-pill">{c.priority}</span></td>
                          <td><span className="status-badge-clean">{c.status}</span></td>
                          <td className="text-secondary">{c.updatedAt}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-table-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCaseId(c.id);
                                setActiveTab(c.type.includes('UPI') ? 'UPI Fraud' : 'Risk');
                              }}
                            >
                              Analyze →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </main>
          )}

          {/* VIEW 5: RISK ANALYSIS */}
          {activeTab === 'Risk' && (
            <div className="sub-workspace-wrapper">
              <RiskAnalysisWorkspace
                activeCaseId={activeCaseId}
                onBack={() => setActiveTab('Dashboard')}
                onNavigateToTransaction={(txHash) => {
                  setSelectedTxHash(txHash);
                  setTxOriginTab('Risk');
                  setActiveTab('Transactions');
                }}
                onNavigateToGraph={(entityId) => {
                  setSelectedGraphEntityId(entityId);
                  setActiveTab('Graph');
                }}
              />
            </div>
          )}

          {/* VIEW 6: VASP ATTRIBUTION */}
          {activeTab === 'Attribution' && (
            <div className="sub-workspace-wrapper">
              <VASPAttributionWorkspace
                activeCaseId={activeCaseId}
                onBack={() => setActiveTab('Dashboard')}
                onNavigateToTransaction={(txHash) => {
                  setSelectedTxHash(txHash);
                  setTxOriginTab('Attribution');
                  setActiveTab('Transactions');
                }}
                onNavigateToGraph={(entityId) => {
                  setSelectedGraphEntityId(entityId);
                  setActiveTab('Graph');
                }}
                onNavigateToRisk={() => setActiveTab('Risk')}
                onNavigateToEvidence={() => setActiveTab('Evidence')}
                onNavigateToDisclosure={(vaspName, subject) => {
                  setPrefilledDisclosureVasp(vaspName);
                  setPrefilledDisclosureSubject(subject);
                  setActiveTab('Disclosure');
                }}
              />
            </div>
          )}

          {/* VIEW 7: UPI FRAUD WORKSPACE */}
          {activeTab === 'UPI Fraud' && (
            <div className="sub-workspace-wrapper">
              <UPIFraudWorkspace
                activeCaseId={activeCaseId}
                onBack={() => setActiveTab('Dashboard')}
                onNavigateToTransaction={(txId) => {
                  setSelectedTxHash(txId);
                  setTxOriginTab('UPI Fraud');
                  setActiveTab('Transactions');
                }}
                onNavigateToGraph={(entityId) => {
                  setSelectedGraphEntityId(entityId);
                  setActiveTab('Graph');
                }}
                onNavigateToRisk={() => setActiveTab('Risk')}
              />
            </div>
          )}

          {/* VIEW 8: GEOSPATIAL INTELLIGENCE */}
          {activeTab === 'Geospatial' && (
            <div className="sub-workspace-wrapper">
              <GeospatialWorkspace
                activeCaseId={activeCaseId}
                onBack={() => setActiveTab('Dashboard')}
                onNavigateToTransaction={(txId) => {
                  setSelectedTxHash(txId);
                  setTxOriginTab('Geospatial');
                  setActiveTab('Transactions');
                }}
                onNavigateToGraph={(entityId) => {
                  setSelectedGraphEntityId(entityId);
                  setActiveTab('Graph');
                }}
                onNavigateToRisk={() => setActiveTab('Risk')}
                onNavigateToEvidence={() => setActiveTab('Evidence')}
              />
            </div>
          )}

          {/* VIEW 9: EVIDENCE WORKSPACE */}
          {activeTab === 'Evidence' && (
            <div className="sub-workspace-wrapper">
              <EvidenceWorkspace
                activeCaseId={activeCaseId}
                onBack={() => setActiveTab('Dashboard')}
                onNavigateToTransaction={(txId) => {
                  setSelectedTxHash(txId);
                  setTxOriginTab('Evidence');
                  setActiveTab('Transactions');
                }}
                onNavigateToGraph={(entityId) => {
                  setSelectedGraphEntityId(entityId || '0x71F9A6809403dE4B07B4f114B5C1089b0A124982');
                  setActiveTab('Graph');
                }}
                onNavigateToRisk={() => setActiveTab('Risk')}
                onNavigateToUPI={() => setActiveTab('UPI Fraud')}
                onNavigateToAttribution={() => setActiveTab('Attribution')}
                onNavigateToGeospatial={() => setActiveTab('Geospatial')}
                onNavigateToReport={() => setActiveTab('Report')}
                onNavigateToDisclosure={() => setActiveTab('Disclosure')}
              />
            </div>
          )}

          {/* VIEW 10: REPORT WORKSPACE */}
          {activeTab === 'Report' && (
            <div className="sub-workspace-wrapper">
              <ReportWorkspace
                activeCaseId={activeCaseId}
                onBackToCase={() => setActiveTab('Cases')}
                onNavigateToTransaction={(txId) => {
                  setSelectedTxHash(txId);
                  setTxOriginTab('Report');
                  setActiveTab('Transactions');
                }}
                onNavigateToGraph={(entityId) => {
                  setSelectedGraphEntityId(entityId || '0x71F9A6809403dE4B07B4f114B5C1089b0A124982');
                  setActiveTab('Graph');
                }}
                onNavigateToRisk={() => setActiveTab('Risk')}
                onNavigateToUpi={() => setActiveTab('UPI Fraud')}
                onNavigateToVasp={() => setActiveTab('Attribution')}
                onNavigateToGeospatial={() => setActiveTab('Geospatial')}
                onNavigateToEvidence={() => setActiveTab('Evidence')}
                onNavigateToDisclosure={() => setActiveTab('Disclosure')}
              />
            </div>
          )}

          {/* VIEW 11: SAHYOG / DISCLOSURE WORKSPACE */}
          {activeTab === 'Disclosure' && (
            <div className="sub-workspace-wrapper">
              <DisclosureWorkspace
                activeCaseId={activeCaseId}
                onBack={() => setActiveTab('Dashboard')}
                onNavigateToEvidence={() => setActiveTab('Evidence')}
                onNavigateToGraph={() => setActiveTab('Graph')}
                onNavigateToReport={() => setActiveTab('Report')}
                onNavigateToVASP={() => setActiveTab('Attribution')}
                prefilledTargetVasp={prefilledDisclosureVasp}
                prefilledSubject={prefilledDisclosureSubject}
              />
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          EMBEDDED DESIGN SYSTEM STYLES
         ======================================================== */}
      <style>{`
        .app-shell-root {
          display: flex;
          width: 100vw;
          min-height: 100vh;
          background-color: #f8fafc;
          color: #111827;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }

        /* ----------------------------------------------------
           LEFT SIDEBAR (260px wide, White, Matching Reference 1,3,4)
           ---------------------------------------------------- */
        .app-sidebar {
          width: 260px;
          min-width: 260px;
          max-width: 260px;
          height: 100vh;
          background-color: #ffffff;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          padding: 24px 20px 20px 20px;
          box-sizing: border-box;
          z-index: 20;
          overflow-y: auto;
        }

        .sidebar-brand-row {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          margin-bottom: 32px;
        }

        .brand-circle-badge {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #2563eb;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: -0.02em;
        }

        .brand-text {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
        }

        .sidebar-section-heading {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 12px 0 8px 6px;
        }

        .sidebar-nav-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 24px;
        }

        .sidebar-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease, color 0.15s ease;
          width: 100%;
        }

        .sidebar-nav-item:hover {
          background-color: #f8fafc;
          color: #111827;
        }

        .sidebar-nav-item.active {
          background-color: #eff6ff;
          color: #2563eb;
          font-weight: 600;
        }

        .nav-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: currentColor;
        }

        .nav-item-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-active-pill-bar {
          position: absolute;
          right: -20px;
          top: 8px;
          bottom: 8px;
          width: 3.5px;
          background-color: #2563eb;
          border-radius: 4px 0 0 4px;
        }

        .sidebar-balances-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: auto;
        }

        .balance-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 8px;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
        }

        .balance-flag-circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 600;
        }

        .eth-rail-dot {
          background-color: #eff6ff;
          color: #2563eb;
          border-color: #bfdbfe;
        }

        .upi-rail-dot {
          background-color: #ecfdf5;
          color: #059669;
          border-color: #a7f3d0;
        }

        .mixer-rail-dot {
          background-color: #fff7ed;
          color: #d97706;
          border-color: #fed7aa;
        }
        .balance-val {
          font-variant-numeric: tabular-nums;
          font-size: 13px;
          color: #475569;
        }

        .btn-add-balance {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 12.5px;
          font-weight: 500;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: color 0.15s ease;
          margin-top: 4px;
        }

        .btn-add-balance:hover {
          color: #2563eb;
        }

        .plus-circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid currentColor;
          font-size: 13px;
          line-height: 1;
        }

        .sidebar-bottom-pinned {
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          margin-top: 20px;
        }

        .profile-settings-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .profile-settings-btn:hover {
          background-color: #f8fafc;
        }

        .profile-avatar-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 13px;
        }

        .profile-info-col {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .profile-name {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .profile-role {
          font-size: 11px;
          color: #64748b;
        }

        .settings-gear {
          color: #94a3b8;
        }

        /* ----------------------------------------------------
           WORKSPACE RIGHT AREA
           ---------------------------------------------------- */
        .app-workspace-body {
          flex: 1;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f8fafc;
          overflow: hidden;
        }

        .workspace-top-bar {
          height: 64px;
          min-height: 64px;
          background-color: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          box-sizing: border-box;
          z-index: 10;
        }

        .top-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.01em;
        }

        .top-controls-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-pill-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          padding: 6px 14px;
          width: 240px;
        }

        .search-pill-icon {
          color: #94a3b8;
        }

        .search-pill-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 13px;
          color: #111827;
          width: 100%;
        }

        .search-pill-input::placeholder {
          color: #94a3b8;
        }

        .icon-bell-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .icon-bell-btn:hover {
          color: #111827;
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .header-avatar-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #cbd5e1;
          color: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }

        .workspace-scroll-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sub-workspace-wrapper {
          width: 100%;
          height: 100%;
          overflow-y: auto;
        }

        /* ----------------------------------------------------
           DASHBOARD CONTENT (REFERENCE 1 & 2 SPEC)
           ---------------------------------------------------- */
        .dashboard-content-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 32px 48px 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .dashboard-hero-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding-bottom: 4px;
        }

        .hero-huge-number {
          font-size: 44px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .hero-balance-sub {
          font-size: 13.5px;
          color: #64748b;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .currency-pill {
          color: #2563eb;
          font-weight: 600;
        }

        .btn-hero-action {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: #111827;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
          padding: 8px 12px;
        }

        .btn-hero-action:hover {
          color: #2563eb;
        }

        .plus-symbol {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid currentColor;
          font-size: 14px;
          line-height: 1;
        }

        /* 2-Column Grid */
        .dashboard-two-col-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 960px) {
          .dashboard-two-col-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Clean White Card Base (Reference 1, 3, 4) */
        .clean-white-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.01em;
        }

        .card-sub-description {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }

        .btn-icon-minimal {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon-minimal:hover {
          color: #111827;
          background: #f8fafc;
        }

        /* SVG Chart & Tooltip */
        .chart-canvas-box {
          position: relative;
          width: 100%;
          height: 220px;
          margin-bottom: 20px;
        }

        .chart-svg-view {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .chart-tooltip-badge {
          position: absolute;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 6px 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          pointer-events: none;
          transform: translate(-50%, -100%);
        }

        .tooltip-time {
          font-size: 11px;
          color: #94a3b8;
        }

        .tooltip-amount {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .chart-metrics-footer {
          display: flex;
          flex-direction: column;
          gap: 14px;
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
        }

        .metric-row-split {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .metric-col-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .blue-dot { background-color: #2563eb; }
        .green-dot { background-color: #10b981; }

        .metric-name {
          font-size: 13px;
          color: #64748b;
        }

        .metric-col-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .metric-val {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          font-variant-numeric: tabular-nums;
        }

        .metric-tag {
          font-size: 11.5px;
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .tag-green {
          color: #10b981;
          background: #ecfdf5;
        }

        .tag-pink {
          color: #f43f5e;
          background: #fff1f2;
        }

        .btn-detailed-report {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 16px;
          color: #111827;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
          margin-top: 6px;
        }

        .btn-detailed-report:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* Forensic Case Dossier Target Card (Visual Container matching Reference proportions) */
        .wallet-card-carousel {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .carousel-nav-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .carousel-nav-btn:hover {
          color: #111827;
          background: #f8fafc;
        }

        .fintech-credit-card {
          flex: 1;
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
          border-radius: 12px;
          padding: 22px 24px;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 18px;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.18);
        }

        .card-network-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .visa-text {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #bfdbfe;
          text-transform: uppercase;
        }

        .card-num-text {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: #ffffff;
        }

        .card-balance-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .cb-col {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .cb-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #93c5fd;
          font-weight: 500;
        }

        .cb-val {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
        }

        /* Quick Actions Row */
        .card-quick-actions-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .action-pill-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 11.5px;
          color: #64748b;
          transition: color 0.15s ease;
        }

        .action-pill-btn:hover {
          color: #111827;
        }

        .icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #334155;
          transition: all 0.15s ease;
        }

        .action-pill-btn:hover .icon-circle {
          border-color: #cbd5e1;
          background: #f8fafc;
          color: #111827;
        }

        /* Latest Transactions */
        .latest-tx-header {
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
          margin-bottom: 12px;
        }

        .lt-title {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
        }

        .latest-tx-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tx-item-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 6px 0;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }

        .tx-item-row:hover {
          opacity: 0.85;
        }

        .tx-brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          color: #ffffff;
          flex-shrink: 0;
        }

        .blue-bg { background-color: #2563eb; }
        .blue-dark-bg { background-color: #0284c7; }
        .black-bg { background-color: #111827; }

        .tx-info-col {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .tx-title {
          font-size: 13px;
          font-weight: 500;
          color: #111827;
        }

        .tx-sub {
          font-size: 11.5px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .tx-amount-col {
          font-size: 13.5px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .tx-amount-col.negative {
          color: #111827;
        }

        /* Tables & Lists */
        .full-width-table-card {
          width: 100%;
        }

        .table-wrapper {
          overflow-x: auto;
          margin-top: 12px;
        }

        .reference-styled-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .reference-styled-table th {
          text-align: left;
          padding: 12px 16px;
          color: #64748b;
          font-weight: 600;
          font-size: 12px;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .reference-styled-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #111827;
          vertical-align: middle;
          white-space: nowrap;
        }

        .reference-styled-table tr:hover td {
          background-color: #f8fafc;
        }

        .rail-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 6px;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          font-size: 11.5px;
          font-weight: 500;
          color: #334155;
        }

        .status-badge-clean {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 9999px;
          background-color: #ecfdf5;
          color: #10b981;
          font-size: 11.5px;
          font-weight: 500;
        }

        .priority-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 9999px;
          background-color: #fee2e2;
          color: #ef4444;
          font-size: 11px;
          font-weight: 600;
        }

        .btn-table-action {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          color: #2563eb;
          cursor: pointer;
        }

        .btn-table-action:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .text-secondary {
          color: #64748b;
        }

        /* Banner Card */
        .tx-banner-card {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .tx-banner-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .banner-tag {
          font-size: 11px;
          font-weight: 600;
          color: #2563eb;
          letter-spacing: 0.05em;
        }

        .banner-hash {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .banner-desc {
          font-size: 12px;
          color: #64748b;
        }

        .tx-banner-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-primary-action {
          background: #2563eb;
          color: #ffffff;
          border: 1px solid #2563eb;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-primary-action:hover {
          background: #1d4ed8;
        }

        .btn-secondary-action {
          background: #ffffff;
          color: #111827;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-secondary-action:hover {
          background: #f8fafc;
        }

        .section-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-main-title {
          font-size: 22px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.02em;
        }

        .section-main-sub {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }

        /* Footer */
        .dashboard-footer-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #e2e8f0;
          padding-top: 24px;
          margin-top: 16px;
          font-size: 12.5px;
          color: #64748b;
        }

        .footer-links {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .footer-links a {
          color: #64748b;
          text-decoration: none;
        }

        .footer-links a:hover {
          color: #111827;
        }

        .copyright-text {
          color: #94a3b8;
          margin-left: 10px;
        }

        .footer-lang-theme {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .theme-toggle-icon {
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};
