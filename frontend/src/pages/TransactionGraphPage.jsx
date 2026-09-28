import { useParams, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import CaseHeader from '../components/case/CaseHeader';
import CaseTabs from '../components/case/CaseTabs';
import TransactionGraph from '../components/graph/TransactionGraph';
import Button from '../components/common/Button';
import { useInvestigation } from '../utils/useInvestigation';

export default function TransactionGraphPage() {
  const { id } = useParams();
  const { investigation, loading, error, reload } = useInvestigation(id);

  if (loading) {
    return (
      <>
        <CaseHeader />
        <CaseTabs />
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Generating interactive transaction graph from NetworkX traversal data...</p>
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
            {error || 'Unable to load transaction graph for this investigation.'}
          </p>
          <Button variant="secondary" onClick={reload}><RefreshCw /> Retry</Button>
        </div>
      </>
    );
  }

  const hasGraphData = investigation.graph?.nodes?.length > 0;

  return (
    <>
      <CaseHeader investigation={investigation} />
      <CaseTabs />
      <div className="graph-page-heading">
        <div>
          <span>Transaction Intelligence</span>
          <h2>Fund Movement Graph</h2>
          <p>Interactive NetworkX graph traversal showing hops, intermediary clusters, and VASP deposit destinations.</p>
        </div>
        <dl>
          <div>
            <dt>Target Ledger</dt>
            <dd>{investigation.blockchain}</dd>
          </div>
          <div>
            <dt>Path Distance</dt>
            <dd>{investigation.hops} {investigation.hops === 1 ? 'hop' : 'hops'}</dd>
          </div>
          <div>
            <dt>Attribution Confidence</dt>
            <dd>{investigation.confidence}%</dd>
          </div>
        </dl>
      </div>

      {!hasGraphData && (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: 'var(--surface-subtle)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          margin: '1.5rem 0'
        }}>
          <p style={{ marginBottom: '1.25rem' }}>No transaction graph has been generated for this case yet.</p>
          <Link to={`/cases/${encodeURIComponent(investigation.id)}/analysis`} className="button button-primary">
            Run Analysis Now
          </Link>
        </div>
      )}

      {hasGraphData && (
        <TransactionGraph investigation={investigation} />
      )}
    </>
  );
}
