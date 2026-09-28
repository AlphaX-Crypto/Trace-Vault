import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle, 
  FileWarning, 
  Scale, 
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function WorkspaceLimitationsTab({ result }) {
  const limitations = result?.limitations || [];
  const status = result?.status || 'COMPLETE';
  const isPartial = status === 'PARTIAL';

  return (
    <div className="workspace-tab-panel">
      {/* Partial Execution Alert (if applicable) */}
      {isPartial && (
        <div className="workspace-card" style={{ borderLeft: '4px solid var(--color-medium)' }}>
          <div className="workspace-card-header">
            <div className="workspace-card-title" style={{ color: 'var(--color-medium)' }}>
              <FileWarning size={16} />
              <span>Partial Investigation Execution Notice</span>
            </div>
            <span className="status-badge partial">STATUS: PARTIAL</span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--color-primary-text)' }}>
            One or more intelligence domains were omitted or encountered missing data during this execution cycle. Downstream risk aggregation has been calculated based solely on available inputs. Review the limitations below for scope details.
          </p>
        </div>
      )}

      {/* Disclaimers & Known Limitations */}
      <div className="workspace-card">
        <div className="workspace-card-header">
          <div className="workspace-card-title">
            <AlertTriangle size={15} color="#e6a23c" />
            <span>Scope Limitations & Disclaimers ({limitations.length})</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
            Formal Analytical Boundary Disclosures
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {limitations.map((lim, idx) => (
            <div 
              key={idx} 
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--color-surface-soft)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12.5px',
                lineHeight: '1.5'
              }}
            >
              <HelpCircle size={16} color="#e6a23c" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ color: 'var(--color-primary-text)' }}>{lim}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Institutional Legal Boundary Cards */}
      <div className="workspace-grid-2">
        <div className="workspace-card">
          <div className="workspace-card-header">
            <div className="workspace-card-title">
              <Scale size={15} />
              <span>Non-Inferential Legal Boundary</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.6', color: 'var(--color-secondary-text)' }}>
            TRACEVAULT applies strict non-inferential terminology. Analytical links between cryptocurrency addresses and UPI Virtual Payment Addresses (VPAs) indicate data-level correlations (such as exchange off-ramp transaction logs) and do NOT prove or imply that the accounts are controlled by the same legal individual. Beneficial ownership must be verified through formal legal requests (e.g. CrPC Section 91 notices).
          </p>
        </div>

        <div className="workspace-card">
          <div className="workspace-card-header">
            <div className="workspace-card-title">
              <Clock size={15} />
              <span>Temporal Integrity & Data Freshness</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.6', color: 'var(--color-secondary-text)' }}>
            Timestamps are preserved strictly as reported by authoritative ledgers and banking switches. Missing or unverifiable timestamps are explicitly marked as <code>TIME UNKNOWN</code> and are never artificially estimated or backfilled. Data freshness is tied to indexer block latency and core banking switch settlement feeds.
          </p>
        </div>
      </div>
    </div>
  );
}
