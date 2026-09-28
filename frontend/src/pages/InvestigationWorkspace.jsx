import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Layers, 
  Clock, 
  FileText, 
  Cpu, 
  GitBranch, 
  GitCommit, 
  AlertTriangle, 
  Printer, 
  ShieldCheck, 
  RotateCw, 
  Copy, 
  Download, 
  Check, 
  Share2, 
  ArrowLeft 
} from 'lucide-react';
import api from '../services/api';
import { getLocalScenarioResult } from '../data/investigationScenarios';
import '../components/investigation/investigationWorkspace.css';

// Tab Components
import WorkspaceOverviewTab from '../components/investigation/workspace/WorkspaceOverviewTab';
import WorkspaceRiskTab from '../components/investigation/workspace/WorkspaceRiskTab';
import WorkspaceGraphTab from '../components/investigation/workspace/WorkspaceGraphTab';
import WorkspaceTimelineTab from '../components/investigation/workspace/WorkspaceTimelineTab';
import WorkspaceIntelligenceTab from '../components/investigation/workspace/WorkspaceIntelligenceTab';
import WorkspaceCrossRailTab from '../components/investigation/workspace/WorkspaceCrossRailTab';
import WorkspaceEvidenceTab from '../components/investigation/workspace/WorkspaceEvidenceTab';
import WorkspaceReasoningTab from '../components/investigation/workspace/WorkspaceReasoningTab';
import WorkspaceLimitationsTab from '../components/investigation/workspace/WorkspaceLimitationsTab';
import WorkspaceReportTab from '../components/investigation/workspace/WorkspaceReportTab';
import WorkspaceAuditTab from '../components/investigation/workspace/WorkspaceAuditTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Layers },
  { id: 'risk', label: 'Risk & Scoring', icon: ShieldAlert },
  { id: 'graph', label: 'Unified Graph', icon: Share2 },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'intelligence', label: 'Intelligence', icon: Cpu },
  { id: 'crossrail', label: 'Cross-Rail', icon: GitBranch },
  { id: 'evidence', label: 'Evidence', icon: FileText },
  { id: 'reasoning', label: 'Reasoning Trace', icon: GitCommit },
  { id: 'limitations', label: 'Limitations', icon: AlertTriangle },
  { id: 'report', label: 'Report', icon: Printer },
  { id: 'audit', label: 'Audit', icon: ShieldCheck }
];

