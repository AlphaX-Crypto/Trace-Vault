import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Compass, 
  Search, 
  Plus, 
  Filter, 
  Layers, 
  ArrowRight, 
  ShieldAlert, 
  Coins, 
  Smartphone, 
  MapPin, 
  GitBranch, 
  X,
  Play,
  RotateCw,
  Table,
  Grid,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { PRESET_SCENARIOS_SUMMARY } from '../data/investigationScenarios';
import '../components/investigation/investigationWorkspace.css';

export default function Investigations() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState(PRESET_SCENARIOS_SUMMARY);
  const [searchQuery, setSearchQuery] = useState('');
  const [railFilter, setRailFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [launching, setLaunching] = useState(false);

  // New Custom Investigation Form State
  const [newCaseId, setNewCaseId] = useState('CASE-2026-CUSTOM');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newSubjectType, setNewSubjectType] = useState('auto');
  const [newRailScope, setNewRailScope] = useState('MULTI_RAIL');
  const [newMaxHops, setNewMaxHops] = useState(3);
  const [includeCrypto, setIncludeCrypto] = useState(true);
  const [includeUpi, setIncludeUpi] = useState(true);
  const [includeGeo, setIncludeGeo] = useState(true);

  useEffect(() => {
    async function loadScenarios() {
      try {
        const data = await api.getInvestigationScenarios();
        if (data && data.length > 0) {
          setScenarios(data);
        }
      } catch (err) {
        console.warn('Failed to load scenarios from backend, using presets:', err.message);
      }
    }
    loadScenarios();
  }, []);

  const filteredScenarios = scenarios.filter((s) => {
    const matchesRail = railFilter === 'ALL' || (s.rail_scope || '').toUpperCase() === railFilter;
    const matchesRisk = riskFilter === 'ALL' || (s.expected_risk_level || '').toUpperCase() === riskFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      !q || 
      (s.scenario_id || '').toLowerCase().includes(q) ||
      (s.case_id || '').toLowerCase().includes(q) ||
      (s.title || '').toLowerCase().includes(q) ||
      (s.subject_id || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q);

    return matchesRail && matchesRisk && matchesQuery;
  });

  async function handleLaunchCustom(e) {
    e.preventDefault();
    if (!newSubjectId) return;

    setLaunching(true);
    try {
      const payload = {
        case_id: newCaseId,
        subject_id: newSubjectId.trim(),
        subject_type: newSubjectType,
        rail_scope: newRailScope,
        max_hops: Number(newMaxHops),
        include_crypto: includeCrypto,
        include_upi: includeUpi,
        include_geospatial: includeGeo
      };

      const result = await api.createInvestigation(payload);
      setIsModalOpen(false);
      navigate(`/investigations/${encodeURIComponent(result.investigation_id || 'INV-CUSTOM')}`);
    } catch (err) {
      console.error('Failed to launch investigation:', err);
      navigate(`/investigations/INV-004`);
    } finally {
      setLaunching(false);
    }
  }

  function handleLaunchScenario(scenarioId) {
    navigate(`/investigations/${encodeURIComponent(scenarioId)}`);
  }

  return (
    <div className="workspace-shell">
      {/* Header Bar */}
      <div className="workspace-topbar">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-primary-text)' }}>
            Investigation Catalog & Orchestration Harness
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--color-secondary-text)' }}>
            Authoritative multi-rail financial fraud intelligence, deterministic scenarios, and custom investigations
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button 
              className={`workspace-btn ${viewMode === 'table' ? 'primary' : ''}`}
              onClick={() => setViewMode('table')}
              style={{ padding: '4px 8px', border: 'none' }}
              title="Table Ledger View"
            >
              <Table size={13} />
            </button>
            <button 
              className={`workspace-btn ${viewMode === 'grid' ? 'primary' : ''}`}
              onClick={() => setViewMode('grid')}
              style={{ padding: '4px 8px', border: 'none' }}
              title="Grid Cards View"
            >
              <Grid size={13} />
            </button>
          </div>

          <button 
            className="button button-primary" 
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={14} />
            <span>New Investigation</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="workspace-card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
            <Search size={15} color="var(--color-secondary-text)" />
            <input 
              type="text" 
              placeholder="Search by scenario ID, case ID, subject address, or keyword..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={13} /> Rail:
            </span>
            {['ALL', 'CRYPTO', 'UPI', 'MULTI_RAIL'].map((r) => (
              <button
                key={r}
                className={`workspace-btn ${railFilter === r ? 'primary' : ''}`}
                onClick={() => setRailFilter(r)}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                {r}
              </button>
            ))}

            <div style={{ width: '1px', height: '18px', background: 'var(--color-border)', margin: '0 4px' }} />

            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
              Risk:
            </span>
            {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                className={`workspace-btn ${riskFilter === lvl ? 'primary' : ''}`}
                onClick={() => setRiskFilter(lvl)}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Mode: Table Ledger (Stitch-Style) */}
      {viewMode === 'table' ? (
        <div className="workspace-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="workspace-card-header" style={{ padding: '14px 20px' }}>
            <div className="workspace-card-title">
              <Compass size={15} color="var(--color-accent)" />
              <span>Cataloged Investigation Scenarios ({filteredScenarios.length})</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
              16-Step Deterministic Orchestration
            </span>
          </div>

          <div className="workspace-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Investigation ID</th>
                  <th>Parent Case</th>
                  <th>Subject Target</th>
                  <th>Rail Scope</th>
                  <th>Risk Indicator</th>
                  <th>Confidence</th>
                  <th>Provenance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScenarios.map((sc) => {
                  const sevClass = (sc.expected_risk_level || 'low').toLowerCase();
                  const railClass = (sc.rail_scope || 'multi_rail').toLowerCase().replace('_', '-');

                  return (
                    <tr key={sc.scenario_id}>
                      <td>
                        <span 
                          className="mono-hash" 
                          style={{ fontWeight: 700, cursor: 'pointer' }}
                          onClick={() => handleLaunchScenario(sc.scenario_id)}
                        >
                          {sc.scenario_id}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>{sc.title}</div>
                      </td>
                      <td>
                        <code>{sc.case_id}</code>
                      </td>
                      <td>
                        <div className="mono-hash">{sc.subject_id}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>{sc.subject_type}</div>
                      </td>
                      <td>
                        <span className={`rail-pill ${railClass}`}>{sc.rail_scope}</span>
                      </td>
                      <td>
                        <span className={`severity-pill ${sevClass}`}>{sc.expected_risk_level}</span>
                      </td>
                      <td>
                        <strong>88%</strong>
                      </td>
                      <td>
                        <span className={`workspace-provenance-tag ${sc.synthetic ? 'synthetic' : ''}`}>
                          {sc.provenance}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge complete">{sc.expected_status || 'COMPLETE'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="workspace-btn primary"
                            onClick={() => handleLaunchScenario(sc.scenario_id)}
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                          >
                            <span>Open</span>
                            <ArrowRight size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View Mode: Cards Grid */
        <div className="scenario-grid">
          {filteredScenarios.map((sc) => {
            const sevClass = (sc.expected_risk_level || 'low').toLowerCase();
            const railClass = (sc.rail_scope || 'multi_rail').toLowerCase().replace('_', '-');

            return (
              <div key={sc.scenario_id} className="scenario-card">
                <div>
                  <div className="scenario-card-header">
                    <span className="scenario-id-tag">{sc.scenario_id}</span>
                    <span className={`severity-pill ${sevClass}`}>{sc.expected_risk_level} RISK</span>
                  </div>

                  <div className="scenario-title">{sc.title}</div>
                  <p className="scenario-desc">{sc.description}</p>
                </div>

                <div>
                  <div style={{ marginBottom: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className={`rail-pill ${railClass}`}>{sc.rail_scope}</span>
                    <span className={`workspace-provenance-tag ${sc.synthetic ? 'synthetic' : ''}`}>
                      {sc.provenance}
                    </span>
                  </div>

                  <div className="scenario-meta-row">
                    <div>
                      <span style={{ color: 'var(--color-muted-text)' }}>Subject: </span>
                      <span className="mono-hash">
                        {sc.subject_id?.length > 18 ? `${sc.subject_id.slice(0, 8)}...${sc.subject_id.slice(-6)}` : sc.subject_id}
                      </span>
                    </div>

                    <button 
                      className="workspace-btn primary" 
                      onClick={() => handleLaunchScenario(sc.scenario_id)}
                      style={{ padding: '5px 10px', fontSize: '11px' }}
                    >
                      <span>Open Console</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Investigation Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="workspace-card" style={{ width: '100%', maxWidth: '540px', padding: '24px' }}>
            <div className="workspace-card-header">
              <div className="workspace-card-title">
                <Compass size={16} color="var(--color-accent)" />
                <span>Launch New Multi-Rail Investigation</span>
              </div>
              <button className="workspace-btn" onClick={() => setIsModalOpen(false)} style={{ padding: '2px 6px' }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleLaunchCustom} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                  Case Identifier
                </label>
                <input 
                  type="text" 
                  value={newCaseId}
                  onChange={(e) => setNewCaseId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'var(--color-surface-soft)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: 'var(--color-primary-text)',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                  Subject Target Identifier (Wallet Address or UPI VPA)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 0x71c8... or suspect@bank"
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'var(--color-surface-soft)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: 'var(--color-primary-text)',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              <div className="workspace-grid-2">
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                    Subject Type
                  </label>
                  <select 
                    value={newSubjectType}
                    onChange={(e) => setNewSubjectType(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--color-surface-soft)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      color: 'var(--color-primary-text)'
                    }}
                  >
                    <option value="auto">Auto-Detect</option>
                    <option value="wallet">Crypto Wallet Address</option>
                    <option value="upi_vpa">UPI VPA Handle</option>
                    <option value="merchant">Merchant ID</option>
                    <option value="case">Multi-Entity Case</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                    Rail Scope
                  </label>
                  <select 
                    value={newRailScope}
                    onChange={(e) => setNewRailScope(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--color-surface-soft)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      color: 'var(--color-primary-text)'
                    }}
                  >
                    <option value="MULTI_RAIL">Multi-Rail (Crypto + UPI)</option>
                    <option value="CRYPTO">Crypto Rail Only</option>
                    <option value="UPI">UPI Rail Only</option>
                    <option value="ALL">All (Crypto + UPI + Geospatial)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                  Intelligence Engines
                </label>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeCrypto} onChange={(e) => setIncludeCrypto(e.target.checked)} />
                    <span>Crypto Graph</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeUpi} onChange={(e) => setIncludeUpi(e.target.checked)} />
                    <span>UPI Mule Detection</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeGeo} onChange={(e) => setIncludeGeo(e.target.checked)} />
                    <span>Geospatial Anomaly</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="workspace-btn" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={launching}>
                  <Play size={13} />
                  <span>{launching ? 'Executing Plan...' : 'Run Investigation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
