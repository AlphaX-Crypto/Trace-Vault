import React, { useState } from 'react';
import {
  Radar,
  Radio,
  Scale,
  ShieldCheck,
  Copy,
  ChevronRight,
  ExternalLink,
  Target,
  FileText
} from 'lucide-react';
import './geospatialRadar.css';

export default function GeospatialRadar() {
  const [riskBand, setRiskBand] = useState('ALL');
  const [copied, setCopied] = useState(false);

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="geospatial-page">
      {/* Breadcrumb Strip matching screenshot */}
      <div className="geo-breadcrumb-strip">
        <span>TRACEVAULT</span> / 
        <strong>GEOSPATIAL & IP RADAR</strong> / 
        <span>DOCKET TV-2026-041</span>
        <span className="jurisdiction-badge">JURISDICTIONAL CLEARANCE // CERT. SEC 65B</span>
      </div>

      {/* Satellite Downlink Bar */}
      <div className="geo-satellite-bar">
        <div className="satellite-status">
          <span className="satellite-dot" />
          <span>SATELLITE DOWNLINK: <strong>ACTIVE (12.4 GHZ)</strong></span>
        </div>
        <div>
          <span>UTC: <strong>2026-03-30 08:42:19.402</strong></span>
        </div>
      </div>

      {/* Filter & Correlate Bar matching screenshot */}
      <div className="geo-filter-bar">
        <div className="geo-input-group">
          <div className="geo-search-input">
            <Target size={12} />
            <input
              type="text"
              defaultValue="185.220.101.5, 122.166.42.18, 0x7:"
              placeholder="Search IPs or Wallets..."
            />
          </div>
          <span className="geo-format-pill">IPV4/V6</span>
          <span className="geo-format-pill">HEX</span>

          <div className="risk-band-selector">
            <span>RISK BAND:</span>
            <button
              className={`risk-pill crit ${riskBand === 'CRIT' ? 'active' : ''}`}
              onClick={() => setRiskBand('CRIT')}
            >
              CRIT
            </button>
            <button
              className={`risk-pill elev ${riskBand === 'ELEV' ? 'active' : ''}`}
              onClick={() => setRiskBand('ELEV')}
            >
              ELEV
            </button>
            <button
              className={`risk-pill all ${riskBand === 'ALL' ? 'active' : ''}`}
              onClick={() => setRiskBand('ALL')}
            >
              ALL
            </button>
          </div>

          <span className="geo-format-pill">WINDOW: T - 72H</span>
        </div>

        <button className="btn-correlate-subpoena" title="Generate Section 91 Subpoena Package">
          <Scale size={13} />
          <span>CORRELATE ISP SUBPOENA</span>
        </button>
      </div>

      {/* Main Split Grid: Radar Canvas on Left, Target Dossier on Right */}
      <div className="geo-main-grid">
        {/* Left Column: Radar Workspace */}
        <div className="radar-panel">
          <div className="radar-header">
            <div className="radar-title-group">
              <div className="radar-icon-box">
                <Radar size={16} />
              </div>
              <div>
                <h2 className="radar-title">TACTICAL IP RADAR // MULTI-HOP TELEMETRY</h2>
                <p className="radar-subtitle">COORDINATE MAPPING & SATELLITE INTERCEPT ENGINE</p>
              </div>
            </div>

            <div className="radar-badges">
              <span className="radar-badge">GRID: WGS-84</span>
              <span className="radar-badge active">GEO-LOCK: PINPOINT</span>
            </div>
          </div>

          {/* Radar Screen Canvas with concentric rings & pings */}
          <div className="radar-screen-canvas">
            {/* Top-Left Coordinates Overlay */}
            <div className="radar-coordinates-overlay">
              <div>LAT: <strong>50.1109° N</strong> | LON: <strong>8.6821° E</strong></div>
              <div>DATUM: <strong>EPSG 4326 // GEO-HASH: u0yu</strong></div>
              <div>ELEVATION: <strong>112m AMSL</strong></div>
            </div>

            {/* SVG Concentric Radar Rings & Crosshairs */}
            <svg
              width="100%"
              height="100%"
              style={{ position: 'absolute', inset: 0 }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#24c7c9" stopOpacity="0.08" />
                  <stop offset="60%" stopColor="#24c7c9" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#24c7c9" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="100%" height="100%" fill="url(#radarSweep)" />

              {/* Concentric rings */}
              <circle cx="50%" cy="50%" r="40" stroke="#162432" strokeWidth="1" fill="none" />
              <circle cx="50%" cy="50%" r="85" stroke="#162432" strokeWidth="1" fill="none" strokeDasharray="3 3" />
              <circle cx="50%" cy="50%" r="130" stroke="#1c2f42" strokeWidth="1" fill="none" />
              <circle cx="50%" cy="50%" r="175" stroke="#162432" strokeWidth="1" fill="none" strokeDasharray="4 4" />

              {/* Crosshair lines */}
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#162432" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#162432" strokeWidth="1" strokeDasharray="2 2" />

              {/* Arcs / trajectory path connecting nodes */}
              <path
                d="M 330 180 Q 420 150, 480 230 T 640 280"
                fill="none"
                stroke="#24c7c9"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <path
                d="M 330 180 Q 380 260, 480 230"
                fill="none"
                stroke="#f97316"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </svg>

            {/* Pings matching screenshot */}
            {/* Node 1: Swiss Wasabi */}
            <div className="radar-ping-card" style={{ top: '90px', left: '46%' }}>
              <div className="ping-ip-row">
                <span style={{ color: '#f59e0b' }}>●</span>
                <span>178.249.214.89 CH</span>
              </div>
              <div className="ping-role-text">WASABI CJ POOL PARTICIPANT</div>
            </div>

            {/* Node 2: Frankfurt Tor Exit */}
            <div className="radar-ping-card" style={{ top: '150px', left: '26%' }}>
              <div className="ping-ip-row">
                <span style={{ color: '#ef4444' }}>🚩</span>
                <span>185.220.101.5</span>
              </div>
              <div className="ping-role-text tainted">TOR EXIT NODE</div>
              <div className="ping-role-text">RTT: 18ms · PORT 9001</div>
            </div>

            {/* Node 3: Starlink Romania */}
            <div className="radar-ping-card" style={{ top: '210px', left: '48%' }}>
              <div className="ping-ip-row">
                <span style={{ color: '#94a3b8' }}>●</span>
                <span>194.26.29.112 RO</span>
              </div>
              <div className="ping-role-text">STARLINK SATELLITE UPLINK</div>
              <div className="ping-role-text">RTT: 64ms · SOCKS5 GATE</div>
            </div>

            {/* Node 4: Airtel India Target */}
            <div className="radar-ping-card" style={{ top: '240px', left: '68%' }}>
              <div className="ping-ip-row">
                <span style={{ color: '#10b981' }}>✔</span>
                <span>122.166.42.18 IN</span>
              </div>
              <div className="ping-role-text fiu">AIRTEL BB // FIU-IND REPORTED</div>
              <div className="ping-role-text fiu">TARGET KYC CORRELATED</div>
            </div>

            <div className="radar-footer-axis">
              SCALE: 1:50,000,000 | GEOCODER: LE-TRACE INTEL V3.8
            </div>
          </div>

          {/* Bottom 3 Summary Cards */}
          <div className="radar-summary-cards">
            <div className="radar-mini-card">
              <Radio size={14} className="mini-card-icon" />
              <div>
                <div className="mini-card-val">4 NODES</div>
                <div className="mini-card-desc">ACTIVE GEO-PINGS DETECTED</div>
              </div>
              <span className="mini-card-badge live">LIVE SYNC</span>
            </div>

            <div className="radar-mini-card">
              <Target size={14} style={{ color: '#ef4444' }} />
              <div>
                <div className="mini-card-val">2 RELAYS</div>
                <div className="mini-card-desc">IDENTIFIED TOR / MIX HOPS</div>
              </div>
              <span className="mini-card-badge tainted">TAINTED</span>
            </div>

            <div className="radar-mini-card">
              <Scale size={14} style={{ color: '#24c7c9' }} />
              <div>
                <div className="mini-card-val">3 ORDERS</div>
                <div className="mini-card-desc">SUBPOENA READINESS</div>
              </div>
              <span className="mini-card-badge ready">READY (LE)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Target Dossier & Enforcement */}
        <div className="geo-dossier-column">
          {/* Target Dossier Card */}
          <div className="target-dossier-card">
            <div className="dossier-header-row">
              <h3 className="dossier-title">TARGET DOSSIER // LE-8327</h3>
              <span className="primary-suspect-badge">PRIMARY SUSPECT</span>
            </div>

            {/* Correlated Crypto Wallet */}
            <div className="correlated-wallet-box">
              <span className="correlated-wallet-title">CORRELATED CRYPTO LEDGER WALLET</span>
              <div className="wallet-addr-row">
                <span>0x71F92830d8...E84C2</span>
                <Copy
                  size={12}
                  style={{ cursor: 'pointer', color: '#64748b' }}
                  onClick={() => handleCopy('0x71F92830d8...E84C2')}
                />
              </div>
              <div className="wallet-volume-row">
                <span>TETHER USDT (TRC-20)</span>
                <span className="volume-val">VOLUME: $1,420,000</span>
              </div>
            </div>

            {/* Technical Telemetry List */}
            <div className="telemetry-details-list">
              <div className="telemetry-row">
                <span className="telemetry-label">BGP ASN INTERCEPT</span>
                <span className="telemetry-val">AS13335 (Cloudflare WARP)</span>
              </div>

              <div className="telemetry-row">
                <span className="telemetry-label">BYPASS ATTEMPT</span>
                <span className="telemetry-val alert-red">DETECTED (SPLIT TUNNEL)</span>
              </div>

              <div className="telemetry-row">
                <span className="telemetry-label">WEBRTC LOCAL LEAK</span>
                <span className="telemetry-val alert-green">192.168.1.104 (LEAKED)</span>
              </div>

              <div className="telemetry-row">
                <span className="telemetry-label">CLIENT OS FINGERPRINT</span>
                <span className="telemetry-val">Darwin x86_64 // Chrome 122</span>
              </div>

              <div className="telemetry-row">
                <span className="telemetry-label">MAC HASH (ANONYMIZED)</span>
                <span className="telemetry-val">e4:5f:01:8a:d9:...</span>
              </div>
            </div>

            {/* Merkle Forensic Seal Card */}
            <div className="merkle-seal-card">
              <div className="seal-header-row">
                <span>MERKLE FORENSIC SEAL</span>
                <span className="seal-valid-pill">HASH VALID</span>
              </div>
              <div className="seal-hash">
                0x892a0f671c08bc...4ea388b1
              </div>
              <div className="seal-timestamp">
                Hardware Sealed Timestamp: UTC 2026-03-30 08:39:04
              </div>
            </div>
          </div>

          {/* Statutory Enforcement Card */}
          <div className="statutory-card">
            <div className="statutory-header">
              <span>STATUTORY ENFORCEMENT</span>
              <span>CRPC / MLAT</span>
            </div>

            <div className="statutory-item-link">
              <div>
                <div className="statutory-item-text">Draft Section 91 CrPC ISP Order</div>
                <div className="statutory-item-sub">Bharti Airtel Broadband KYC / IP logs</div>
              </div>
              <ChevronRight size={14} color="#64748b" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
