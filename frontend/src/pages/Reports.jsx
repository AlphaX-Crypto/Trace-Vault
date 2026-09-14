import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, FileText } from 'lucide-react';
import { api } from '../services/api';

const Reports = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reusing cases data for reports list for Demo Mode
    api.getCases().then(data => {
      setCases(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="reports-container">
      <div className="dashboard-header mb-6">
        <h2>Intelligence Reports</h2>
      </div>

      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
          <div className="actions" style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <div className="search-bar" style={{ width: '300px' }}>
              <Search size={14} className="search-icon" />
              <input type="text" placeholder="Search reports..." />
            </div>
            <button className="btn btn-outline" style={{ padding: 'var(--spacing-2)' }}>
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading mono text-center py-6" style={{ padding: '2rem' }}>LOADING REPORTS...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Case ID</th>
                  <th>Generated Date</th>
                  <th>Risk Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.caseId}>
                    <td className="mono">REP-{c.caseId.split('-')[1]}</td>
                    <td className="mono text-muted">{c.caseId}</td>
                    <td>{new Date(c.created).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${c.riskLevel.toLowerCase()}`}>{c.riskLevel}</span>
                    </td>
                    <td>
                      <button className="btn btn-outline" onClick={() => navigate(`/cases/${c.caseId}/report`)}>
                        <FileText size={14} style={{ marginRight: '4px' }} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
