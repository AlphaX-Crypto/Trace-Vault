import React, { useState } from 'react';
import { 
  Globe2, 
  MapPin, 
  Radio, 
  FileText, 
  AlertTriangle, 
  Search,
  Copy,
  Check
} from 'lucide-react';
import './geospatialTab.css';

const TELEMETRY_NODES = [
  {
    id: 'GEO-01',
    ip: '185.220.101.5',
    classification: 'TOR EXIT NODE',
    risk: 'CRITICAL',
    isp: 'Zwiebelfreunde e.V.',
    asn: 'AS60729',
    city: 'Frankfurt am Main',
    country: 'Germany (DE)',
    coords: '50.1109° N, 8.6821° E',
    distanceKm: '6,720 km',
    timestampDelta: '18s',
    travelSpeed: '1,344,000 km/h',
    accuracy: '± 15 km (ISP Gateway)',
    source: 'IPDR Telemetry & Tor Registry',
    confidence: '95%',
    finding: 'Impossible Travel Velocity: Node broadcasting detected 18 seconds after prior domestic session. Represents proxy evasion.',
    subpoenaStatus: 'MLAT / BKA Requisition Drafted'
  },
  {
    id: 'GEO-02',
    ip: '122.166.42.18',
    classification: 'AIRTEL FIBER BROADBAND',
    risk: 'HIGH',
    isp: 'Bharti Airtel Limited',
    asn: 'AS45609',
    city: 'Bengaluru',
    country: 'India (IN)',
    coords: '12.9716° N, 77.5946° E',
    distanceKm: '0 km (Ground Datum)',
    timestampDelta: 'Baseline',
    travelSpeed: 'Static',
    accuracy: '± 500m (BTS Sector #882)',
    source: 'Telecom IPDR & CAF Records',
    confidence: '92%',
    finding: 'Subscriber lease corroborated by cellular tower triangulation in Koramangala, Bengaluru during P2P off-ramp session.',
    subpoenaStatus: 'Section 91 CrPC Notice Executed'
  },
  {
    id: 'GEO-03',
    ip: '178.249.214.89',
    classification: 'WASABI MIXER COORDINATOR',
    risk: 'HIGH',
    isp: 'Host Europe GmbH',
    asn: 'AS20773',
    city: 'Zurich',
    country: 'Switzerland (CH)',
    coords: '47.3769° N, 8.5417° E',
    distanceKm: '6,610 km',
    timestampDelta: '+12m 44s',
    travelSpeed: 'N/A (Relay Channel)',
    accuracy: '± 25 km (Data Center)',
    source: 'EVM Coordinator RPC Telemetry',
    confidence: '88%',
    finding: 'Whirlpool coordinator server pool IP matching contract deposit timestamps on Hop 2.',
    subpoenaStatus: 'Formal Requisition Drafted'
  }
];

