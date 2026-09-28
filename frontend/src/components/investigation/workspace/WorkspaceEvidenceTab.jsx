import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Filter, 
  ShieldCheck, 
  Download, 
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function WorkspaceEvidenceTab({ result }) {
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const evidenceItems = result?.evidence_items || [];

  const filteredItems = useMemo(() => {
    if (categoryFilter === 'ALL') return evidenceItems;
    return evidenceItems.filter((e) => {
      const cat = (e.category || '').toUpperCase();
      if (categoryFilter === 'CRYPTO') return cat.includes('CRYPTO');
      if (categoryFilter === 'UPI') return cat.includes('UPI');
      if (categoryFilter === 'VASP') return cat.includes('VASP');
      if (categoryFilter === 'CROSS_RAIL') return cat.includes('CROSS') || cat.includes('BRIDGE');
      if (categoryFilter === 'LOCATION') return cat.includes('LOC') || cat.includes('GEO');
      return true;
    });
  }, [evidenceItems, categoryFilter]);

  function exportEvidenceJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(evidenceItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `EVIDENCE-${result?.investigation_id || 'EXPORT'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  return (
    <div className="workspace-tab-panel">
      {/* Evidence Controls */}
      <div className="workspace-card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} /> Filter Category:
            </span>
            {['ALL', 'CRYPTO', 'UPI', 'VASP', 'CROSS_RAIL', 'LOCATION'].map((c) => (
              <button
                key={c}
                className={`workspace-btn ${categoryFilter === c ? 'primary' : ''}`}
                onClick={() => setCategoryFilter(c)}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                {c.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-secondary-text)' }}>
              <strong>{filteredItems.length}</strong> of <strong>{evidenceItems.length}</strong> Items
            </span>
            <button className="workspace-btn" onClick={exportEvidenceJSON}>
              <Download size={13} /> Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Structured Evidence Table */}
      <div className="workspace-card">
        <div className="workspace-card-header">
          <div className="workspace-card-title">
            <FileText size={15} />
            <span>Structured Investigative Evidence Schedule</span>
          </div>
          <span className="status-badge complete">SUITABLE FOR LAW ENFORCEMENT REVIEW</span>
        </div>

        {filteredItems.length > 0 ? (
          <div className="workspace-table-container">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Evidence ID</th>
                  <th>Category</th>
                  <th>Reference / Transaction Hash</th>
                  <th>Confidence</th>
                  <th>Source Provenance</th>
                  <th>Analytical Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={item.evidence_id || idx}>
                    <td>
                      <span className="mono-hash" style={{ fontWeight: 700 }}>
                        {item.evidence_id || `EV-${idx + 1}`}
                      </span>
                    </td>
                    <td>
                      <span className="rail-pill" style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)' }}>
                        {item.category || 'GENERAL_RECORD'}
                      </span>
                    </td>
                    <td>
                      <span className="mono-hash">{item.reference_hash || item.transaction_reference || 'N/A'}</span>
                    </td>
                    <td>
                      <strong>{item.confidence ?? 100}%</strong>
                    </td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--color-secondary-text)' }}>
                        {item.source || 'SYSTEM'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-secondary-text)', lineHeight: '1.4' }}>
                      {item.description || 'Evidentiary artifact captured during automated multi-rail trace.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-muted-text)', fontSize: '13px' }}>
            No evidentiary items match the active category filter.
          </div>
        )}
      </div>

      {/* Evidentiary Standard Notice */}
      <div className="limitation-box">
        <h4><CheckCircle2 size={15} color="var(--color-low)" /> Evidence Integrity Standard</h4>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-secondary-text)', lineHeight: '1.5' }}>
          Items listed in this schedule constitute structured investigative evidence suitable for review by financial crime investigators and regulatory authorities. All records preserve source timestamps, transaction hashes, and strict isolation between live on-chain data and synthetic demonstration data.
        </p>
      </div>
    </div>
  );
}
