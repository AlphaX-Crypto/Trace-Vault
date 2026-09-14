import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Database, Filter, Search } from 'lucide-react';
import { api } from '../../services/api';

const Evidence = () => {
  const { caseId } = useParams();
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvidence(caseId).then(data => {
      setEvidence(data);
      setLoading(false);
    });
  }, [caseId]);

  return (
    <div className="evidence-container">
      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            <Database size={18} className="icon" />
            <h3>Evidence Register</h3>
          </div>
          <div className="actions" style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <div className="search-bar" style={{ width: '200px' }}>
              <Search size={14} className="search-icon" />
              <input type="text" placeholder="Search evidence..." />
            </div>
            <button className="btn btn-outline" style={{ padding: 'var(--spacing-2)' }}>
              <Filter size={16} />
            </button>
          </div>
        </div>
        
        <div className="table-container">
          {loading ? (
            <div className="loading mono">LOADING EVIDENCE...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Relevance</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((item) => (
                  <tr key={item.id}>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{item.id}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-highlight)' }}>
                        {item.type}
                      </span>
                    </td>
                    <td>
                      {item.type === 'Transaction' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className="mono text-muted">Hash: {item.hash}</span>
                          <span>{item.amount} {item.asset}</span>
                        </div>
                      )}
                      {item.type === 'Entity Tag' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span>{item.tag}</span>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Source: {item.source}</span>
                        </div>
                      )}
                      {item.type === 'Behavior' && (
                        <span>{item.description}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${item.relevance.toLowerCase()}`}>{item.relevance}</span>
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

export default Evidence;
