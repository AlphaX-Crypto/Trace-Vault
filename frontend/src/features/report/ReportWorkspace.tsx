import React, { useState } from 'react';
import {
  FindingClassification,
  InvestigationReportData,
  ReportStatus
} from './reportTypes';
import { initialReportData } from './reportData';

export interface ReportWorkspaceProps {
  activeCaseId?: string;
  onBackToCase?: () => void;
  onNavigateToTransaction?: (txId: string) => void;
  onNavigateToGraph?: (entityId: string) => void;
  onNavigateToRisk?: () => void;
  onNavigateToUpi?: () => void;
  onNavigateToVasp?: () => void;
  onNavigateToGeospatial?: () => void;
  onNavigateToEvidence?: () => void;
  onNavigateToDisclosure?: () => void;
}

export const ReportWorkspace: React.FC<ReportWorkspaceProps> = ({
  activeCaseId = 'CASE-2026-001',
  onBackToCase,
  onNavigateToTransaction,
  onNavigateToGraph,
  onNavigateToRisk,
  onNavigateToUpi,
  onNavigateToVasp,
  onNavigateToGeospatial,
  onNavigateToEvidence,
  onNavigateToDisclosure
}) => {
  const [report, setReport] = useState<InvestigationReportData>({
    ...initialReportData,
    caseId: activeCaseId
  });
  const [simulationMode, setSimulationMode] = useState<
    'full' | 'no-geo' | 'no-notes' | 'empty-all'
  >('full');
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(
    report.investigatorInterpretations[0]?.notes || ''
  );

  // Status handler
  const handleStatusChange = (newStatus: ReportStatus) => {
    setReport((prev) => ({ ...prev, status: newStatus }));
  };

  // Note save handler
  const handleSaveNote = () => {
    if (!noteDraft.trim()) {
      setReport((prev) => ({
        ...prev,
        investigatorInterpretations: []
      }));
    } else {
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      setReport((prev) => ({
        ...prev,
        investigatorInterpretations: [
          {
            author: 'Lead Investigator Samarth',
            enteredAt: nowStr,
            notes: noteDraft,
            classification: 'INVESTIGATOR_INTERPRETATION'
          }
        ]
      }));
    }
    setIsEditingNote(false);
  };

  // Classification Badge styling matching Evidence system
  const renderClassificationBadge = (cat: FindingClassification) => {
    switch (cat) {
      case 'OBSERVED_FACT':
        return <span className="cat-pill font-sans cat-badge-observed">Observed Fact</span>;
      case 'SYSTEM_ANALYSIS':
        return <span className="cat-pill font-sans cat-badge-analysis">System Analysis</span>;
      case 'ATTRIBUTION_INDICATOR':
        return <span className="cat-pill font-sans cat-badge-attribution">Attribution Indicator</span>;
      case 'RISK_INDICATOR':
        return <span className="cat-pill font-sans cat-badge-risk">Risk Indicator</span>;
      case 'INVESTIGATOR_INTERPRETATION':
        return <span className="cat-pill font-sans cat-badge-interpretation">Investigator Interpretation</span>;
      default:
        return null;
    }
  };

  // Geospatial display check
  const activeGeospatial =
    simulationMode === 'no-geo' || simulationMode === 'empty-all'
      ? []
      : report.geospatialFindings;

  // Notes display check
  const activeNotes =
    simulationMode === 'no-notes' || simulationMode === 'empty-all'
      ? []
      : report.investigatorInterpretations;

  // Vasp display check
  const activeVasp =
    simulationMode === 'empty-all' ? [] : report.vaspFindings;

  return (
    <div className={`report-workspace-root font-sans ${isPrintMode ? 'print-layout-active' : ''}`}>
      {/* 1. Standard Case / Page Header */}
      <header className="report-app-header no-print">
        <div className="header-left">
          <div className="breadcrumb-nav">
            {onBackToCase ? (
              <button type="button" onClick={onBackToCase} className="breadcrumb-link">
                Cases
              </button>
            ) : (
              <span className="breadcrumb-current">Cases</span>
            )}
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{report.caseId}</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Report</span>
          </div>
          <div className="header-titles">
            <h1 className="page-main-title font-sans">Investigation Report</h1>
            <p className="page-main-sub font-sans">
              Investigation reports and review status for Case {report.caseId}.
            </p>
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions-row">
            {/* Status Selector */}
            <div className="status-select-wrapper font-sans">
              <span className="status-select-label">Status:</span>
              <select
                value={report.status}
                onChange={(e) => handleStatusChange(e.target.value as ReportStatus)}
                className="status-dropdown font-sans"
              >
                <option value="DRAFT">Draft</option>
                <option value="UNDER REVIEW">Under Review</option>
                <option value="READY FOR REVIEW">Ready For Review</option>
              </select>
            </div>

            {/* Print / Export Action */}
            <button
              type="button"
              onClick={() => {
                setIsPrintMode(!isPrintMode);
                setTimeout(() => window.print(), 200);
              }}
              className="btn-primary-action font-sans"
              title="Print or Export PDF"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              <span>Export PDF / Print</span>
            </button>
          </div>

          {/* Compact View Switcher */}
          <div className="state-simulator-bar font-sans">
            <span className="sim-label">Simulation:</span>
            <button
              type="button"
              onClick={() => {
                setSimulationMode('full');
                setIsPrintMode(false);
              }}
              className={`pill-btn ${simulationMode === 'full' && !isPrintMode ? 'active' : ''}`}
            >
              Full
            </button>
            <button
              type="button"
              onClick={() => setSimulationMode('no-geo')}
              className={`pill-btn ${simulationMode === 'no-geo' ? 'active' : ''}`}
            >
              No Geo
            </button>
            <button
              type="button"
              onClick={() => setSimulationMode('no-notes')}
              className={`pill-btn ${simulationMode === 'no-notes' ? 'active' : ''}`}
            >
              No Notes
            </button>
            <button
              type="button"
              onClick={() => setIsPrintMode(!isPrintMode)}
              className={`pill-btn ${isPrintMode ? 'active' : ''}`}
            >
              Print View
            </button>
          </div>
        </div>
      </header>

      {/* 2. Document Container (Simulates Page-Like Sheet) */}
      <main className="report-document-sheet">
        {/* Document Header / Cover Banner */}
        <section className="report-cover-section">
          <div className="cover-top-bar">
            <div className="brand-lockup">
              <span className="brand-text font-sans">TraceVault</span>
              <span className="brand-sub font-sans">Financial Investigation Platform</span>
            </div>
            <div className="cover-badge-block font-sans">
              <span className="tag-demo-alert font-sans">Demo / Synthetic Data</span>
              <span className={`status-pill status-${report.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {report.status}
              </span>
            </div>
          </div>

          <div className="cover-title-area">
            <h1 className="cover-heading font-sans">Investigation Report</h1>
            <p className="cover-subheading font-sans">
              Comprehensive Multi-Rail Synthesized Findings for Case <span className="font-mono text-blue">{report.caseId}</span>
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="report-metadata-grid font-sans">
            <div className="meta-card">
              <span className="meta-k">CASE IDENTIFIER</span>
              <span className="meta-v font-mono text-blue">{report.caseId}</span>
            </div>
            <div className="meta-card">
              <span className="meta-k">INVESTIGATION TYPE</span>
              <span className="meta-v">{report.caseType}</span>
            </div>
            <div className="meta-card">
              <span className="meta-k">GENERATED TIMESTAMP</span>
              <span className="meta-v font-mono">{report.generatedAt}</span>
            </div>
            <div className="meta-card">
              <span className="meta-k">SUBJECT IDENTIFIER</span>
              <span className="meta-v font-mono text-truncate">{report.subject.primaryIdentifier}</span>
            </div>
            <div className="meta-card">
              <span className="meta-k">NETWORK RAILS</span>
              <span className="meta-v font-sans">{report.subject.rails.join(', ')}</span>
            </div>
            <div className="meta-card">
              <span className="meta-k">DATA INTEGRITY</span>
              <span className="meta-v font-sans">Verified Structured Repository</span>
            </div>
          </div>

          {/* Legal Certification Negative Constraint Disclaimer */}
          <div className="evidence-standard-banner font-sans">
            <span className="standard-tag">INVESTIGATIVE STANDARD &amp; DATA INTEGRITY</span>
            <p>
              This document compiles structured findings, algorithmic heuristics, and recorded investigator entries generated within TraceVault.
              This report represents investigative analysis and does not constitute automated court certification or legal finality.
            </p>
          </div>
        </section>

        {/* 3. Section: Executive Summary */}
        <section className="report-page-section" id="sec-summary">
          <div className="section-header-row">
            <div>
              <span className="sec-num font-sans">01</span>
              <h2 className="sec-title font-sans">Executive Summary</h2>
            </div>
            <span className="sec-pill font-sans">Synthesized Overview</span>
          </div>

          <div className="summary-structured-list font-sans">
            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-label">SUBJECT OVERVIEW</span>
                {renderClassificationBadge('OBSERVED_FACT')}
              </div>
              <p className="summary-text">
                Primary examination of Ethereum origin <span className="font-mono text-blue">{report.subject.primaryIdentifier}</span> and domestic clearing identifier <span className="font-mono text-blue">{report.subject.secondaryIdentifier}</span> across 4 payment networks.
              </p>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-label">OBSERVED ACTIVITY</span>
                {renderClassificationBadge('OBSERVED_FACT')}
              </div>
              <p className="summary-text">{report.executiveSummary.observedActivity}</p>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-label">KEY ANALYTICAL FINDINGS</span>
                {renderClassificationBadge('SYSTEM_ANALYSIS')}
              </div>
              <p className="summary-text">{report.executiveSummary.systemAnalysis}</p>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-label">POTENTIAL VASP ASSOCIATIONS</span>
                {renderClassificationBadge('ATTRIBUTION_INDICATOR')}
              </div>
              <p className="summary-text">{report.executiveSummary.attributionFindings}</p>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-label">LOCATION CORRELATIONS</span>
                {renderClassificationBadge('SYSTEM_ANALYSIS')}
              </div>
              <p className="summary-text">{report.executiveSummary.locationCorrelations}</p>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <span className="summary-label">EVIDENCE AVAILABILITY</span>
                {renderClassificationBadge('OBSERVED_FACT')}
              </div>
              <p className="summary-text">{report.executiveSummary.evidenceAvailable}</p>
            </div>
          </div>
        </section>

        {/* 4. Section: Subject Profile */}
        <section className="report-page-section" id="sec-subject">
          <div className="section-header-row">
            <div>
              <span className="sec-num font-sans">02</span>
              <h2 className="sec-title font-sans">Subject Profile &amp; Parameters</h2>
            </div>
            <span className="sec-pill font-sans">Multi-Rail Target</span>
          </div>

          <div className="subject-profile-grid font-sans">
            <div className="profile-card">
              <span className="card-k">SUBJECT CLASSIFICATION</span>
              <span className="card-v">{report.subject.subjectType}</span>
            </div>
            <div className="profile-card">
              <span className="card-k">PRIMARY ON-CHAIN IDENTIFIER</span>
              <span className="card-v font-mono text-blue">{report.subject.primaryIdentifier}</span>
            </div>
            <div className="profile-card">
              <span className="card-k">DOMESTIC VPA CLEARING HANDLE</span>
              <span className="card-v font-mono text-blue">{report.subject.secondaryIdentifier}</span>
            </div>
            <div className="profile-card">
              <span className="card-k">OBSERVED ACTIVITY VOLUME</span>
              <span className="card-v font-mono">{report.subject.observedTransactionsCount} Transactions ({report.subject.distinctCounterpartiesCount} Distinct Counterparties)</span>
            </div>
            <div className="profile-card">
              <span className="card-k">COMPOSITE RISK EVALUATION</span>
              <span className="card-v font-mono text-amber">Score {report.subject.riskScore}/100 ({report.subject.riskSeverity})</span>
            </div>
            <div className="profile-card">
              <span className="card-k">TOP CANDIDATE VASP ASSOCIATION</span>
              <span className="card-v font-mono">{report.subject.attributionCandidate} ({report.subject.attributionConfidence}% Confidence)</span>
            </div>
          </div>
        </section>

        {/* 5. Section: Transaction Findings */}
        <section className="report-page-section" id="sec-transactions">
          <div className="section-header-row">
            <div>
              <span className="sec-num font-sans">03</span>
              <h2 className="sec-title font-sans">Transaction Findings</h2>
            </div>
            {onNavigateToTransaction && (
              <button
                type="button"
                onClick={() => onNavigateToTransaction(report.transactions[0].id)}
                className="btn-workspace-link font-sans no-print"
              >
                Inspect in Transactions →
              </button>
            )}
          </div>

          <div className="table-responsive font-sans">
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Transaction Identifier</th>
                  <th>Network Rail</th>
                  <th>Direction</th>
                  <th>Amount</th>
                  <th>Classification</th>
                  <th>Relationship / Modus Operandi</th>
                </tr>
              </thead>
              <tbody>
                {report.transactions.map((tx) => (
                  <tr key={tx.id} className="table-row-item">
                    <td className="font-mono text-muted">{tx.timestamp.slice(11, 19)}</td>
                    <td className="font-mono text-blue text-truncate-sm" title={tx.id}>
                      {onNavigateToTransaction ? (
                        <button
                          type="button"
                          onClick={() => onNavigateToTransaction(tx.id)}
                          className="link-cell-btn font-mono"
                        >
                          {tx.id.slice(0, 18)}...
                        </button>
                      ) : (
                        `${tx.id.slice(0, 18)}...`
                      )}
                    </td>
                    <td className="font-sans">{tx.rail}</td>
                    <td>
                      <span className={`direction-badge ${tx.direction.toLowerCase()}`}>
                        {tx.direction}
                      </span>
                    </td>
                    <td className="font-mono font-medium">{tx.amount}</td>
                    <td>{renderClassificationBadge(tx.classification)}</td>
                    <td className="text-secondary">{tx.relationship}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. Section: Trace Paths */}
        <section className="report-page-section" id="sec-paths">
          <div className="section-header-row">
            <div>
              <span className="sec-num font-mono">SECTION 04</span>
              <h2 className="sec-title font-sans">Multi-Hop Trace Paths</h2>
            </div>
            {onNavigateToGraph && (
              <button
                type="button"
                onClick={() => onNavigateToGraph(report.subject.primaryIdentifier)}
                className="btn-workspace-link font-mono no-print"
              >
                Open in Graph Workspace →
              </button>
            )}
          </div>

          <p className="section-narrative font-sans">
            Deterministic graph traversal tracing funds from the initial suspect origin through intermediate layering peeling hops to the candidate exchange gateway.
          </p>

          <div className="trace-path-container font-sans">
            {report.tracePaths.map((hop) => (
              <div key={hop.hopNumber} className="trace-hop-card">
                <div className="hop-badge-col font-mono">
                  <span className="hop-num">HOP {hop.hopNumber}</span>
                  <span className={`hop-type type-${hop.entityType.toLowerCase()}`}>{hop.entityType}</span>
                </div>
                <div className="hop-content-col">
                  <div className="hop-top">
                    <span className="hop-name font-sans font-medium">{hop.entityName}</span>
                    <span className="hop-amount font-mono text-green">{hop.amount}</span>
                  </div>
                  <div className="hop-id font-mono text-cyan">{hop.identifier}</div>
                  <div className="hop-meta font-mono">
                    <span className="text-muted">Tx: {hop.transactionRef}</span> &bull; <span>Time: {hop.timestamp}</span>
                  </div>
                  <div className="hop-footer">
                    <span className="hop-assoc font-sans">{hop.association}</span>
                    {renderClassificationBadge(hop.classification)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Section: Risk Findings & UPI Analysis */}
        <section className="report-page-section" id="sec-risk-upi">
          <div className="section-header-row">
            <div>
              <span className="sec-num font-mono">SECTION 05</span>
              <h2 className="sec-title font-sans">Risk Findings & UPI Behavioral Analysis</h2>
            </div>
            <div className="header-actions-row no-print">
              {onNavigateToRisk && (
                <button type="button" onClick={onNavigateToRisk} className="btn-workspace-link font-mono">
                  Risk Workspace →
                </button>
              )}
              {onNavigateToUpi && (
                <button type="button" onClick={onNavigateToUpi} className="btn-workspace-link font-mono">
                  UPI Workspace →
                </button>
              )}
            </div>
          </div>

          <div className="risk-upi-split-grid font-sans">
            {/* Left: Risk Findings */}
            <div className="sub-panel">
              <div className="sub-panel-header">
                <h3 className="sub-panel-title font-sans">Heuristic Risk Findings</h3>
                <span className="font-mono text-amber">Score {report.riskFindings.score}/100 (HIGH)</span>
              </div>
              <div className="risk-signals-list">
                {report.riskFindings.signals.map((sig) => (
                  <div key={sig.id} className="signal-report-card">
                    <div className="sig-header">
                      <span className="sig-name font-sans font-medium">{sig.signalName}</span>
                      {renderClassificationBadge(sig.classification)}
                    </div>
                    <div className="sig-body">
                      <div className="sig-field">
                        <span className="sig-k font-mono">WHY DETECTED:</span>
                        <span className="sig-v">{sig.whyDetected}</span>
                      </div>
                      <div className="sig-field">
                        <span className="sig-k font-mono">SUPPORTING ACTIVITY:</span>
                        <span className="sig-v font-mono text-secondary">{sig.supportingActivity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: UPI Findings */}
            <div className="sub-panel">
              <div className="sub-panel-header">
                <h3 className="sub-panel-title font-sans">UPI Domestic Rail Findings</h3>
                <span className="font-mono text-purple">Risk {report.upiFindings.riskScore}/100</span>
              </div>
              <div className="upi-content-box">
                <div className="upi-meta-row font-mono">
                  <span className="text-muted">SUBJECT VPA:</span>
                  <span className="text-cyan font-bold">{report.upiFindings.subjectVpa}</span>
                </div>
                <div className="upi-signal-tags font-mono">
                  {report.upiFindings.detectedSignals.map((ds, idx) => (
                    <span key={idx} className="upi-tag">{ds}</span>
                  ))}
                </div>
                <div className="upi-desc-box">
                  <div className="upi-k font-mono">BEHAVIORAL FINDINGS:</div>
                  <p className="upi-v">{report.upiFindings.behavioralFindings}</p>
                </div>
                <div className="upi-txs-box font-mono">
                  <div className="upi-k">CORROBORATING TRANSACTIONS:</div>
                  <ul>
                    {report.upiFindings.supportingTransactions.map((txRef, i) => (
                      <li key={i}>{txRef}</li>
                    ))}
                  </ul>
                </div>
                <div className="upi-footer">
                  {renderClassificationBadge(report.upiFindings.classification)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Section: VASP Attribution & Geospatial */}
        <section className="report-page-section" id="sec-vasp-geo">
          <div className="section-header-row">
            <div>
              <span className="sec-num font-mono">SECTION 06</span>
              <h2 className="sec-title font-sans">Potential VASP Associations & Geospatial Telemetry</h2>
            </div>
            <div className="header-actions-row no-print">
              {onNavigateToVasp && (
                <button type="button" onClick={onNavigateToVasp} className="btn-workspace-link font-mono">
                  VASP Workspace →
                </button>
              )}
              {onNavigateToGeospatial && (
                <button type="button" onClick={onNavigateToGeospatial} className="btn-workspace-link font-mono">
                  Geospatial Workspace →
                </button>
              )}
            </div>
          </div>

          <div className="vasp-geo-split-grid font-sans">
            {/* Left: VASP Associations */}
            <div className="sub-panel">
              <div className="sub-panel-header">
                <h3 className="sub-panel-title font-sans">Potential VASP Associations</h3>
                <span className="font-mono text-cyan">Cluster Heuristics</span>
              </div>

              {activeVasp.length > 0 ? (
                activeVasp.map((vasp, idx) => (
                  <div key={idx} className="vasp-candidate-card">
                    <div className="vasp-top">
                      <span className="vasp-name font-sans font-bold">{vasp.candidateName}</span>
                      <span className="vasp-conf font-mono text-cyan">
                        Association Confidence: {vasp.associationConfidence}%
                      </span>
                    </div>

                    <div className="vasp-basis-list font-mono">
                      <span className="basis-label">ASSOCIATION BASIS:</span>
                      {vasp.basis.map((b, i) => (
                        <div key={i} className="basis-item">&bull; {b}</div>
                      ))}
                    </div>

                    <div className="vasp-activity font-sans">
                      <span className="activity-label font-mono">SUPPORTING ACTIVITY:</span>
                      <p>{vasp.supportingActivity}</p>
                    </div>

                    <div className="vasp-footer">
                      <span className="vasp-status font-mono">STATUS: {vasp.reviewStatus}</span>
                      {renderClassificationBadge(vasp.classification)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-section-placeholder font-mono">
                  No candidate VASP associations identified for this case.
                </div>
              )}
            </div>

            {/* Right: Geospatial Findings */}
            <div className="sub-panel">
              <div className="sub-panel-header">
                <h3 className="sub-panel-title font-sans">Correlated Geospatial Signals</h3>
                <span className="font-mono text-cyan">Regional Telemetry</span>
              </div>

              {activeGeospatial.length > 0 ? (
                <div className="geo-signals-list font-sans">
                  {activeGeospatial.map((geo) => (
                    <div key={geo.signalId} className="geo-report-card">
                      <div className="geo-top">
                        <span className="geo-type font-mono font-medium">{geo.signalType}</span>
                        {renderClassificationBadge(geo.classification)}
                      </div>
                      <div className="geo-location font-sans font-bold">{geo.locationName}</div>
                      <div className="geo-meta font-mono">
                        <span>Coord: {geo.coordinates}</span> &bull; <span>Time: {geo.timestamp}</span>
                      </div>
                      <div className="geo-source font-mono text-muted">
                        Source: {geo.source} (Accuracy: {geo.accuracy}) &bull; Linked Tx: {geo.relatedTransaction}
                      </div>
                      {geo.derivedFinding && (
                        <div className="geo-derived-box font-sans">
                          <span className="derived-tag font-mono">ANALYTICAL DERIVATION:</span>
                          <p>{geo.derivedFinding}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-section-placeholder font-mono">
                  NO LOCATION FINDINGS: No location signals are associated with this case.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 9. Section: Evidence Register Summary */}
        <section className="report-page-section" id="sec-evidence">
          <div className="section-header-row">
            <div>
              <span className="sec-num font-mono">SECTION 07</span>
              <h2 className="sec-title font-sans">Evidence Register Summary</h2>
            </div>
            {onNavigateToEvidence && (
              <button type="button" onClick={onNavigateToEvidence} className="btn-workspace-link font-mono no-print">
                Evidence Workspace →
              </button>
            )}
          </div>

          <div className="table-responsive font-sans">
            <table className="report-data-table">
              <thead>
                <tr className="font-mono">
                  <th>EVIDENCE ID</th>
                  <th>CATEGORY</th>
                  <th>TITLE</th>
                  <th>SOURCE PROVENANCE</th>
                  <th>SOURCE INTEGRITY</th>
                  <th>REVIEW STATUS</th>
                </tr>
              </thead>
              <tbody>
                {report.evidenceItems.map((ev) => (
                  <tr key={ev.id} className="table-row-item">
                    <td className="font-mono text-cyan font-bold">
                      {onNavigateToEvidence ? (
                        <button
                          type="button"
                          onClick={onNavigateToEvidence}
                          className="link-cell-btn font-mono"
                        >
                          {ev.id}
                        </button>
                      ) : (
                        ev.id
                      )}
                    </td>
                    <td>{renderClassificationBadge(ev.category)}</td>
                    <td className="font-sans font-medium">{ev.title}</td>
                    <td className="text-secondary">{ev.source}</td>
                    <td className="font-mono text-green">{ev.integrity}</td>
                    <td>
                      <span className={`status-pill-sm status-${ev.status.toLowerCase().replace(/_/g, '-')}`}>
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 10. Section: Investigator Interpretation (Visually Distinct) */}
        <section className="report-page-section" id="sec-interpretation">
          <div className="section-header-row">
            <div>
              <span className="sec-num font-mono">SECTION 08</span>
              <h2 className="sec-title font-sans">Investigator Interpretation</h2>
            </div>
            <div className="header-actions-row no-print">
              <button
                type="button"
                onClick={() => {
                  setNoteDraft(activeNotes[0]?.notes || '');
                  setIsEditingNote(!isEditingNote);
                }}
                className="btn-workspace-link font-mono"
              >
                {isEditingNote ? 'Cancel' : activeNotes.length > 0 ? 'Edit Note' : '+ Add Interpretation'}
              </button>
            </div>
          </div>

          {/* Form for editing or entering interpretation */}
          {isEditingNote && (
            <div className="investigator-note-editor no-print font-sans">
              <label className="editor-label font-mono">INVESTIGATOR INTERPRETATION NOTE *</label>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Enter investigator analysis, deductions, and recommendations..."
                rows={4}
                className="editor-textarea font-sans"
              />
              <div className="editor-actions">
                <button type="button" onClick={handleSaveNote} className="btn-save-note font-mono">
                  Save Interpretation
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingNote(false)}
                  className="btn-cancel-note font-mono"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="investigator-interpretation-container font-sans">
            <div className="interpretation-badge-bar">
              <span className="badge-distinction font-mono">
                INVESTIGATOR-ENTERED CONTENT &bull; SEPARATE FROM OBSERVED FACTS
              </span>
              {renderClassificationBadge('INVESTIGATOR_INTERPRETATION')}
            </div>

            {activeNotes.length > 0 ? (
              activeNotes.map((note, index) => (
                <div key={index} className="note-card">
                  <div className="note-meta-row font-mono">
                    <span className="note-author font-bold">{note.author}</span>
                    <span className="note-time text-muted">{note.enteredAt}</span>
                  </div>
                  <blockquote className="note-text font-sans">
                    &ldquo;{note.notes}&rdquo;
                  </blockquote>
                </div>
              ))
            ) : (
              <div className="empty-section-placeholder font-mono">
                NO INVESTIGATOR INTERPRETATION: No investigator interpretation has been recorded.
              </div>
            )}
          </div>
        </section>

        {/* 11. Section: Open Questions / Data Gaps */}
        <section className="report-page-section" id="sec-gaps">
          <div className="section-header-row">
            <div>
              <span className="sec-num font-mono">SECTION 09</span>
              <h2 className="sec-title font-sans">Open Questions & Data Gaps</h2>
            </div>
            <span className="sec-pill font-mono">Uncertainty Register</span>
          </div>

          <p className="section-narrative font-sans">
            Identified analytical limitations, missing telemetry layers, and required external verifications. Transparency regarding data gaps is maintained in accordance with investigative standards.
          </p>

          <div className="gaps-grid font-sans">
            {report.openQuestions.map((gap) => (
              <div key={gap.id} className="gap-card">
                <div className="gap-top">
                  <span className="gap-id font-mono text-cyan">{gap.id}</span>
                  <span className="gap-cat font-mono">{gap.category}</span>
                </div>
                <div className="gap-desc font-medium">{gap.description}</div>
                <div className="gap-impact font-sans">
                  <span className="impact-tag font-mono">INVESTIGATIVE IMPACT:</span>
                  <span>{gap.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 12. Section: Recommended Next Actions */}
        <section className="report-page-section" id="sec-actions">
          <div className="section-header-row">
            <div>
              <span className="sec-num font-mono">SECTION 10</span>
              <h2 className="sec-title font-sans">Recommended Next Actions</h2>
            </div>
            <span className="sec-pill font-mono">Investigator Checklist</span>
          </div>

          <div className="actions-list font-sans">
            {report.nextActions.map((act) => (
              <div key={act.id} className="action-item-card">
                <div className="act-status-box font-mono">
                  <span className="act-id">{act.id}</span>
                  <span className="act-tag">{act.status}</span>
                </div>
                <div className="act-info">
                  <h4 className="act-title font-sans font-bold">{act.actionTitle}</h4>
                  <p className="act-desc">{act.description}</p>
                </div>
                <div className="act-btn-box no-print">
                  {act.targetWorkspace === 'Transactions' && onNavigateToTransaction && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTransaction(report.transactions[0].id)}
                      className="btn-action-jump font-mono"
                    >
                      Open Transactions →
                    </button>
                  )}
                  {act.targetWorkspace === 'VASP' && onNavigateToVasp && (
                    <button type="button" onClick={onNavigateToVasp} className="btn-action-jump font-mono">
                      Open VASP →
                    </button>
                  )}
                  {act.targetWorkspace === 'Geospatial' && onNavigateToGeospatial && (
                    <button type="button" onClick={onNavigateToGeospatial} className="btn-action-jump font-mono">
                      Open Geospatial →
                    </button>
                  )}
                  {act.targetWorkspace === 'Evidence' && onNavigateToEvidence && (
                    <button type="button" onClick={onNavigateToEvidence} className="btn-action-jump font-mono">
                      Open Evidence →
                    </button>
                  )}
                  {act.targetWorkspace === 'SAHYOG_HOOK' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateToDisclosure) {
                          onNavigateToDisclosure();
                        } else {
                          alert('SAHYOG Platform Hook: Disclosure workflow simulated in Phase P8.');
                        }
                      }}
                      className="btn-action-jump font-mono"
                    >
                      Prepare SAHYOG Disclosure Requisition →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Document Footer */}
        <footer className="report-document-footer font-mono">
          <div className="footer-left">
            <span>TRACEVAULT INVESTIGATION REPORT &bull; CASE-2026-001 &bull; {report.reportId}</span>
          </div>
          <div className="footer-right">
            <span>DATA STATUS: DEMO / SYNTHETIC DATA &bull; GENERATED: {report.generatedAt}</span>
          </div>
        </footer>
      </main>

      {/* Embedded Styles for Workspace and Print View */}
      <style>{`
        .report-workspace-root {
          min-height: 100vh;
          background-color: #f8fafc;
          color: #111827;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .report-app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 28px;
          background-color: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #ffffff;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-back:hover {
          background: #f1f5f9;
          color: #111827;
          border-color: #cbd5e1;
        }

        .header-divider {
          width: 1px;
          height: 28px;
          background: #e2e8f0;
        }

        .badge-row {
          display: flex;
          gap: 8px;
          margin-bottom: 4px;
        }

        .badge-pill {
          padding: 2px 8px;
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 3px;
          font-size: 11px;
          letter-spacing: 0.5px;
        }

        .demo-data-badge {
          padding: 2px 8px;
          background: rgba(245, 158, 11, 0.15);
          color: #b45309;
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: 3px;
          font-size: 11px;
          font-weight: 600;
        }

        .report-main-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .report-workspace-root {
          width: 100%;
          min-height: calc(100vh - 72px);
          background-color: #f8fafc;
          color: #111827;
          display: flex;
          flex-direction: column;
        }

        .report-app-header {
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

        .status-select-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-select-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .status-dropdown {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #111827;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 6px;
          outline: none;
          cursor: pointer;
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
          display: inline-flex;
          align-items: center;
          transition: background 0.15s ease;
        }

        .btn-primary-action:hover {
          background: #1d4ed8;
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

        /* Document Sheet Layout */
        .report-document-sheet {
          max-width: 1200px;
          margin: 24px auto 48px;
          padding: 36px 40px;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          gap: 32px;
          width: 95%;
        }

        /* Cover Section */
        .report-cover-section {
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cover-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .brand-text {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
        }

        .brand-sub {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .cover-badge-block {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tag-demo-alert {
          padding: 3px 8px;
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 500;
        }

        .cover-heading {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .cover-subheading {
          font-size: 13.5px;
          color: #64748b;
          margin: 0 0 16px 0;
        }

        .report-metadata-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }

        .meta-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-k {
          font-size: 10.5px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        .meta-v {
          font-size: 12.5px;
          color: #111827;
          font-weight: 500;
        }

        .evidence-standard-banner {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-left: 3px solid #2563eb;
          border-radius: 8px;
          padding: 14px 18px;
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

        /* Section Layout */
        .report-page-section {
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }

        .sec-num {
          font-size: 11px;
          font-weight: 600;
          color: #2563eb;
          letter-spacing: 0.04em;
          display: block;
          margin-bottom: 2px;
        }

        .sec-title {
          font-size: 17px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .sec-pill {
          font-size: 11px;
          color: #64748b;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .btn-workspace-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ffffff;
          color: #2563eb;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-workspace-link:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .section-narrative {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        /* Badges matching Evidence */
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

        .status-under-review {
          background: #eff6ff;
          color: #2563eb;
        }

        .status-draft {
          background: #f1f5f9;
          color: #64748b;
        }

        .status-ready-for-review {
          background: #ecfdf5;
          color: #059669;
        }

        /* Summary Structured List */
        .summary-structured-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .summary-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summary-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .summary-label {
          font-size: 11px;
          color: #64748b;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .summary-text {
          font-size: 12.5px;
          color: #334155;
          line-height: 1.55;
          margin: 0;
        }

        /* Subject Profile Grid */
        .subject-profile-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .profile-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .card-k {
          font-size: 10.5px;
          color: #64748b;
        }

        .card-v {
          font-size: 12.5px;
          color: #334155;
          font-weight: 500;
        }

        /* Report Tables */
        .report-data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          text-align: left;
        }

        .report-data-table th {
          background: #f8fafc;
          color: #475569;
          font-size: 11px;
          font-weight: 600;
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
          letter-spacing: 0.5px;
        }

        .report-data-table td {
          padding: 11px 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }

        .table-row-item:hover {
          background: #f8fafc;
        }

        .direction-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 2px;
        }
        .direction-badge.inbound {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        .direction-badge.outbound {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        .direction-badge.internal_hop {
          background: rgba(56, 189, 248, 0.15);
          color: #2563eb;
        }

        .link-cell-btn {
          background: transparent;
          border: none;
          color: #2563eb;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }
        .link-cell-btn:hover {
          color: #7dd3fc;
        }

        /* Trace Paths */
        .trace-path-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .trace-hop-card {
          display: flex;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
        }

        .hop-badge-col {
          width: 90px;
          background: #f8fafc;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #e2e8f0;
          gap: 4px;
        }

        .hop-num {
          font-size: 11px;
          color: #2563eb;
          font-weight: 700;
        }

        .hop-type {
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 2px;
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .hop-content-col {
          flex: 1;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hop-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .hop-name {
          font-size: 13px;
          color: #111827;
        }

        .hop-amount {
          font-size: 12.5px;
        }

        .hop-id {
          font-size: 11.5px;
        }

        .hop-meta {
          font-size: 11px;
          color: #64748b;
        }

        .hop-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid #e2e8f0;
        }

        .hop-assoc {
          font-size: 12px;
          color: #334155;
        }

        /* Split Grids (Risk / UPI, VASP / Geo) */
        .risk-upi-split-grid,
        .vasp-geo-split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .sub-panel {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sub-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }

        .sub-panel-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .signal-report-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 8px;
        }

        .sig-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .sig-name {
          font-size: 13px;
          color: #111827;
        }

        .sig-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sig-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sig-k {
          font-size: 10px;
          color: #64748b;
        }

        .sig-v {
          font-size: 12px;
          color: #334155;
        }

        /* UPI Content Box */
        .upi-content-box {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .upi-meta-row {
          display: flex;
          gap: 8px;
          font-size: 12px;
        }

        .upi-signal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .upi-tag {
          font-size: 10.5px;
          padding: 2px 6px;
          background: #f5f3ff;
          color: #6d28d9;
          border: 1px solid #ddd6fe;
          border-radius: 2px;
        }

        .upi-desc-box,
        .upi-txs-box {
          font-size: 12px;
          background: #ffffff;
          padding: 10px;
          border-radius: 3px;
          border: 1px solid #e2e8f0;
        }

        .upi-k {
          font-size: 10px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .upi-v {
          margin: 0;
          color: #334155;
          line-height: 1.45;
        }

        .upi-txs-box ul {
          margin: 0;
          padding-left: 16px;
          color: #334155;
        }

        .upi-footer {
          margin-top: 4px;
        }

        /* VASP Candidate Card */
        .vasp-candidate-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .vasp-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .vasp-name {
          font-size: 14px;
          color: #111827;
        }

        .vasp-conf {
          font-size: 12px;
        }

        .vasp-basis-list {
          font-size: 11.5px;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .basis-label {
          font-size: 10px;
          color: #64748b;
        }

        .vasp-activity {
          font-size: 12px;
          color: #334155;
        }
        .activity-label {
          font-size: 10px;
          color: #64748b;
          display: block;
          margin-bottom: 2px;
        }

        .vasp-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
          padding-top: 6px;
          border-top: 1px solid #e2e8f0;
        }

        .vasp-status {
          font-size: 11px;
          color: #f59e0b;
        }

        /* Geospatial Report Cards */
        .geo-report-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .geo-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .geo-type {
          font-size: 11px;
          color: #2563eb;
        }

        .geo-location {
          font-size: 13px;
          color: #111827;
        }

        .geo-meta,
        .geo-source {
          font-size: 11px;
        }

        .geo-derived-box {
          margin-top: 4px;
          padding: 8px;
          background: rgba(245, 158, 11, 0.06);
          border-left: 2px solid #f59e0b;
          border-radius: 0 2px 2px 0;
          font-size: 11.5px;
          color: #334155;
        }
        .derived-tag {
          font-size: 9.5px;
          color: #f59e0b;
          display: block;
          margin-bottom: 2px;
        }

        .empty-section-placeholder {
          padding: 24px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 4px;
        }

        /* Investigator Interpretation Section */
        .investigator-interpretation-container {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .interpretation-badge-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid #bbf7d0;
        }

        .badge-distinction {
          font-size: 11px;
          font-weight: 700;
          color: #15803d;
          letter-spacing: 0.5px;
        }

        .note-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .note-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .note-author {
          color: #111827;
        }

        .note-text {
          margin: 0;
          font-size: 13.5px;
          color: #334155;
          line-height: 1.6;
          font-style: italic;
        }

        .investigator-note-editor {
          background: #ffffff;
          border: 1px solid #2563eb;
          border-radius: 4px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .editor-label {
          font-size: 11px;
          color: #2563eb;
          font-weight: 700;
        }

        .editor-textarea {
          width: 100%;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 10px;
          color: #111827;
          font-size: 13px;
          outline: none;
          resize: vertical;
        }

        .editor-actions {
          display: flex;
          gap: 10px;
        }

        .btn-save-note {
          padding: 6px 14px;
          background: #10b981;
          color: #ffffff;
          font-weight: 600;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }

        .btn-cancel-note {
          padding: 6px 14px;
          background: #ffffff;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 3px;
          cursor: pointer;
        }

        /* Gaps Section */
        .gaps-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .gap-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .gap-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .gap-cat {
          font-size: 10px;
          color: #64748b;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 2px 6px;
          border-radius: 2px;
        }

        .gap-desc {
          font-size: 12.5px;
          color: #111827;
        }

        .gap-impact {
          font-size: 11.5px;
          color: #64748b;
          line-height: 1.4;
          margin-top: 4px;
        }
        .impact-tag {
          font-size: 9.5px;
          color: #b45309;
          margin-right: 4px;
        }

        /* Next Actions */
        .actions-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .action-item-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px 16px;
          gap: 16px;
        }

        .act-status-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          width: 75px;
        }

        .act-id {
          font-size: 11px;
          color: #2563eb;
          font-weight: 700;
        }

        .act-tag {
          font-size: 9px;
          color: #64748b;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 1px 4px;
          border-radius: 2px;
        }

        .act-info {
          flex: 1;
        }

        .act-title {
          font-size: 13px;
          color: #111827;
          margin: 0 0 2px 0;
        }

        .act-desc {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .btn-action-jump {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: #ffffff;
          color: #2563eb;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 11.5px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .btn-action-jump:hover {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        /* Document Footer */
        .report-document-footer {
          display: flex;
          justify-content: space-between;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          color: #64748b;
        }

        /* Typography & Helper classes */
        .font-mono {
          font-family: 'IBM Plex Mono', 'SF Mono', Consolas, monospace;
        }
        .font-sans {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .text-cyan { color: #2563eb; }
        .text-green { color: #10b981; }
        .text-amber { color: #f59e0b; }
        .text-purple { color: #a78bfa; }
        .text-muted { color: #64748b; }
        .text-secondary { color: #94a3b8; }
        .text-truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .text-truncate-sm {
          max-width: 140px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .status-pill-sm {
          display: inline-block;
          font-size: 9.5px;
          padding: 2px 6px;
          border-radius: 2px;
          font-weight: 600;
        }
        .status-available {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.35);
        }
        .status-review-required {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .status-reviewed {
          background: rgba(56, 189, 248, 0.15);
          color: #2563eb;
          border: 1px solid rgba(56, 189, 248, 0.35);
        }

        /* PRINT STYLESHEET */
        @media print {
          .no-print {
            display: none !important;
          }
          body, .report-workspace-root {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
          .report-document-sheet {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm 15mm !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            color: #0f172a !important;
          }
          .brand-text, .cover-heading, .sec-title, .hop-name, .vasp-name, .geo-location, .act-title {
            color: #0f172a !important;
          }
          .summary-card, .profile-card, .sub-panel, .signal-report-card, .upi-desc-box, .upi-txs-box, .vasp-candidate-card, .geo-report-card, .gap-card, .action-item-card, .hop-badge-col, .report-metadata-grid {
            background: #f8fafc !important;
            border-color: #334155 !important;
            color: #0f172a !important;
          }
          .report-data-table th {
            background: #f1f5f9 !important;
            color: #475569 !important;
          }
          .report-data-table td {
            color: #0f172a !important;
            border-bottom-color: #334155 !important;
          }
          .investigator-interpretation-container {
            background: #f0fdf4 !important;
            border-color: #10b981 !important;
          }
          .note-text {
            color: #064e3b !important;
          }
          .legal-standard-disclaimer {
            background: #fffbeb !important;
            border-color: #f59e0b !important;
            color: #92400e !important;
          }
          .report-page-section {
            page-break-inside: avoid;
          }
        }

        /* Interactive Print Preview Simulation Mode */
        .print-layout-active .report-document-sheet {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 0 20px rgba(0,0,0,0.5) !important;
        }
        .print-layout-active .brand-text,
        .print-layout-active .cover-heading,
        .print-layout-active .sec-title,
        .print-layout-active .hop-name,
        .print-layout-active .vasp-name,
        .print-layout-active .geo-location,
        .print-layout-active .act-title,
        .print-layout-active .note-author {
          color: #0f172a !important;
        }
        .print-layout-active .cover-subheading,
        .print-layout-active .section-narrative,
        .print-layout-active .summary-text,
        .print-layout-active .card-v,
        .print-layout-active .hop-assoc,
        .print-layout-active .sig-v,
        .print-layout-active .upi-v,
        .print-layout-active .vasp-activity,
        .print-layout-active .geo-derived-box,
        .print-layout-active .gap-desc,
        .print-layout-active .act-desc {
          color: #334155 !important;
        }
        .print-layout-active .summary-card,
        .print-layout-active .profile-card,
        .print-layout-active .sub-panel,
        .print-layout-active .signal-report-card,
        .print-layout-active .upi-desc-box,
        .print-layout-active .upi-txs-box,
        .print-layout-active .vasp-candidate-card,
        .print-layout-active .geo-report-card,
        .print-layout-active .gap-card,
        .print-layout-active .action-item-card,
        .print-layout-active .hop-badge-col,
        .print-layout-active .report-metadata-grid {
          background: #f8fafc !important;
          border-color: #334155 !important;
        }
        .print-layout-active .report-data-table th {
          background: #f1f5f9 !important;
          color: #475569 !important;
        }
        .print-layout-active .report-data-table td {
          color: #0f172a !important;
          border-bottom-color: #334155 !important;
        }
        .print-layout-active .investigator-interpretation-container {
          background: #f0fdf4 !important;
          border-color: #10b981 !important;
        }
        .print-layout-active .note-text {
          color: #064e3b !important;
        }
        .print-layout-active .legal-standard-disclaimer {
          background: #fffbeb !important;
          border-color: #f59e0b !important;
          color: #92400e !important;
        }
      `}</style>
    </div>
  );
};