export default function WorkspaceGeospatialTab({ result }) {
  const [selectedNode, setSelectedNode] = useState(TELEMETRY_NODES[0]);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [copied, setCopied] = useState(false);

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filteredNodes = TELEMETRY_NODES.filter((n) => {
    if (filterRisk === 'ALL') return true;
    return n.risk === filterRisk;
  });

  return (
    <div className="tv-geospatial-workspace anim-workspace">
      {/* LEFT: Filters / Controls */}
      <div className="tv-geo-controls-panel">
        <div className="tv-card-header">
          <span className="tv-card-title">Location Filters</span>
        </div>

        <div className="tv-control-group">
          <label className="tv-control-label">RISK FILTER</label>
          <div className="tv-select-btn-group">
            {['ALL', 'CRITICAL', 'HIGH'].map((rf) => (
              <button
                key={rf}
                className={`tv-dir-btn ${filterRisk === rf ? 'active' : ''}`}
                onClick={() => setFilterRisk(rf)}
              >
                {rf === 'ALL' ? 'All Telemetry Nodes' : `${rf} Risk Signals`}
              </button>
            ))}
          </div>
        </div>

        <div className="tv-control-group" style={{ marginTop: '12px' }}>
          <label className="tv-control-label">TELEMETRY NODES</label>
          <div className="tv-geo-nodes-list">
            {filteredNodes.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNode(n)}
                className={`tv-geo-node-card ${selectedNode.id === n.id ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono font-semibold" style={{ fontSize: '11px' }}>{n.id}</span>
                  <span className={`tv-badge ${n.risk === 'CRITICAL' ? 'tv-risk-critical' : 'tv-risk-high'}`}>
                    {n.risk}
                  </span>
                </div>
                <div className="mono text-primary font-medium" style={{ fontSize: '11.5px', marginTop: '3px' }}>
                  {n.ip}
                </div>
                <div className="text-muted" style={{ fontSize: '10.5px' }}>
                  {n.city}, {n.country}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tv-geo-disclaimer-note">
          <strong>LEGAL DISCLAIMER:</strong> Location signals represent IPDR network endpoints and cellular sector telemetry. They do not constitute verified physical presence of a person.
        </div>
      </div>

      {/* CENTER: Radar / Geospatial Visualization */}
      <div className="tv-geo-radar-container">
        <div className="tv-graph-canvas-toolbar">
          <span className="tv-section-title">Tactical Telemetry Radar</span>
          <span className="mono text-muted" style={{ fontSize: '11px' }}>
            Datum: Bengaluru, IN (12.9716° N, 77.5946° E)
          </span>
        </div>

        <div className="tv-radar-canvas-wrap">
          {/* Concentric Radar Rings */}
          <div className="tv-radar-ring ring-1"><span className="tv-ring-label">1,000 km</span></div>
          <div className="tv-radar-ring ring-2"><span className="tv-ring-label">3,500 km</span></div>
          <div className="tv-radar-ring ring-3"><span className="tv-ring-label">7,000 km</span></div>
          <div className="tv-radar-crosshair-h" />
          <div className="tv-radar-crosshair-v" />

          {/* Radar Nodes Blips */}
          {filteredNodes.map((node, idx) => {
            // Static positions corresponding to distance
            const positions = [
              { top: '24%', left: '32%' }, // Frankfurt
              { top: '52%', left: '52%' }, // Bengaluru center
              { top: '30%', left: '42%' }  // Zurich
            ];
            const pos = positions[idx % positions.length];
            const isSelected = selectedNode.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`tv-radar-blip ${isSelected ? 'active' : ''}`}
                style={pos}
                title={`${node.id}: ${node.city} (${node.ip})`}
              >
                <div className="tv-blip-core" />
                <div className="tv-blip-label mono">
                  {node.id} · {node.city}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Signal Summary */}
        <div className="tv-geo-bottom-summary">
          <div className="tv-geo-summary-item">
            <span className="tv-attr-label">TOTAL SIGNALS</span>
            <span className="tv-attr-value mono font-semibold">{TELEMETRY_NODES.length} Verified</span>
          </div>
          <div className="tv-geo-summary-item">
            <span className="tv-attr-label">ANOMALIES DETECTED</span>
            <span className="tv-attr-value mono font-semibold" style={{ color: 'var(--risk-critical)' }}>
              1 Impossible Velocity
            </span>
          </div>
          <div className="tv-geo-summary-item">
            <span className="tv-attr-label">PRIMARY CORRIDOR</span>
            <span className="tv-attr-value font-medium">DE (Frankfurt) ↔ IN (Bengaluru)</span>
          </div>
          <div className="tv-geo-summary-item">
            <span className="tv-attr-label">MAX RECORDED DELTA</span>
            <span className="tv-attr-value mono">18s / 6,720 km</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Location Signal Inspector */}
      <div className="tv-geo-inspector-panel anim-panel-slide">
        <div className="tv-inspector-header">
          <span className="tv-inspector-title">Location Signal Inspector</span>
          <span className={`tv-badge ${selectedNode.risk === 'CRITICAL' ? 'tv-risk-critical' : 'tv-risk-high'}`}>
            {selectedNode.risk}
          </span>
        </div>

        <div className="tv-inspector-scroll">
          <div className="tv-inspector-section">
            <div className="tv-inspector-section-label">TELEMETRY ENDPOINT</div>
            <div className="tv-inspector-kv">
              <span className="tv-inspector-k">IP Address</span>
              <div className="tv-inspector-v-row">
                <span className="mono font-semibold">{selectedNode.ip}</span>
                <button onClick={() => handleCopy(selectedNode.ip)} className="tv-icon-copy-btn">
                  {copied ? <Check size={12} color="var(--risk-low)" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
            <div className="tv-inspector-kv">
              <span className="tv-inspector-k">Classification</span>
              <span className="mono font-medium">{selectedNode.classification}</span>
            </div>
            <div className="tv-inspector-kv">
              <span className="tv-inspector-k">ISP / ASN</span>
              <span className="mono">{selectedNode.asn} ({selectedNode.isp})</span>
            </div>
          </div>

          <div className="tv-inspector-section">
            <div className="tv-inspector-section-label">GEODETIC METRICS</div>
            <div className="tv-inspector-kv">
              <span className="tv-inspector-k">Coordinates</span>
              <span className="mono font-medium">{selectedNode.coords}</span>
            </div>
            <div className="tv-inspector-kv">
              <span className="tv-inspector-k">Distance to Datum</span>
              <span className="mono font-semibold">{selectedNode.distanceKm}</span>
            </div>
            <div className="tv-inspector-kv">
              <span className="tv-inspector-k">Timestamp Delta</span>
              <span className="mono font-semibold" style={{ color: selectedNode.timestampDelta === '18s' ? 'var(--risk-critical)' : 'inherit' }}>
                {selectedNode.timestampDelta}
              </span>
            </div>
            <div className="tv-inspector-kv">
              <span className="tv-inspector-k">Calculated Speed</span>
              <span className="mono font-semibold">{selectedNode.travelSpeed}</span>
            </div>
            <div className="tv-inspector-kv">
              <span className="tv-inspector-k">Radial Accuracy</span>
              <span className="mono">{selectedNode.accuracy}</span>
            </div>
          </div>

          <div className="tv-inspector-section">
            <div className="tv-inspector-section-label">ATTRIBUTION & CONFIDENCE</div>
            <div className="tv-inspector-kv">
              <span className="tv-inspector-k">Signal Source</span>
              <span style={{ fontSize: '11px' }}>{selectedNode.source}</span>
            </div>
            <div className="tv-inspector-kv">
              <span className="tv-inspector-k">Attribution Confidence</span>
              <span className="mono font-semibold" style={{ color: 'var(--risk-low)' }}>{selectedNode.confidence}</span>
            </div>
          </div>

          <div className="tv-inspector-section">
            <div className="tv-inspector-section-label">INVESTIGATIVE FINDING</div>
            <p className="tv-inspector-narrative">
              {selectedNode.finding}
            </p>
          </div>

          <div className="tv-inspector-section">
            <div className="tv-inspector-section-label">STATUTORY SUBPOENA STATUS</div>
            <div className="tv-evidence-ref-card">
              <FileText size={14} className="text-secondary" />
              <div className="tv-evidence-ref-info">
                <span className="font-semibold" style={{ fontSize: '11.5px', color: 'var(--text-primary)' }}>
                  {selectedNode.subpoenaStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
