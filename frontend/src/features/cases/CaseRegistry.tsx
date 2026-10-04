import React, { useState } from 'react';
import { CaseData } from './CreateCaseModal';

interface CaseRegistryProps {
  cases: CaseData[];
  onSelectCase: (caseId: string) => void;
  onOpenCreateModal: () => void;
  onBackToOverview: () => void;
}

export const CaseRegistry: React.FC<CaseRegistryProps> = ({
  cases,
  onSelectCase,
  onOpenCreateModal,
  onBackToOverview
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  const filtered = cases.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.targetIdentifier.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'All' || c.type === filterType || c.status === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="registry-root">
      {/* Registry Top Bar */}
      <div className="registry-header-row">
        <div className="header-left">
          <button type="button" onClick={onBackToOverview} className="btn-back">
            ← Overview
          </button>
          <div className="header-titles">
            <h1 className="registry-title">Case Registry</h1>
            <p className="registry-subtitle">Active financial investigations, crypto traces, and domestic UPI matters.</p>
          </div>
        </div>

        <button type="button" onClick={onOpenCreateModal} className="btn-new-case">
          + New Case
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="registry-controls-card">
        <div className="pill-filters">
          {['All', 'Crypto', 'UPI', 'Cross-Rail', 'Active', 'Review'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterType(f)}
              className={`filter-pill ${filterType === f ? 'filter-pill-active' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="search-box">
          <span className="search-icon" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search cases, identifiers, or titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Cases Table */}
      <div className="cases-table-card">
        <div className="table-responsive">
          <table className="registry-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Investigation Title</th>
                <th>Type</th>
                <th>Target Identifier</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectCase(item.id)}
                  className="registry-row"
                  title="Click to open Case Detail"
                >
                  <td className="font-mono cell-case-id">{item.id}</td>
                  <td className="cell-title">
                    <span className="title-text">{item.title}</span>
                    <span className="desc-preview">{item.description}</span>
                  </td>
                  <td>
                    <span className="type-badge">{item.type}</span>
                  </td>
                  <td className="font-mono text-muted">{item.targetIdentifier}</td>
                  <td>
                    <span className={`priority-pill priority-${item.priority.toLowerCase()}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge">{item.status}</span>
                  </td>
                  <td className="text-muted">{item.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .registry-root {
          max-width: 1440px;
          width: 100%;
          margin: 0 auto;
          padding: 32px 32px 64px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: 'Inter', sans-serif;
          background-color: #f8fafc;
        }

        .registry-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .btn-back {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-back:hover {
          color: #1e293b;
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .header-titles {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .registry-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
        }

        .registry-subtitle {
          font-size: 13.5px;
          color: #64748b;
        }

        .btn-new-case {
          background: #2563eb;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          padding: 9px 20px;
          border-radius: 8px;
          border: 1px solid #2563eb;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-new-case:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        .registry-controls-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 20px;
          flex-wrap: wrap;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .pill-filters {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .filter-pill {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 12px;
          padding: 5px 14px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .filter-pill:hover {
          color: #1e293b;
          border-color: #cbd5e1;
        }

        .filter-pill-active {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #2563eb;
          font-weight: 600;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0 12px;
          height: 38px;
          width: 300px;
        }

        .search-icon {
          color: #94a3b8;
          margin-right: 8px;
        }

        .search-input {
          background: transparent;
          border: none;
          outline: none;
          color: #111827;
          font-size: 13px;
          width: 100%;
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .cases-table-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }

        .registry-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
        }

        .registry-table th {
          padding: 12px 18px;
          background: #f8fafc;
          color: #64748b;
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e2e8f0;
        }

        .registry-row {
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .registry-row:hover {
          background: #f8fafc;
        }

        .registry-table td {
          padding: 14px 18px;
          color: #334155;
          vertical-align: middle;
        }

        .cell-case-id {
          color: #2563eb;
          font-size: 12.5px;
          font-weight: 600;
        }

        .cell-title {
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-width: 360px;
        }

        .title-text {
          color: #111827;
          font-weight: 600;
        }

        .desc-preview {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .type-badge {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 11.5px;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .priority-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 9999px;
          display: inline-block;
        }

        .priority-critical {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
        }

        .priority-high {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fde68a;
        }

        .priority-medium {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .priority-low {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .status-badge {
          font-size: 11.5px;
          font-weight: 500;
          color: #059669;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 2px 8px;
          border-radius: 9999px;
          display: inline-block;
        }

        .font-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .text-muted {
          color: #64748b;
        }
      `}</style>
    </div>
  );
};
