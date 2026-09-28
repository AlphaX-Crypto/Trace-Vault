import React from 'react';
import { 
  GitCommit, 
  CheckCircle2, 
  Clock, 
  Terminal, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function WorkspaceReasoningTab({ result }) {
  const trace = result?.reasoning_trace || [];

  return (
    <div className="workspace-tab-panel">
      {/* Top Card */}
      <div className="workspace-card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
        <div className="workspace-card-header">
          <div className="workspace-card-title">
            <GitCommit size={16} color="var(--color-accent)" />
            <span>Deterministic 16-Step Orchestration Reasoning Trace</span>
          </div>
          <span className="status-badge complete">100% REPRODUCIBLE</span>
        </div>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--color-primary-text)' }}>
          Every investigation executed by TRACEVAULT follows a deterministic 16-step execution lifecycle. The reasoning trace below provides a complete audit trail of how data sources were gathered, domain algorithms were applied, graph structures were traversed, and risks were synthesized.
        </p>
      </div>

      {/* Step Sequence */}
      <div className="workspace-card">
        <div className="workspace-card-header">
          <div className="workspace-card-title">
            <Terminal size={15} />
            <span>Execution Lifecycle Log ({trace.length} Steps)</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
            Investigation ID: <code>{result?.investigation_id}</code>
          </span>
        </div>

        <div className="reasoning-list">
          {trace.map((stepStr, idx) => {
            // Extract step number if available
            const match = stepStr.match(/^Step\s*(\d+):?\s*(.*)$/i);
            const stepNum = match ? match[1] : (idx + 1);
            const stepText = match ? match[2] : stepStr;

            return (
              <div key={idx} className="reasoning-step-item">
                <span className="step-num-badge">STEP {String(stepNum).padStart(2, '0')}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--color-primary-text)', fontWeight: 500 }}>
                    {stepText}
                  </div>
                </div>
                <CheckCircle2 size={15} color="var(--color-low)" style={{ marginTop: '2px' }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
