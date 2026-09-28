import React, { useState } from 'react';
import { 
  UserCheck2, 
  ShieldAlert, 
  Network, 
  Building2, 
  Radar, 
  FileLock2, 
  Clock, 
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import './evidenceLocker.css';

export default function EntityDossier() {
  const [copied, setCopied] = useState(false);

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="evidence-locker-page">
      {/* Header Banner */}
      <div className="evidence-header-banner">
        <div>
          <div className="evidence-header-badges">
            <span className="statutory-badge vault">
              <UserCheck2 size={11} /> ENTITY DOSSIER
            </span>
            <span className="statutory-badge admissible" style={{ color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.4)' }}>
              SYNTHETIC DEMONSTRATION SUBJECT
            </span>
          </div>
          <div className="evidence-docket-line">
            DOSSIER REF: <strong>DOS-2026-8327 // TARGET: VIKTOR "CIPHER" VANCE</strong>
          </div>
          <h1 className="evidence-header-title">
            Forensic Entity Intelligence Dossier
          </h1>
          <p className="evidence-header-subtitle">
            Consolidated multi-rail subject intelligence profiling unhosted crypto clusters, correlated banking VPAs, VASP associations, and geospatial anomalies.
          </p>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="evidence-metrics-grid">
        <div className="evidence-metric-card">
          <div className="metric-header">
            <span>COMPOSITE RISK LEVEL</span>
            <ShieldAlert size={13} />
          </div>
          <div className="metric-body">
            <span className="metric-val" style={{ color: '#ef4444' }}>88 / 100</span>
            <div className="metric-sub" style={{ color: '#ef4444' }}>CRITICAL ELEVATED</div>
          </div>
          <div className="metric-bar-indicator" style={{ background: '#ef4444' }} />
        </div>

        <div className="evidence-metric-card">
          <div className="metric-header">
            <span>NETWORK CLUSTERS</span>
            <Network size={13} />
          </div>
          <div className="metric-body">
            <span className="metric-val">12 Wallets · 3 VPAs</span>
            <div className="metric-sub">Across 4 Financial Rails</div>
          </div>
          <div className="metric-bar-indicator cyan" />
        </div>

        <div className="evidence-metric-card">
          <div className="metric-header">
            <span>TOTAL EXPOSURE FLOW</span>
            <Building2 size={13} />
          </div>
          <div className="metric-body">
            <span className="metric-val">$1,420,000 USD</span>
            <div className="metric-sub">₹11.82 Cr Equivalent</div>
          </div>
          <div className="metric-bar-indicator green" />
        </div>

        <div className="evidence-metric-card">
          <div className="metric-header">
            <span>GEO FINDINGS</span>
            <Radar size={13} />
          </div>
          <div className="metric-body">
            <span className="metric-val">3 Anomalies Flagged</span>
            <div className="metric-sub" style={{ color: '#f97316' }}>Impossible Travel Detected</div>
          </div>
          <div className="metric-bar-indicator" style={{ background: '#f97316' }} />
        </div>
      </div>

      {/* Dossier Detail Grid */}
      <div className="evidence-split-workspace">
        {/* Left Column: Network & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Identity & Technical Targets */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Subject Identifiers & Analytical Associations</span>
              <span className="badge badge-synthetic">SYNTHETIC SUBJECT</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
                <span className="muted" style={{ fontSize: '11px' }}>Subject Codename</span>
                <strong className="mono" style={{ fontSize: '12px' }}>Viktor "Cipher" Vance (DEMO SUBJECT)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
                <span className="muted" style={{ fontSize: '11px' }}>Primary EVM Wallet</span>
                <span className="mono" style={{ fontSize: '11px', color: '#24c7c9' }}>
                  0x71F92830d8c019284756102938475610293E84C2
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
                <span className="muted" style={{ fontSize: '11px' }}>Correlated UPI VPA</span>
                <span className="mono" style={{ fontSize: '11px', color: '#a855f7' }}>
                  p2p_desk_blr@axis (Analytical Association)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted" style={{ fontSize: '11px' }}>Attribution Confidence</span>
                <strong style={{ color: '#10b981' }}>82% (Heuristic Cluster Match)</strong>
              </div>
            </div>
          </div>

          {/* Behavior & Heuristic Findings */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Behavioral Risk Heuristics</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '8px 10px', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '11px' }}>
                    <span>Peel-Chain Layering Detected</span>
                    <span style={{ color: '#ef4444' }}>+20 PTS</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '10px', color: 'var(--color-secondary-text)' }}>
                    High-entropy peeling transfers to 4 unhosted intermediate wallets before reaching exchange deposit node.
                  </p>
                </div>

                <div style={{ padding: '8px 10px', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '11px' }}>
                    <span>Wasabi Mixer Interaction</span>
                    <span style={{ color: '#ef4444' }}>+25 PTS</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '10px', color: 'var(--color-secondary-text)' }}>
                    Direct interaction with Wasabi CoinJoin coordinator pool within 3 hops of primary target wallet.
                  </p>
                </div>

                <div style={{ padding: '8px 10px', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '11px' }}>
                    <span>UPI Mule Funnel Dispersal</span>
                    <span style={{ color: '#f97316' }}>+20 PTS</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '10px', color: 'var(--color-secondary-text)' }}>
                    Cross-rail fiat off-ramp disbursed across multiple beneficiary accounts in Bengaluru within 15 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: VASP & Statutory Evidence Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">VASP Attribution Profiles</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '8px 10px', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '11px' }}>
                  <span style={{ color: '#24c7c9' }}>Binance Global Hot Wallet Cluster</span>
                  <span className="badge badge-low">82% CONF</span>
                </div>
                <div className="mono" style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>
                  Deposit Wallet: 0x88fa3910b2...10b2 · Hop 2
                </div>
              </div>

              <div style={{ padding: '8px 10px', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '11px' }}>
                  <span style={{ color: '#24c7c9' }}>CoinDCX Institutional Liquidity Desk</span>
                  <span className="badge badge-medium">64% CONF</span>
                </div>
                <div className="mono" style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>
                  Off-ramp bridge to Axis Bank settlement node
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Linked Evidence & Exhibits</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span className="mono" style={{ color: '#38bdf8' }}>EX-01 (Ledger Trail)</span>
                  <span className="badge badge-low">SEAL VALID</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span className="mono" style={{ color: '#38bdf8' }}>EX-02 (Frankfurt PCAP)</span>
                  <span className="badge badge-low">SEAL VALID</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span className="mono" style={{ color: '#38bdf8' }}>EX-03 (KYC Airtel IPDR)</span>
                  <span className="badge badge-low">SEAL VALID</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