export default function InvestigationWorkspace() {
  const { id, tab: routeTab } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(routeTab || 'overview');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reRunning, setReRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync tab with route parameter if present
  useEffect(() => {
    if (routeTab && routeTab !== activeTab) {
      setActiveTab(routeTab);
    }
  }, [routeTab]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getInvestigation(id || 'INV-004');
      setResult(data);
    } catch (err) {
      console.warn('Falling back to local scenario result:', err.message);
      setResult(getLocalScenarioResult(id || 'INV-004'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleSelectTab(tabId) {
    setActiveTab(tabId);
    navigate(`/investigations/${encodeURIComponent(id || 'INV-004')}/${tabId}`, { replace: true });
  }

  async function handleReRun() {
    setReRunning(true);
    try {
      const updated = await api.runInvestigation(id || 'INV-004');
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
    if (!result) return;
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
      <div className="workspace-shell" style={{ alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <RotateCw size={28} className="spin" color="var(--color-accent)" />
          <div style={{ fontSize: '13px', color: 'var(--color-secondary-text)' }}>
            Loading multi-rail investigation workspace...
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="workspace-shell">
        <div className="workspace-card" style={{ padding: '36px', textAlign: 'center' }}>
          <AlertTriangle size={32} color="var(--color-critical)" style={{ margin: '0 auto 12px auto' }} />
          <h3>Investigation Record Not Found</h3>
          <p style={{ color: 'var(--color-secondary-text)' }}>
            Could not retrieve data for identifier <code>{id}</code>.
          </p>
          <button className="workspace-btn primary" onClick={() => navigate('/investigations')} style={{ margin: '12px auto 0 auto' }}>
            <ArrowLeft size={14} /> Return to Investigations
          </button>
        </div>
      </div>
    );
  }

  const subject = result.subject || {};
  const risk = result.risk_summary || {};
  const statusClass = (result.status || 'complete').toLowerCase();
  const sevClass = (risk.severity || 'low').toLowerCase();
  const isSynthetic = result.source_summary?.[0]?.synthetic || false;

  return (
    <div className="workspace-shell">
      {/* 1. Workspace Top Bar */}
      <header className="workspace-topbar">
        <div className="workspace-topbar-meta">
          <button 
            className="workspace-btn" 
            onClick={() => navigate('/investigations')} 
            style={{ padding: '4px 8px' }}
            title="Back to Investigations Directory"
          >
            <ArrowLeft size={14} />
          </button>
          <span className="workspace-id-badge">{result.investigation_id}</span>
          <span className="workspace-case-id">CASE: <strong>{result.case_id}</strong></span>

          <span className="workspace-subject-pill">
            <span style={{ textTransform: 'uppercase', color: 'var(--color-secondary-text)', fontSize: '11px' }}>
              {subject.type}:
            </span>
            <code>{subject.id}</code>
          </span>

          <span className={`workspace-provenance-tag ${isSynthetic ? 'synthetic' : ''}`}>
            {isSynthetic ? 'SYNTHETIC DEMONSTRATION' : (result.source_summary?.[0]?.source_type || 'MOCK')}
          </span>
        </div>

        <div className="workspace-topbar-actions">
          <button 
            className="workspace-btn" 
            onClick={handleCopyId}
            title="Copy Investigation ID"
          >
            {copied ? <Check size={13} color="var(--color-low)" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy ID'}</span>
          </button>

          <button 
            className="workspace-btn" 
            onClick={handleExportJSON}
            title="Export raw JSON dossier"
          >
            <Download size={13} />
            <span>Export JSON</span>
          </button>

          <button 
            className="workspace-btn primary" 
            onClick={handleReRun}
            disabled={reRunning}
            title="Re-run orchestration pipeline"
          >
            <RotateCw size={13} className={reRunning ? 'spin' : ''} />
            <span>{reRunning ? 'Executing...' : 'Re-run'}</span>
          </button>
        </div>
      </header>

      {/* 2. Risk & Status Ribbon */}
      <section className="workspace-ribbon" aria-label="Investigation status overview">
        <div className="ribbon-cell">
          <span className="ribbon-label">Unified Risk Score</span>
          <div className="ribbon-val">
            <span style={{ color: risk.overall_score >= 80 ? 'var(--color-critical)' : risk.overall_score >= 50 ? 'var(--color-high)' : 'var(--color-low)' }}>
              {risk.overall_score?.toFixed(1) ?? '0.0'}
            </span>
            <span className="ribbon-sub">/ 100</span>
          </div>
          <span className={`severity-pill ${sevClass}`} style={{ width: 'fit-content' }}>
            {risk.severity || 'LOW'}
          </span>
        </div>

        <div className="ribbon-cell">
          <span className="ribbon-label">Confidence Score</span>
          <div className="ribbon-val">
            <span>{risk.confidence ?? 80}%</span>
          </div>
          <span className="ribbon-sub">Deterministic Heuristics</span>
        </div>

        <div className="ribbon-cell">
          <span className="ribbon-label">Scope & Rails Analyzed</span>
          <div className="rail-badge-group" style={{ marginTop: '4px' }}>
            {result.rails_analyzed?.map((r) => (
              <span key={r} className={`rail-pill ${r.toLowerCase().replace('_', '-')}`}>{r}</span>
            ))}
          </div>
          <span className="ribbon-sub">{result.graph_summary?.total_nodes ?? 0} graph entities</span>
        </div>

        <div className="ribbon-cell">
          <span className="ribbon-label">Lifecycle Status</span>
          <span className={`status-badge ${statusClass}`} style={{ marginTop: '4px' }}>
            {result.status}
          </span>
          <span className="ribbon-sub">16 Steps Completed</span>
        </div>
      </section>

      {/* 3. Navigation Tabs Bar */}
      <nav className="workspace-tabs-nav" aria-label="Investigation Workspace Navigation">
        {TABS.map(({ id: tabId, label, icon: Icon }) => {
          let count = null;
          if (tabId === 'timeline') count = result.timeline?.length;
          if (tabId === 'evidence') count = result.evidence_items?.length;
          if (tabId === 'crossrail') count = result.cross_rail_associations?.length;
          if (tabId === 'reasoning') count = result.reasoning_trace?.length;
          if (tabId === 'limitations') count = result.limitations?.length;

          return (
            <button
              key={tabId}
              className={`workspace-tab-btn ${activeTab === tabId ? 'active' : ''}`}
              onClick={() => handleSelectTab(tabId)}
            >
              <Icon size={14} />
              <span>{label}</span>
              {count != null && <span className="tab-badge">{count}</span>}
            </button>
          );
        })}
      </nav>

      {/* 4. Active Tab Content Panel */}
      <main>
        {activeTab === 'overview' && (
          <WorkspaceOverviewTab result={result} onSelectTab={handleSelectTab} />
        )}
        {activeTab === 'risk' && (
          <WorkspaceRiskTab result={result} />
        )}
        {activeTab === 'graph' && (
          <WorkspaceGraphTab result={result} />
        )}
        {activeTab === 'timeline' && (
          <WorkspaceTimelineTab result={result} />
        )}
        {activeTab === 'intelligence' && (
          <WorkspaceIntelligenceTab result={result} />
        )}
        {activeTab === 'crossrail' && (
          <WorkspaceCrossRailTab result={result} />
        )}
        {activeTab === 'evidence' && (
          <WorkspaceEvidenceTab result={result} />
        )}
        {activeTab === 'reasoning' && (
          <WorkspaceReasoningTab result={result} />
        )}
        {activeTab === 'limitations' && (
          <WorkspaceLimitationsTab result={result} />
        )}
        {activeTab === 'report' && (
          <WorkspaceReportTab result={result} />
        )}
        {activeTab === 'audit' && (
          <WorkspaceAuditTab result={result} />
        )}
      </main>
    </div>
  );
}
