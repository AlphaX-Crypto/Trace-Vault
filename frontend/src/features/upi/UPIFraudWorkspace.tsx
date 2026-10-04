import React, { useState, useEffect } from 'react';
import { api, DataSourceState } from '../../api/client';
import { MULE_UPI_ANALYSIS_DATA, MULE_UPI_ENTITIES } from './upiData';
import { UPIFraudFinding, UPITransaction } from './upiTypes';

export interface UPIFraudWorkspaceProps {
  activeCaseId?: string;
  onBack: () => void;
  onNavigateToTransaction?: (txId: string) => void;
  onNavigateToGraph?: (entityId?: string) => void;
  onNavigateToRisk?: () => void;
  initialState?: 'analyzed' | 'empty' | 'loading' | 'error';
}

export const UPIFraudWorkspace: React.FC<UPIFraudWorkspaceProps> = ({
  activeCaseId = 'CASE-2026-001',
  onBack,
  onNavigateToTransaction,
  onNavigateToGraph,
  onNavigateToRisk,
  initialState = 'analyzed'
}) => {
  const [viewState, setViewState] = useState<'analyzed' | 'empty' | 'loading' | 'error'>(initialState);
  const [loadingStep, setLoadingStep] = useState(1);
  const [expandedSignals, setExpandedSignals] = useState<Record<string, boolean>>({
    'UPI-SIG-PASSTHROUGH': true
  });
  const [evidenceAddedMap, setEvidenceAddedMap] = useState<Record<string, boolean>>({});

  const [dataSource, setDataSource] = useState<DataSourceState>('DEMO_SYNTHETIC');
  const [liveRiskScore, setLiveRiskScore] = useState<number>(MULE_UPI_ANALYSIS_DATA.risk.score);
  const [liveRiskLevel, setLiveRiskLevel] = useState<string>(MULE_UPI_ANALYSIS_DATA.risk.level);
  const [liveFindingCount, setLiveFindingCount] = useState<number>(MULE_UPI_ANALYSIS_DATA.findings.length);

  const analysis = MULE_UPI_ANALYSIS_DATA;
  const entities = MULE_UPI_ENTITIES;

  useEffect(() => {
    let isMounted = true;
    async function loadUPIData() {
      try {
        const isHealthy = await api.checkHealth();
        if (!isHealthy) {
          if (isMounted) setDataSource('DEMO_SYNTHETIC');
          return;
        }

        const res = await api.post<any>(`/api/cases/${activeCaseId}/upi/analyze`, {
          subject_vpa: 'suspect@okaxis'
        });
        if (!isMounted) return;

        if (res.success && res.data) {
          setDataSource('LIVE_BACKEND');
          if (typeof res.data.risk_score === 'number') {
            setLiveRiskScore(res.data.risk_score);
          }
          if (res.data.risk_level) {
            setLiveRiskLevel(res.data.risk_level);
          }
          if (Array.isArray(res.data.findings)) {
            setLiveFindingCount(res.data.findings.length);
          }
        } else {
          setDataSource('DEMO_SYNTHETIC');
        }
      } catch {
        if (isMounted) setDataSource('BACKEND_UNAVAILABLE');
      }
    }

    loadUPIData();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSignal = (signalId: string) => {
    setExpandedSignals((prev) => ({
      ...prev,
      [signalId]: !prev[signalId]
    }));
  };

  const handleAddEvidence = (identifier: string) => {
    setEvidenceAddedMap((prev) => ({ ...prev, [identifier]: true }));
    setTimeout(() => {
      setEvidenceAddedMap((prev) => ({ ...prev, [identifier]: false }));
    }, 2500);
  };

  const handleRunAnalysis = async () => {
    setViewState('loading');
    setLoadingStep(1);

    try {
      const res = await api.post<any>('/api/cases/CASE-2026-001/upi/analyze', {
        subject_vpa: 'suspect@okaxis'
      });
      if (res.success && res.data) {
        setDataSource('LIVE_BACKEND');
        if (typeof res.data.risk_score === 'number') {
          setLiveRiskScore(res.data.risk_score);
        }
        if (res.data.risk_level) {
          setLiveRiskLevel(res.data.risk_level);
        }
        if (Array.isArray(res.data.findings)) {
          setLiveFindingCount(res.data.findings.length);
        }
      }
    } catch {
      // Keep existing behavior or fall back gracefully
    }

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= 4) {
          clearInterval(stepInterval);
          setViewState('analyzed');
          return 4;
        }
        return prev + 1;
      });
    }, 300);
  };

  return (
    <div className="upi-workspace-root font-sans">
      {/* 1. Header (Consistent with Risk Analysis / Evidence / Transactions) */}
      <header className="upi-context-header font-sans">
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
            <span className="breadcrumb-current">UPI Fraud</span>
          </nav>
          <div className="header-titles">
            <div className="title-row-with-pill" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="page-main-title font-sans">UPI Fraud</h1>
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
              Review UPI transaction patterns and potential risk signals associated with this investigation.
            </p>
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions-row font-sans">
            {onNavigateToRisk && (
              <button
                type="button"
                onClick={onNavigateToRisk}
                className="btn-secondary-action font-sans"
              >
                Analyze Risk →
              </button>
            )}
            {onNavigateToGraph && (
              <button
                type="button"
                onClick={() => onNavigateToGraph('vasp-1')}
                className="btn-secondary-action font-sans"
              >
                Inspect Trace Graph →
              </button>
            )}
            {onNavigateToTransaction && (
              <button
                type="button"
                onClick={() => onNavigateToTransaction('TX-UPI-001')}
                className="btn-primary-action font-sans"
              >
                View in Transactions →
              </button>
            )}
          </div>

          {/* Compact View Switcher for State Validation */}
          <div className="state-simulator-bar font-sans">
            <span className="sim-label">Status:</span>
            {(['analyzed', 'empty', 'loading', 'error'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setViewState(st);
                  if (st === 'loading') setLoadingStep(3);
                }}
                className={`pill-btn ${viewState === st ? 'active' : ''}`}
              >
                {st === 'analyzed' ? `Analyzed (${analysis.risk.score})` : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="upi-main-content">
        {/* STATE: LOADING */}
        {viewState === 'loading' && (
          <div className="upi-state-box font-sans">
            <div className="loading-spinner" />
            <div className="state-title font-sans">Evaluating UPI Transaction Patterns...</div>
            <p className="state-desc font-sans">
              {loadingStep === 1 && 'Ingesting domestic UPI transaction records and counterparty VPAs... (Step 1 of 4)'}
              {loadingStep === 2 && 'Evaluating rapid pass-through velocity and conversion hops... (Step 2 of 4)'}
              {loadingStep === 3 && 'Analyzing multi-counterparty beneficiary disbursement patterns... (Step 3 of 4)'}
              {loadingStep >= 4 && 'Synthesizing deterministic findings and structuring metrics... (Step 4 of 4)'}
            </p>
            <div className="linear-progress-track">
              <div className="linear-progress-fill" style={{ width: `${(loadingStep / 4) * 100}%` }} />
            </div>
            <div className="state-meta font-mono">
              <span>Subject VPA: {analysis.subject}</span>
              <span>Rail: UPI Domestic</span>
            </div>
          </div>
        )}

        {/* STATE: ERROR */}
        {viewState === 'error' && (
          <div className="upi-state-box font-sans">
            <div className="state-icon-alert">⚠</div>
            <div className="state-title font-sans">UPI Analysis Record Unavailable</div>
            <p className="state-desc font-sans">
              Unable to complete deterministic pattern evaluation for subject VPA {analysis.subject}. Gateway query timed out.
            </p>
            <div className="state-actions-row">
              <button type="button" onClick={handleRunAnalysis} className="btn-state-action primary font-sans">
                Retry Evaluation
              </button>
              <button type="button" onClick={() => setViewState('empty')} className="btn-state-action font-sans">
                Clear to Empty State
              </button>
            </div>
          </div>
        )}

        {/* STATE: EMPTY */}
        {viewState === 'empty' && (
          <div className="upi-state-box font-sans">
            <div className="state-icon-doc">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <line x1="6" y1="15" x2="10" y2="15" />
              </svg>
            </div>
            <div className="state-title font-sans">NO UPI ASSESSMENT RECORDED</div>
            <p className="state-desc font-sans">
              Deterministic pattern analysis has not been executed for subject account <span className="font-mono">{analysis.subject}</span>.
            </p>
            <div className="state-actions-row">
              <button type="button" onClick={handleRunAnalysis} className="btn-state-action primary font-sans">
                Execute UPI Analysis →
              </button>
              <button type="button" onClick={() => setViewState('analyzed')} className="btn-state-action font-sans">
                Load Sample Findings
              </button>
            </div>
          </div>
        )}

        {/* STATE: ANALYZED (Primary View) */}
        {viewState === 'analyzed' && (
          <div className="upi-container">
            {/* 1. Primary UPI Risk Summary Card (Side-by-Side Two-Column Layout matching Risk Analysis) */}
            <section className="clean-white-card upi-summary-card font-sans">
              <div className="upi-summary-left">
                <div className="summary-section-label">UPI RISK ASSESSMENT</div>
                <div className="summary-score-row">
                  <div className="score-numbers font-mono">
                    <span className="score-num">{liveRiskScore}</span>
                    <span className="score-den">/ 100</span>
                  </div>
                  <div className="score-badge-wrap">
                    <span className={`risk-badge-${liveRiskLevel.toLowerCase()} font-sans`}>{liveRiskLevel}</span>
                    <span className="score-badge-sub">Requires Direct Corroboration</span>
                  </div>
                </div>
                <p className="summary-caption font-sans">
                  Investigative assessment based on {liveFindingCount} explainable risk signals across rapid pass-through, velocity, and structured disbursement limits.
                </p>
              </div>

              <div className="upi-summary-divider" />

              <div className="upi-summary-right">
                <div className="summary-section-label">ASSESSMENT TARGET & STATUS</div>
                <div className="meta-list">
                  <div className="meta-row">
                    <span className="meta-label">Subject VPA:</span>
                    <span className="meta-val font-mono">{analysis.subject}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Transaction Rail:</span>
                    <span className="meta-val font-mono">{analysis.rail}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Evaluation Status:</span>
                    <span className="meta-val text-green font-medium">Complete ({liveFindingCount} Signals Identified)</span>
                  </div>
                </div>
                <div className="meta-actions">
                  <button type="button" onClick={handleRunAnalysis} className="btn-quiet-action font-sans">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Re-evaluate Signals
                  </button>
                </div>
              </div>
            </section>

            {/* 2. Summary Metric Cards Row */}
            <section className="upi-metrics-grid font-sans">
              <div className="count-card">
                <span className="count-label">SUBJECT VPA</span>
                <span className="count-val font-mono text-sm">{analysis.subject}</span>
                <span className="count-sub">Subject Account</span>
              </div>
              <div className="count-card">
                <span className="count-label">TRANSACTION COUNT</span>
                <span className="count-val">{analysis.features.transaction_count}</span>
                <span className="count-sub">{analysis.features.velocity_tx_per_minute} TX / min velocity</span>
              </div>
              <div className="count-card">
                <span className="count-label">TOTAL VOLUME</span>
                <span className="count-val font-mono">{analysis.features.total_volume}</span>
                <span className="count-sub">Avg ₹49,166.67 per TX</span>
              </div>
              <div className="count-card">
                <span className="count-label">SETTLEMENT STATUS</span>
                <span className="count-val text-green">5 Settled</span>
                <span className="count-sub">1 Terminal Failed Attempt</span>
              </div>
              <div className="count-card">
                <span className="count-label">UNIQUE COUNTERPARTIES</span>
                <span className="count-val">{analysis.features.unique_beneficiaries}</span>
                <span className="count-sub">Across 3 Commercial Banks</span>
              </div>
            </section>

            {/* 3. Risk Signals Breakdown Section */}
            <section className="clean-white-card signals-section font-sans">
              <div className="card-top-header">
                <div>
                  <h2 className="card-title font-sans">Risk Signals ({analysis.findings.length})</h2>
                  <p className="card-sub-description font-sans">
                    Explainable risk indicators triggered by pure deterministic rule evaluation. Click each signal to inspect observed activity and exact metrics.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-toggle-all font-sans"
                  onClick={() => {
                    const allOpen = Object.keys(expandedSignals).length === analysis.findings.length;
                    if (allOpen) {
                      setExpandedSignals({});
                    } else {
                      const next: Record<string, boolean> = {};
                      analysis.findings.forEach((f) => { next[f.signal_id] = true; });
                      setExpandedSignals(next);
                    }
                  }}
                >
                  {Object.keys(expandedSignals).length === analysis.findings.length ? 'Collapse All' : 'Expand All'}
                </button>
              </div>

              <div className="signals-list">
                {analysis.findings.map((sig: UPIFraudFinding, idx: number) => {
                  const isExpanded = !!expandedSignals[sig.signal_id];
                  const isAdded = !!evidenceAddedMap[sig.signal_id];
                  return (
                    <div key={sig.signal_id} className={`signal-item-card ${isExpanded ? 'expanded' : ''}`}>
                      {/* Signal Row Header */}
                      <div
                        className="signal-header-row"
                        onClick={() => toggleSignal(sig.signal_id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleSignal(sig.signal_id);
                          }
                        }}
                      >
                        <div className="sig-left">
                          <span className="sig-num font-mono">0{idx + 1}</span>
                          <div className="sig-title-block">
                            <div className="sig-title-line">
                              <span className="sig-title font-sans">{sig.title}</span>
                              <span className={`sig-pill pill-${sig.severity.toLowerCase()} font-mono`}>
                                {sig.severity} (+{sig.risk_contribution} pts)
                              </span>
                              <span className="category-pill font-mono">{sig.signal_type}</span>
                              <span className="tx-count-pill font-mono">{sig.transaction_ids.length} TXs</span>
                            </div>
                            <p className="sig-summary font-sans">{sig.description}</p>
                          </div>
                        </div>

                        <div className="sig-right">
                          <span className="chevron-icon font-mono">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Signal Details */}
                      {isExpanded && (
                        <div className="signal-expanded-content font-sans">
                          {/* Reason / Explanation */}
                          <div className="why-box">
                            <div className="why-header font-sans">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                              </svg>
                              <span>Why this signal was raised:</span>
                            </div>
                            <p className="why-text font-sans">{sig.reason}</p>
                          </div>

                          {/* Observed Activity vs Measured Metrics */}
                          <div className="details-two-col">
                            <div className="detail-col-card">
                              <span className="detail-col-heading font-sans">Observed Activity</span>
                              <div className="detail-kv-list font-sans">
                                {sig.observedBehavior && (
                                  <>
                                    <div className="detail-kv-item">
                                      <span className="detail-k font-mono">Incoming:</span>
                                      <span className="detail-v">{sig.observedBehavior.inflow}</span>
                                    </div>
                                    <div className="detail-kv-item">
                                      <span className="detail-k font-mono">Outgoing:</span>
                                      <span className="detail-v">{sig.observedBehavior.outflow}</span>
                                    </div>
                                    <div className="detail-kv-item">
                                      <span className="detail-k font-mono">Elapsed Time:</span>
                                      <span className="detail-v font-mono">{sig.observedBehavior.elapsedTime}</span>
                                    </div>
                                    {sig.observedBehavior.details && (
                                      <div className="detail-kv-item">
                                        <span className="detail-k font-mono">Observation:</span>
                                        <span className="detail-v">{sig.observedBehavior.details}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="detail-col-card">
                              <span className="detail-col-heading font-sans">Rule Metrics &amp; Thresholds</span>
                              <div className="detail-kv-list font-sans">
                                {Object.entries(sig.metrics).map(([k, v]) => (
                                  <div key={k} className="detail-kv-item">
                                    <span className="detail-k font-mono">{k}:</span>
                                    <span className="detail-v font-mono font-medium">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Signal Actions Footer */}
                          <div className="signal-footer-row">
                            <div className="footer-links-group">
                              <span className="footer-label font-sans">Supporting Activity:</span>
                              {sig.transaction_ids.map((txId) => (
                                <button
                                  key={txId}
                                  type="button"
                                  className="btn-link-action font-mono"
                                  onClick={() => onNavigateToTransaction && onNavigateToTransaction(txId)}
                                >
                                  {txId} →
                                </button>
                              ))}
                              {onNavigateToGraph && (
                                <button
                                  type="button"
                                  className="btn-link-action font-sans"
                                  onClick={() => onNavigateToGraph('vasp-1')}
                                >
                                  Focus in Graph →
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddEvidence(sig.signal_id)}
                              className="btn-add-evidence-pill font-sans"
                            >
                              {isAdded ? '✓ Added to Case Evidence' : '+ Add to Case Evidence'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 4. Investigative Findings (Structured 3-Pillar Component) */}
            <section className="clean-white-card findings-section font-sans">
              <div className="card-top-header">
                <div>
                  <h2 className="card-title font-sans">Investigative Findings</h2>
                  <p className="card-sub-description font-sans">
                    Structured classification separating objective observed facts, deterministic system analysis, and investigator considerations.
                  </p>
                </div>
              </div>

              <div className="findings-pillars-grid">
                {/* Pillar 1: Observed Fact */}
                <div className="pillar-card">
                  <div className="pillar-header">
                    <span className="pillar-tag tag-fact font-sans">OBSERVED FACT</span>
                  </div>
                  <ul className="pillar-list font-sans">
                    <li>
                      Inflow of <strong>₹49,500.00</strong> credited from <code className="font-mono">otc_desk@okhdfcbank</code> at 08:30:15 UTC.
                    </li>
                    <li>
                      Subsequent outflow of <strong>₹48,500.00</strong> transferred to <code className="font-mono">clearing_settle@okhdfcbank</code> within 105 seconds (97.98% volume swept).
                    </li>
                    <li>
                      Total of <strong>₹2,95,000.00</strong> processed across 6 transactions spanning 6 minutes 35 seconds across 3 commercial banks (HDFC, ICICI, Yes Bank).
                    </li>
                    <li>
                      Individual amounts clustered between <strong>₹48,500.00</strong> and <strong>₹50,000.00</strong>.
                    </li>
                  </ul>
                </div>

                {/* Pillar 2: System Analysis */}
                <div className="pillar-card">
                  <div className="pillar-header">
                    <span className="pillar-tag tag-analysis font-sans">SYSTEM ANALYSIS</span>
                  </div>
                  <ul className="pillar-list font-sans">
                    <li>
                      Pattern meets the configured <strong>Rapid Pass-Through Flow</strong> threshold (ratio 0.98 &ge; 0.80 within 10 minutes).
                    </li>
                    <li>
                      Disbursement frequency meets the <strong>High-Value Transaction Velocity</strong> threshold (0.91 TX/min).
                    </li>
                    <li>
                      Dispersal targets meet the <strong>Rapid Beneficiary Dispersion</strong> threshold (3 distinct destination VPAs in 170 seconds).
                    </li>
                    <li>
                      Amounts exceed historical baseline average (₹2,500.00) by 19.8x while staying directly beneath the ₹50,000 standard reporting trigger.
                    </li>
                  </ul>
                </div>

                {/* Pillar 3: Investigator Consideration */}
                <div className="pillar-card">
                  <div className="pillar-header">
                    <span className="pillar-tag tag-consideration font-sans">INVESTIGATOR CONSIDERATION</span>
                  </div>
                  <ul className="pillar-list font-sans">
                    <li>
                      Review counterparty beneficiary relationships and corroborate whether the account functions as an intermediary routing point.
                    </li>
                    <li>
                      Verify OTC desk origin counterparties to inspect potential fiat liquidation from previous cryptocurrency peeling hops.
                    </li>
                    <li>
                      Issue formal preservation or Section 91 disclosure requests to relevant commercial banks for KYC and terminal withdrawal records.
                    </li>
                    <li>
                      Cross-examine transaction timestamps with on-chain rapid dispersion timing in the Trace Graph workspace.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. Transaction Activity Table */}
            <section className="clean-white-card upi-table-card font-sans">
              <div className="card-top-header">
                <div>
                  <h2 className="card-title font-sans">Transaction Activity ({analysis.analyzed_transactions.length})</h2>
                  <p className="card-sub-description font-sans">
                    Normalized UPI transaction records associated with subject account <span className="font-mono">{analysis.subject}</span>.
                  </p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="clean-table font-sans">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Reference</th>
                      <th>Sender</th>
                      <th>Beneficiary</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Signal</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.analyzed_transactions.map((tx: UPITransaction) => (
                      <tr
                        key={tx.transaction_id}
                        onClick={() => onNavigateToTransaction && onNavigateToTransaction(tx.transaction_id)}
                        className="clickable-row"
                      >
                        <td className="font-mono text-secondary">{tx.timestamp.slice(11, 19)} UTC</td>
                        <td className="font-mono font-medium text-dark">{tx.transaction_id}</td>
                        <td className="font-mono text-secondary">{tx.sender_vpa}</td>
                        <td className="font-mono text-secondary">{tx.receiver_vpa}</td>
                        <td className="font-mono font-medium text-dark">{tx.amount}</td>
                        <td>
                          <span className="rail-pill font-mono">{tx.transaction_type}</span>
                        </td>
                        <td>
                          <span className={`status-badge-clean ${tx.status === 'SUCCESS' ? 'status-success' : 'status-failed'} font-mono`}>
                            {tx.status}
                          </span>
                        </td>
                        <td>
                          <span className="sig-pill pill-high font-mono">{tx.signal_trigger}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn-row-action font-sans"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNavigateToTransaction) onNavigateToTransaction(tx.transaction_id);
                            }}
                          >
                            Inspect →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 6. Beneficiary / Associated Entities Table */}
            <section className="clean-white-card entities-table-card font-sans">
              <div className="card-top-header">
                <div>
                  <h2 className="card-title font-sans">Associated Accounts &amp; Counterparties ({entities.length})</h2>
                  <p className="card-sub-description font-sans">
                    Associated VPAs and routing counterparties observed during transaction pass-through and dispersal phases.
                  </p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="clean-table font-sans">
                  <thead>
                    <tr>
                      <th>Account / VPA</th>
                      <th>Investigative Role</th>
                      <th>Volume</th>
                      <th>First Observed</th>
                      <th>Triggered Signals</th>
                      <th>Indicator</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((ent) => {
                      const isAdded = !!evidenceAddedMap[ent.vpa];
                      return (
                        <tr key={ent.vpa}>
                          <td className="font-mono font-medium text-dark">{ent.vpa}</td>
                          <td className="text-secondary">{ent.role}</td>
                          <td className="font-mono text-dark">{ent.totalVolume} ({ent.transactionCount} TX)</td>
                          <td className="font-mono text-secondary">{ent.firstObserved.slice(11, 19)} UTC</td>
                          <td>
                            <div className="signals-tag-wrap font-sans">
                              {ent.associatedSignals.map((s, i) => (
                                <span key={i} className="mini-signal-tag font-sans">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className={`risk-indicator-pill indicator-${ent.riskLevel.toLowerCase()} font-mono`}>
                              {ent.riskLevel}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="row-actions-group">
                              {onNavigateToTransaction && (
                                <button
                                  type="button"
                                  className="btn-row-action font-sans"
                                  onClick={() => onNavigateToTransaction(ent.vpa)}
                                >
                                  TXs →
                                </button>
                              )}
                              {onNavigateToGraph && (
                                <button
                                  type="button"
                                  className="btn-row-action font-sans"
                                  onClick={() => onNavigateToGraph('vasp-1')}
                                >
                                  Graph →
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-row-action font-sans"
                                onClick={() => handleAddEvidence(ent.vpa)}
                              >
                                {isAdded ? '✓ Added' : '+ Evidence'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="investigative-note-strip font-sans">
                <span className="note-label font-sans">Investigative Note:</span>
                <span className="note-text font-sans">
                  A Virtual Payment Address (VPA) is a payment routing identifier and does not establish verified legal identity. Counterparties are classified based on observed transaction patterns and require formal documentary corroboration.
                </span>
              </div>
            </section>
          </div>
        )}
      </main>

      <style>{`
        .upi-workspace-root {
          width: 100%;
          min-height: calc(100vh - 72px);
          background-color: #f8fafc;
          color: #0f172a;
          display: flex;
          flex-direction: column;
        }

        /* 1. Page Context Header */
        .upi-context-header {
          background-color: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 20px 32px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
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
        }

        .breadcrumb-link {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0;
          font-size: 13px;
          transition: color 0.15s ease;
        }

        .breadcrumb-link:hover {
          color: #0f172a;
        }

        .breadcrumb-sep {
          color: #cbd5e1;
        }

        .breadcrumb-current {
          color: #0f172a;
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
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .demo-synthetic-pill {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .page-main-sub {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          max-width: 680px;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .header-actions-row {
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
          color: #0f172a;
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

        .state-simulator-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 3px 8px;
        }

        .sim-label {
          font-size: 11px;
          color: #64748b;
          margin-right: 2px;
        }

        .pill-btn {
          background: transparent;
          border: 1px solid transparent;
          color: #64748b;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pill-btn:hover {
          color: #0f172a;
          background: #e2e8f0;
        }

        .pill-btn.active {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #2563eb;
          font-weight: 500;
        }

        /* Main Body */
        .upi-main-content {
          padding: 24px 32px 48px 32px;
          flex: 1;
        }

        .upi-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .clean-white-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 22px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .card-top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .card-sub-description {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }

        /* 1. Primary UPI Risk Summary Card (Side-by-Side Two-Column Layout) */
        .clean-white-card.upi-summary-card {
          display: grid !important;
          grid-template-columns: 1fr 1px 1fr !important;
          align-items: stretch !important;
          padding: 24px 28px !important;
          gap: 28px !important;
        }

        @media (max-width: 1024px) {
          .clean-white-card.upi-summary-card {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .upi-summary-divider {
            display: none !important;
          }
        }

        .upi-summary-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
        }

        .summary-section-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .summary-score-row {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .score-numbers {
          display: flex;
          align-items: baseline;
        }

        .score-num {
          font-size: 40px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1;
        }

        .score-den {
          font-size: 18px;
          font-weight: 500;
          color: #64748b;
          margin-left: 6px;
        }

        .score-badge-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .risk-badge-high {
          display: inline-block;
          align-self: flex-start;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .score-badge-sub {
          font-size: 11px;
          color: #64748b;
        }

        .summary-caption {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .upi-summary-divider {
          width: 1px;
          background: #e2e8f0;
        }

        .upi-summary-right {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
        }

        .meta-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          padding-bottom: 4px;
          border-bottom: 1px dashed #f1f5f9;
        }

        .meta-label {
          color: #64748b;
          font-weight: 500;
        }

        .meta-val {
          color: #0f172a;
        }

        .meta-actions {
          margin-top: 6px;
        }

        .btn-quiet-action {
          background: transparent;
          border: none;
          color: #2563eb;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          font-weight: 500;
        }

        .btn-quiet-action:hover {
          text-decoration: underline;
        }

        /* 2. Metrics Grid */
        .upi-metrics-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }

        @media (max-width: 1024px) {
          .upi-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .count-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .count-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        .count-val {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 2px 0;
        }

        .count-sub {
          font-size: 12px;
          color: #64748b;
        }

        /* 3. Signals Accordion */
        .btn-toggle-all {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 12px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-toggle-all:hover {
          color: #0f172a;
          background: #f8fafc;
        }

        .signals-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .signal-item-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.15s ease;
        }

        .signal-item-card.expanded {
          border-color: #cbd5e1;
        }

        .signal-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          cursor: pointer;
          background: #ffffff;
          gap: 16px;
        }

        .signal-header-row:hover {
          background: #f8fafc;
        }

        .sig-left {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          flex: 1;
        }

        .sig-num {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-top: 2px;
        }

        .sig-title-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sig-title-line {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sig-title {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }

        .sig-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .pill-high, .pill-critical {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .pill-medium {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fde68a;
        }

        .pill-low {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .category-pill, .tx-count-pill {
          font-size: 11px;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .sig-summary {
          font-size: 12.5px;
          color: #64748b;
          margin: 0;
        }

        .sig-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chevron-icon {
          font-size: 11px;
          color: #64748b;
        }

        .signal-expanded-content {
          padding: 0 20px 20px 20px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .why-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-top: 16px;
        }

        .why-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .why-text {
          font-size: 13px;
          color: #334155;
          margin: 0;
          line-height: 1.5;
        }

        .details-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .detail-col-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px 16px;
        }

        .detail-col-heading {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }

        .detail-kv-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-kv-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          font-size: 12px;
        }

        .detail-k {
          color: #64748b;
          flex-shrink: 0;
        }

        .detail-v {
          color: #0f172a;
          text-align: right;
        }

        .signal-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px dashed #e2e8f0;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-links-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .footer-label {
          font-size: 12px;
          color: #64748b;
        }

        .btn-link-action {
          background: transparent;
          border: none;
          color: #2563eb;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
        }

        .btn-link-action:hover {
          text-decoration: underline;
        }

        .btn-add-evidence-pill {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-add-evidence-pill:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* 4. Investigative Findings (3-Pillar Section) */
        .findings-pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 1024px) {
          .findings-pillars-grid {
            grid-template-columns: 1fr;
          }
        }

        .pillar-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pillar-header {
          display: flex;
          align-items: center;
        }

        .pillar-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .tag-fact {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .tag-analysis {
          background: #f5f3ff;
          color: #7c3aed;
          border: 1px solid #ddd6fe;
        }

        .tag-consideration {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .pillar-list {
          margin: 0;
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 12.5px;
          color: #334155;
          line-height: 1.5;
        }

        .pillar-list li {
          color: #334155;
        }

        /* 5 & 6 Tables */
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }

        .clean-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .clean-table th {
          text-align: left;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .clean-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #f1f5f9;
          color: #0f172a;
          vertical-align: middle;
        }

        .clean-table tr.clickable-row {
          cursor: pointer;
          transition: background 0.1s ease;
        }

        .clean-table tr.clickable-row:hover {
          background: #f8fafc;
        }

        .status-badge-clean {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .status-success {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .status-failed {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .rail-pill {
          font-size: 11px;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .risk-indicator-pill {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .indicator-high {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .indicator-medium {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fde68a;
        }

        .indicator-low {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .btn-row-action {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-row-action:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .row-actions-group {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .signals-tag-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .mini-signal-tag {
          font-size: 11px;
          background: #f1f5f9;
          color: #475569;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .investigative-note-strip {
          margin-top: 16px;
          padding: 12px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 12px;
          color: #64748b;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .note-label {
          font-weight: 600;
          color: #0f172a;
          flex-shrink: 0;
        }

        .note-text {
          line-height: 1.45;
        }

        /* States (Loading, Error, Empty) */
        .upi-state-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 56px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          max-width: 640px;
          margin: 40px auto;
        }

        .state-icon-doc, .state-icon-alert {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .state-icon-doc {
          background: #f1f5f9;
        }

        .state-icon-alert {
          background: #fef2f2;
          color: #dc2626;
          font-size: 24px;
          font-weight: 700;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .state-title {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }

        .state-desc {
          font-size: 13px;
          color: #64748b;
          max-width: 440px;
          margin: 0;
          line-height: 1.5;
        }

        .state-actions-row {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .btn-state-action {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          padding: 7px 16px;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-state-action.primary {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        .linear-progress-track {
          width: 240px;
          height: 6px;
          background: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
          margin-top: 8px;
        }

        .linear-progress-fill {
          height: 100%;
          background: #2563eb;
          transition: width 0.3s ease;
        }

        .state-meta {
          font-size: 11px;
          color: #64748b;
          display: flex;
          gap: 16px;
          margin-top: 6px;
        }

        .text-red { color: #dc2626; }
        .text-amber { color: #d97706; }
        .text-blue { color: #2563eb; }
        .text-green { color: #16a34a; }
        .text-secondary { color: #64748b; }
        .text-dark { color: #0f172a; }
      `}</style>
    </div>
  );
};
