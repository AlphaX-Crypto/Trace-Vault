import React, { useState, useMemo, useEffect } from 'react';
import {
  EvidenceCategoryType,
  EvidenceRecord,
  EvidenceStatusType,
  EvidenceFilterState
} from './evidenceTypes';
import { INITIAL_EVIDENCE_RECORDS, calculateEvidenceCounts } from './evidenceData';
import { AddEvidenceModal } from './AddEvidenceModal';
import { api, DataSourceState } from '../../api/client';

export interface EvidenceWorkspaceProps {
  activeCaseId?: string;
  onBack: () => void;
  onNavigateToTransaction?: (txId: string) => void;
  onNavigateToGraph?: (entityId?: string) => void;
  onNavigateToRisk?: () => void;
  onNavigateToUPI?: () => void;
  onNavigateToAttribution?: () => void;
  onNavigateToGeospatial?: (signalId?: string) => void;
  onNavigateToReport?: () => void;
  onNavigateToDisclosure?: (evidenceId?: string) => void;
  initialState?: 'available' | 'empty' | 'loading' | 'error';
}

export const EvidenceWorkspace: React.FC<EvidenceWorkspaceProps> = ({
  activeCaseId = 'CASE-2026-001',
  onBack,
  onNavigateToTransaction,
  onNavigateToGraph,
  onNavigateToRisk,
  onNavigateToUPI,
  onNavigateToAttribution,
  onNavigateToGeospatial,
  onNavigateToReport,
  onNavigateToDisclosure,
  initialState = 'available'
}) => {
  const [viewState, setViewState] = useState<'available' | 'empty' | 'loading' | 'error'>(initialState);
  const [records, setRecords] = useState<EvidenceRecord[]>(INITIAL_EVIDENCE_RECORDS);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>('EV-0001');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dataSource, setDataSource] = useState<DataSourceState>('DEMO_SYNTHETIC');

  useEffect(() => {
    let isMounted = true;
    async function loadEvidence() {
      try {
        const isHealthy = await api.checkHealth();
        if (!isHealthy) {
          if (isMounted) setDataSource('DEMO_SYNTHETIC');
          return;
        }

        const res = await api.get<any[]>(`/api/cases/${activeCaseId}/evidence`);
        if (!isMounted) return;

        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const nowIso = new Date().toISOString();
          const mapped: EvidenceRecord[] = res.data.map((e, idx) => ({
            id: e.evidence_id || e.id || `EV-${String(idx + 1).padStart(4, '0')}`,
            caseId: e.case_id || activeCaseId,
            category: (e.category as any) || 'OBSERVED_FACT',
            title: e.title || e.type || 'Forensic Evidence Record',
            description: e.description || e.summary || 'Supporting case record',
            source: e.source || 'Authorized Law Enforcement Ledger',
            sourceType: (e.source_type as any) || 'INVESTIGATOR_INPUT',
            sourceReference: e.source_reference || e.metadata?.source_ref || undefined,
            observedAt: e.observed_at || nowIso,
            ingestedAt: e.ingested_at || e.created_at || nowIso,
            timestamp: e.created_at ? new Date(e.created_at).toUTCString() : 'Just now',
            status: (e.status as any) || 'AVAILABLE',
            sourceIntegrity: 'SOURCE_VERIFIED',
            relatedTransactionId: e.metadata?.related_tx || e.related_tx || undefined,
            relatedEntityId: e.metadata?.related_entity || e.related_entity || undefined,
            investigatorNotes: e.notes || e.investigator_notes || '',
            annotatedBy: e.annotated_by || 'Inspector Samarth',
            annotatedAt: e.annotated_at || nowIso
          }));
          setRecords(mapped);
          setSelectedEvidenceId(mapped[0]?.id || 'EV-0001');
          setDataSource('LIVE_BACKEND');
        } else {
          setDataSource('DEMO_SYNTHETIC');
        }
      } catch {
        if (isMounted) setDataSource('BACKEND_UNAVAILABLE');
      }
    }
    loadEvidence();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filters
  const [filters, setFilters] = useState<EvidenceFilterState>({
    searchQuery: '',
    category: 'All',
    source: 'All',
    status: 'All',
    relatedObject: 'All'
  });

  // Inline note editing
  const [editingNote, setEditingNote] = useState<string>('');
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);

  // Counts
  const counts = useMemo(() => calculateEvidenceCounts(records), [records]);

  // Selected Evidence Record
  const selectedRecord = useMemo(() => {
    return records.find((r) => r.id === selectedEvidenceId) || records[0];
  }, [records, selectedEvidenceId]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchId = r.id.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchObj = (r.relatedTransactionId || '').toLowerCase().includes(q) ||
                         (r.relatedEntityId || '').toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchDesc && !matchObj) return false;
      }
      // Category
      if (filters.category !== 'All' && r.category !== filters.category) {
        return false;
      }
      // Source
      if (filters.source !== 'All') {
        if (filters.source === 'Blockchain' && r.sourceType !== 'BLOCKCHAIN_LEDGER') return false;
        if (filters.source === 'UPI' && r.sourceType !== 'UPI_FEED') return false;
        if (filters.source === 'Risk' && r.sourceType !== 'RISK_ENGINE') return false;
        if (filters.source === 'VASP' && r.sourceType !== 'VASP_REGISTRY') return false;
        if (filters.source === 'Geospatial' && r.sourceType !== 'GEOSPATIAL_SIGNAL') return false;
        if (filters.source === 'Investigator' && r.sourceType !== 'INVESTIGATOR_INPUT') return false;
      }
      // Status
      if (filters.status !== 'All' && r.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [records, filters]);

  // Timeline events sorted chronologically
  const timelineRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());
  }, [records]);

  // Handlers
  const handleAddEvidence = (newRecord: EvidenceRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    setSelectedEvidenceId(newRecord.id);
  };

  const handleUpdateStatus = (newStatus: EvidenceStatusType) => {
    if (!selectedRecord) return;
    setRecords((prev) =>
      prev.map((r) => (r.id === selectedRecord.id ? { ...r, status: newStatus } : r))
    );
  };

  const handleSaveNote = () => {
    if (!selectedRecord) return;
    const now = new Date();
    const isoString = `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 19)} UTC`;
    setRecords((prev) =>
      prev.map((r) =>
        r.id === selectedRecord.id
          ? {
              ...r,
              investigatorNotes: editingNote,
              annotatedBy: 'Investigator Samarth',
              annotatedAt: isoString
            }
          : r
      )
    );
    setIsEditingNote(false);
  };

  const getCategoryBadgeClass = (category: EvidenceCategoryType) => {
    switch (category) {
      case 'OBSERVED_FACT':
        return 'cat-badge-observed';
      case 'SYSTEM_ANALYSIS':
        return 'cat-badge-analysis';
      case 'ATTRIBUTION_INDICATOR':
        return 'cat-badge-attribution';
      case 'RISK_INDICATOR':
        return 'cat-badge-risk';
      case 'INVESTIGATOR_INTERPRETATION':
        return 'cat-badge-interpretation';
      default:
        return 'cat-badge-default';
    }
  };

  const getCategoryLabel = (category: EvidenceCategoryType) => {
    switch (category) {
      case 'OBSERVED_FACT':
        return 'Observed Fact';
      case 'SYSTEM_ANALYSIS':
        return 'System Analysis';
      case 'ATTRIBUTION_INDICATOR':
        return 'Attribution Indicator';
      case 'RISK_INDICATOR':
        return 'Risk Indicator';
      case 'INVESTIGATOR_INTERPRETATION':
        return 'Investigator Interpretation';
      default:
        return category;
    }
  };

  const getStatusBadgeClass = (status: EvidenceStatusType) => {
    switch (status) {
      case 'AVAILABLE':
        return 'status-badge-available';
      case 'REVIEW_REQUIRED':
        return 'status-badge-review-req';
      case 'REVIEWED':
        return 'status-badge-reviewed';
      case 'INSUFFICIENT_SUPPORT':
        return 'status-badge-insufficient';
      case 'DISPUTED':
        return 'status-badge-disputed';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: EvidenceStatusType) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="evidence-workspace-root font-sans">
      {/* 1. Standard Case / Page Header */}
      <header className="evidence-context-header">
        <div className="header-left">
          <div className="breadcrumb-nav">
            <button type="button" onClick={onBack} className="breadcrumb-link">
              Cases
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">CASE-2026-001</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Evidence</span>
          </div>
          <div className="header-titles">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 className="page-main-title font-sans">Evidence Register</h1>
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
              >
                {dataSource === 'LIVE_BACKEND' ? '● LIVE BACKEND' : dataSource === 'BACKEND_UNAVAILABLE' ? '✕ BACKEND OFFLINE (FIXTURE)' : '○ DEMO / SYNTHETIC'}
              </span>
            </div>
            <p className="page-main-sub font-sans">
              Review, organize, and track verified supporting records and intelligence findings for Case CASE-2026-001.
            </p>
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions-row">
            {onNavigateToReport && (
              <button
                type="button"
                onClick={onNavigateToReport}
                className="btn-secondary-action font-sans"
              >
                Prepare Investigation Report →
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary-action font-sans"
            >
              + Add Evidence Record
            </button>
          </div>

          {/* Compact View Switcher for State Validation */}
          <div className="state-simulator-bar font-sans">
            <span className="sim-label">Status:</span>
            {(['available', 'empty', 'loading', 'error'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setViewState(st)}
                className={`pill-btn ${viewState === st ? 'active' : ''}`}
              >
                {st === 'available' ? `All (${records.length})` : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="evidence-main-content">
        {/* State: LOADING */}
        {viewState === 'loading' && (
          <div className="evidence-state-box font-mono">
            <div className="loading-spinner" />
            <div className="state-title">Retrieving Evidence Register...</div>
            <p className="state-desc">Synchronizing verified records from PostgreSQL and Intelligence Engine repository.</p>
          </div>
        )}

        {/* State: ERROR */}
        {viewState === 'error' && (
          <div className="evidence-state-box font-mono">
            <div className="state-icon-alert">⚠</div>
            <div className="state-title">Evidence Register Retrieval Error</div>
            <p className="state-desc">Failed to connect to primary case evidence repository. Source verification timed out.</p>
            <button type="button" onClick={() => setViewState('available')} className="btn-state-action">
              Retry Connection
            </button>
          </div>
        )}

        {/* State: EMPTY */}
        {viewState === 'empty' && (
          <div className="evidence-state-box font-sans">
            <div className="state-icon-doc">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div className="state-title font-sans">NO EVIDENCE RECORDS</div>
            <p className="state-desc">No investigation evidence has been added to this case.</p>
            <div className="state-actions-row">
              <button
                type="button"
                onClick={() => onNavigateToTransaction && onNavigateToTransaction('0x8ef2a9103c8b7b659fe10938bfe41209b0a124982')}
                className="btn-state-action"
              >
                Return to Transactions →
              </button>
              <button
                type="button"
                onClick={() => onNavigateToGraph && onNavigateToGraph('0x71F9A6809403dE4B07B4f114B5C1089b0A124982')}
                className="btn-state-action"
              >
                Open Graph Workspace →
              </button>
              <button
                type="button"
                onClick={() => setViewState('available')}
                className="btn-state-action primary"
              >
                Load Available Records
              </button>
            </div>
          </div>
        )}

        {/* State: AVAILABLE (Normal Operation) */}
        {viewState === 'available' && (
          <div className="evidence-container">
            {/* 2. Evidence Counts / Summary Metrics */}
            <section className="evidence-summary-grid font-sans">
              <div className="count-card">
                <span className="count-label">TOTAL EVIDENCE</span>
                <span className="count-val">{counts.total}</span>
                <span className="count-sub">Cataloged Records</span>
              </div>
              <div className="count-card">
                <span className="count-label">OBSERVED FACTS</span>
                <span className="count-val text-blue">{counts.observedFacts}</span>
                <span className="count-sub">Direct Source Records</span>
              </div>
              <div className="count-card">
                <span className="count-label">SYSTEM ANALYSIS</span>
                <span className="count-val text-purple">{counts.systemAnalysis}</span>
                <span className="count-sub">Engine Findings</span>
              </div>
              <div className="count-card">
                <span className="count-label">RISK INDICATORS</span>
                <span className="count-val text-amber">{counts.riskIndicators}</span>
                <span className="count-sub">Heuristic Signals</span>
              </div>
              <div className="count-card">
                <span className="count-label">ATTRIBUTION</span>
                <span className="count-val text-indigo">{counts.attributionIndicators}</span>
                <span className="count-sub">Entity Associations</span>
              </div>
              <div className="count-card">
                <span className="count-label">INTERPRETATIONS</span>
                <span className="count-val text-emerald">{counts.investigatorInterpretations}</span>
                <span className="count-sub">Investigator Notes</span>
              </div>
            </section>

            {/* 3. Filter and Search Controls Bar */}
            <section className="evidence-controls-bar font-sans">
              <div className="search-input-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search evidence title, ID, source, transaction, or entity..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
                  className="filter-search-input font-sans"
                />
              </div>

              <div className="filter-select-group font-sans">
                <span className="filter-group-label">Category:</span>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                  className="filter-select"
                >
                  <option value="All">All Categories</option>
                  <option value="OBSERVED_FACT">Observed Fact</option>
                  <option value="SYSTEM_ANALYSIS">System Analysis</option>
                  <option value="ATTRIBUTION_INDICATOR">Attribution Indicator</option>
                  <option value="RISK_INDICATOR">Risk Indicator</option>
                  <option value="INVESTIGATOR_INTERPRETATION">Investigator Interpretation</option>
                </select>

                <span className="filter-group-label" style={{ marginLeft: '6px' }}>Source:</span>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
                  className="filter-select"
                >
                  <option value="All">All Sources</option>
                  <option value="Blockchain">Blockchain Ledger</option>
                  <option value="UPI">UPI Feed</option>
                  <option value="Risk">Risk Engine</option>
                  <option value="VASP">VASP Registry</option>
                  <option value="Geospatial">Geospatial Signal</option>
                  <option value="Investigator">Investigator Note</option>
                </select>

                <span className="filter-group-label" style={{ marginLeft: '6px' }}>Status:</span>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  className="filter-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="REVIEW_REQUIRED">REVIEW REQUIRED</option>
                  <option value="REVIEWED">REVIEWED</option>
                  <option value="INSUFFICIENT_SUPPORT">INSUFFICIENT SUPPORT</option>
                  <option value="DISPUTED">DISPUTED</option>
                </select>

                {(filters.searchQuery || filters.category !== 'All' || filters.source !== 'All' || filters.status !== 'All') && (
                  <button
                    type="button"
                    onClick={() => setFilters({ searchQuery: '', category: 'All', source: 'All', status: 'All', relatedObject: 'All' })}
                    className="btn-clear-filters"
                  >
                    Clear
                  </button>
                )}
              </div>
            </section>

            {/* 4. Main Two-Column Split Layout */}
            <div className="evidence-grid">
              {/* Left Column: Evidence Register (Table) */}
              <div className="evidence-register-col">
                <div className="clean-white-card table-card">
                  <div className="card-top-header">
                    <div>
                      <h3 className="card-title font-sans">Evidence Register</h3>
                      <p className="card-sub-description font-sans">
                        Showing {filteredRecords.length} of {records.length} cataloged investigative records
                      </p>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="evidence-table font-sans">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Category</th>
                          <th>Title &amp; Source</th>
                          <th>Related Object</th>
                          <th>Timestamp</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-muted font-sans">
                              No evidence matches current filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((r) => {
                            const isSelected = r.id === selectedEvidenceId;
                            return (
                              <tr
                                key={r.id}
                                onClick={() => setSelectedEvidenceId(r.id)}
                                className={`table-row ${isSelected ? 'row-selected' : ''}`}
                              >
                                <td className="font-mono td-id">
                                  <span className="id-chip">{r.id}</span>
                                </td>
                                <td>
                                  <span className={`cat-pill font-sans ${getCategoryBadgeClass(r.category)}`}>
                                    {getCategoryLabel(r.category)}
                                  </span>
                                </td>
                                <td>
                                  <div className="title-cell-wrap">
                                    <div className="ev-title font-sans font-medium">{r.title}</div>
                                    <div className="ev-source font-sans">{r.source}</div>
                                  </div>
                                </td>
                                <td>
                                  <div className="object-cell font-mono">
                                    {r.relatedTransactionId ? (
                                      <span className="obj-tag text-blue">{r.relatedTransactionId.slice(0, 14)}...</span>
                                    ) : r.relatedEntityId ? (
                                      <span className="obj-tag text-muted">{r.relatedEntityId}</span>
                                    ) : (
                                      <span className="text-muted">Case Level</span>
                                    )}
                                  </div>
                                </td>
                                <td className="font-sans text-muted text-xs whitespace-nowrap">
                                  {r.timestamp.slice(11, 19)} UTC
                                </td>
                                <td>
                                  <span className={`status-pill font-sans ${getStatusBadgeClass(r.status)}`}>
                                    {getStatusLabel(r.status)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Evidence Detail Inspector */}
              <div className="evidence-inspector-col">
                <section className="clean-white-card inspector-card">
                  {selectedRecord ? (
                    <>
                      <div className="inspector-header">
                        <div className="inspector-top-row">
                          <span className="inspector-id font-mono">{selectedRecord.id}</span>
                          <span className={`cat-pill font-sans ${getCategoryBadgeClass(selectedRecord.category)}`}>
                            {getCategoryLabel(selectedRecord.category)}
                          </span>
                          <span className={`status-pill font-sans ${getStatusBadgeClass(selectedRecord.status)}`}>
                            {getStatusLabel(selectedRecord.status)}
                          </span>
                        </div>
                        <h2 className="inspector-title font-sans">{selectedRecord.title}</h2>
                        <p className="inspector-desc font-sans">{selectedRecord.description}</p>
                      </div>

                      {/* Source Provenance Metadata */}
                      <div className="inspector-section">
                        <div className="section-subtitle">Source Provenance</div>
                        <div className="meta-list font-sans">
                          <div className="meta-row">
                            <span className="meta-label">Source</span>
                            <span className="meta-val font-sans font-medium">{selectedRecord.source}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">Source Type</span>
                            <span className="meta-val font-mono">{selectedRecord.sourceType}</span>
                          </div>
                          {selectedRecord.sourceReference && (
                            <div className="meta-row">
                              <span className="meta-label">Reference</span>
                              <span className="meta-val font-mono text-blue">{selectedRecord.sourceReference}</span>
                            </div>
                          )}
                          <div className="meta-row">
                            <span className="meta-label">Observed At</span>
                            <span className="meta-val font-mono">{selectedRecord.observedAt}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">Ingested At</span>
                            <span className="meta-val font-mono">{selectedRecord.ingestedAt}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">Integrity Status</span>
                            <span className="source-integrity-badge font-sans">
                              {selectedRecord.sourceIntegrity === 'SOURCE_VERIFIED' ? 'Source Verified' : 'Source Available'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Related Objects & Cross-Workspace Actions */}
                      <div className="inspector-section">
                        <div className="section-subtitle">Related Investigative Objects</div>
                        <div className="meta-list font-sans">
                          <div className="meta-row">
                            <span className="meta-label">Case ID</span>
                            <span className="meta-val font-mono">{selectedRecord.caseId}</span>
                          </div>
                          {selectedRecord.relatedTransactionId && (
                            <div className="meta-row">
                              <span className="meta-label">Transaction</span>
                              <span className="meta-val font-mono text-blue">{selectedRecord.relatedTransactionId}</span>
                            </div>
                          )}
                          {selectedRecord.relatedEntityId && (
                            <div className="meta-row">
                              <span className="meta-label">Entity / VPA</span>
                              <span className="meta-val font-mono">{selectedRecord.relatedEntityId}</span>
                            </div>
                          )}
                          {selectedRecord.amount && (
                            <div className="meta-row">
                              <span className="meta-label">Amount</span>
                              <span className="meta-val font-mono font-medium">{selectedRecord.amount}</span>
                            </div>
                          )}
                          {selectedRecord.rail && (
                            <div className="meta-row">
                              <span className="meta-label">Network Rail</span>
                              <span className="meta-val font-sans">{selectedRecord.rail}</span>
                            </div>
                          )}
                        </div>

                        {/* Cross-Workspace Navigation Buttons */}
                        <div className="cross-nav-actions">
                          {selectedRecord.relatedTransactionId && onNavigateToTransaction && (
                            <button
                              type="button"
                              onClick={() => onNavigateToTransaction(selectedRecord.relatedTransactionId!)}
                              className="btn-cross-nav font-sans"
                            >
                              Inspect Transaction →
                            </button>
                          )}
                          {selectedRecord.relatedEntityId && onNavigateToGraph && (
                            <button
                              type="button"
                              onClick={() => onNavigateToGraph(selectedRecord.relatedEntityId)}
                              className="btn-cross-nav font-sans"
                            >
                              View in Graph →
                            </button>
                          )}
                          {selectedRecord.relatedRiskSignalId && onNavigateToRisk && (
                            <button
                              type="button"
                              onClick={onNavigateToRisk}
                              className="btn-cross-nav font-sans"
                            >
                              View Risk →
                            </button>
                          )}
                          {(selectedRecord.rail === 'UPI Domestic' || selectedRecord.sourceType === 'UPI_FEED' || selectedRecord.relatedEntityId?.includes('@')) && onNavigateToUPI && (
                            <button
                              type="button"
                              onClick={onNavigateToUPI}
                              className="btn-cross-nav font-sans"
                            >
                              View UPI Fraud →
                            </button>
                          )}
                          {selectedRecord.category === 'ATTRIBUTION_INDICATOR' && onNavigateToAttribution && (
                            <button
                              type="button"
                              onClick={onNavigateToAttribution}
                              className="btn-cross-nav font-sans"
                            >
                              View Attribution →
                            </button>
                          )}
                          {selectedRecord.relatedLocationId && onNavigateToGeospatial && (
                            <button
                              type="button"
                              onClick={() => onNavigateToGeospatial(selectedRecord.relatedLocationId)}
                              className="btn-cross-nav font-sans"
                            >
                              View Geospatial →
                            </button>
                          )}
                          {onNavigateToDisclosure && (
                            <button
                              type="button"
                              onClick={() => onNavigateToDisclosure(selectedRecord.id)}
                              className="btn-cross-nav font-sans"
                              style={{ color: '#2563eb' }}
                            >
                              Disclosure Requisition →
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Investigator Notes (Distinct Interpretation Section) */}
                      <div className="inspector-section investigator-notes-section">
                        <div className="label-with-badge">
                          <span className="section-subtitle">Investigator Note</span>
                          <span className="note-distinction-badge">Analyst Annotation</span>
                        </div>

                        {isEditingNote ? (
                          <div className="note-editor-wrap">
                            <textarea
                              value={editingNote}
                              onChange={(e) => setEditingNote(e.target.value)}
                              rows={3}
                              className="note-textarea font-sans"
                              placeholder="Enter investigative interpretation or follow-up recommendation..."
                            />
                            <div className="note-actions">
                              <button
                                type="button"
                                onClick={() => setIsEditingNote(false)}
                                className="btn-note-cancel font-sans"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveNote}
                                className="btn-note-save font-sans"
                              >
                                Save Note
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="note-display-box">
                            <p className="note-text font-sans">
                              {selectedRecord.investigatorNotes || 'No investigator interpretation added for this evidence record yet.'}
                            </p>
                            <div className="note-meta-row font-sans">
                              <span className="note-author">
                                {selectedRecord.annotatedBy ? `By: ${selectedRecord.annotatedBy}` : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNote(selectedRecord.investigatorNotes || '');
                                  setIsEditingNote(true);
                                }}
                                className="btn-edit-note font-sans"
                              >
                                {selectedRecord.investigatorNotes ? 'Edit Note' : '+ Add Interpretation'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Lifecycle Modifier */}
                      <div className="inspector-section">
                        <div className="section-subtitle">Status Review</div>
                        <div className="status-selector-row">
                          {(['AVAILABLE', 'REVIEW_REQUIRED', 'REVIEWED', 'INSUFFICIENT_SUPPORT', 'DISPUTED'] as EvidenceStatusType[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleUpdateStatus(st)}
                              className={`btn-status-option font-sans ${selectedRecord.status === st ? 'active' : ''}`}
                            >
                              {getStatusLabel(st)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted font-sans">Select an evidence record to inspect.</div>
                  )}
                </section>
              </div>
            </div>

            {/* 5. Evidence Relationship Architecture */}
            <section className="clean-white-card relationship-card font-sans">
              <div className="card-top-header">
                <div>
                  <h3 className="card-title font-sans">Evidence Relationship Context</h3>
                  <p className="card-sub-description font-sans">
                    Trace from evidentiary record to linked entities, transactions, and analytical domains.
                  </p>
                </div>
              </div>

              <div className="relationship-flow font-sans">
                <div className="rel-node">
                  <span className="rel-tag">1. EVIDENCE RECORD</span>
                  <div className="rel-name font-mono">{selectedRecord.id}</div>
                  <div className="rel-sub">{getCategoryLabel(selectedRecord.category)}</div>
                </div>

                <div className="rel-arrow">→</div>

                <div className="rel-node">
                  <span className="rel-tag">2. TRANSACTION</span>
                  <div className="rel-name font-mono">{selectedRecord.relatedTransactionId || 'TX-UPI-001'}</div>
                  <div className="rel-sub">{selectedRecord.amount || 'Multi-Hop Transfer'}</div>
                </div>

                <div className="rel-arrow">→</div>

                <div className="rel-node">
                  <span className="rel-tag">3. WALLET / VPA</span>
                  <div className="rel-name font-mono">{selectedRecord.relatedEntityId || '0x71F9...89b0A1'}</div>
                  <div className="rel-sub">Subject Entity</div>
                </div>

                <div className="rel-arrow">→</div>

                <div className="rel-node">
                  <span className="rel-tag">4. GRAPH CONTEXT</span>
                  <div className="rel-name font-sans">Multi-Hop Visual Trace</div>
                  <div className="rel-sub font-mono">3 Hops to Peeling Tier</div>
                </div>

                <div className="rel-arrow">→</div>

                <div className="rel-node">
                  <span className="rel-tag">5. DOMAIN</span>
                  <div className="rel-name font-sans">
                    {selectedRecord.category === 'RISK_INDICATOR' ? 'Risk Workspace' :
                     selectedRecord.category === 'ATTRIBUTION_INDICATOR' ? 'VASP Attribution' :
                     selectedRecord.relatedLocationId ? 'Geospatial Intelligence' : 'UPI Fraud Workspace'}
                  </div>
                  <div className="rel-sub font-sans">Corroborated Record</div>
                </div>
              </div>
            </section>

            {/* 6. Chronological Evidence Timeline */}
            <section className="clean-white-card timeline-card font-sans">
              <div className="card-top-header">
                <div>
                  <h3 className="card-title font-sans">Chronological Evidence Timeline</h3>
                  <p className="card-sub-description font-sans">
                    Temporal sequence of observed records and analytical findings for Case CASE-2026-001.
                  </p>
                </div>
              </div>

              <div className="evidence-timeline-track">
                {timelineRecords.map((item) => {
                  const isSelected = item.id === selectedEvidenceId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedEvidenceId(item.id)}
                      className={`timeline-node-card ${isSelected ? 'timeline-selected' : ''}`}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="time-row font-sans">
                        <span className="time-val font-mono">{item.observedAt.slice(11, 19)}</span>
                        <span className="time-date">{item.observedAt.slice(5, 10)}</span>
                      </div>
                      <div className="time-id font-mono">{item.id}</div>
                      <div className="time-title font-medium">{item.title}</div>
                      <div className="time-meta">
                        <span className={`cat-pill font-sans ${getCategoryBadgeClass(item.category)}`}>
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 7. Data Standard & Integrity Banner */}
            <div className="evidence-standard-banner font-sans">
              <span className="standard-tag">INVESTIGATIVE STANDARD & DATA INTEGRITY</span>
              <p>
                TraceVault provides structured evidentiary organization of observed financial records, analytical heuristics, and investigator interpretations.
                Evidence records are cataloged for investigative review and do not constitute automated court certification or legal finality.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Add Evidence Modal */}
      <AddEvidenceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddEvidence={handleAddEvidence}
      />

      <style>{`
        .evidence-workspace-root {
          width: 100%;
          min-height: calc(100vh - 72px);
          background-color: #f8fafc;
          color: #111827;
          display: flex;
          flex-direction: column;
        }

        .evidence-context-header {
          padding: 24px 32px 20px 32px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          flex-wrap: wrap;
          background: #ffffff;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .breadcrumb-link {
          background: none;
          border: none;
          padding: 0;
          color: #2563eb;
          font-size: 13px;
          cursor: pointer;
          font-weight: 500;
        }

        .breadcrumb-link:hover {
          text-decoration: underline;
        }

        .breadcrumb-sep {
          color: #94a3b8;
          font-size: 13px;
        }

        .breadcrumb-current {
          color: #64748b;
          font-weight: 500;
        }

        .header-titles {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .page-main-title {
          font-size: 22px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.02em;
          margin: 0;
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
          color: #111827;
          background: #e2e8f0;
        }

        .pill-btn.active {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #2563eb;
          font-weight: 500;
        }

        .evidence-main-content {
          padding: 24px 32px 48px 32px;
          flex: 1;
        }

        .evidence-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Summary Cards */
        .evidence-summary-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }

        .count-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .count-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        .count-val {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }

        .count-sub {
          font-size: 11.5px;
          color: #64748b;
        }

        /* Controls Bar */
        .evidence-controls-bar {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .search-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 7px 12px;
          flex: 1;
          max-width: 440px;
        }

        .filter-search-input {
          background: transparent;
          border: none;
          outline: none;
          color: #111827;
          font-size: 13px;
          width: 100%;
        }

        .filter-search-input::placeholder {
          color: #94a3b8;
        }

        .filter-select-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-group-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .filter-select {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #111827;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 6px;
          outline: none;
          cursor: pointer;
        }

        .filter-select:focus {
          border-color: #2563eb;
        }

        .btn-clear-filters {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 11.5px;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-clear-filters:hover {
          background: #f1f5f9;
          color: #111827;
        }

        /* Two Column Grid */
        .evidence-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
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
          color: #111827;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .card-sub-description {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }

        /* Table */
        .table-responsive {
          overflow-x: auto;
        }

        .evidence-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .evidence-table th {
          text-align: left;
          padding: 11px 14px;
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .evidence-table td {
          padding: 13px 14px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .table-row {
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .table-row:hover td {
          background-color: #f8fafc;
        }

        .table-row.row-selected td {
          background-color: #eff6ff;
        }

        .id-chip {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #111827;
          font-size: 11.5px;
          padding: 3px 7px;
          border-radius: 6px;
        }

        .title-cell-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-width: 280px;
        }

        .ev-title {
          font-size: 13px;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ev-source {
          font-size: 11.5px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .obj-tag {
          font-size: 12px;
        }

        /* Badges */
        .cat-pill {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 9999px;
          white-space: nowrap;
          display: inline-block;
          font-weight: 500;
        }

        .cat-badge-observed {
          background: #eff6ff;
          color: #2563eb;
        }

        .cat-badge-analysis {
          background: #f5f3ff;
          color: #7c3aed;
        }

        .cat-badge-attribution {
          background: #eef2ff;
          color: #4f46e5;
        }

        .cat-badge-risk {
          background: #fffbeb;
          color: #d97706;
        }

        .cat-badge-interpretation {
          background: #ecfdf5;
          color: #059669;
        }

        .status-pill {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 9999px;
          white-space: nowrap;
          display: inline-block;
          font-weight: 500;
        }

        .status-badge-available {
          background: #ecfdf5;
          color: #059669;
        }

        .status-badge-review-req {
          background: #fffbeb;
          color: #d97706;
        }

        .status-badge-reviewed {
          background: #eff6ff;
          color: #2563eb;
        }

        .status-badge-insufficient {
          background: #f1f5f9;
          color: #64748b;
        }

        .status-badge-disputed {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Inspector */
        .inspector-card {
          position: sticky;
          top: 20px;
        }

        .inspector-header {
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 14px;
          margin-bottom: 14px;
        }

        .inspector-top-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .inspector-id {
          font-size: 12.5px;
          font-weight: 600;
          color: #111827;
        }

        .inspector-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 6px 0;
          line-height: 1.35;
        }

        .inspector-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        .inspector-section {
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 14px;
          margin-bottom: 14px;
        }

        .inspector-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .section-subtitle {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .meta-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          font-size: 12.5px;
        }

        .meta-label {
          font-size: 12px;
          color: #64748b;
          flex-shrink: 0;
        }

        .meta-val {
          color: #111827;
          text-align: right;
          word-break: break-all;
          font-size: 12px;
        }

        .source-integrity-badge {
          font-size: 11px;
          color: #2563eb;
          background: #eff6ff;
          padding: 2px 8px;
          border-radius: 9999px;
          font-weight: 500;
        }

        .cross-nav-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .btn-cross-nav {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #2563eb;
          font-size: 11px;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-cross-nav:hover {
          background: #2563eb;
          color: #ffffff;
        }

        /* Investigator Notes */
        .investigator-notes-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px 16px;
        }

        .label-with-badge {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .note-distinction-badge {
          font-size: 11px;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 500;
        }

        .note-display-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .note-text {
          font-size: 13px;
          color: #334155;
          line-height: 1.5;
          margin: 0;
        }

        .note-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11.5px;
          color: #64748b;
          margin-top: 4px;
        }

        .btn-edit-note {
          background: transparent;
          border: none;
          color: #2563eb;
          font-size: 12px;
          cursor: pointer;
          padding: 0;
          font-weight: 500;
        }

        .btn-edit-note:hover {
          text-decoration: underline;
        }

        .note-editor-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .note-textarea {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #111827;
          font-size: 13px;
          padding: 8px 12px;
          border-radius: 6px;
          outline: none;
        }

        .note-textarea:focus {
          border-color: #2563eb;
        }

        .note-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .btn-note-cancel {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 12px;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-note-save {
          background: #2563eb;
          border: none;
          color: #ffffff;
          font-size: 12px;
          font-weight: 500;
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
        }

        /* Status Lifecycle Selector */
        .status-selector-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .btn-status-option {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 11px;
          padding: 4px 9px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-status-option:hover {
          color: #111827;
          border-color: #cbd5e1;
        }

        .btn-status-option.active {
          background: #eff6ff;
          border-color: #2563eb;
          color: #2563eb;
          font-weight: 600;
        }

        /* Relationship View */
        .relationship-card {
          margin-top: 4px;
        }

        .relationship-flow {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow-x: auto;
          padding: 8px 0;
        }

        .rel-node {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          min-width: 180px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .rel-tag {
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        .rel-name {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rel-sub {
          font-size: 11.5px;
          color: #64748b;
        }

        .rel-arrow {
          color: #94a3b8;
          font-size: 16px;
          font-weight: 500;
        }

        /* Timeline Card */
        .evidence-timeline-track {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .timeline-node-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
          min-width: 200px;
          max-width: 230px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .timeline-node-card:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .timeline-node-card.timeline-selected {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .time-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #64748b;
        }

        .time-val {
          color: #2563eb;
          font-weight: 500;
        }

        .time-id {
          font-size: 11px;
          color: #64748b;
        }

        .time-title {
          font-size: 12.5px;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Standard Banner */
        .evidence-standard-banner {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-left: 3px solid #2563eb;
          border-radius: 8px;
          padding: 16px 20px;
          font-size: 12.5px;
          color: #475569;
          line-height: 1.5;
        }

        .standard-tag {
          font-size: 11px;
          color: #2563eb;
          font-weight: 600;
          letter-spacing: 0.04em;
          display: block;
          margin-bottom: 4px;
        }

        /* State Boxes */
        .evidence-state-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 60px 30px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .state-icon-alert {
          font-size: 28px;
          color: #ef4444;
        }

        .state-icon-doc {
          margin-bottom: 4px;
        }

        .state-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .state-desc {
          font-size: 12.5px;
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
          color: #334155;
          font-size: 12px;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-state-action:hover {
          color: #111827;
          border-color: #cbd5e1;
        }

        .btn-state-action.primary {
          background: #2563eb;
          color: #ffffff;
          font-weight: 600;
          border: none;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(36, 199, 201, 0.2);
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Utility classes */
        .text-cyan { color: #2dd4bf; }
        .text-purple { color: #c084fc; }
        .text-amber { color: #f59e0b; }
        .text-blue { color: #60a5fa; }
        .text-green { color: #4ade80; }
        .text-muted { color: #64748b; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        .font-sans { font-family: 'Inter', -apple-system, sans-serif; }
      `}</style>
    </div>
  );
};
