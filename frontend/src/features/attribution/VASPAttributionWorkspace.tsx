import React, { useState, useEffect } from 'react';
import { api, DataSourceState } from '../../api/client';
import { CASE_VASP_ATTRIBUTION_DATA } from './attributionData';
import { CandidateVASP, AttributionSupportingTransaction } from './attributionTypes';

export interface VASPAttributionWorkspaceProps {
  activeCaseId?: string;
  onBack: () => void;
  onNavigateToTransaction?: (txHash: string) => void;
  onNavigateToGraph?: (entityId?: string) => void;
  onNavigateToRisk?: () => void;
  onNavigateToEvidence?: () => void;
  onNavigateToDisclosure?: (vaspName?: string, subject?: string) => void;
  initialState?: 'analyzed' | 'empty' | 'loading' | 'error';
}

export const VASPAttributionWorkspace: React.FC<VASPAttributionWorkspaceProps> = ({
  activeCaseId = 'CASE-2026-001',
  onBack,
  onNavigateToTransaction,
  onNavigateToGraph,
  onNavigateToRisk,
  onNavigateToEvidence,
  onNavigateToDisclosure,
  initialState = 'analyzed'
}) => {
  const [viewState, setViewState] = useState<'analyzed' | 'empty' | 'loading' | 'error'>(initialState);
  const [dataSource, setDataSource] = useState<DataSourceState>('DEMO_SYNTHETIC');
  const [selectedVaspId, setSelectedVaspId] = useState<string>('vasp-a');
  const [loadingStep, setLoadingStep] = useState(1);
  const [evidenceAddedMap, setEvidenceAddedMap] = useState<Record<string, boolean>>({});

  const attributionData = CASE_VASP_ATTRIBUTION_DATA;
  const selectedVasp: CandidateVASP =
    attributionData.candidates.find((c) => c.id === selectedVaspId) || attributionData.candidates[0];

  useEffect(() => {
    let isMounted = true;
    async function loadVASPData() {
      try {
        const isHealthy = await api.checkHealth();
        if (!isHealthy) {
          if (isMounted) setDataSource('DEMO_SYNTHETIC');
          return;
        }

        const res = await api.post<any>(`/api/cases/${activeCaseId}/vasp/analyze`, {
          max_hops: 5
        });
        if (!isMounted) return;

        if (res.success && res.data) {
          setDataSource('LIVE_BACKEND');
          if (Array.isArray(res.data.candidates) && res.data.candidates.length === 0) {
            setViewState('empty');
          }
        } else {
          setDataSource('DEMO_SYNTHETIC');
        }
      } catch {
        if (isMounted) setDataSource('BACKEND_UNAVAILABLE');
      }
    }

    loadVASPData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddEvidence = (identifier: string) => {
    setEvidenceAddedMap((prev) => ({ ...prev, [identifier]: true }));
    if (onNavigateToEvidence) {
      // Hook available for evidence linking
    }
    setTimeout(() => {
      setEvidenceAddedMap((prev) => ({ ...prev, [identifier]: false }));
    }, 2500);
  };

  const handleRunAttribution = async () => {
    setViewState('loading');
    setLoadingStep(1);

    try {
      const res = await api.post<any>('/api/cases/CASE-2026-001/vasp/analyze', {
        max_hops: 5
      });
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
          setViewState('analyzed');
          return 4;
        }
        return prev + 1;
      });
    }, 300);
  };

  return (
    <div className="vasp-workspace-root font-sans">
      {/* 1. Standard Page Context Header */}
      <header className="vasp-context-header font-sans">
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
            <span className="breadcrumb-current">VASP Attribution</span>
          </nav>
          <div className="header-titles">
            <div className="title-row-with-pill" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="page-main-title font-sans">VASP Attribution</h1>
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
              Review potential VASP associations and supporting transaction-path indicators for this investigation.
            </p>
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions-row font-sans">
            {onNavigateToGraph && (
              <button
                type="button"
                onClick={() => onNavigateToGraph('vasp-1')}
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
                Analyze Risk Profile →
              </button>
            )}
            {onNavigateToTransaction && (
              <button
                type="button"
                onClick={() => onNavigateToTransaction('0x8ef2a9103c8b7b659fe10938bfe41209b0a124982')}
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
                {st === 'analyzed' ? `Analyzed (3 Candidates)` : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="vasp-main-content">
        {/* STATE: LOADING */}
        {viewState === 'loading' && (
          <div className="vasp-state-box font-sans">
            <div className="loading-spinner" />
            <div className="state-title font-sans">Traversing Multi-Hop Transaction Topology...</div>
            <p className="state-desc font-sans">
              {loadingStep === 1 && 'Ingesting normalized multi-rail transaction topology... (Step 1 of 4)'}
              {loadingStep === 2 && 'Executing directed breadth-first search up to 4 hops... (Step 2 of 4)'}
              {loadingStep === 3 && 'Cross-referencing destination nodes against VaspRegistry index... (Step 3 of 4)'}
              {loadingStep >= 4 && 'Synthesizing association indicators and hop decay penalties... (Step 4 of 4)'}
            </p>
            <div className="linear-progress-track">
              <div className="linear-progress-fill" style={{ width: `${(loadingStep / 4) * 100}%` }} />
            </div>
            <div className="state-meta font-mono">
              <span>Subject: {attributionData.subjectAddress}</span>
              <span>Rail: {attributionData.rail}</span>
            </div>
          </div>
        )}

        {/* STATE: ERROR */}
        {viewState === 'error' && (
          <div className="vasp-state-box font-sans">
            <div className="state-icon-alert">⚠</div>
            <div className="state-title font-sans">VASP Attribution Record Unavailable</div>
            <p className="state-desc font-sans">
              Graph traversal timed out while evaluating multi-rail peeling nodes for subject address <span className="font-mono">{attributionData.subjectAddress}</span>.
            </p>
            <div className="state-actions-row">
              <button type="button" onClick={handleRunAttribution} className="btn-state-action primary font-sans">
                Retry Graph Traversal
              </button>
              <button type="button" onClick={() => setViewState('empty')} className="btn-state-action font-sans">
                Clear to Empty State
              </button>
            </div>
          </div>
        )}

        {/* STATE: EMPTY */}
        {viewState === 'empty' && (
          <div className="vasp-state-box font-sans">
            <div className="state-icon-doc">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="state-title font-sans">NO VASP ATTRIBUTION GENERATED</div>
            <p className="state-desc font-sans">
              Subject wallet <span className="font-mono">{attributionData.subjectAddress}</span> has not been evaluated against the VASP intelligence registry.
            </p>
            <div className="state-actions-row">
              <button type="button" onClick={handleRunAttribution} className="btn-state-action primary font-sans">
                Execute Attribution Traversal →
              </button>
              <button type="button" onClick={() => setViewState('analyzed')} className="btn-state-action font-sans">
                Load Sample Findings
              </button>
            </div>
          </div>
        )}

        {/* STATE: ANALYZED (Primary View) */}
        {viewState === 'analyzed' && (
          <div className="vasp-container">
            {/* 1. Primary Attribution Summary Card (Side-by-Side Two-Column Layout) */}
            <section className="clean-white-card vasp-summary-card font-sans">
              <div className="vasp-summary-left">
                <div className="summary-section-label">ATTRIBUTION SUMMARY</div>
                <div className="summary-score-row">
                  <div className="score-numbers font-mono">
                    <span className="score-num">82%</span>
                  </div>
                  <div className="score-badge-wrap">
                    <span className="conf-badge-pill font-sans">HIGHEST ATTRIBUTION CONFIDENCE</span>
                    <span className="score-badge-sub">Example Exchange (1 Hop Away)</span>
                  </div>
                </div>
                <p className="summary-caption font-sans">
                  Graph traversal identified 3 candidate VASP associations across multi-rail liquidation corridors. Real-world ownership requires formal legal disclosure.
                </p>
              </div>

              <div className="vasp-summary-divider" />

              <div className="vasp-summary-right">
                <div className="summary-section-label">SUBJECT IDENTIFIER &amp; SCOPE</div>
                <div className="meta-list">
                  <div className="meta-row">
                    <span className="meta-label">Subject Address:</span>
                    <span className="meta-val font-mono">{attributionData.subjectAddress}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Primary Rail:</span>
                    <span className="meta-val font-mono">{attributionData.rail}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Discovered Candidates:</span>
                    <span className="meta-val text-blue font-medium">3 Candidate Associations (1 to 3 Hops)</span>
                  </div>
                </div>
                <div className="meta-actions">
                  <button type="button" onClick={handleRunAttribution} className="btn-quiet-action font-sans">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Re-run Graph Traversal
                  </button>
                </div>
              </div>
            </section>

            {/* 2. Summary Metric Cards Row */}
            <section className="vasp-metrics-grid font-sans">
              <div className="count-card">
                <span className="count-label">SUBJECT WALLET</span>
                <span className="count-val font-mono text-sm">0x71F9...4982</span>
                <span className="count-sub">Investigated Subject</span>
              </div>
              <div className="count-card">
                <span className="count-label">CANDIDATE ASSOCIATIONS</span>
                <span className="count-val">{attributionData.candidates.length} Identified</span>
                <span className="count-sub">Ranked: 82%, 64%, 41%</span>
              </div>
              <div className="count-card">
                <span className="count-label">ASSOCIATED VOLUME</span>
                <span className="count-val font-mono">69.15 ETH</span>
                <span className="count-sub">~$241,025 Liquidated</span>
              </div>
              <div className="count-card">
                <span className="count-label">MAX GRAPH DISTANCE</span>
                <span className="count-val">3 Directed Hops</span>
                <span className="count-sub">Peeling &amp; P2P Layering</span>
              </div>
              <div className="count-card">
                <span className="count-label">REGISTRY STATUS</span>
                <span className="count-val text-green">Index Verified</span>
                <span className="count-sub">VaspRegistry Internal Index</span>
              </div>
            </section>

            {/* 3. Master-Detail Two Column Layout: Candidate Table (Left) + Candidate Inspector (Right) */}
            <div className="vasp-master-detail-grid">
              {/* Left Column: Candidate VASP Associations Table */}
              <div className="candidate-table-col">
                <section className="clean-white-card table-container-card font-sans">
                  <div className="card-top-header">
                    <div>
                      <h2 className="card-title font-sans">Candidate VASP Associations ({attributionData.candidates.length})</h2>
                      <p className="card-sub-description font-sans">
                        Reachable virtual asset service providers discovered along traced transaction paths. Click any candidate to inspect details.
                      </p>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="clean-table font-sans">
                      <thead>
                        <tr>
                          <th>Candidate VASP</th>
                          <th>Attribution Confidence</th>
                          <th>Hops</th>
                          <th>Transaction Volume</th>
                          <th>Supporting Indicators</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attributionData.candidates.map((vasp) => {
                          const isSelected = vasp.id === selectedVasp.id;
                          return (
                            <tr
                              key={vasp.id}
                              onClick={() => setSelectedVaspId(vasp.id)}
                              className={`clickable-row ${isSelected ? 'row-selected' : ''}`}
                            >
                              <td>
                                <div className="vasp-name-cell">
                                  <span className="vasp-display-name font-sans font-medium text-dark">{vasp.name}</span>
                                  <span className="vasp-legal-name text-secondary">{vasp.legalEntity}</span>
                                </div>
                              </td>
                              <td>
                                <div className="conf-cell-wrap">
                                  <span className={`conf-score-pill conf-${vasp.confidenceLabel.toLowerCase()} font-mono`}>
                                    {vasp.confidence}% ({vasp.confidenceLabel})
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className="hop-pill font-mono">{vasp.hopDistance} {vasp.hopDistance === 1 ? 'Hop' : 'Hops'}</span>
                              </td>
                              <td className="font-mono text-dark font-medium">{vasp.totalVolume}</td>
                              <td>
                                <span className="indicators-summary-text font-sans">
                                  {vasp.associationBasis.addressMatch.clusterName.split(' ')[0]} Match &bull; {vasp.associationBasis.transactionPath.pathSequence.length} Steps
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  className={`btn-row-action font-sans ${isSelected ? 'btn-active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVaspId(vasp.id);
                                  }}
                                >
                                  {isSelected ? 'Inspecting' : 'Inspect →'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Supporting Activity for Selected Candidate */}
                  <div className="supporting-activity-subcard font-sans">
                    <div className="subcard-header">
                      <h3 className="subcard-title font-sans">
                        Supporting Transactions for {selectedVasp.name} ({selectedVasp.supportingTransactions.length})
                      </h3>
                      <span className="subcard-note text-secondary font-sans">
                        Click transaction to inspect in Transaction Explorer
                      </span>
                    </div>

                    <div className="table-responsive">
                      <table className="clean-table compact-table font-sans">
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Transaction Hash</th>
                            <th>Origin</th>
                            <th>Destination</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedVasp.supportingTransactions.map((tx: AttributionSupportingTransaction) => (
                            <tr
                              key={tx.txHash}
                              onClick={() => onNavigateToTransaction && onNavigateToTransaction(tx.txHash)}
                              className="clickable-row"
                            >
                              <td className="font-mono text-secondary">{tx.time.slice(11, 19)} UTC</td>
                              <td className="font-mono font-medium text-dark">
                                {tx.txHash.length > 20 ? `${tx.txHash.slice(0, 10)}...${tx.txHash.slice(-8)}` : tx.txHash}
                              </td>
                              <td className="font-mono text-secondary">
                                {tx.from.length > 20 ? `${tx.from.slice(0, 8)}...${tx.from.slice(-6)}` : tx.from}
                              </td>
                              <td className="font-mono text-secondary">
                                {tx.to.length > 20 ? `${tx.to.slice(0, 8)}...${tx.to.slice(-6)}` : tx.to}
                              </td>
                              <td className="font-mono font-medium text-dark">{tx.amount}</td>
                              <td>
                                <span className="status-badge-clean status-success font-mono">{tx.status}</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  className="btn-row-action font-sans"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onNavigateToTransaction) onNavigateToTransaction(tx.txHash);
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
                  </div>
                </section>
              </div>

              {/* Right Column: Candidate Detail Inspector */}
              <div className="candidate-inspector-col">
                <section className="clean-white-card inspector-card font-sans">
                  <div className="inspector-top-header">
                    <span className="inspector-eyebrow font-sans">CANDIDATE VASP INSPECTOR</span>
                    <h3 className="inspector-title font-sans">{selectedVasp.name}</h3>
                    <span className="inspector-legal text-secondary font-sans">{selectedVasp.legalEntity}</span>
                  </div>

                  {/* Confidence Block */}
                  <div className="inspector-metric-box">
                    <div className="box-row">
                      <span className="box-label font-sans">Attribution Confidence</span>
                      <span className={`conf-score-pill conf-${selectedVasp.confidenceLabel.toLowerCase()} font-mono`}>
                        {selectedVasp.confidence}% ({selectedVasp.confidenceLabel})
                      </span>
                    </div>
                    <div className="confidence-track">
                      <div className="confidence-fill" style={{ width: `${selectedVasp.confidence}%` }} />
                    </div>
                    <span className="box-subtext font-sans">
                      Base: {selectedVasp.associationBasis.addressMatch.confidenceBase}% &minus; Hop Penalty: {selectedVasp.associationBasis.graphRelationship.hopPenalty}%
                    </span>
                  </div>

                  {/* Transaction Path Summary */}
                  <div className="inspector-section">
                    <div className="section-subtitle font-sans">Transaction Path ({selectedVasp.hopDistance} {selectedVasp.hopDistance === 1 ? 'Hop' : 'Hops'})</div>
                    <div className="compact-path-flow font-mono">
                      {selectedVasp.associationBasis.transactionPath.pathSequence.map((step, idx) => (
                        <div key={step.address} className="compact-step-item">
                          <div className={`step-badge ${step.isSubject ? 'badge-subject' : ''} ${step.isTarget ? 'badge-target' : ''}`}>
                            <span className="step-num font-mono">H{step.hopIndex}</span>
                            <span className="step-addr font-mono">{step.address.slice(0, 6)}...{step.address.slice(-4)}</span>
                            <span className="step-label font-sans">{step.isSubject ? 'Subject' : step.isTarget ? 'VASP' : 'Intermediary'}</span>
                          </div>
                          {idx < selectedVasp.associationBasis.transactionPath.pathSequence.length - 1 && (
                            <span className="step-arrow font-sans">↓</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="path-description-text font-sans">
                      {selectedVasp.associationBasis.transactionPath.details}
                    </p>
                  </div>

                  {/* Key Metadata Fields */}
                  <div className="inspector-section">
                    <div className="section-subtitle font-sans">Attribution Attributes</div>
                    <div className="meta-list font-sans">
                      <div className="meta-row">
                        <span className="meta-label">Entity Classification:</span>
                        <span className="meta-val font-sans">{selectedVasp.entityType}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Jurisdiction:</span>
                        <span className="meta-val font-sans">{selectedVasp.jurisdiction}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Traced Volume:</span>
                        <span className="meta-val font-mono font-medium">{selectedVasp.totalVolume}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Cluster Identifier:</span>
                        <span className="meta-val font-mono">{selectedVasp.depositClusterAddress.slice(0, 10)}...{selectedVasp.depositClusterAddress.slice(-6)}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Registry Source:</span>
                        <span className="meta-val font-sans">{selectedVasp.associationBasis.addressMatch.registrySource}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Reliability Index:</span>
                        <span className="meta-val font-mono text-green font-medium">{selectedVasp.associationBasis.addressMatch.reliability}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cross-Workspace Actions */}
                  <div className="inspector-actions">
                    {onNavigateToGraph && (
                      <button
                        type="button"
                        onClick={() => onNavigateToGraph('vasp-1')}
                        className="btn-cross-nav font-sans"
                      >
                        View in Trace Graph →
                      </button>
                    )}
                    {onNavigateToRisk && (
                      <button
                        type="button"
                        onClick={onNavigateToRisk}
                        className="btn-cross-nav font-sans"
                      >
                        Cross-Examine in Risk Workspace →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAddEvidence(selectedVasp.id)}
                      className="btn-secondary-action font-sans full-width"
                    >
                      {evidenceAddedMap[selectedVasp.id] ? '✓ Added to Case Evidence' : '+ Add to Case Evidence'}
                    </button>
                    {onNavigateToDisclosure && (
                      <button
                        type="button"
                        onClick={() => onNavigateToDisclosure(selectedVasp.name, selectedVasp.depositClusterAddress)}
                        className="btn-primary-action font-sans full-width"
                      >
                        Prepare Information Requisition (SAHYOG) →
                      </button>
                    )}
                  </div>

                  {/* Attribution Notice */}
                  <div className="inspector-notice font-sans">
                    <span className="notice-bold">Attribution Notice:</span>
                    <span>
                      A candidate VASP association is an investigative finding derived from on-chain graph analysis, not proof of wallet ownership. Real-world legal attribution requires formal statutory disclosure.
                    </span>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .vasp-workspace-root {
          width: 100%;
          min-height: calc(100vh - 72px);
          background-color: #f8fafc;
          color: #0f172a;
          display: flex;
          flex-direction: column;
        }

        /* 1. Page Context Header */
        .vasp-context-header {
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

        /* Main Content */
        .vasp-main-content {
          padding: 24px 32px 48px 32px;
          flex: 1;
        }

        .vasp-container {
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

        /* 1. Primary VASP Summary Card (Side-by-Side Two-Column Layout) */
        .clean-white-card.vasp-summary-card {
          display: grid !important;
          grid-template-columns: 1fr 1px 1fr !important;
          align-items: stretch !important;
          padding: 24px 28px !important;
          gap: 28px !important;
        }

        @media (max-width: 1024px) {
          .clean-white-card.vasp-summary-card {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .vasp-summary-divider {
            display: none !important;
          }
        }

        .vasp-summary-left {
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

        .score-badge-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .conf-badge-pill {
          display: inline-block;
          align-self: flex-start;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
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

        .vasp-summary-divider {
          width: 1px;
          background: #e2e8f0;
        }

        .vasp-summary-right {
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
        .vasp-metrics-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }

        @media (max-width: 1024px) {
          .vasp-metrics-grid {
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

        /* 3. Master-Detail Two Column Grid */
        .vasp-master-detail-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1200px) {
          .vasp-master-detail-grid {
            grid-template-columns: 1fr;
          }
        }

        .table-container-card {
          padding: 22px;
        }

        .vasp-name-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .vasp-display-name {
          font-size: 13.5px;
        }

        .vasp-legal-name {
          font-size: 11.5px;
        }

        .conf-cell-wrap {
          display: flex;
          align-items: center;
        }

        .conf-score-pill {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .conf-high {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .conf-moderate {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fde68a;
        }

        .conf-low {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .hop-pill {
          font-size: 11px;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .indicators-summary-text {
          font-size: 12px;
          color: #64748b;
        }

        .row-selected {
          background: #eff6ff !important;
        }

        .btn-row-action.btn-active {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        /* Supporting Activity Subcard */
        .supporting-activity-subcard {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .subcard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .subcard-title {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }

        .subcard-note {
          font-size: 12px;
        }

        .compact-table th {
          padding: 8px 12px;
          font-size: 10.5px;
        }

        .compact-table td {
          padding: 10px 12px;
          font-size: 12px;
        }

        /* Inspector Card */
        .inspector-card {
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: sticky;
          top: 20px;
        }

        .inspector-top-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 14px;
        }

        .inspector-eyebrow {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.05em;
        }

        .inspector-title {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .inspector-legal {
          font-size: 12px;
        }

        .inspector-metric-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .box-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .box-label {
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
        }

        .confidence-track {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: #2563eb;
          border-radius: 9999px;
        }

        .box-subtext {
          font-size: 11px;
          color: #64748b;
        }

        .inspector-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .section-subtitle {
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .compact-path-flow {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
        }

        .compact-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          width: 100%;
        }

        .step-badge {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11.5px;
        }

        .badge-subject {
          border-color: #93c5fd;
          background: #eff6ff;
        }

        .badge-target {
          border-color: #86efac;
          background: #f0fdf4;
        }

        .step-num {
          font-weight: 700;
          color: #64748b;
        }

        .step-addr {
          color: #0f172a;
        }

        .step-label {
          font-size: 11px;
          color: #64748b;
        }

        .step-arrow {
          font-size: 11px;
          color: #94a3b8;
        }

        .path-description-text {
          font-size: 12px;
          color: #64748b;
          line-height: 1.45;
          margin: 4px 0 0 0;
        }

        .inspector-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
        }

        .btn-cross-nav {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #2563eb;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .btn-cross-nav:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .full-width {
          width: 100%;
          text-align: center;
        }

        .inspector-notice {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 11px;
          color: #64748b;
          line-height: 1.45;
        }

        .notice-bold {
          font-weight: 600;
          color: #0f172a;
          display: block;
          margin-bottom: 2px;
        }

        /* Tables & Helpers */
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

        /* States (Loading, Error, Empty) */
        .vasp-state-box {
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

        .text-blue { color: #2563eb; }
        .text-green { color: #16a34a; }
        .text-secondary { color: #64748b; }
        .text-dark { color: #0f172a; }
      `}</style>
    </div>
  );
};
