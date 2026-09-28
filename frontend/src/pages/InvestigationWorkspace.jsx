import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  RotateCw, 
  Copy, 
  Check, 
  Download, 
  AlertTriangle 
} from 'lucide-react';
import api from '../services/api';
import { getLocalScenarioResult } from '../data/investigationScenarios';
import './investigationWorkspace.css';

// 9 Official Investigation Tabs
import WorkspaceOverviewTab from '../components/investigation/workspace/WorkspaceOverviewTab';
import WorkspaceTransactionsTab from '../components/investigation/workspace/WorkspaceTransactionsTab';
import WorkspaceGraphTab from '../components/investigation/workspace/WorkspaceGraphTab';
import WorkspaceTimelineTab from '../components/investigation/workspace/WorkspaceTimelineTab';
import WorkspaceRiskTab from '../components/investigation/workspace/WorkspaceRiskTab';
import WorkspaceAttributionTab from '../components/investigation/workspace/WorkspaceAttributionTab';
import WorkspaceGeospatialTab from '../components/investigation/workspace/WorkspaceGeospatialTab';
import WorkspaceEvidenceTab from '../components/investigation/workspace/WorkspaceEvidenceTab';
import WorkspaceReportTab from '../components/investigation/workspace/WorkspaceReportTab';

const TABS = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'transactions', label: 'TRANSACTIONS' },
  { id: 'graph', label: 'GRAPH' },
  { id: 'timeline', label: 'TIMELINE' },
  { id: 'risk', label: 'RISK' },
  { id: 'attribution', label: 'ATTRIBUTION' },
  { id: 'geospatial', label: 'GEOSPATIAL' },
  { id: 'evidence', label: 'EVIDENCE' },
  { id: 'report', label: 'REPORT' }
];

export default function InvestigationWorkspace() {
  const { id, tab: routeTab } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(routeTab || 'overview');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reRunning, setReRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync tab with route parameter
  useEffect(() => {
    if (routeTab && routeTab !== activeTab) {
      setActiveTab(routeTab);
    }
  }, [routeTab]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getInvestigation(id || 'INV-001');
      setResult(data);
    } catch (err) {
      console.warn('Falling back to deterministic scenario result:', err.message);
      setResult(getLocalScenarioResult(id || 'INV-001'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleSelectTab(tabId) {
    setActiveTab(tabId);
    navigate(`/investigations/${encodeURIComponent(id || 'INV-001')}/${tabId}`, { replace: true });
  }

  async function handleReRun() {
    setReRunning(true);
    try {
      const updated = await api.runInvestigation(id || 'INV-001');
      setResult(updated);
    } catch (err) {
      console.warn('Re-run error:', err.message);
    } finally {
      setReRunning(false);
    }
  }

  function handleCopyId() {
    if (result?.investigation_id) {
      navigator.clipboard.writeText(result.investigation_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleExportJSON() {
    if (!result) return null;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${result.investigation_id || 'INVESTIGATION'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  if (loading) {
    return (
      <div className="tv-workspace-loading">
        <RotateCw size={24} className="spin" color="var(--accent-primary)" />
        <span className="mono text-muted" style={{ fontSize: '12px' }}>
          Loading investigation workspace...
        </span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="tv-workspace-error anim-workspace">
        <div className="tv-card" style={{ padding: '36px', textAlign: 'center', maxWidth: '500px', margin: '60px auto' }}>
          <AlertTriangle size={32} color="var(--risk-critical)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Investigation Record Not Found</h3>
          <p className="text-secondary" style={{ fontSize: '12.5px', margin: '0 0 20px 0' }}>
            Could not retrieve data for identifier <code>{id}</code>.
          </p>
          <button className="tv-btn-primary" onClick={() => navigate('/cases')}>
            <ArrowLeft size={13} />
            <span>Return to Cases Ledger</span>
          </button>
        </div>
      </div>
    );
  }

  const subject = result.subject || {};
  const risk = result.risk_summary || {};
  const isSynthetic = result.source_summary?.[0]?.synthetic !== false;
  const rails = result.rails_analyzed || (subject.type === 'upi_vpa' ? ['UPI'] : ['Ethereum']);
  const caseId = result.case_id || 'CASE-2026-001';
  const caseTitle = result.title || (caseId === 'CASE-2025-081' ? 'DarkNet Mixer Trace' : 'Operation CryptoSweep');
  const riskScore = risk.overall_score || 78;
  const riskLevel = risk.severity || 'HIGH';

  return (
    <div className="tv-investigation-workspace anim-workspace">
      {/* CASE CONTEXT BAR matching Section 8 & Transactiongraph.png */}
      <div className="tv-case-context-bar">
        <div className="tv-context-left">
          <button 
            className="tv-btn-back-cases" 
            onClick={() => navigate('/cases')}
            title="Return to Cases Ledger"
          >
            <ArrowLeft size={14} />
          </button>

          <span className="tv-badge tv-badge-mono font-semibold">{caseId}</span>
          <span className="tv-case-context-title">{caseTitle}</span>

          <span className="tv-badge tv-risk-low font-semibold">Active</span>
          <span className={`tv-badge ${riskScore >= 70 ? 'tv-risk-high' : 'tv-risk-medium'} font-semibold`}>
            {riskLevel} Risk
          </span>

          <div className="tv-context-rails-list">
            {rails.map((r) => (
              <span key={r} className="tv-badge tv-rail-crypto font-medium">{r}</span>
            ))}
          </div>

          {isSynthetic && (
            <span className="tv-badge tv-synthetic-badge">
              SYNTHETIC DEMONSTRATION DATA
            </span>
          )}
        </div>

        <div className="tv-context-right">
          <span className="tv-context-subject mono text-muted">
            Target: <strong className="text-primary">{subject.id ? `${subject.id.slice(0, 10)}...` : '0x71c8...1350'}</strong>
          </span>

          <button 
            className="tv-btn-context-action" 
            onClick={handleReRun}
            disabled={reRunning}
            title="Re-run investigation orchestration pipeline"
          >
            <RotateCw size={12} className={reRunning ? 'spin' : ''} />
            <span>{reRunning ? 'Tracing...' : 'Re-run'}</span>
          </button>

          <button 
            className="tv-btn-context-action" 
            onClick={handleExportJSON}
            title="Export raw JSON dossier"
          >
            <Download size={12} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS BAR */}
      <div className="tv-investigation-tabs-bar" role="tablist">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={`tv-investigation-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleSelectTab(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* WORKSPACE VIEW (ONE SCREEN = ONE INVESTIGATIVE JOB) */}
      <div className="tv-tab-content-area anim-workspace">
        {activeTab === 'overview' && (
          <WorkspaceOverviewTab result={result} onSelectTab={handleSelectTab} />
        )}
        {activeTab === 'transactions' && (
          <WorkspaceTransactionsTab result={result} />
        )}
        {activeTab === 'graph' && (
          <WorkspaceGraphTab result={result} />
        )}
        {activeTab === 'timeline' && (
          <WorkspaceTimelineTab result={result} />
        )}
        {activeTab === 'risk' && (
          <WorkspaceRiskTab result={result} />
        )}
        {activeTab === 'attribution' && (
          <WorkspaceAttributionTab result={result} />
        )}
        {activeTab === 'geospatial' && (
          <WorkspaceGeospatialTab result={result} />
        )}
        {activeTab === 'evidence' && (
          <WorkspaceEvidenceTab result={result} />
        )}
        {activeTab === 'report' && (
          <WorkspaceReportTab result={result} />
        )}
      </div>
    </div>
  );
}
