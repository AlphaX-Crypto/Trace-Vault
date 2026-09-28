import React, { useState } from 'react';
import { 
  Globe2, 
  Search, 
  Download, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  FileText, 
  Scale, 
  Radio
} from 'lucide-react';
import './geospatialRadar.css';

const TELEMETRY_NODES = [
  {
    id: 'IP-01',
    ip: '185.220.101.5',
    classification: 'TOR EXIT NODE',
    risk: 'CRITICAL',
    riskTag: 'crit',
    isp: 'Zwiebelfreunde e.V.',
    asn: 'AS60729',
    city: 'Frankfurt am Main',
    region: 'Hesse',
    country: 'Germany (DE)',
    coords: '50.1109° N, 8.6821° E',
    geoHash: 'u0yu',
    port: '9001 (ORPort)',
    protocol: 'TCP / WireGuard Proxy',
    velocityAnomaly: 'Impossible Velocity Violation: Hop time 18s from India',
    subpoenaStatus: 'MLAT Subpoena Drafted (BKA Germany)',
    timestamp: '2026-02-14 08:21:12 UTC',
    walletCorrelation: '0x71F9...E84C2 (Seed Actor)'
  },
  {
    id: 'IP-02',
    ip: '122.166.42.18',
    classification: 'AIRTEL FIBER BROADBAND',
    risk: 'HIGH',
    riskTag: 'high',
    isp: 'Bharti Airtel Limited',
    asn: 'AS45609',
    city: 'Bengaluru',
    region: 'Karnataka',
    country: 'India (IN)',
    coords: '12.9716° N, 77.5946° E',
    geoHash: 'tdr1',
    port: '443 (HTTPS) / API Call',
    protocol: 'Direct Broadband Session',
    velocityAnomaly: 'Geospatial Ground Truth: Corroborated by BTS Tower #882',
    subpoenaStatus: 'Section 91 CrPC Notice Executed',
    timestamp: '2026-02-14 08:44:10 UTC',
    walletCorrelation: 'p2p_desk_blr@axis (P2P Off-Ramp)'
  },
  {
    id: 'IP-03',
    ip: '178.249.214.89',
    classification: 'WASABI MIXER COORDINATOR',
    risk: 'HIGH',
    riskTag: 'high',
    isp: 'Host Europe GmbH',
    asn: 'AS20773',
    city: 'Zurich',
    region: 'Zurich Canton',
    country: 'Switzerland (CH)',
    coords: '47.3769° N, 8.5417° E',
    geoHash: 'u0qj',
    port: '8333 (CoinJoin P2P)',
    protocol: 'WabiSabi Protocol v2',
    velocityAnomaly: 'Anonymization Layering Pool Participant',
    subpoenaStatus: 'Fedpol MLAT In-Progress',
    timestamp: '2026-02-14 08:35:02 UTC',
    walletCorrelation: '0x88fa...b210 (Consolidation Node)'
  },
  {
    id: 'IP-04',
    ip: '194.26.29.112',
    classification: 'SATELLITE DOWNLINK RELAY',
    risk: 'ELEVATED',
    riskTag: 'med',
    isp: 'Starlink Internet Services',
    asn: 'AS14593',
    city: 'Bucharest',
    region: 'Ilfov',
    country: 'Romania (RO)',
    coords: '44.4268° N, 26.1025° E',
    geoHash: 'sxfr',
    port: '1080 (SOCKS5 Proxy)',
    protocol: 'LEO Ku-Band Uplink',
    velocityAnomaly: 'Rapid Gateway Switch detected during off-ramp sequence',
    subpoenaStatus: 'LE Subpoena Package Ready',
    timestamp: '2026-02-14 08:41:19 UTC',
    walletCorrelation: 'Binance Hot Wallet Cluster'
  },
  {
    id: 'IP-05',
    ip: '49.207.181.94',
    classification: 'MOBILE CELLULAR TOWER',
    risk: 'CRITICAL',
    riskTag: 'crit',
    isp: 'Reliance Jio Infocomm',
    asn: 'AS55836',
    city: 'New Delhi',
    region: 'Delhi NCT',
    country: 'India (IN)',
    coords: '28.6139° N, 77.2090° E',
    geoHash: 'ttnf',
    port: 'Dynamic CGNAT (Port 38291)',
    protocol: 'VoLTE / 5G SA Bearer',
    velocityAnomaly: 'Simultaneous Active Session with Bangalore Node (2,100km)',
    subpoenaStatus: 'Section 91 Notice Executed · CDR Received',
    timestamp: '2026-02-14 08:49:22 UTC',
    walletCorrelation: 'merchant_outlet_delhi@icici'
  }
];

