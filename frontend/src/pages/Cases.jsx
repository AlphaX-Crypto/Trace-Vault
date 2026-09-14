import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';
import { api } from '../services/api';

const Cases = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCases().then(data => {
      setCases(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="cases-container">
      <div className="dashboard-header mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Case Registry</h2>
        <button className="btn btn-primary" onClick={() => navigate('/cases/new')}>
          <Plus size={16} /> New Investigation
        </button>
      </div>

      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
          <div className="actions" style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <div className="search-bar" style={{ width: '300px' }}>
              <Search size={14} className="search-icon" />
              <input type="text" placeholder="Search cases by ID or wallet..." />
            </div>
            <button className="btn btn-outline" style={{ padding: 'var(--spacing-2)' }}>
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading mono text-center py-6" style={{ padding: '2rem' }}>LOADING CASES...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Title</th>
                  <th>Subject Wallet</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Attribution</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.caseId}>
                    <td className="mono">{c.caseId}</td>
                    <td>{c.title}</td>
                    <td className="mono text-muted">{c.subjectWallet.slice(0, 10)}...{c.subjectWallet.slice(-4)}</td>
                    <td>
                      <span className={`badge ${c.riskLevel.toLowerCase()}`}>{c.riskLevel}</span>
                    </td>
                    <td>{c.status}</td>
                    <td>{c.attribution.entity}</td>
                    <td>
                      <button className="btn btn-outline" onClick={() => navigate(`/cases/${c.caseId}`)}>
                        Open
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

export default Cases;
