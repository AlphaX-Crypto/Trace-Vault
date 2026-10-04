import React, { useState, useMemo } from 'react';
import {
  DisclosureRequest,
  DisclosureStatus,
  NewDisclosureRequestInput
} from './disclosureTypes';
import {
  INITIAL_DISCLOSURE_REQUESTS,
  AVAILABLE_EVIDENCE_CATALOG
} from './disclosureData';
import { mockSahyogAdapter } from './sahyogAdapter';
import { CreateDisclosureModal } from './CreateDisclosureModal';
import { api, DataSourceState } from '../../api/client';

export interface DisclosureWorkspaceProps {
  activeCaseId?: string;
  onBack: () => void;
  onNavigateToEvidence?: (evidenceId?: string) => void;
  onNavigateToGraph?: (entityId?: string) => void;
  onNavigateToReport?: () => void;
  onNavigateToVASP?: () => void;
  initialState?: 'available' | 'empty' | 'loading' | 'error';
  prefilledTargetVasp?: string;
  prefilledSubject?: string;
}

export const DisclosureWorkspace: React.FC<DisclosureWorkspaceProps> = ({
  activeCaseId = 'CASE-2026-001',
  onBack,
  onNavigateToEvidence,
  onNavigateToGraph,
  onNavigateToReport,
  onNavigateToVASP,
  initialState = 'available',
  prefilledTargetVasp,
  prefilledSubject
}) => {
  const [viewState, setViewState] = useState<'available' | 'empty' | 'loading' | 'error'>(initialState);
  const [requests, setRequests] = useState<DisclosureRequest[]>(INITIAL_DISCLOSURE_REQUESTS);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('DR-2026-001');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'overview' | 'evidence' | 'payload' | 'response' | 'history'>('overview');
  const [dataSource, setDataSource] = useState<DataSourceState>('DEMO_SYNTHETIC');

  React.useEffect(() => {
    let isMounted = true;
    async function loadDisclosures() {
      try {
        const isHealthy = await api.checkHealth();
        if (!isHealthy) {
          if (isMounted) setDataSource('DEMO_SYNTHETIC');
          return;
        }

        const res = await api.get<any[]>(`/api/cases/${activeCaseId}/disclosure-requests`);
        if (!isMounted) return;

        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const nowIso = new Date().toISOString();
          const mapped: DisclosureRequest[] = res.data.map((r, idx) => ({
            requestId: r.request_id || r.id || `DR-2026-${String(idx + 1).padStart(3, '0')}`,
            caseId: r.case_id || activeCaseId,
            caseTitle: 'Cross-Rail Peeling Chain to Domestic VPA Sweep',
            recipient: r.vasp_name || r.recipient || 'VASP Recipient',
            recipientType: (r.recipient_type as any) || 'VASP',
            subjectIdentifier: r.target_identifier || r.subject_identifier || 'N/A',
            identifierType: (r.subject_type as any) || 'WALLET_ADDRESS',
            requestType: r.request_type || 'Section 91 CrPC Information Request',
            legalBasis: r.legal_basis || 'Sec 91 CrPC',
            requestPurpose: r.purpose || r.request_purpose || 'Information Request under Section 91 CrPC',
            requestedInformation: r.data_requested ? (Array.isArray(r.data_requested) ? r.data_requested : [r.data_requested]) : ['KYC Records', 'Account History'],
            supportingEvidenceIds: r.attached_evidence || ['EV-0001'],
            investigatorNotes: r.notes || undefined,
            status: (r.status?.toUpperCase() as any) || 'DRAFT',
            createdAt: r.created_at || nowIso,
            updatedAt: r.updated_at || nowIso,
            sahyogReference: r.sahyog_reference || undefined,
            history: [
              {
                timestamp: r.created_at || '2026-03-30 10:00 UTC',
                toStatus: (r.status?.toUpperCase() as any) || 'DRAFT',
                actor: 'Inspector Samarth',
                note: 'Requisition initialized in database'
              }
            ]
          }));
          setRequests(mapped);
          setSelectedRequestId(mapped[0]?.requestId || 'DR-2026-001');
          setDataSource('LIVE_BACKEND');
        } else {
          setDataSource('DEMO_SYNTHETIC');
        }
      } catch {
        if (isMounted) setDataSource('BACKEND_UNAVAILABLE');
      }
    }
    loadDisclosures();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [recipientFilter, setRecipientFilter] = useState<string>('All');

  // Notification / toast feedback
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Pre-fill modal if requested from props
  React.useEffect(() => {
    if (prefilledTargetVasp || prefilledSubject) {
      setIsCreateModalOpen(true);
    }
  }, [prefilledTargetVasp, prefilledSubject]);

  // Selected Request
  const selectedRequest = useMemo(() => {
    return requests.find((r) => r.requestId === selectedRequestId) || requests[0] || null;
  }, [requests, selectedRequestId]);

  // Filtered list
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = req.requestId.toLowerCase().includes(q);
        const matchRef = (req.sahyogReference || '').toLowerCase().includes(q);
        const matchRecipient = req.recipient.toLowerCase().includes(q);
        const matchSubject = req.subjectIdentifier.toLowerCase().includes(q);
        const matchPurpose = req.requestPurpose.toLowerCase().includes(q);
        if (!matchId && !matchRef && !matchRecipient && !matchSubject && !matchPurpose) {
          return false;
        }
      }
      if (statusFilter !== 'All' && req.status !== statusFilter) {
        return false;
      }
      if (recipientFilter !== 'All' && req.recipientType !== recipientFilter) {
        return false;
      }
      return true;
    });
  }, [requests, searchQuery, statusFilter, recipientFilter]);

  // Metric counts
  const metrics = useMemo(() => {
    return {
      total: requests.length,
      draft: requests.filter((r) => r.status === 'DRAFT').length,
      underReview: requests.filter((r) => r.status === 'UNDER REVIEW').length,
      ready: requests.filter((r) => r.status === 'READY TO SUBMIT').length,
      submitted: requests.filter((r) => r.status === 'SUBMITTED — SANDBOX').length,
      completed: requests.filter((r) => r.status === 'RESPONSE RECEIVED — SANDBOX').length,
      closed: requests.filter((r) => r.status === 'CLOSED').length
    };
  }, [requests]);

  // Action handlers
  const handleCreateRequest = async (input: NewDisclosureRequestInput) => {
    const created = await mockSahyogAdapter.createDraft(input);
    setRequests((prev) => [created, ...prev]);
    setSelectedRequestId(created.requestId);
    setIsCreateModalOpen(false);
    showNotice(`Created new draft requisition ${created.sahyogReference || created.requestId}`);
  };

  const handleStatusTransition = async (newStatus: DisclosureStatus) => {
    if (!selectedRequest) return;

    if (newStatus === 'SUBMITTED — SANDBOX') {
      const submitted = await mockSahyogAdapter.submitToSandbox(selectedRequest);
      setRequests((prev) => prev.map((r) => (r.requestId === submitted.requestId ? submitted : r)));
      showNotice(`Requisition ${submitted.sahyogReference} successfully dispatched to SAHYOG Sandbox adapter.`);
      return;
    }

    if (newStatus === 'RESPONSE RECEIVED — SANDBOX') {
      const withResponse = await mockSahyogAdapter.simulateResponse(selectedRequest);
      setRequests((prev) => prev.map((r) => (r.requestId === withResponse.requestId ? withResponse : r)));
      setActiveInspectorTab('response');
      showNotice(`Simulated response received for ${withResponse.sahyogReference || withResponse.requestId}.`);
      return;
    }

    const updated = await mockSahyogAdapter.updateStatus(
      selectedRequest,
      newStatus,
      `Status updated to ${newStatus} by Investigator Samarth`
    );
    setRequests((prev) => prev.map((r) => (r.requestId === updated.requestId ? updated : r)));
    showNotice(`Requisition updated to: ${newStatus}`);
  };

  const getStatusBadgeClass = (status: DisclosureStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'status-pill-neutral';
      case 'UNDER REVIEW':
        return 'status-pill-warning';
      case 'READY TO SUBMIT':
        return 'status-pill-accent';
      case 'SUBMITTED — SANDBOX':
        return 'status-pill-success';
      case 'RESPONSE RECEIVED — SANDBOX':
        return 'status-pill-purple';
      case 'CLOSED':
        return 'status-pill-neutral';
      default:
        return 'status-pill-neutral';
    }
  };

  return (
    <div className="disclosure-workspace font-sans">
      {/* 1. Header Navigation & Breadcrumb */}
      <header className="disclosure-header">
        <div className="breadcrumb-nav font-mono">
          <button type="button" onClick={onBack} className="bc-btn font-mono">
            Cases
          </button>
          <span className="bc-sep">/</span>
          <span className="bc-item">CASE-2026-001</span>
          <span className="bc-sep">/</span>
          <span className="bc-current">Disclosure</span>
        </div>

        <div className="header-title-row">
          <div className="title-group">
            <div className="title-badges-inline">
              <h1 className="page-title font-sans">Disclosure / SAHYOG</h1>
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
              <span className="status-pill-neutral font-mono">SAHYOG SANDBOX</span>
              <span className="status-pill-neutral font-mono">MOCK ADAPTER</span>
            </div>
            <p className="page-subtitle font-sans">
              Prepare and track authorized information disclosure requests associated with this investigation.
            </p>
          </div>

          <div className="header-actions font-sans">
            {onNavigateToEvidence && (
              <button
                type="button"
                onClick={() => onNavigateToEvidence()}
                className="btn-secondary-action font-sans"
              >
                Review Evidence →
              </button>
            )}
            {onNavigateToGraph && (
              <button
                type="button"
                onClick={() => onNavigateToGraph('0x71F9A6809403dE4B07B4f114B5C1089b0A124982')}
                className="btn-secondary-action font-sans"
              >
                Open Trace Graph →
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary-action font-sans"
            >
              + Create Disclosure Request
            </button>

            {/* State Simulator */}
            <div className="state-simulator-bar">
              <span className="sim-label font-mono">STATUS:</span>
              {(['available', 'empty', 'loading', 'error'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`pill-btn font-mono ${viewState === st ? 'active' : ''}`}
                  onClick={() => setViewState(st)}
                >
                  {st === 'available' ? 'Available (3)' : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="toast-notification font-mono">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="toast-close-btn">
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="disclosure-main-content">
        {/* STATE: LOADING */}
        {viewState === 'loading' && (
          <section className="state-card loading-state-card" aria-live="polite">
            <div className="loading-content">
              <span className="status-pill-neutral font-mono">ADAPTER SYNCHRONIZATION</span>
              <h2 className="loading-title font-sans">Synchronizing Disclosure Requisitions...</h2>
              <p className="loading-step-text font-mono">
                Querying disclosure_requests table and SAHYOG sandbox adapter registry...
              </p>
              <div className="linear-progress-track">
                <div className="linear-progress-fill" style={{ width: '65%' }} />
              </div>
              <div className="loading-meta-info font-mono">
                <span>Case: CASE-2026-001</span>
                <span>Adapter: MOCK_SAHYOG_SANDBOX_ADAPTER_V2</span>
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
            <h2 className="error-title font-sans">Failed to Synchronize SAHYOG Sandbox Adapter</h2>
            <p className="error-desc font-sans">
              Simulation connection to the mock SAHYOG sandbox adapter timed out. Recheck local RPC or retry simulation.
            </p>
            <div className="error-actions font-sans">
              <button type="button" onClick={() => setViewState('available')} className="btn-primary-action font-sans">
                Retry Connection
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <span className="status-pill-neutral font-mono">NO REQUISITIONS FILED</span>
              <h2 className="empty-headline font-sans">No information disclosure requests filed for this case</h2>
              <p className="empty-subtext font-sans">
                No disclosure requisitions have been drafted for Case CASE-2026-001 yet. Create a draft requisition to request subscriber KYC or deposit telemetry from candidate VASPs or financial institutions.
              </p>
              <div className="empty-action-group font-sans">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary-action font-sans"
                >
                  + Create First Disclosure Request
                </button>
                {onNavigateToVASP && (
                  <button
                    type="button"
                    onClick={onNavigateToVASP}
                    className="btn-secondary-action font-sans"
                  >
                    Review VASP Attribution →
                  </button>
                )}
              </div>
              <div className="empty-heuristics-note font-sans">
                <div className="note-title font-mono">INVESTIGATIVE STANDARD</div>
                <p>
                  Legal authority must be determined and validated by the authorized investigator or competent authority. TRACEVAULT does not determine legal admissibility or issue unilateral requisitions.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* STATE: AVAILABLE */}
        {viewState === 'available' && (
          <div className="disclosure-content-container">
            {/* Prominent Sandbox & Legal Notice Banner */}
            <div className="disclosure-notice-banner font-sans">
              <div className="notice-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="notice-text">
                <span className="font-mono notice-tag">SAHYOG SANDBOX ENVIRONMENT:</span> This workspace simulates the information disclosure requisition workflow via a simulated SAHYOG adapter for demonstration purposes. It does not connect to live government servers or production VASP APIs.{' '}
                <span className="notice-legal">
                  Legal authority must be determined and validated by the authorized investigator or competent authority.
                </span>
              </div>
            </div>

            {/* Top Metric Summary Strip */}
            <section className="disclosure-metrics-strip font-sans" aria-label="Disclosure Summary Metrics">
              <div className="metric-box">
                <span className="m-label font-mono">TOTAL REQUISITIONS</span>
                <span className="m-val font-mono">{metrics.total}</span>
                <span className="m-sub">Requisition Records</span>
              </div>
              <div className="metric-box">
                <span className="m-label font-mono">DRAFT</span>
                <span className="m-val font-mono">{metrics.draft}</span>
                <span className="m-sub">Pending Review</span>
              </div>
              <div className="metric-box">
                <span className="m-label font-mono">UNDER REVIEW</span>
                <span className="m-val font-mono text-warning">{metrics.underReview}</span>
                <span className="m-sub">Secondary Verification</span>
              </div>
              <div className="metric-box">
                <span className="m-label font-mono">READY TO SUBMIT</span>
                <span className="m-val font-mono text-accent">{metrics.ready}</span>
                <span className="m-sub">Validated for Sandbox</span>
              </div>
              <div className="metric-box">
                <span className="m-label font-mono">SUBMITTED (SANDBOX)</span>
                <span className="m-val font-mono text-success">{metrics.submitted}</span>
                <span className="m-sub">Dispatched to Sandbox</span>
              </div>
              <div className="metric-box">
                <span className="m-label font-mono">RESPONSE RECEIVED</span>
                <span className="m-val font-mono text-purple">{metrics.completed}</span>
                <span className="m-sub">Simulated Receipt</span>
              </div>
            </section>

            {/* Filter and Search Bar */}
            <div className="disclosure-filter-strip font-sans">
              <div className="filter-group">
                <div className="search-input-wrapper" style={{ width: '220px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" className="search-icon">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search requests..."
                    className="search-input font-sans"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="search-clear-btn">
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="filter-divider" />

              <div className="filter-group">
                <span className="filter-label font-mono">Status:</span>
                {['All', 'DRAFT', 'UNDER REVIEW', 'READY TO SUBMIT', 'SUBMITTED — SANDBOX'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`filter-btn ${statusFilter === st ? 'active' : ''}`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st === 'All' ? 'All Statuses' : st.replace(' — SANDBOX', '')}
                  </button>
                ))}
              </div>

              <div className="filter-divider" />

              <div className="filter-group">
                <span className="filter-label font-mono">Recipient:</span>
                {['All', 'VASP', 'FINANCIAL_INSTITUTION'].map((rc) => (
                  <button
                    key={rc}
                    type="button"
                    className={`filter-btn ${recipientFilter === rc ? 'active' : ''}`}
                    onClick={() => setRecipientFilter(rc)}
                  >
                    {rc === 'All' ? 'All Types' : rc === 'VASP' ? 'VASP' : 'Financial / Bank'}
                  </button>
                ))}
              </div>

              <div className="filter-count-badge font-mono">
                {filteredRequests.length} of {requests.length} Requests
              </div>
            </div>

            {/* PRIMARY WORKSPACE GRID: Registry Table (58%) on Left, Inspector (42%) on Right */}
            <div className="disclosure-primary-grid">
              {/* Left Column: Requisition Registry Table */}
              <div className="content-card registry-card font-sans">
                <div className="card-header-clean">
                  <div>
                    <h3 className="card-title font-sans">Disclosure Requisition Registry</h3>
                    <p className="card-subtitle font-sans">
                      Structured information requests associated with this investigation.
                    </p>
                  </div>
                  <span className="status-pill-neutral font-mono">{filteredRequests.length} Requisitions</span>
                </div>

                {filteredRequests.length === 0 ? (
                  <div className="registry-empty-msg font-mono">
                    No disclosure requests match current search/filter parameters.
                  </div>
                ) : (
                  <div className="registry-table-wrapper">
                    <table className="registry-table font-sans">
                      <thead>
                        <tr>
                          <th className="font-mono">REQUEST ID</th>
                          <th className="font-mono">RECIPIENT</th>
                          <th className="font-mono">SUBJECT</th>
                          <th className="font-mono">STATUS</th>
                          <th className="font-mono">UPDATED</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((req) => {
                          const isSelected = selectedRequest?.requestId === req.requestId;
                          return (
                            <tr
                              key={req.requestId}
                              className={`registry-row ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedRequestId(req.requestId)}
                              role="button"
                              tabIndex={0}
                            >
                              <td>
                                <div className="req-id-box">
                                  <span className="req-id font-mono">{req.requestId}</span>
                                  {req.sahyogReference && (
                                    <span className="req-ref-tag font-mono">
                                      {req.sahyogReference}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="recipient-name font-sans">{req.recipient}</div>
                                <span className="recipient-type font-mono">{req.recipientType}</span>
                              </td>
                              <td>
                                <div className="subject-id font-mono" title={req.subjectIdentifier}>
                                  {req.subjectIdentifier.length > 18
                                    ? `${req.subjectIdentifier.slice(0, 8)}...${req.subjectIdentifier.slice(-6)}`
                                    : req.subjectIdentifier}
                                </div>
                                <span className="subject-type font-mono">{req.identifierType}</span>
                              </td>
                              <td>
                                <span className={`${getStatusBadgeClass(req.status)} font-mono`}>
                                  {req.status.replace(' — SANDBOX', '')}
                                </span>
                              </td>
                              <td>
                                <span className="time-val font-mono">{req.updatedAt.slice(0, 16)}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: Requisition Inspector Panel */}
              {selectedRequest && (
                <div className="content-card inspector-card font-sans">
                  {/* Top Inspector Header */}
                  <div className="inspector-header">
                    <div>
                      <span className="inspector-badge-label font-mono">REQUEST INSPECTOR</span>
                      <h3 className="inspector-title font-sans">
                        {selectedRequest.recipient}
                      </h3>
                      <div className="inspector-meta font-mono">
                        <span className="meta-id">{selectedRequest.requestId}</span>
                        {selectedRequest.sahyogReference && (
                          <>
                            <span className="dot-sep">•</span>
                            <span className="meta-ref">{selectedRequest.sahyogReference}</span>
                          </>
                        )}
                        <span className="dot-sep">•</span>
                        <span>Case: {selectedRequest.caseId}</span>
                      </div>
                    </div>
                    <span className={`${getStatusBadgeClass(selectedRequest.status)} font-mono`}>
                      {selectedRequest.status}
                    </span>
                  </div>

                  {/* Workflow State Progression Bar & Actions */}
                  <div className="workflow-action-box font-sans">
                    <div className="workflow-steps-line font-mono">
                      <span className={`wf-step ${selectedRequest.status === 'DRAFT' ? 'current' : 'done'}`}>
                        Draft
                      </span>
                      <span className="wf-arrow">→</span>
                      <span className={`wf-step ${selectedRequest.status === 'UNDER REVIEW' ? 'current' : selectedRequest.status === 'DRAFT' ? '' : 'done'}`}>
                        Review
                      </span>
                      <span className="wf-arrow">→</span>
                      <span className={`wf-step ${selectedRequest.status === 'READY TO SUBMIT' ? 'current' : ['DRAFT', 'UNDER REVIEW'].includes(selectedRequest.status) ? '' : 'done'}`}>
                        Ready
                      </span>
                      <span className="wf-arrow">→</span>
                      <span className={`wf-step ${selectedRequest.status === 'SUBMITTED — SANDBOX' ? 'current' : selectedRequest.status === 'RESPONSE RECEIVED — SANDBOX' || selectedRequest.status === 'CLOSED' ? 'done' : ''}`}>
                        Sandbox
                      </span>
                      <span className="wf-arrow">→</span>
                      <span className={`wf-step ${selectedRequest.status === 'RESPONSE RECEIVED — SANDBOX' ? 'current' : selectedRequest.status === 'CLOSED' ? 'done' : ''}`}>
                        Response
                      </span>
                    </div>

                    <div className="workflow-buttons-row">
                      {selectedRequest.status === 'DRAFT' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusTransition('UNDER REVIEW')}
                            className="btn-primary-action font-sans"
                          >
                            Submit for Review →
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusTransition('READY TO SUBMIT')}
                            className="btn-secondary-action font-sans"
                          >
                            Mark Ready to Submit
                          </button>
                        </>
                      )}

                      {selectedRequest.status === 'UNDER REVIEW' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusTransition('DRAFT')}
                            className="btn-secondary-action font-sans"
                          >
                            Return to Draft
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusTransition('READY TO SUBMIT')}
                            className="btn-primary-action font-sans"
                          >
                            Approve & Mark Ready →
                          </button>
                        </>
                      )}

                      {selectedRequest.status === 'READY TO SUBMIT' && (
                        <button
                          type="button"
                          onClick={() => handleStatusTransition('SUBMITTED — SANDBOX')}
                          className="btn-primary-action font-sans"
                        >
                          Dispatch to SAHYOG Sandbox →
                        </button>
                      )}

                      {selectedRequest.status === 'SUBMITTED — SANDBOX' && (
                        <button
                          type="button"
                          onClick={() => handleStatusTransition('RESPONSE RECEIVED — SANDBOX')}
                          className="btn-purple-action font-sans"
                        >
                          Simulate Sandbox Response →
                        </button>
                      )}

                      {selectedRequest.status === 'RESPONSE RECEIVED — SANDBOX' && (
                        <button
                          type="button"
                          onClick={() => handleStatusTransition('CLOSED')}
                          className="btn-secondary-action font-sans"
                        >
                          Close Requisition
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inspector Tabs Bar */}
                  <div className="inspector-tabs-bar font-sans">
                    {[
                      { key: 'overview', label: 'Details' },
                      { key: 'evidence', label: `Evidence (${selectedRequest.supportingEvidenceIds.length})` },
                      { key: 'payload', label: 'Sandbox Envelope' },
                      {
                        key: 'response',
                        label: selectedRequest.sandboxResponse ? 'Sandbox Response' : 'Response',
                        highlight: !!selectedRequest.sandboxResponse
                      },
                      { key: 'history', label: `Audit Log (${selectedRequest.history.length})` }
                    ].map((tab) => {
                      const isActive = activeInspectorTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveInspectorTab(tab.key as any)}
                          className={`inspector-tab-btn ${isActive ? 'active' : ''} ${tab.highlight ? 'highlight' : ''}`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab 1: Overview */}
                  {activeInspectorTab === 'overview' && (
                    <div className="inspector-tab-content font-sans">
                      {/* Subject Identification Table */}
                      <div className="inspector-details-table">
                        <div className="detail-row">
                          <span className="detail-label font-mono">Subject Identifier</span>
                          <span className="detail-value font-mono">{selectedRequest.subjectIdentifier}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label font-mono">Identifier Type</span>
                          <span className="detail-value font-mono">{selectedRequest.identifierType}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label font-mono">Recipient Entity</span>
                          <span className="detail-value font-sans">{selectedRequest.recipient} ({selectedRequest.recipientType})</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label font-mono">Requisition Scope</span>
                          <span className="detail-value font-sans">{selectedRequest.requestType}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label font-mono">Created Timestamp</span>
                          <span className="detail-value font-mono">{selectedRequest.createdAt}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label font-mono">Last Updated</span>
                          <span className="detail-value font-mono">{selectedRequest.updatedAt}</span>
                        </div>
                      </div>

                      {/* Legal Authority Basis */}
                      <div className="inspector-box law-box">
                        <span className="box-label font-mono">STATUTORY / LEGAL AUTHORITY BASIS</span>
                        <div className="law-badge-val font-mono">{selectedRequest.legalBasis}</div>
                        <p className="box-text font-sans" style={{ marginTop: '6px' }}>
                          Legal authority must be determined and validated by the authorized investigator or competent authority. TRACEVAULT prepares structured requisition envelopes based on investigator selection.
                        </p>
                      </div>

                      {/* Request Purpose */}
                      <div className="inspector-box purpose-box">
                        <span className="box-label font-mono">INVESTIGATIVE PURPOSE & RATIONALE</span>
                        <p className="box-text font-sans">{selectedRequest.requestPurpose}</p>
                      </div>

                      {/* Requested Information Inventory */}
                      <div className="inspector-box info-box">
                        <span className="box-label font-mono">REQUESTED INFORMATION INVENTORY</span>
                        <div className="requested-items-list">
                          {selectedRequest.requestedInformation.map((info, idx) => (
                            <div key={idx} className="requested-item-row font-sans">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>{info}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Supporting Evidence */}
                  {activeInspectorTab === 'evidence' && (
                    <div className="inspector-tab-content font-sans">
                      <div className="evidence-tab-header">
                        <span className="font-mono text-muted">
                          Supporting verified case material linked to this requisition:
                        </span>
                        {onNavigateToEvidence && (
                          <button
                            type="button"
                            onClick={() => onNavigateToEvidence()}
                            className="btn-text-link font-sans"
                          >
                            Open Full Evidence Register →
                          </button>
                        )}
                      </div>

                      {selectedRequest.supportingEvidenceIds.length === 0 ? (
                        <div className="empty-sub-card font-mono">
                          No evidence records attached to this requisition.
                        </div>
                      ) : (
                        <div className="evidence-list-stack">
                          {selectedRequest.supportingEvidenceIds.map((evId) => {
                            const evCatalog = AVAILABLE_EVIDENCE_CATALOG.find((e) => e.id === evId);
                            return (
                              <div key={evId} className="evidence-entry-card">
                                <div className="ev-entry-top">
                                  <div className="ev-entry-badges">
                                    <span className="ev-entry-id font-mono">{evId}</span>
                                    {evCatalog && (
                                      <span className="status-pill-neutral font-mono">
                                        {evCatalog.category}
                                      </span>
                                    )}
                                    {evCatalog && (
                                      <span className="ev-rail-tag font-mono">
                                        Rail: {evCatalog.rail}
                                      </span>
                                    )}
                                  </div>
                                  {onNavigateToEvidence && (
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToEvidence(evId)}
                                      className="btn-secondary-action font-sans"
                                      style={{ padding: '4px 8px', fontSize: '11px' }}
                                    >
                                      View Item →
                                    </button>
                                  )}
                                </div>
                                <div className="ev-entry-title font-sans">
                                  {evCatalog?.title || `Evidence Item ${evId}`}
                                </div>
                                <div className="ev-entry-summary font-sans">
                                  {evCatalog?.summary || 'Supporting verified material record in case dossier.'}
                                </div>
                                <div className="ev-entry-source font-mono">
                                  Source: {evCatalog?.source || 'Case Record'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: SAHYOG Sandbox Envelope */}
                  {activeInspectorTab === 'payload' && (
                    <div className="inspector-tab-content font-sans">
                      <div className="inspector-box payload-meta-box">
                        <span className="box-label font-mono">DIGITAL ENVELOPE METADATA (SIMULATED SAHYOG PROTOCOL)</span>
                        <div className="payload-meta-grid font-sans">
                          <div className="p-meta-item">
                            <span className="p-label font-mono">Schema:</span>
                            <span className="p-val font-mono">sahyog.disclosure.req.v1.2-sandbox</span>
                          </div>
                          <div className="p-meta-item">
                            <span className="p-label font-mono">Payload Integrity Digest:</span>
                            <span className="p-val font-mono text-accent">sha256:4f89d3a0112c8b7e28a9bcf339a041f021e87d002f10d481b7a2d48c0a87f49e</span>
                          </div>
                          <div className="p-meta-item">
                            <span className="p-label font-mono">Adapter Mode:</span>
                            <span className="p-val font-mono text-warning">MOCK_SAHYOG_SANDBOX_ADAPTER_V2</span>
                          </div>
                          <div className="p-meta-item">
                            <span className="p-label font-mono">Endpoint:</span>
                            <span className="p-val font-mono">https://sandbox-gateway.sahyog.local/v1/requisition/submit</span>
                          </div>
                        </div>
                      </div>

                      <div className="code-viewer-container">
                        <div className="code-viewer-header font-mono">
                          <span>STANDARDIZED SIMULATED REQUISITION PAYLOAD</span>
                          <span className="status-pill-neutral">SANDBOX PAYLOAD</span>
                        </div>
                        <pre className="code-viewer-body font-mono">
                          {JSON.stringify(
                            {
                              envelopeHeader: {
                                standard: 'SAHYOG_DISCLOSURE_REQUEST',
                                protocolVersion: '1.2-SANDBOX',
                                environment: 'SANDBOX_SIMULATION',
                                referenceId: selectedRequest.sahyogReference || `SANDBOX-${selectedRequest.requestId}`,
                                generatedAt: selectedRequest.updatedAt,
                                submittingApplication: 'TRACEVAULT Investigation Platform'
                              },
                              requisitionBody: {
                                caseReference: selectedRequest.caseId,
                                recipientEntity: {
                                  name: selectedRequest.recipient,
                                  type: selectedRequest.recipientType,
                                  routingCode: `IN-SANDBOX-${selectedRequest.recipientType}-01`
                                },
                                targetSubject: {
                                  identifierValue: selectedRequest.subjectIdentifier,
                                  identifierType: selectedRequest.identifierType
                                },
                                legalAuthorization: {
                                  statutoryBasis: selectedRequest.legalBasis,
                                  investigativeRationale: selectedRequest.requestPurpose
                                },
                                requestedInformationCatalog: selectedRequest.requestedInformation,
                                supportingEvidenceIndex: selectedRequest.supportingEvidenceIds
                              }
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Sandbox Response */}
                  {activeInspectorTab === 'response' && (
                    <div className="inspector-tab-content font-sans">
                      {!selectedRequest.sandboxResponse ? (
                        <div className="empty-sub-card font-mono">
                          <p style={{ margin: '0 0 12px 0' }}>
                            No response received yet. Requisition is currently in status: <strong>{selectedRequest.status}</strong>.
                          </p>
                          {selectedRequest.status === 'SUBMITTED — SANDBOX' && (
                            <button
                              type="button"
                              onClick={() => handleStatusTransition('RESPONSE RECEIVED — SANDBOX')}
                              className="btn-purple-action font-sans"
                            >
                              Simulate Sandbox Response Now →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="response-stack">
                          <div className="inspector-box response-meta-box">
                            <div className="response-header-row">
                              <span className="box-label font-mono text-purple">
                                SAHYOG SANDBOX RESPONSE SUMMARY (SIMULATED)
                              </span>
                              <span className="status-pill-success font-mono">
                                {selectedRequest.sandboxResponse.sandboxStatus}
                              </span>
                            </div>

                            <div className="inspector-details-table" style={{ borderTop: 'none', margin: 0 }}>
                              <div className="detail-row">
                                <span className="detail-label font-mono">Response Reference</span>
                                <span className="detail-value font-mono">{selectedRequest.sandboxResponse.referenceId}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label font-mono">Timestamp</span>
                                <span className="detail-value font-mono">{selectedRequest.sandboxResponse.timestamp}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label font-mono">Adapter Identifier</span>
                                <span className="detail-value font-mono text-accent">{selectedRequest.sandboxResponse.adapterIdentifier}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label font-mono">Simulated Retention</span>
                                <span className="detail-value font-mono">{selectedRequest.sandboxResponse.simulatedRetentionDays} days</span>
                              </div>
                            </div>

                            <div className="response-remarks-box font-sans">
                              <span className="remarks-label font-mono">MOCK RECIPIENT REMARKS:</span>
                              <p>{selectedRequest.sandboxResponse.acknowledgmentMessage}</p>
                            </div>
                          </div>

                          {/* Disclosed Fields Breakdown */}
                          <div className="inspector-box artifacts-box">
                            <div className="artifacts-header">
                              <span className="box-label font-mono">
                                DISCLOSED DATA ARTIFACTS (SIMULATED RESPONSE)
                              </span>
                              <span className="status-pill-warning font-mono">NOT A REAL VASP RESPONSE</span>
                            </div>
                            <div className="artifacts-grid font-sans">
                              <div className="artifact-item">
                                <span className="art-label font-mono">ACCOUNT HOLDER</span>
                                <span className="art-val font-mono">R**** K**** (Simulated KYC Profile)</span>
                              </div>
                              <div className="artifact-item">
                                <span className="art-label font-mono">REGISTERED PHONE</span>
                                <span className="art-val font-mono">+91 98765 ***** (Masked Telecom Telemetry)</span>
                              </div>
                              <div className="artifact-item">
                                <span className="art-label font-mono">KYC STATUS</span>
                                <span className="art-val font-mono text-success">VERIFIED (PAN & Aadhaar OVD Matched)</span>
                              </div>
                              <div className="artifact-item">
                                <span className="art-label font-mono">LINKED BANK ACCOUNT</span>
                                <span className="art-val font-mono">HDFC Bank A/C ...8901 (IFSC: HDFC0000123)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 5: Chronological Audit Log */}
                  {activeInspectorTab === 'history' && (
                    <div className="inspector-tab-content font-sans">
                      <div className="audit-sub-header font-mono">
                        Chronological requisition lifecycle and application audit log:
                      </div>
                      <div className="audit-timeline-stack">
                        {selectedRequest.history.map((h, i) => (
                          <div key={i} className="audit-item-row font-sans">
                            <div className="audit-top-line">
                              <span className={`${getStatusBadgeClass(h.toStatus)} font-mono`}>
                                {h.toStatus}
                              </span>
                              <span className="audit-actor font-mono">• {h.actor}</span>
                              <span className="audit-time font-mono">{h.timestamp.slice(0, 16)}</span>
                            </div>
                            <p className="audit-note font-sans">{h.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cross-Workspace Action Buttons */}
                  <div className="inspector-actions-footer font-sans">
                    {onNavigateToGraph && (
                      <button
                        type="button"
                        onClick={() => onNavigateToGraph('0x71F9A6809403dE4B07B4f114B5C1089b0A124982')}
                        className="btn-secondary-action font-sans"
                      >
                        Inspect in Trace Graph →
                      </button>
                    )}
                    {onNavigateToEvidence && (
                      <button
                        type="button"
                        onClick={() => onNavigateToEvidence()}
                        className="btn-secondary-action font-sans"
                      >
                        Review Case Evidence →
                      </button>
                    )}
                    {onNavigateToReport && (
                      <button
                        type="button"
                        onClick={onNavigateToReport}
                        className="btn-secondary-action font-sans"
                      >
                        Open Reports →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Disclosure Modal */}
      <CreateDisclosureModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRequest}
        initialData={{
          caseId: 'CASE-2026-001',
          recipient: prefilledTargetVasp || 'Example Exchange',
          recipientType: prefilledTargetVasp?.includes('Bank') ? 'FINANCIAL_INSTITUTION' : 'VASP',
          subjectIdentifier: prefilledSubject || '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
          identifierType: prefilledSubject?.includes('@') ? 'UPI_VPA' : 'WALLET_ADDRESS'
        }}
        onNavigateToEvidence={onNavigateToEvidence}
      />

      <style>{`
        /* 1. Root & Shell */
        .disclosure-workspace {
          min-height: 100vh;
          background: #F8FAFC;
          color: #0F172A;
          display: flex;
          flex-direction: column;
        }

        /* 2. Header & Breadcrumbs */
        .disclosure-header {
          background: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          padding: 20px 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #64748B;
        }

        .bc-item {
          color: #64748B;
        }

        .bc-btn {
          background: transparent;
          border: none;
          padding: 0;
          color: #64748B;
          cursor: pointer;
          font-size: 12px;
          transition: color 0.15s ease;
        }

        .bc-btn:hover {
          color: #0F172A;
        }

        .bc-sep {
          color: #CBD5E1;
        }

        .bc-current {
          color: #0F172A;
          font-weight: 600;
        }

        .header-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          flex-wrap: wrap;
        }

        .title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .title-badges-inline {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .page-title {
          font-size: 22px;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .page-subtitle {
          font-size: 13.5px;
          color: #64748B;
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
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

        .btn-purple-action {
          background: #7C3AED;
          color: #FFFFFF;
          border: 1px solid #7C3AED;
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

        .btn-purple-action:hover {
          background: #6D28D9;
          border-color: #6D28D9;
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

        .btn-text-link {
          background: transparent;
          border: none;
          color: #0284C7;
          font-size: 12px;
          cursor: pointer;
          text-decoration: underline;
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

        .toast-close-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          font-size: 14px;
        }

        /* 3. Main Content Container */
        .disclosure-main-content {
          padding: 24px 32px 48px 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .disclosure-content-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Notice Banner */
        .disclosure-notice-banner {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .notice-icon {
          color: #0284C7;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notice-text {
          font-size: 12.5px;
          color: #1E3A8A;
          line-height: 1.45;
        }

        .notice-tag {
          font-weight: 700;
          margin-right: 6px;
        }

        .notice-legal {
          font-weight: 600;
          color: #1E40AF;
        }

        /* 4. Metrics Summary Strip */
        .disclosure-metrics-strip {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
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
          font-size: 18px;
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

        .text-accent {
          color: #0284C7 !important;
        }

        .text-success {
          color: #15803D !important;
        }

        .text-purple {
          color: #7C3AED !important;
        }

        /* 5. Filter Strip */
        .disclosure-filter-strip {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          background: #F8FAFC;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          padding: 6px 30px 6px 32px;
          font-size: 12.5px;
          color: #0F172A;
          outline: none;
        }

        .search-input:focus {
          border-color: #0284C7;
          background: #FFFFFF;
        }

        .search-clear-btn {
          position: absolute;
          right: 8px;
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          font-size: 12px;
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

        .filter-count-badge {
          margin-left: auto;
          font-size: 11.5px;
          color: #64748B;
        }

        /* 6. Primary Grid */
        .disclosure-primary-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(420px, 1fr);
          gap: 20px;
          align-items: start;
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

        .status-pill-accent {
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          background: #E0F2FE;
          color: #0369A1;
          border: 1px solid #BAE6FD;
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

        .status-pill-purple {
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          background: #EDE9FE;
          color: #5B21B6;
          border: 1px solid #DDD6FE;
          white-space: nowrap;
        }

        /* 7. Registry Table */
        .registry-table-wrapper {
          overflow-x: auto;
        }

        .registry-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
        }

        .registry-table th {
          text-align: left;
          padding: 10px 12px;
          background: #F8FAFC;
          color: #64748B;
          font-size: 11px;
          font-weight: 600;
          border-bottom: 1px solid #E2E8F0;
          white-space: nowrap;
        }

        .registry-table td {
          padding: 12px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
        }

        .registry-row {
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .registry-row:hover {
          background: #F8FAFC;
        }

        .registry-row.selected {
          background: #F0F9FF;
        }

        .req-id-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .req-id {
          font-weight: 700;
          color: #0F172A;
          font-size: 12px;
        }

        .registry-row.selected .req-id {
          color: #0284C7;
        }

        .req-ref-tag {
          font-size: 10px;
          color: #0284C7;
          background: #E0F2FE;
          padding: 1px 5px;
          border-radius: 3px;
          width: fit-content;
        }

        .recipient-name {
          font-weight: 600;
          color: #0F172A;
          font-size: 13px;
        }

        .recipient-type {
          font-size: 10.5px;
          color: #64748B;
        }

        .subject-id {
          font-size: 12px;
          color: #334155;
        }

        .subject-type {
          font-size: 10.5px;
          color: #64748B;
        }

        .time-val {
          font-size: 11px;
          color: #64748B;
        }

        .registry-empty-msg {
          padding: 30px;
          text-align: center;
          color: #64748B;
          font-size: 12px;
        }

        /* 8. Inspector Card */
        .inspector-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding-bottom: 14px;
          border-bottom: 1px solid #F1F5F9;
          margin-bottom: 14px;
        }

        .inspector-badge-label {
          font-size: 10px;
          font-weight: 600;
          color: #64748B;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 2px;
        }

        .inspector-title {
          font-size: 17px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 3px 0;
        }

        .inspector-meta {
          font-size: 11px;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .meta-id {
          font-weight: 600;
          color: #0284C7;
        }

        .meta-ref {
          color: #64748B;
        }

        .dot-sep {
          color: #CBD5E1;
        }

        /* Workflow Action Box */
        .workflow-action-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 12px 14px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .workflow-steps-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #94A3B8;
        }

        .wf-step {
          padding: 2px 6px;
          border-radius: 3px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
        }

        .wf-step.done {
          background: #DCFCE7;
          border-color: #BBF7D0;
          color: #166534;
        }

        .wf-step.current {
          background: #0284C7;
          border-color: #0284C7;
          color: #FFFFFF;
          font-weight: 600;
        }

        .wf-arrow {
          color: #CBD5E1;
        }

        .workflow-buttons-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Inspector Tabs Bar */
        .inspector-tabs-bar {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 8px;
          margin-bottom: 16px;
          overflow-x: auto;
        }

        .inspector-tab-btn {
          background: transparent;
          border: 1px solid transparent;
          font-size: 12px;
          padding: 5px 10px;
          border-radius: 5px;
          color: #64748B;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .inspector-tab-btn:hover {
          color: #0F172A;
          background: #F8FAFC;
        }

        .inspector-tab-btn.active {
          background: #F1F5F9;
          border-color: #CBD5E1;
          color: #0284C7;
          font-weight: 600;
        }

        .inspector-tab-btn.highlight {
          color: #7C3AED;
        }

        .inspector-tab-btn.highlight.active {
          color: #7C3AED;
          border-color: #DDD6FE;
          background: #EDE9FE;
        }

        /* Tab Content Styling */
        .inspector-tab-content {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .inspector-details-table {
          display: flex;
          flex-direction: column;
          border-top: 1px solid #F1F5F9;
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
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .law-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .law-badge-val {
          font-size: 12px;
          font-weight: 600;
          color: #0F172A;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          padding: 4px 8px;
          border-radius: 4px;
          width: fit-content;
        }

        .purpose-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .info-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
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

        .requested-items-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-top: 4px;
        }

        .requested-item-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 12px;
          color: #1E293B;
        }

        /* Evidence Tab inside Inspector */
        .evidence-tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .evidence-list-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .evidence-entry-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ev-entry-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ev-entry-badges {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ev-entry-id {
          font-size: 11px;
          font-weight: 700;
          color: #0284C7;
        }

        .ev-rail-tag {
          font-size: 10px;
          color: #64748B;
        }

        .ev-entry-title {
          font-size: 13px;
          font-weight: 600;
          color: #0F172A;
        }

        .ev-entry-summary {
          font-size: 12px;
          color: #475569;
          line-height: 1.4;
        }

        .ev-entry-source {
          font-size: 10.5px;
          color: #64748B;
        }

        /* Payload Tab */
        .payload-meta-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .payload-meta-grid {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 4px;
        }

        .p-meta-item {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 8px;
          font-size: 12px;
        }

        .p-label {
          color: #64748B;
          font-size: 11px;
        }

        .p-val {
          color: #0F172A;
        }

        .code-viewer-container {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          overflow: hidden;
        }

        .code-viewer-header {
          background: #F1F5F9;
          border-bottom: 1px solid #E2E8F0;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #475569;
          font-weight: 600;
        }

        .code-viewer-body {
          margin: 0;
          padding: 14px;
          font-size: 11.5px;
          color: #0F172A;
          overflow-x: auto;
          max-height: 320px;
          line-height: 1.5;
        }

        /* Response Tab */
        .response-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .response-meta-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .response-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .response-remarks-box {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 4px;
          padding: 10px;
          margin-top: 10px;
        }

        .remarks-label {
          font-size: 10px;
          font-weight: 600;
          color: #64748B;
          display: block;
          margin-bottom: 3px;
        }

        .response-remarks-box p {
          margin: 0;
          font-size: 12px;
          color: #334155;
          line-height: 1.45;
        }

        .artifacts-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .artifacts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .artifacts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .artifact-item {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 4px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .art-label {
          font-size: 10px;
          color: #64748B;
        }

        .art-val {
          font-size: 11.5px;
          color: #0F172A;
        }

        /* Audit Tab */
        .audit-sub-header {
          font-size: 11.5px;
          color: #64748B;
          margin-bottom: 6px;
        }

        .audit-timeline-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .audit-item-row {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 10px 12px;
        }

        .audit-top-line {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .audit-actor {
          font-size: 11px;
          color: #64748B;
        }

        .audit-time {
          margin-left: auto;
          font-size: 11px;
          color: #64748B;
        }

        .audit-note {
          margin: 5px 0 0 0;
          font-size: 12px;
          color: #334155;
          line-height: 1.4;
        }

        .empty-sub-card {
          padding: 24px;
          text-align: center;
          background: #F8FAFC;
          border: 1px dashed #CBD5E1;
          border-radius: 6px;
          color: #64748B;
          font-size: 12px;
        }

        /* Inspector Actions Footer */
        .inspector-actions-footer {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #F1F5F9;
        }

        .inspector-actions-footer button {
          justify-content: center;
        }

        /* 9. State Cards (Loading, Error, Empty) */
        .state-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 48px 32px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .loading-state-card {
          max-width: 580px;
          margin: 40px auto;
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .loading-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .loading-step-text {
          font-size: 12.5px;
          color: #64748B;
          margin: 0;
          max-width: 440px;
        }

        .linear-progress-track {
          width: 100%;
          max-width: 380px;
          height: 6px;
          background: #E2E8F0;
          border-radius: 999px;
          overflow: hidden;
          margin: 8px 0;
        }

        .linear-progress-fill {
          height: 100%;
          background: #0284C7;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .loading-meta-info {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: #94A3B8;
        }

        .error-state-card {
          max-width: 540px;
          margin: 40px auto;
        }

        .error-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #FEE2E2;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px auto;
        }

        .error-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 6px 0;
        }

        .error-desc {
          font-size: 13px;
          color: #64748B;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }

        .error-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .empty-state-card {
          max-width: 680px;
          margin: 40px auto;
        }

        .empty-state-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .empty-symbol-box {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .empty-headline {
          font-size: 19px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .empty-subtext {
          font-size: 13px;
          color: #64748B;
          max-width: 520px;
          line-height: 1.5;
          margin: 0;
        }

        .empty-action-group {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .empty-heuristics-note {
          margin-top: 16px;
          padding: 12px 16px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          max-width: 540px;
          text-align: left;
        }

        .note-title {
          font-size: 10.5px;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }

        .empty-heuristics-note p {
          font-size: 12px;
          color: #475569;
          margin: 0;
          line-height: 1.45;
        }

        /* Responsive */
        @media (max-width: 1100px) {
          .disclosure-metrics-strip {
            grid-template-columns: repeat(3, 1fr);
          }
          .disclosure-primary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
