import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowUpRight, 
  BriefcaseBusiness,
  Layers,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import { normalizeCase } from '../services/normalizer';
import { formatWallet } from '../utils/formatWallet';
import '../components/investigation/investigationWorkspace.css';

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [railFilter, setRailFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCases();
      const normalized = Array.isArray(data) ? data.map(normalizeCase) : [];
      setCases(normalized);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
      setError(err.message || 'Unable to load cases from backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (c.id || '').toLowerCase().includes(q) ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.wallet || '').toLowerCase().includes(q) ||
        (c.assignedInvestigator || '').toLowerCase().includes(q);

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || (c.status || '').toUpperCase() === statusFilter;

      // Rail filter
      const matchesRail = 
        railFilter === 'ALL' ||
        (railFilter === 'CRYPTO' && (c.blockchain || '').toLowerCase().includes('eth') || (c.blockchain || '').toLowerCase().includes('btc')) ||
        (railFilter === 'UPI' && (c.name || '').toLowerCase().includes('upi'));

      // Risk filter
      const matchesRisk = 
        riskFilter === 'ALL' || 
        (c.riskLevel || c.priority || '').toUpperCase() === riskFilter;

      return matchesSearch && matchesStatus && matchesRail && matchesRisk;
    });
  }, [cases, searchQuery, statusFilter, railFilter, riskFilter]);

  return (
    <div className="workspace-shell">
      {/* Top Header */}
      <div className="workspace-topbar">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-primary-text)' }}>
            Investigation Cases Registry
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--color-secondary-text)' }}>
            Active multi-rail financial fraud casework, evidence dossiers, and LEA disclosures
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="button button-secondary" 
            onClick={fetchCases} 
            disabled={loading} 
            title="Refresh case list"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/cases/new">
            <button className="button button-primary">
              <Plus size={14} /> <span>New Case</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="workspace-card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
            <Search size={15} color="var(--color-secondary-text)" />
            <input 
              type="text"
              placeholder="Search by case ID, title, target address, or investigator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--color-surface-soft)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '12px',
                color: 'var(--color-primary-text)'
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={13} /> Risk:
            </span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                className={`workspace-btn ${riskFilter === lvl ? 'primary' : ''}`}
                onClick={() => setRiskFilter(lvl)}
                style={{ fontSize: '11px', padding: '4px 9px' }}
              >
                {lvl}
              </button>
            ))}

            <div style={{ width: '1px', height: '18px', background: 'var(--color-border)', margin: '0 4px' }} />

            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
              Rail:
            </span>
            {['ALL', 'CRYPTO', 'UPI'].map((r) => (
              <button
                key={r}
                className={`workspace-btn ${railFilter === r ? 'primary' : ''}`}
                onClick={() => setRailFilter(r)}
                style={{ fontSize: '11px', padding: '4px 9px' }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="workspace-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="workspace-card-header" style={{ padding: '14px 20px' }}>
          <div className="workspace-card-title">
            <BriefcaseBusiness size={15} color="var(--color-accent)" />
            <span>Cataloged Cases ({filteredCases.length})</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
            PostgreSQL Encrypted Persistence
          </span>
        </div>

        {loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-secondary-text)' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px auto', color: 'var(--color-accent)' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Loading case dossiers from persistence layer...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '36px', textAlign: 'center' }}>
            <AlertCircle size={28} color="var(--color-critical)" style={{ margin: '0 auto 10px auto' }} />
            <p style={{ color: 'var(--color-critical)', margin: '0 0 12px 0', fontSize: '13px' }}>{error}</p>
            <button className="button button-secondary" onClick={fetchCases}>Retry Connection</button>
          </div>
        )}

        {!loading && !error && filteredCases.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted-text)' }}>
            <BriefcaseBusiness size={32} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
            <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}>No investigation cases match the active filter criteria.</p>
            <Link to="/cases/new">
              <button className="button button-primary"><Plus size={14} /> Open New Case</button>
            </Link>
          </div>
        )}

        {!loading && !error && filteredCases.length > 0 && (
          <div className="workspace-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Case Identifier</th>
                  <th>Title & Description</th>
                  <th>Subject Target</th>
                  <th>Rail Scope</th>
                  <th>Risk Indicator</th>
                  <th>Status</th>
                  <th>Investigator</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((item) => {
                  const sevClass = (item.riskLevel || item.priority || 'low').toLowerCase();

                  return (
                    <tr key={item.id}>
                      <td>
                        <Link to={`/case/${encodeURIComponent(item.id)}/overview`} className="mono-hash" style={{ fontWeight: 700 }}>
                          {item.id}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-primary-text)' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>{item.description || 'Cryptocurrency tracing dossier'}</div>
                      </td>
                      <td>
                        <span className="mono-hash">{formatWallet(item.wallet)}</span>
                      </td>
                      <td>
                        <span className="rail-pill crypto">{item.blockchain || 'CRYPTO'}</span>
                      </td>
                      <td>
                        <span className={`severity-pill ${sevClass}`}>
                          {item.riskLevel || item.priority || 'LOW'}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge complete">{item.status}</span>
                      </td>
                      <td style={{ color: 'var(--color-secondary-text)', fontSize: '11.5px' }}>
                        {item.assignedInvestigator || 'LE Officer'}
                      </td>
                      <td style={{ color: 'var(--color-muted-text)', fontSize: '11px' }}>
                        {item.updated || 'Just now'}
                      </td>
                      <td>
                        <Link 
                          to={`/case/${encodeURIComponent(item.id)}/overview`}
                          className="workspace-btn"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          <span>Open</span>
                          <ArrowUpRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
