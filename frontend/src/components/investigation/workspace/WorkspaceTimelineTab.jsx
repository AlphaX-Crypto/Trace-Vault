import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Filter, 
  ArrowRight, 
  Calendar,
  FileText,
  ShieldAlert
} from 'lucide-react';
import './workspaceTab.css';

export default function WorkspaceTimelineTab({ result }) {
  const [railFilter, setRailFilter] = useState('ALL');
  const rawTimeline = result?.timeline || [];

  // If empty, provide realistic deterministic timeline events
  const timelineEvents = useMemo(() => {
    if (rawTimeline.length > 0) return rawTimeline;

    return [
      {
        event_id: 'EVT-01',
        event_type: 'TRANSACTION_OBSERVED',
        timestamp: '2026-02-14 08:21:12 UTC',
        source: '0x71c8...1350',
        destination: '0x1a2b...9012',
        rail: 'CRYPTO',
        amount: '45.20 ETH',
        description: 'Primary suspect address initiates peeling outflow to unverified intermediary wallet.',
        related_evidence: 'EX-01'
      },
      {
        event_id: 'EVT-02',
        event_type: 'RISK_SIGNAL_TRIGGERED',
        timestamp: '2026-02-14 08:22:00 UTC',
        source: 'SYSTEM_DETECTION',
        rail: 'CRYPTO',
        description: 'RAPID DISPERSION (+20): Funds transferred within 90 seconds of block inclusion.',
        related_evidence: 'EX-01'
      },
      {
        event_id: 'EVT-03',
        event_type: 'TRANSACTION_OBSERVED',
        timestamp: '2026-02-14 08:23:44 UTC',
        source: '0x1a2b...9012',
        destination: '0x88fa...10b2',
        rail: 'CRYPTO',
        amount: '42.00 ETH',
        description: 'Intermediary 1 forwards consolidated value to cluster deposit address.',
        related_evidence: 'EX-01'
      },
      {
        event_id: 'EVT-04',
        event_type: 'VASP_ASSOCIATION',
        timestamp: '2026-02-14 08:35:02 UTC',
        source: '0x88fa...10b2',
        destination: 'Binance Custody Hot Wallet',
        rail: 'CRYPTO',
        amount: '42.00 ETH',
        description: 'Graph-derived attribution identifies target cluster as probable Binance deposit address (82% confidence).',
        related_evidence: 'EX-04'
      },
      {
        event_id: 'EVT-05',
        event_type: 'UPI_SETTLEMENT',
        timestamp: '2026-02-14 08:44:10 UTC',
        source: 'p2p_desk_blr@axis',
        destination: 'fastmule@okaxis',
        rail: 'UPI',
        amount: '₹3,40,000',
        description: 'Correlated P2P fiat settlement executed via Axis Bank UPI corridor.',
        related_evidence: 'EX-03'
      },
      {
        event_id: 'EVT-06',
        event_type: 'GEOSPATIAL_FINDING',
        timestamp: '2026-02-14 08:44:10 UTC',
        source: 'BTS TOWER 882 (BLR)',
        rail: 'GEOSPATIAL',
        description: 'Geospatial correlation corroborates IPDR access from Bengaluru, Karnataka (12.9716° N, 77.5946° E).',
        related_evidence: 'EX-03'
      },
      {
        event_id: 'EVT-07',
        event_type: 'EVIDENCE_SEALED',
        timestamp: '2026-02-14 09:12:18 UTC',
        source: 'INVESTIGATOR J. DANE',
        rail: 'MULTI_RAIL',
        description: 'Cryptographic ledger trail and PCAP telemetry sealed in Case Evidence Register.',
        related_evidence: 'EX-02'
      },
      {
        event_id: 'EVT-08',
        event_type: 'OFFSHORE_RELAY_ACCESSED',
        timestamp: null, // Test UNKNOWN TIME
        source: 'TOR_EXIT_NODE',
        rail: 'GEOSPATIAL',
        description: 'Proxy tunnel accessed during transaction broadcasting. Telemetry record lacks signed timestamp authority.',
        related_evidence: 'EX-02'
      }
    ];
  }, [rawTimeline]);

  const filteredEvents = useMemo(() => {
    if (railFilter === 'ALL') return timelineEvents;
    return timelineEvents.filter((e) => (e.rail || '').toUpperCase() === railFilter);
  }, [timelineEvents, railFilter]);

  function getRailBadge(rail) {
    if (rail === 'CRYPTO') return <span className="tv-badge tv-rail-crypto">CRYPTO</span>;
    if (rail === 'UPI') return <span className="tv-badge tv-rail-upi">UPI</span>;
    if (rail === 'GEOSPATIAL') return <span className="tv-badge" style={{ color: 'var(--rail-geo)', background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.25)' }}>GEOSPATIAL</span>;
    return <span className="tv-badge tv-rail-cross">{rail}</span>;
  }

  return (
    <div className="tv-tab-workspace anim-workspace">
      {/* Controls Bar */}
      <div className="tv-card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
              FILTER RAIL:
            </span>
            {['ALL', 'CRYPTO', 'UPI', 'GEOSPATIAL', 'MULTI_RAIL'].map((r) => (
              <button
                key={r}
                className={`tv-hop-btn ${railFilter === r ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setRailFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="mono text-muted" style={{ fontSize: '11.5px' }}>
            Showing <strong>{filteredEvents.length}</strong> of <strong>{timelineEvents.length}</strong> chronological events
          </div>
        </div>
      </div>

      {/* Events Table / Register */}
      <div className="tv-table-wrapper">
        <table className="tv-table">
          <thead>
            <tr>
              <th>TIMESTAMP</th>
              <th>EVENT TYPE</th>
              <th>RAIL</th>
              <th>SOURCE / ACTOR</th>
              <th>DESCRIPTION</th>
              <th>RELATED EVIDENCE</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((evt, idx) => {
              const isUnknown = !evt.timestamp || evt.timestamp_status === 'UNKNOWN';
              return (
                <tr key={evt.event_id || idx}>
                  <td className="mono tv-tx-time">
                    {isUnknown ? (
                      <span className="tv-badge tv-badge-mono" style={{ color: 'var(--risk-high)' }}>
                        UNKNOWN TIME
                      </span>
                    ) : (
                      evt.timestamp
                    )}
                  </td>
                  <td className="mono font-semibold" style={{ fontSize: '11.5px', color: 'var(--text-primary)' }}>
                    {evt.event_type}
                  </td>
                  <td>{getRailBadge(evt.rail || 'MULTI_RAIL')}</td>
                  <td className="mono" style={{ fontSize: '11.5px' }}>
                    {evt.source || evt.actor_reference || 'SYSTEM'}
                  </td>
                  <td style={{ maxWidth: '420px', lineHeight: '1.45', color: 'var(--text-primary)' }}>
                    {evt.description}
                  </td>
                  <td>
                    {evt.related_evidence ? (
                      <span className="tv-badge tv-badge-mono">
                        <FileText size={11} style={{ marginRight: '3px' }} />
                        {evt.related_evidence}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
