import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import WorkspaceGraphTab from '../components/investigation/workspace/WorkspaceGraphTab';
import { getLocalScenarioResult, PRESET_SCENARIOS_SUMMARY } from '../data/investigationScenarios';
import api from '../services/api';
import './investigationWorkspace.css';

export default function TransactionGraphPage() {
  const [searchParams] = useSearchParams();
  const targetParam = searchParams.get('target');
  const [selectedCaseId, setSelectedCaseId] = useState(targetParam ? 'INV-001' : 'INV-001');
  const [result, setResult] = useState(() => getLocalScenarioResult('INV-001'));

  useEffect(() => {
    async function load() {
      try {
        const inv = await api.getInvestigation(selectedCaseId);
        if (inv) setResult(inv);
        else setResult(getLocalScenarioResult(selectedCaseId));
      } catch (_) {
        setResult(getLocalScenarioResult(selectedCaseId));
      }
    }
    load();
  }, [selectedCaseId]);

  return (
    <div className="tv-investigation-workspace anim-workspace">
      {/* Top Case Selector Ribbon */}
      <div className="tv-case-context-bar" style={{ marginBottom: '14px' }}>
        <div className="tv-context-left">
          <span className="tv-badge tv-badge-mono font-semibold">GRAPH WORKSPACE</span>
          <span className="tv-case-context-title">Value Movement &amp; Path Tracing</span>

          <select
            className="tv-select-mode"
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            style={{ padding: '4px 10px', fontSize: '11.5px', marginLeft: '8px' }}
          >
            {PRESET_SCENARIOS_SUMMARY.map((sc) => (
              <option key={sc.scenario_id} value={sc.scenario_id}>
                {sc.case_id} — {sc.title}
              </option>
            ))}
          </select>
        </div>

        <div className="tv-context-right">
          <span className="tv-badge tv-risk-low font-medium">Authoritative Engine Parity</span>
        </div>
      </div>

      {/* Render the full Graph Workspace (Controls + Canvas + Inspector) */}
      <WorkspaceGraphTab result={result} />
    </div>
  );
}
