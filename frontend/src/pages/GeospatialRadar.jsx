import React, { useState } from 'react';
import WorkspaceGeospatialTab from '../components/investigation/workspace/WorkspaceGeospatialTab';
import { getLocalScenarioResult, PRESET_SCENARIOS_SUMMARY } from '../data/investigationScenarios';
import './investigationWorkspace.css';

export default function GeospatialRadar() {
  const [selectedCaseId, setSelectedCaseId] = useState('INV-005');
  const result = getLocalScenarioResult(selectedCaseId);

  return (
    <div className="tv-investigation-workspace anim-workspace">
      {/* Top Ribbon */}
      <div className="tv-case-context-bar" style={{ marginBottom: '14px' }}>
        <div className="tv-context-left">
          <span className="tv-badge tv-badge-mono font-semibold">GEOSPATIAL RADAR</span>
          <span className="tv-case-context-title">Tactical Location Signals &amp; IPDR Triangulation</span>

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
          <span className="tv-badge tv-risk-low font-medium">Phase 14 Engine Live</span>
        </div>
      </div>

      {/* Dedicated Tactical Radar Workspace */}
      <WorkspaceGeospatialTab result={result} />
    </div>
  );
}
