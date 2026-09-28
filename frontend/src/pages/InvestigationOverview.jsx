import { useParams, Link } from 'react-router-dom';
import { Play, AlertCircle, RefreshCw } from 'lucide-react';
import CaseHeader from '../components/case/CaseHeader';
import CaseTabs from '../components/case/CaseTabs';
import WalletDetailsCard from '../components/investigation/WalletDetailsCard';
import RiskAssessmentCard from '../components/investigation/RiskAssessmentCard';
import AttributionCard from '../components/investigation/AttributionCard';
import InvestigationSummary from '../components/investigation/InvestigationSummary';
import TransactionSummary from '../components/investigation/TransactionSummary';
import InvestigationStatus from '../components/investigation/InvestigationStatus';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useInvestigation } from '../utils/useInvestigation';
import './phase2.css';

export default function InvestigationOverview() {
  const { id } = useParams();
  const { investigation, loading, error, reload } = useInvestigation(id);

  if (loading) {
    return (
      <>
        <div className="case-header">
          <div>
            <div className="case-id mono">{id}</div>
            <h1>Loading Case Details...</h1>
          </div>
        </div>
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Retrieving case records and analysis from database...</p>
        </div>
      </>
    );
  }

  if (error || !investigation) {
    return (
      <>
        <div className="case-header">
          <div>
            <div className="case-id mono">{id}</div>
            <h1>Investigation Unavailable</h1>
          </div>
          <Link to="/cases" className="button button-secondary">Back to cases</Link>
        </div>
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle style={{ color: 'var(--color-danger, #ef4444)', margin: '0 auto 1rem', width: 36, height: 36 }} />
          <p style={{ color: 'var(--color-danger, #ef4444)', marginBottom: '1.5rem' }}>
            {error || `Case '${id}' could not be loaded.`}
          </p>
          <Button variant="secondary" onClick={reload}>
            <RefreshCw /> Retry
          </Button>
        </div>
      </>
    );
  }

  const isUnanalyzed = !investigation.analysis && investigation.status === 'OPEN';

  return (
    <>
      <CaseHeader investigation={investigation} />
      <CaseTabs />

      {isUnanalyzed && (
        <Card
          className="unanalyzed-banner"
          title="Analysis Pending"
          subtitle="This case has been registered but has not yet undergone transaction graph traversal."
          action={
            <Link
              to={`/cases/${encodeURIComponent(investigation.id)}/analysis`}
              state={{
                caseId: investigation.id,
                walletAddress: investigation.wallet,
                blockchain: investigation.blockchainRaw || 'ethereum',
                maxHops: 3
              }}
            >
              <Button>
                <Play /> Run Intelligence Analysis
              </Button>
            </Link>
          }
        >
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Clicking &quot;Run Intelligence Analysis&quot; will invoke the Python NetworkX Intelligence Engine,
            traverse connected addresses, attribute probable VASP deposit endpoints, and compute composite risk indicators.
          </p>
        </Card>
      )}

      <div className="overview-primary">
        <WalletDetailsCard investigation={investigation} />
        <RiskAssessmentCard investigation={investigation} />
      </div>

      <div className="overview-secondary">
        <AttributionCard investigation={investigation} />
        <TransactionSummary investigation={investigation} />
        <InvestigationStatus investigation={investigation} />
      </div>

      <InvestigationSummary investigation={investigation} />
    </>
  );
}
