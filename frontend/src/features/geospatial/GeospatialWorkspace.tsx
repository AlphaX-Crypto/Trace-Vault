import React, { useState, useEffect } from 'react';
import { api, DataSourceState } from '../../api/client';
import { CASE_GEOSPATIAL_DATA } from './geoData';
import { LocationSignalItem } from './geoTypes';
import { GeospatialMap } from './GeospatialMap';

export interface GeospatialWorkspaceProps {
  activeCaseId?: string;
  onBack: () => void;
  onNavigateToTransaction?: (txId: string) => void;
  onNavigateToGraph?: (entityId?: string) => void;
  onNavigateToRisk?: () => void;
  onNavigateToEvidence?: () => void;
  initialState?: 'available' | 'partial' | 'empty' | 'loading' | 'error';
}

export const GeospatialWorkspace: React.FC<GeospatialWorkspaceProps> = ({
  activeCaseId = 'CASE-2026-001',
  onBack,
  onNavigateToTransaction,
  onNavigateToGraph,
  onNavigateToRisk,
  onNavigateToEvidence,
  initialState = 'available'
}) => {
  const [viewState, setViewState] = useState<'available' | 'partial' | 'empty' | 'loading' | 'error'>(initialState);
  const [dataSource, setDataSource] = useState<DataSourceState>('DEMO_SYNTHETIC');
  const [selectedSignalId, setSelectedSignalId] = useState<string>('GEO-SIG-001');
  const [selectedRail, setSelectedRail] = useState<string>('All');
  const [selectedSignalType, setSelectedSignalType] = useState<string>('All');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('All');
  const [loadingStep, setLoadingStep] = useState(1);
  const [evidenceNotification, setEvidenceNotification] = useState<string | null>(null);

  const geoData = CASE_GEOSPATIAL_DATA;
  const selectedSignal: LocationSignalItem =
    geoData.signals.find((s) => s.id === selectedSignalId) || geoData.signals[0];

  useEffect(() => {
    let isMounted = true;
    async function loadGeoData() {
      try {
        const isHealthy = await api.checkHealth();
        if (!isHealthy) {
          if (isMounted) setDataSource('DEMO_SYNTHETIC');
          return;
        }

        const res = await api.post<any>(`/api/cases/${activeCaseId}/geospatial/analyze`, {});
        if (!isMounted) return;

        if (res.success && res.data) {
          setDataSource('LIVE_BACKEND');
          if (Array.isArray(res.data.location_signals) && res.data.location_signals.length === 0) {
            setViewState('empty');
          }
        } else {
          setDataSource('DEMO_SYNTHETIC');
        }
      } catch {
        if (isMounted) setDataSource('BACKEND_UNAVAILABLE');
      }
    }

    loadGeoData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRunAnalysis = async () => {
    setViewState('loading');
    setLoadingStep(1);

    try {
      const res = await api.post<any>('/api/cases/CASE-2026-001/geospatial/analyze', {});
      if (res.success && res.data) {
        setDataSource('LIVE_BACKEND');
      }
    } catch {
      // Graceful fallback
    }

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= 4) {
          clearInterval(stepInterval);
          setViewState('available');
          return 4;
        }
        return prev + 1;
      });
    }, 300);
  };

  const handleAddEvidence = () => {
    if (onNavigateToEvidence) {
      onNavigateToEvidence();
    } else {
      setEvidenceNotification(`Added location signal ${selectedSignal.id} (${selectedSignal.city}) to case evidence.`);
      setTimeout(() => setEvidenceNotification(null), 3500);
    }
  };

  return (
    <div className="geo-workspace-root font-sans">
      {/* 1. Standard Page Context Header */}
      <header className="geo-context-header font-sans">
        <div className="header-left">
          <nav className="breadcrumb-nav font-sans" aria-label="Breadcrumb">
            <button type="button" onClick={onBack} className="breadcrumb-link">
              Cases
            </button>
            <span className="breadcrumb-sep">/</span>
            <button type="button" onClick={onBack} className="breadcrumb-link">
              CASE-2026-001
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Geospatial</span>
          </nav>
          <div className="header-titles">
            <div className="title-row-with-pill" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="page-main-title font-sans">Geospatial</h1>
              <span
                className="font-mono"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background:
                    dataSource === 'LIVE_BACKEND'
                      ? '#ECFDF5'
                      : dataSource === 'BACKEND_UNAVAILABLE'
                      ? '#FEF2F2'
                      : '#F1F5F9',
                  color:
                    dataSource === 'LIVE_BACKEND'
                      ? '#047857'
                      : dataSource === 'BACKEND_UNAVAILABLE'
                      ? '#B91C1C'
                      : '#475569',
                  border: `1px solid ${
                    dataSource === 'LIVE_BACKEND'
                      ? '#A7F3D0'
                      : dataSource === 'BACKEND_UNAVAILABLE'
                      ? '#FECACA'
                      : '#CBD5E1'
                  }`
                }}
              >
                {dataSource === 'LIVE_BACKEND'
                  ? '● LIVE BACKEND'
                  : dataSource === 'BACKEND_UNAVAILABLE'
                  ? '✕ BACKEND OFFLINE (FIXTURE)'
                  : '○ DEMO / SYNTHETIC'}
              </span>
            </div>
            <p className="page-main-sub font-sans">
              Review location signals and geographic consistency findings associated with this investigation.
            </p>
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions-row font-sans">
            {onNavigateToGraph && (
              <button
                type="button"
                onClick={() => onNavigateToGraph('geo-node')}
                className="btn-secondary-action font-sans"
              >
                Inspect Trace Graph →
              </button>
            )}
            {onNavigateToRisk && (
              <button
                type="button"
                onClick={onNavigateToRisk}
                className="btn-secondary-action font-sans"
              >
                Review Risk Signals →
              </button>
            )}
            {onNavigateToTransaction && (
              <button
                type="button"
                onClick={() => onNavigateToTransaction(selectedSignal.relatedTransactionId || 'TX-UPI-001')}
                className="btn-primary-action font-sans"
              >
                View in Transactions →
              </button>
            )}
          </div>

          {/* Compact View Switcher for State Validation */}
          <div className="state-simulator-bar font-sans">
            <span className="sim-label">Status:</span>
            {(['available', 'partial', 'empty', 'loading', 'error'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setViewState(st);
                  if (st === 'loading') setLoadingStep(2);
                }}
                className={`pill-btn ${viewState === st ? 'active' : ''}`}
              >
                {st === 'available'
                  ? 'Available (6)'
                  : st === 'partial'
                  ? 'Partial (3)'
                  : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {evidenceNotification && (
        <div className="toast-notification font-sans">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{evidenceNotification}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="geo-main-content">
        {/* STATE: LOADING */}
        {viewState === 'loading' && (
          <section className="state-card loading-state-card" aria-live="polite">
            <div className="loading-content">
              <span className="status-pill-neutral font-mono">LOCATION SIGNAL INGESTION</span>
              <h2 className="loading-title font-sans">Correlating Location Signals...</h2>
              <p className="loading-step-text font-mono">
                {loadingStep === 1 && 'Ingesting authorized transaction metadata and geocoded records... (Step 1 of 4)'}
                {loadingStep === 2 && 'Evaluating spatial distance vs. elapsed transit intervals... (Step 2 of 4)'}
                {loadingStep === 3 && 'Checking physical transit consistency boundaries... (Step 3 of 4)'}
                {loadingStep >= 4 && 'Synthesizing location clusters with financial activity... (Step 4 of 4)'}
              </p>

              <div className="linear-progress-track">
                <div
                  className="linear-progress-fill"
                  style={{ width: `${(loadingStep / 4) * 100}%` }}
                />
              </div>

              <div className="loading-meta-info font-mono">
                <span>Case: {geoData.caseId}</span>
                <span>Scope: Authorized Signals</span>
                <span>Status: In Progress</span>
              </div>
            </div>
          </section>
        )}

        {/* STATE: ERROR */}
        {viewState === 'error' && (
          <section className="state-card error-state-card" role="alert">
            <div className="error-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="error-title font-sans">Geospatial Data Unavailable</h2>
            <p className="error-desc font-sans">
              The location correlation service encountered a coordinate format error or terminal switch timeout while retrieving location telemetry.
            </p>
            <div className="error-actions font-sans">
              <button type="button" onClick={handleRunAnalysis} className="btn-primary-action font-sans">
                Retry Ingestion
              </button>
              <button type="button" onClick={() => setViewState('empty')} className="btn-secondary-action font-sans">
                View Empty State
              </button>
            </div>
          </section>
        )}

        {/* STATE: EMPTY */}
        {viewState === 'empty' && (
          <section className="state-card empty-state-card">
            <div className="empty-state-inner">
              <div className="empty-symbol-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <span className="status-pill-neutral font-mono">NO LOCATION DATA</span>
              <h2 className="empty-headline font-sans">No location signals associated with this investigation</h2>
              <p className="empty-subtext font-sans">
                No authorized or investigation-provided location signals were identified for the selected subject address. Blockchain wallets and domestic routing VPAs do not inherently generate physical location records.
              </p>

              <div className="empty-action-group font-sans">
                {onNavigateToTransaction && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTransaction('0x8ef2a9103c8b7b659fe10938bfe41209b0a124982')}
                    className="btn-primary-action font-sans"
                  >
                    Return to Transactions →
                  </button>
                )}
                {onNavigateToGraph && (
                  <button
                    type="button"
                    onClick={() => onNavigateToGraph('suspect')}
                    className="btn-secondary-action font-sans"
                  >
                    Open Trace Graph →
                  </button>
                )}
              </div>

              <div className="empty-heuristics-note font-sans">
                <div className="note-title font-mono">INVESTIGATIVE STANDARD</div>
                <p>
                  Location signals are displayed only from authorized, verified, or synthetic records. TRACEVAULT does not fabricate coordinates when no authorized location records exist.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* STATE: AVAILABLE OR PARTIAL */}
        {(viewState === 'available' || viewState === 'partial') && (
          <div className="geo-content-container">
            {/* 2. Top Metric Summary Strip */}
            <section className="geo-metrics-strip font-sans" aria-label="Geospatial Summary Metrics">
              <div className="metric-box">
                <span className="m-label font-mono">SUBJECT ADDRESS</span>
                <span className="m-val font-mono">0x71F9...4982</span>
                <span className="m-sub">vpa98@okhdfcbank</span>
              </div>
              <div className="metric-box">
                <span className="m-label font-mono">LOCATION SIGNALS</span>
                <span className="m-val font-mono">
                  {viewState === 'partial' ? '3 Signals' : `${geoData.totalSignalsCount} Signals`}
                </span>
                <span className="m-sub">Authorized Sources</span>
              </div>
              <div className="metric-box">
                <span className="m-label font-mono">LOCATIONS REVIEWED</span>
                <span className="m-val font-mono">
                  {viewState === 'partial' ? '2 Cities' : '4 Locations'}
                </span>
                <span className="m-sub">Bengaluru, Mumbai, Delhi, Chennai</span>
              </div>
              <div className="metric-box">
                <span className="m-label font-mono">LOCATION INCONSISTENCIES</span>
                <span className="m-val font-mono text-warning">1 Finding</span>
                <span className="m-sub">Bengaluru ↔ Mumbai Sequence</span>
              </div>
              <div className="metric-box">
                <span className="m-label font-mono">RELATED TRANSACTIONS</span>
                <span className="m-val font-mono">
                  {viewState === 'partial' ? '3 Correlated' : '5 Correlated'}
                </span>
                <span className="m-sub">₹1,96,000 Observed Flow</span>
              </div>
            </section>

            {/* Filter and Rail Selector Bar */}
            <div className="geo-filter-strip font-sans">
              <div className="filter-group">
                <span className="filter-label font-mono">Network Rail:</span>
                {['All', 'UPI Domestic', 'Banking KYC'].map((rail) => (
                  <button
                    key={rail}
                    type="button"
                    className={`filter-btn ${selectedRail === rail ? 'active' : ''}`}
                    onClick={() => setSelectedRail(rail)}
                  >
                    {rail}
                  </button>
                ))}
              </div>

              <div className="filter-divider" />

              <div className="filter-group">
                <span className="filter-label font-mono">Signal Type:</span>
                {['All', 'TRANSACTION LOCATION', 'TERMINAL LOCATION', 'MERCHANT LOCATION'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`filter-btn ${selectedSignalType === t ? 'active' : ''}`}
                    onClick={() => setSelectedSignalType(t)}
                  >
                    {t === 'TRANSACTION LOCATION'
                      ? 'Transaction'
                      : t === 'TERMINAL LOCATION'
                      ? 'Terminal / ATM'
                      : t === 'MERCHANT LOCATION'
                      ? 'Merchant'
                      : 'All Types'}
                  </button>
                ))}
              </div>

              <div className="filter-divider" />

              <div className="filter-group">
                <span className="filter-label font-mono">Time Range:</span>
                {['All', '1h', '6h', '24h'].map((tw) => (
                  <button
                    key={tw}
                    type="button"
                    className={`filter-btn ${selectedTimeFilter === tw ? 'active' : ''}`}
                    onClick={() => setSelectedTimeFilter(tw)}
                  >
                    {tw === 'All' ? 'All Events' : tw}
                  </button>
                ))}
              </div>
            </div>

            {/* PRIMARY WORKSPACE GRID: Map Dominant (68%) on Left, Findings & Inspector (32%) on Right */}
            <div className="geo-primary-grid">
              {/* Left Column: Interactive Map (Dominant Workspace) */}
              <div className="geo-map-panel">
                <div className="map-wrapper-card">
                  <GeospatialMap
                    signals={viewState === 'partial' ? geoData.signals.slice(0, 3) : geoData.signals}
                    selectedSignalId={selectedSignalId}
                    onSelectSignal={(id) => setSelectedSignalId(id)}
                    filteredRail={selectedRail}
                    filteredSignalType={selectedSignalType}
                    height={520}
                  />
                </div>

                {/* Location Clusters & Proximity Groups - Nested under Map in Left Column */}
                <div className="content-card clusters-card font-sans">
                  <div className="card-header-clean">
                    <div>
                      <h3 className="card-title font-sans">Observed Location Clusters</h3>
                      <p className="card-subtitle font-sans">
                        Geographic grouping of correlated signals within active transaction windows.
                      </p>
                    </div>
                    <span className="status-pill-neutral font-mono">{geoData.locationGroups.length} Clusters</span>
                  </div>

                  <div className="clusters-grid">
                    {geoData.locationGroups.map((grp) => (
                      <div key={grp.name} className="cluster-item">
                        <div className="cluster-header">
                          <span className="cluster-name font-sans">{grp.name}</span>
                          <span className="cluster-count font-mono">{grp.signalCount} signals</span>
                        </div>
                        <div className="cluster-meta font-mono">
                          <span>{grp.primaryCity}</span>
                          <span className="dot-sep">•</span>
                          <span>{grp.transactionCount} transactions</span>
                        </div>
                        <div className="cluster-window font-mono">
                          Window: {grp.timeWindow}
                        </div>
                        <div className="cluster-signals-row">
                          {grp.signalIds.map((sigId) => (
                            <button
                              key={sigId}
                              type="button"
                              className={`cluster-sig-tag font-mono ${selectedSignalId === sigId ? 'active' : ''}`}
                              onClick={() => setSelectedSignalId(sigId)}
                            >
                              {sigId}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Location Findings & Signal Inspector Panel */}
              <div className="geo-findings-panel font-sans">
                {/* Findings List Card */}
                <div className="content-card findings-list-card">
                  <div className="card-header-clean">
                    <div>
                      <h3 className="card-title font-sans">Location Signals & Findings</h3>
                      <p className="card-subtitle font-sans">
                        Observed points associated with investigated activity. Select to inspect details.
                      </p>
                    </div>
                    <span className="status-pill-neutral font-mono">
                      {viewState === 'partial' ? '3 Signals' : `${geoData.signals.length} Signals`}
                    </span>
                  </div>

                  <div className="findings-scroll-list">
                    {(viewState === 'partial' ? geoData.signals.slice(0, 3) : geoData.signals).map((sig) => {
                      const isSelected = sig.id === selectedSignalId;
                      return (
                        <div
                          key={sig.id}
                          className={`finding-card-item ${isSelected ? 'selected' : ''} ${sig.isAnomaly ? 'has-anomaly' : ''}`}
                          onClick={() => setSelectedSignalId(sig.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="finding-top-row">
                            <div className="finding-city font-sans">
                              {sig.city}, {sig.region}
                            </div>
                            {sig.isAnomaly ? (
                              <span className="status-pill-warning font-mono">Inconsistency</span>
                            ) : (
                              <span className="status-pill-neutral font-mono">{sig.accuracy}</span>
                            )}
                          </div>
                          <div className="finding-sub-row font-mono">
                            <span>{sig.id}</span>
                            <span className="dot-sep">•</span>
                            <span>{sig.signalType.replace(' LOCATION', '')}</span>
                            {sig.relatedTransactionId && (
                              <>
                                <span className="dot-sep">•</span>
                                <span className="text-secondary">{sig.relatedTransactionId}</span>
                              </>
                            )}
                          </div>
                          <div className="finding-time font-mono">
                            {sig.timestamp}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Signal Inspector Card */}
                <div className="content-card signal-inspector-card">
                  <div className="card-header-clean">
                    <div>
                      <span className="inspector-badge-label font-mono">SIGNAL INSPECTOR</span>
                      <h3 className="inspector-city-title font-sans">
                        {selectedSignal.city}, {selectedSignal.region}
                      </h3>
                      <span className="inspector-sig-id font-mono">{selectedSignal.id}</span>
                    </div>
                    {selectedSignal.isAnomaly ? (
                      <span className="status-pill-warning font-mono">Potential Inconsistency</span>
                    ) : (
                      <span className="status-pill-success font-mono">Consistent Observation</span>
                    )}
                  </div>

                  {/* Structured Details Table */}
                  <div className="inspector-details-table">
                    <div className="detail-row">
                      <span className="detail-label font-mono">Coordinates</span>
                      <span className="detail-value font-mono">
                        {selectedSignal.latitude.toFixed(4)}° N, {selectedSignal.longitude.toFixed(4)}° E
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label font-mono">Timestamp</span>
                      <span className="detail-value font-mono">{selectedSignal.timestamp}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label font-mono">Signal Type</span>
                      <span className="detail-value font-sans">{selectedSignal.signalType}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label font-mono">Source Provenance</span>
                      <span className="detail-value font-sans">{selectedSignal.source}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label font-mono">Accuracy Radius</span>
                      <span className="detail-value font-mono">{selectedSignal.accuracy}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label font-mono">Related Transaction</span>
                      <span className="detail-value font-mono">
                        {selectedSignal.relatedTransactionId || 'None'} {selectedSignal.amount && `(${selectedSignal.amount})`}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label font-mono">Related Entity</span>
                      <span className="detail-value font-mono">{selectedSignal.relatedEntityId || 'Subject Address'}</span>
                    </div>
                  </div>

                  {/* Correlation Observation */}
                  <div className="inspector-box observation-box">
                    <span className="box-label font-mono">CORRELATION OBSERVATION</span>
                    <p className="box-text font-sans">
                      {selectedSignal.correlationExplanation}
                    </p>
                  </div>

                  {/* Anomaly Callout */}
                  {selectedSignal.isAnomaly && selectedSignal.anomalyDetails && (
                    <div className="inspector-box anomaly-box">
                      <span className="box-label font-mono text-warning">TRANSIT INCONSISTENCY FINDING</span>
                      <p className="box-text font-sans">
                        {selectedSignal.anomalyDetails}
                      </p>
                    </div>
                  )}

                  {/* Investigative Consideration Note */}
                  <div className="inspector-box note-box">
                    <span className="box-label font-mono">INVESTIGATIVE CONSIDERATION</span>
                    <p className="box-text font-sans">
                      Location data reflects recorded system metadata and does not conclusively verify physical presence or device ownership. Correlate with transaction timings and rail logs.
                    </p>
                  </div>

                  {/* Cross-Workspace Action Buttons */}
                  <div className="inspector-actions">
                    {selectedSignal.relatedTransactionId && onNavigateToTransaction && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTransaction(selectedSignal.relatedTransactionId!)}
                        className="btn-primary-action font-sans"
                      >
                        Inspect Transaction →
                      </button>
                    )}
                    {onNavigateToGraph && (
                      <button
                        type="button"
                        onClick={() => onNavigateToGraph('geo-node')}
                        className="btn-secondary-action font-sans"
                      >
                        View in Trace Graph →
                      </button>
                    )}
                    {onNavigateToRisk && (
                      <button
                        type="button"
                        onClick={onNavigateToRisk}
                        className="btn-secondary-action font-sans"
                      >
                        Inspect Risk Profile →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddEvidence}
                      className="btn-secondary-action font-sans"
                    >
                      + Add to Case Evidence
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Financial Activity Correlation Workflow & Temporal Sequence */}
            <div className="geo-bottom-grid">
              {/* Financial Activity Correlation Flow */}
              <div className="content-card font-sans">
                <div className="card-header-clean">
                  <div>
                    <h3 className="card-title font-sans">Financial Activity Correlation</h3>
                    <p className="card-subtitle font-sans">
                      Deterministic sequence connecting observed location signals with transactions and investigated entities.
                    </p>
                  </div>
                  <span className="status-pill-neutral font-mono">Correlated Sequence</span>
                </div>

                <div className="correlation-steps-row">
                  <div className="step-card">
                    <span className="step-num font-mono">1. OBSERVED LOCATION</span>
                    <div className="step-title font-sans">{selectedSignal.city}, {selectedSignal.region}</div>
                    <div className="step-desc font-mono">{selectedSignal.timestamp.slice(11, 19)} UTC</div>
                    <div className="step-source font-mono">{selectedSignal.source}</div>
                  </div>

                  <div className="step-arrow font-mono">──▶</div>

                  <div className="step-card">
                    <span className="step-num font-mono">2. FINANCIAL TRANSACTION</span>
                    <div className="step-title font-mono">{selectedSignal.relatedTransactionId || 'TX-UPI-001'}</div>
                    <div className="step-desc font-mono">{selectedSignal.amount || '₹49,500.00'}</div>
                    <div className="step-source font-mono">{selectedSignal.rail}</div>
                  </div>

                  <div className="step-arrow font-mono">──▶</div>

                  <div className="step-card">
                    <span className="step-num font-mono">3. INVESTIGATED ENTITY</span>
                    <div className="step-title font-mono">{selectedSignal.relatedEntityId || 'vpa98@okhdfcbank'}</div>
                    <div className="step-desc font-sans">Correlated Identifier</div>
                    <div className="step-source font-mono">Routing Directory</div>
                  </div>
                </div>

                <div className="correlation-notice font-sans">
                  <span className="notice-tag font-mono">INVESTIGATIVE STANDARD:</span>
                  <span>
                    Financial activity was observed within the designated time interval. A correlated location signal does not establish the identity or confirmed physical presence of any individual.
                  </span>
                </div>
              </div>

              {/* Temporal Event Sequence */}
              <div className="content-card font-sans">
                <div className="card-header-clean">
                  <div>
                    <h3 className="card-title font-sans">Temporal Event Sequence</h3>
                    <p className="card-subtitle font-sans">
                      Chronological ordering of location observations. Select any card to focus on map.
                    </p>
                  </div>
                  <span className="status-pill-neutral font-mono">Chronological UTC</span>
                </div>

                <div className="timeline-items-grid">
                  {geoData.signals.map((sig) => {
                    const isSelected = sig.id === selectedSignalId;
                    return (
                      <div
                        key={sig.id}
                        className={`timeline-card-item ${isSelected ? 'selected' : ''} ${sig.isAnomaly ? 'anomaly' : ''}`}
                        onClick={() => setSelectedSignalId(sig.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="timeline-item-time font-mono">
                          {sig.timestamp.slice(11, 19)} UTC
                        </div>
                        <div className="timeline-item-city font-sans">
                          {sig.city}
                        </div>
                        <div className="timeline-item-tx font-mono">
                          {sig.relatedTransactionId || 'Registry'}
                        </div>
                        <div className="timeline-item-status font-sans">
                          {sig.isAnomaly ? (
                            <span className="text-warning">Inconsistency</span>
                          ) : (
                            <span className="text-muted">Consistent</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Disclaimer */}
            <div className="geo-disclaimer-banner font-sans">
              <span className="disclaimer-tag font-mono">INVESTIGATIVE NOTICE:</span>
              <p className="disclaimer-text font-sans">
                {geoData.investigativeNotice}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Scoped CSS styling strictly following the TraceVault light design system */}
      <style>{`
        .geo-workspace-root {
          width: 100%;
          min-height: calc(100vh - 72px);
          background-color: #F8FAFC;
          color: #0F172A;
          display: flex;
          flex-direction: column;
        }

        /* 1. Header */
        .geo-context-header {
          padding: 20px 32px 16px 32px;
          border-bottom: 1px solid #E2E8F0;
          background: #FFFFFF;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748B;
        }

        .breadcrumb-link {
          background: none;
          border: none;
          padding: 0;
          color: #64748B;
          cursor: pointer;
          font-size: 13px;
          transition: color 0.15s ease;
        }

        .breadcrumb-link:hover {
          color: #0F172A;
          text-decoration: underline;
        }

        .breadcrumb-sep {
          color: #CBD5E1;
        }

        .breadcrumb-current {
          color: #0F172A;
          font-weight: 500;
        }

        .header-titles {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .title-row-with-pill {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-main-title {
          font-size: 20px;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .demo-synthetic-pill {
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FDE68A;
          letter-spacing: 0.04em;
        }

        .page-main-sub {
          font-size: 13.5px;
          color: #64748B;
          margin: 0;
          max-width: 800px;
          line-height: 1.45;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }

        .header-actions-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary-action {
          background: #0284C7;
          color: #FFFFFF;
          border: 1px solid #0284C7;
          padding: 7px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }

        .btn-primary-action:hover {
          background: #0369A1;
          border-color: #0369A1;
        }

        .btn-secondary-action {
          background: #FFFFFF;
          color: #334155;
          border: 1px solid #CBD5E1;
          padding: 7px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }

        .btn-secondary-action:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
          color: #0F172A;
        }

        .state-simulator-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 3px 6px;
        }

        .sim-label {
          font-size: 11px;
          color: #64748B;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding-left: 4px;
        }

        .pill-btn {
          background: transparent;
          border: none;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 4px;
          color: #64748B;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .pill-btn:hover {
          color: #0F172A;
        }

        .pill-btn.active {
          background: #FFFFFF;
          color: #0284C7;
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .toast-notification {
          position: fixed;
          top: 20px;
          right: 24px;
          background: #0F172A;
          color: #FFFFFF;
          font-size: 13px;
          padding: 10px 16px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 1000;
        }

        /* 2. Main Content Container */
        .geo-main-content {
          padding: 24px 32px 48px 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .geo-content-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* 3. Metrics Summary Strip */
        .geo-metrics-strip {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }

        .metric-box {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .m-label {
          font-size: 11px;
          color: #64748B;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .m-val {
          font-size: 17px;
          font-weight: 700;
          color: #0F172A;
        }

        .m-sub {
          font-size: 12px;
          color: #64748B;
        }

        .text-warning {
          color: #B45309 !important;
        }

        /* 4. Filter Strip */
        .geo-filter-strip {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          font-size: 11.5px;
          color: #64748B;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .filter-divider {
          width: 1px;
          height: 18px;
          background: #E2E8F0;
        }

        .filter-btn {
          background: transparent;
          border: 1px solid transparent;
          font-size: 12.5px;
          padding: 4px 10px;
          border-radius: 5px;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .filter-btn:hover {
          color: #0F172A;
          background: #F8FAFC;
        }

        .filter-btn.active {
          background: #F1F5F9;
          border-color: #CBD5E1;
          color: #0284C7;
          font-weight: 600;
        }

        /* 5. Primary Grid (Map dominant left 68%, Right panel 32%) */
        .geo-primary-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(380px, 1fr);
          gap: 20px;
          align-items: start;
        }

        .geo-map-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .map-wrapper-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .content-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 20px 22px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .card-header-clean {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #F1F5F9;
        }

        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: #0F172A;
          margin: 0 0 3px 0;
        }

        .card-subtitle {
          font-size: 12.5px;
          color: #64748B;
          margin: 0;
        }

        /* Status Pills */
        .status-pill-neutral {
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          background: #F1F5F9;
          color: #475569;
          border: 1px solid #E2E8F0;
          white-space: nowrap;
        }

        .status-pill-warning {
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FDE68A;
          white-space: nowrap;
        }

        .status-pill-success {
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          background: #DCFCE7;
          color: #166534;
          border: 1px solid #BBF7D0;
          white-space: nowrap;
        }

        /* Clusters card */
        .clusters-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .cluster-item {
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 12px 14px;
          background: #F8FAFC;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .cluster-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cluster-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #0F172A;
        }

        .cluster-count {
          font-size: 11.5px;
          color: #64748B;
        }

        .cluster-meta {
          font-size: 12px;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dot-sep {
          color: #CBD5E1;
        }

        .cluster-window {
          font-size: 11px;
          color: #94A3B8;
        }

        .cluster-signals-row {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }

        .cluster-sig-tag {
          font-size: 10.5px;
          padding: 2px 6px;
          border-radius: 4px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          color: #334155;
          cursor: pointer;
        }

        .cluster-sig-tag.active {
          border-color: #0284C7;
          color: #0284C7;
          font-weight: 600;
        }

        /* Right Panel: Findings & Inspector */
        .geo-findings-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .findings-scroll-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 250px;
          overflow-y: auto;
        }

        .finding-card-item {
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 10px 12px;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .finding-card-item:hover {
          border-color: #CBD5E1;
          background: #F8FAFC;
        }

        .finding-card-item.selected {
          border-color: #0284C7;
          background: #F0F9FF;
        }

        .finding-card-item.has-anomaly {
          border-left: 3px solid #D97706;
        }

        .finding-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .finding-city {
          font-size: 13.5px;
          font-weight: 600;
          color: #0F172A;
        }

        .finding-sub-row {
          font-size: 11.5px;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .text-secondary {
          color: #0284C7;
        }

        .finding-time {
          font-size: 11px;
          color: #94A3B8;
        }

        /* Inspector styling */
        .inspector-badge-label {
          font-size: 10px;
          font-weight: 600;
          color: #64748B;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 2px;
        }

        .inspector-city-title {
          font-size: 17px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .inspector-sig-id {
          font-size: 11.5px;
          color: #64748B;
        }

        .inspector-details-table {
          display: flex;
          flex-direction: column;
          border-top: 1px solid #F1F5F9;
          margin-bottom: 14px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #F1F5F9;
          font-size: 12.5px;
        }

        .detail-label {
          color: #64748B;
          font-size: 11.5px;
          letter-spacing: 0.02em;
        }

        .detail-value {
          color: #0F172A;
          font-weight: 500;
          text-align: right;
        }

        .inspector-box {
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .observation-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .anomaly-box {
          background: #FEF3C7;
          border: 1px solid #FDE68A;
        }

        .note-box {
          background: #F8FAFC;
          border: 1px dashed #CBD5E1;
        }

        .box-label {
          font-size: 10px;
          font-weight: 600;
          color: #64748B;
          letter-spacing: 0.04em;
        }

        .box-text {
          font-size: 12px;
          color: #334155;
          margin: 0;
          line-height: 1.45;
        }

        .inspector-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-top: 14px;
        }

        .inspector-actions button {
          width: 100%;
          justify-content: center;
        }

        /* 6. Bottom Grid (Financial correlation & temporal timeline) */
        .geo-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .correlation-steps-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 16px 0;
        }

        .step-card {
          flex: 1;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 12px;
          background: #F8FAFC;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .step-num {
          font-size: 10px;
          color: #64748B;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .step-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #0F172A;
        }

        .step-desc {
          font-size: 11.5px;
          color: #475569;
        }

        .step-source {
          font-size: 10.5px;
          color: #94A3B8;
        }

        .step-arrow {
          color: #94A3B8;
          font-size: 13px;
        }

        .correlation-notice {
          font-size: 12px;
          color: #64748B;
          line-height: 1.45;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 10px 12px;
        }

        .notice-tag {
          font-size: 10.5px;
          font-weight: 600;
          color: #475569;
          margin-right: 6px;
        }

        /* Timeline Items Grid */
        .timeline-items-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .timeline-card-item {
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 10px 12px;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .timeline-card-item:hover {
          border-color: #CBD5E1;
          background: #F8FAFC;
        }

        .timeline-card-item.selected {
          border-color: #0284C7;
          background: #F0F9FF;
        }

        .timeline-card-item.anomaly {
          border-top: 2px solid #D97706;
        }

        .timeline-item-time {
          font-size: 11px;
          color: #64748B;
        }

        .timeline-item-city {
          font-size: 13px;
          font-weight: 600;
          color: #0F172A;
        }

        .timeline-item-tx {
          font-size: 11px;
          color: #0284C7;
        }

        .timeline-item-status {
          font-size: 11px;
          margin-top: 2px;
        }

        .text-muted {
          color: #64748B;
        }

        /* 7. Disclaimer Banner */
        .geo-disclaimer-banner {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 14px 18px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .disclaimer-tag {
          font-size: 10.5px;
          font-weight: 600;
          color: #475569;
          background: #E2E8F0;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          letter-spacing: 0.04em;
        }

        .disclaimer-text {
          font-size: 12.5px;
          color: #64748B;
          margin: 0;
          line-height: 1.45;
        }

        /* State Cards (Loading, Error, Empty) */
        .state-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 48px 32px;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .loading-content, .error-state-card, .empty-state-inner {
          max-width: 540px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .loading-title, .error-title, .empty-headline {
          font-size: 18px;
          font-weight: 600;
          color: #0F172A;
          margin: 0;
        }

        .loading-step-text {
          font-size: 13px;
          color: #64748B;
          margin: 0;
        }

        .linear-progress-track {
          width: 100%;
          height: 5px;
          background: #E2E8F0;
          border-radius: 3px;
          overflow: hidden;
          margin: 6px 0;
        }

        .linear-progress-fill {
          height: 100%;
          background: #0284C7;
          transition: width 0.3s ease;
        }

        .loading-meta-info {
          display: flex;
          gap: 12px;
          font-size: 11.5px;
          color: #94A3B8;
        }

        .error-desc, .empty-subtext {
          font-size: 13.5px;
          color: #64748B;
          margin: 0;
          line-height: 1.5;
        }

        .error-actions, .empty-action-group {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .empty-symbol-box, .error-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .error-icon-box {
          background: #FEE2E2;
        }

        .empty-heuristics-note {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 12px 16px;
          margin-top: 14px;
          text-align: left;
          font-size: 12px;
          color: #64748B;
        }

        .note-title {
          font-size: 10.5px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }

        @media (max-width: 1180px) {
          .geo-primary-grid {
            grid-template-columns: 1fr;
          }
          .geo-metrics-strip {
            grid-template-columns: repeat(2, 1fr);
          }
          .geo-bottom-grid {
            grid-template-columns: 1fr;
          }
          .timeline-items-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
