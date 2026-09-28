import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Filter, 
  ArrowRight, 
  AlertCircle, 
  MapPin, 
  Calendar,
  Layers
} from 'lucide-react';

export default function WorkspaceTimelineTab({ result }) {
  const [railFilter, setRailFilter] = useState('ALL');
  const timeline = result?.timeline || [];

  const filteredEvents = useMemo(() => {
    if (railFilter === 'ALL') return timeline;
    return timeline.filter((e) => (e.rail || '').toUpperCase() === railFilter);
  }, [timeline, railFilter]);

  return (
    <div className="workspace-tab-panel">
      {/* Timeline Controls */}
      <div className="workspace-card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} /> Filter Rail:
            </span>
            {['ALL', 'CRYPTO', 'UPI', 'GEOSPATIAL', 'MULTI_RAIL'].map((r) => (
              <button
                key={r}
                className={`workspace-btn ${railFilter === r ? 'primary' : ''}`}
                onClick={() => setRailFilter(r)}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                {r}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--color-secondary-text)' }}>
            Showing <strong>{filteredEvents.length}</strong> of <strong>{timeline.length}</strong> Chronological Events
          </div>
        </div>
      </div>

      {/* Timeline Event Stream */}
      <div className="workspace-card">
        <div className="workspace-card-header">
          <div className="workspace-card-title">
            <Clock size={15} />
            <span>Multi-Rail Chronological Event Sequence</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-muted-text)' }}>
            Strict Temporal Ordering & Integrity
          </span>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="timeline-stream">
            {filteredEvents.map((evt, idx) => {
              const railClass = (evt.rail || 'crypto').toLowerCase().replace('_', '-');
              const isUnknownTime = !evt.timestamp || evt.timestamp_status === 'UNKNOWN';

              return (
                <div key={evt.event_id || idx} className="timeline-item">
                  <div className={`timeline-dot ${railClass}`} />
                  
                  <div className="timeline-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`rail-pill ${railClass}`}>{evt.rail || 'MULTI_RAIL'}</span>
                      <strong style={{ fontSize: '12.5px' }}>{evt.event_type}</strong>
                      <span className="mono-hash" style={{ fontSize: '11px' }}>({evt.event_id})</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} color="var(--color-muted-text)" />
                      {isUnknownTime ? (
                        <span className="timeline-time unknown">TIME UNKNOWN</span>
                      ) : (
                        <span className="timeline-time">
                          {new Date(evt.timestamp).toUTCString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Flow description / entities */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {evt.actor_reference && (
                      <span className="mono-hash">{evt.actor_reference}</span>
                    )}
                    {evt.actor_reference && evt.target_reference && (
                      <ArrowRight size={13} color="var(--color-muted-text)" />
                    )}
                    {evt.target_reference && (
                      <span className="mono-hash">{evt.target_reference}</span>
                    )}

                    {evt.amount != null && (
                      <span style={{ fontWeight: 700, color: 'var(--color-primary-text)', marginLeft: 'auto' }}>
                        {evt.amount.toLocaleString()} {evt.currency || ''}
                      </span>
                    )}
                  </div>

                  {/* Geospatial observation extra */}
                  {evt.location_reference && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#f59e0b', marginTop: '2px' }}>
                      <MapPin size={12} />
                      <span>{evt.location_reference}</span>
                    </div>
                  )}

                  {/* Transaction hash reference */}
                  {evt.transaction_reference && (
                    <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                      Tx Ref: <code>{evt.transaction_reference}</code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-muted-text)', fontSize: '13px' }}>
            No chronological timeline events match the active rail filter.
          </div>
        )}
      </div>
    </div>
  );
}