export default function GeospatialRadar() {
  const [selectedNode, setSelectedNode] = useState(TELEMETRY_NODES[0]);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState('');

  const filteredNodes = TELEMETRY_NODES.filter((item) => {
    const matchesRisk = riskFilter === 'ALL' || item.risk === riskFilter;
    const matchesSearch = !searchQuery ||
      item.ip.includes(searchQuery) ||
      item.isp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.classification.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  }

  return (
    <div className="geo-page">
      {/* Official Government Header */}
      <div className="geo-header">
        <div className="geo-header-left">
          <span className="geo-eyebrow">
            National Cyber Forensics Laboratory · Telecom & IP Telemetry Wing
          </span>
          <h1 className="geo-title">
            Geospatial & IP Telemetry Registry
          </h1>
          <p className="geo-subtitle">
            Docket: <strong>TV-2026-041</strong> · Admissible under Section 65B Bharatiya Sakshya Adhiniyam / Indian Evidence Act. Correlating network infrastructure with financial off-ramps.
          </p>
        </div>

        <div className="geo-header-actions">
          <button className="btn-secondary" onClick={() => handleCopy(JSON.stringify(TELEMETRY_NODES, null, 2))}>
            <Copy size={13} />
            <span>{copiedText ? 'Copied' : 'Copy Registry JSON'}</span>
          </button>
          <button className="btn-primary" onClick={() => alert('Compiling Section 91 Subpoena Package with IPDR/CDR logs...')}>
            <Scale size={13} />
            <span>Generate Subpoena Package (S.91)</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="geo-metrics-grid">
        <div className="geo-metric-card">
          <span className="geo-metric-label">Monitored IP Nodes</span>
          <span className="geo-metric-value">{TELEMETRY_NODES.length} Correlated Nodes</span>
          <span className="geo-metric-sub">Across 4 Legal Jurisdictions</span>
        </div>

        <div className="geo-metric-card">
          <span className="geo-metric-label">Velocity Violations</span>
          <span className="geo-metric-value" style={{ color: '#b91c1c' }}>2 Critical Flags</span>
          <span className="geo-metric-sub">Impossible Travel Distance Detected</span>
        </div>

        <div className="geo-metric-card">
          <span className="geo-metric-label">ISP Subpoenas Executed</span>
          <span className="geo-metric-value" style={{ color: '#15803d' }}>2 Orders Served</span>
          <span className="geo-metric-sub">Airtel & Jio Telecom Compliance</span>
        </div>

        <div className="geo-metric-card">
          <span className="geo-metric-label">MLAT Cross-Border</span>
          <span className="geo-metric-value">2 Active Requests</span>
          <span className="geo-metric-sub">Germany (BKA) & Switzerland (Fedpol)</span>
        </div>
      </div>

      {/* Split Workspace */}
      <div className="geo-workspace-grid">
        {/* Left: Registry Table */}
        <div className="geo-table-container">
          <div className="geo-filter-bar">
            <div className="geo-search-box">
              <Search size={13} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search IP, ISP, City, or Classification..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="geo-filter-tabs">
              <button 
                className={`geo-tab-btn ${riskFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setRiskFilter('ALL')}
              >
                All Nodes
              </button>
              <button 
                className={`geo-tab-btn ${riskFilter === 'CRITICAL' ? 'active' : ''}`}
                onClick={() => setRiskFilter('CRITICAL')}
              >
                Critical
              </button>
              <button 
                className={`geo-tab-btn ${riskFilter === 'HIGH' ? 'active' : ''}`}
                onClick={() => setRiskFilter('HIGH')}
              >
                High Risk
              </button>
              <button 
                className={`geo-tab-btn ${riskFilter === 'ELEVATED' ? 'active' : ''}`}
                onClick={() => setRiskFilter('ELEVATED')}
              >
                Elevated
              </button>
            </div>
          </div>

          <table className="geo-table">
            <thead>
              <tr>
                <th>Observed IP / Classification</th>
                <th>Service Provider (ISP / ASN)</th>
                <th>Jurisdiction & City</th>
                <th>Velocity / Behavior</th>
                <th>Subpoena Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map((node) => (
                <tr 
                  key={node.id}
                  className={selectedNode.id === node.id ? 'selected' : ''}
                  onClick={() => setSelectedNode(node)}
                >
                  <td>
                    <div className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{node.ip}</div>
                    <div className="muted" style={{ fontSize: '10px' }}>{node.classification}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{node.isp}</div>
                    <div className="mono muted" style={{ fontSize: '10px' }}>{node.asn}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--text-primary)' }}>{node.city}, {node.country}</div>
                    <div className="mono muted" style={{ fontSize: '10px' }}>{node.coords}</div>
                  </td>
                  <td>
                    <span className={`tag ${node.riskTag === 'crit' ? 'tag-critical' : node.riskTag === 'high' ? 'tag-high' : 'tag-medium'}`}>
                      {node.risk}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {node.subpoenaStatus}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Selected Node Dossier */}
        <div className="geo-dossier">
          <div className="geo-dossier-header">
            <h3 className="geo-dossier-title">IPDR & Telemetry Inspector</h3>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)' }}>
              {selectedNode.id}
            </span>
          </div>

          <div className="geo-dossier-box">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono muted" style={{ fontSize: '10px' }}>IP ADDRESS:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="mono" style={{ fontWeight: 700 }}>{selectedNode.ip}</span>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '1px 5px', height: '20px' }}
                  onClick={() => handleCopy(selectedNode.ip)}
                  title="Copy IP"
                >
                  <Copy size={10} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono muted" style={{ fontSize: '10px' }}>SERVICE PROVIDER:</span>
              <span style={{ fontWeight: 600 }}>{selectedNode.isp}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono muted" style={{ fontSize: '10px' }}>AUTONOMOUS SYSTEM:</span>
              <span className="mono">{selectedNode.asn}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono muted" style={{ fontSize: '10px' }}>COORDINATES (WGS84):</span>
              <span className="mono">{selectedNode.coords}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono muted" style={{ fontSize: '10px' }}>GEO-HASH / DATUM:</span>
              <span className="mono">{selectedNode.geoHash} (EPSG:4326)</span>
            </div>
          </div>

          <div className="geo-dossier-box">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono muted" style={{ fontSize: '10px' }}>PORT & PROTOCOL:</span>
              <span className="mono">{selectedNode.port} · {selectedNode.protocol}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono muted" style={{ fontSize: '10px' }}>LINKED FINANCIAL ENTITY:</span>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                {selectedNode.walletCorrelation}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono muted" style={{ fontSize: '10px' }}>TIMESTAMP (UTC):</span>
              <span className="mono">{selectedNode.timestamp}</span>
            </div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div className="mono muted" style={{ fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>
              VELOCITY & ROUTING ANOMALY:
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {selectedNode.velocityAnomaly}
            </div>
          </div>

          <div className="geo-dossier-actions">
            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => alert(`Section 91 Notice generated for ${selectedNode.isp} regarding IP ${selectedNode.ip}.`)}
            >
              <Scale size={13} />
              <span>Issue Section 91 Subpoena Notice</span>
            </button>
            <button 
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => alert(`Exported Section 65B Telemetry Certificate for IP ${selectedNode.ip}.`)}
            >
              <FileText size={13} />
              <span>Export Section 65B Telemetry Certificate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
