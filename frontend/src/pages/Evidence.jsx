import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import CaseHeader from '../components/case/CaseHeader';
import CaseTabs from '../components/case/CaseTabs';
import EvidenceSummary from '../components/evidence/EvidenceSummary';
import EvidenceFilters from '../components/evidence/EvidenceFilters';
import EvidenceTable from '../components/evidence/EvidenceTable';
import EvidenceDetailPanel from '../components/evidence/EvidenceDetailPanel';
import Button from '../components/common/Button';
import { useInvestigation } from '../utils/useInvestigation';
import './phase4.css';

export default function Evidence() {
  const { id } = useParams();
  const { investigation, loading, error, reload } = useInvestigation(id);

  const evidence = useMemo(() => {
    return investigation?.intelligence?.evidence || [];
  }, [investigation]);

  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All statuses');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return evidence.filter((item) => {
      const typeMatch = type === 'All' || item.type === type;
      const statusMatch = status === 'All statuses' || item.status === status;
      return typeMatch && statusMatch;
    });
  }, [evidence, status, type]);

  function updateType(value) {
    setType(value);
    if (selected && value !== 'All' && selected.type !== value) setSelected(null);
  }

  function updateStatus(value) {
    setStatus(value);
    if (selected && value !== 'All statuses' && selected.status !== value) setSelected(null);
  }

  if (loading) {
    return (
      <>
        <CaseHeader />
        <CaseTabs />
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading forensic evidence locker from PostgreSQL...</p>
        </div>
      </>
    );
  }

  if (error || !investigation) {
    return (
      <>
        <CaseHeader />
        <CaseTabs />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle style={{ color: 'var(--color-danger, #ef4444)', margin: '0 auto 1rem', width: 36, height: 36 }} />
          <p style={{ color: 'var(--color-danger, #ef4444)', marginBottom: '1.5rem' }}>
            {error || 'Unable to load evidence records for this case.'}
          </p>
          <Button variant="secondary" onClick={reload}><RefreshCw /> Retry</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <CaseHeader investigation={investigation} />
      <CaseTabs />

      <div className="intel-page-title">
        <div>
          <span>Evidentiary Schedule</span>
          <h2>Forensic Evidence Locker</h2>
          <p>On-chain transactions, graph path traversals, and verified VASP registry corroborations.</p>
        </div>
        <div>
          <span>Case Reference</span>
          <strong className="mono">{investigation.id}</strong>
        </div>
      </div>

      <EvidenceSummary evidence={evidence} />

      <section className="evidence-register intel-panel">
        <EvidenceFilters
          type={type}
          onTypeChange={updateType}
          status={status}
          onStatusChange={updateStatus}
          count={filtered.length}
        />
        <div className="evidence-workspace">
          {evidence.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', width: '100%' }}>
              <p style={{ marginBottom: '1.25rem' }}>No evidence items recorded for this case yet.</p>
              <Link to={`/cases/${encodeURIComponent(investigation.id)}/analysis`} className="button button-primary">
                Run Analysis to Compile Evidence
              </Link>
            </div>
          ) : (
            <>
              <EvidenceTable
                evidence={filtered}
                selectedId={selected?.id}
                onSelect={setSelected}
              />
              <EvidenceDetailPanel item={selected} onClose={() => setSelected(null)} />
            </>
          )}
        </div>
      </section>

      <p className="evidence-disclaimer">
        Evidentiary artifacts are compiled algorithmically via NetworkX graph traversal and verified VASP registry matching.
      </p>
    </>
  );
}
