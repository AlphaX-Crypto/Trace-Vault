import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import CaseHeader from '../components/case/CaseHeader';
import CaseTabs from '../components/case/CaseTabs';
import ReportHeader from '../components/report/ReportHeader';
import ExecutiveSummary from '../components/report/ExecutiveSummary';
import SubjectWalletSection from '../components/report/SubjectWalletSection';
import TraceSummary from '../components/report/TraceSummary';
import AttributionFindings from '../components/report/AttributionFindings';
import RiskFindings from '../components/report/RiskFindings';
import ReportEvidenceSummary from '../components/report/ReportEvidenceSummary';
import InvestigativeAssessment from '../components/report/InvestigativeAssessment';
import ReportActions from '../components/report/ReportActions';
import PrepareActionPanel from '../components/action/PrepareActionPanel';
import Button from '../components/common/Button';
import { useInvestigation } from '../utils/useInvestigation';
import './report.css';

export default function Report() {
  const { id } = useParams();
  const { investigation, loading, error, reload } = useInvestigation(id);
  const [status, setStatus] = useState('Ready for Review');
  const [preparing, setPreparing] = useState(false);

  if (loading) {
    return (
      <>
        <CaseHeader />
        <CaseTabs />
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Compiling comprehensive forensic report from database records...</p>
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
            {error || 'Unable to generate report for this case.'}
          </p>
          <Button variant="secondary" onClick={reload}><RefreshCw /> Retry</Button>
        </div>
      </>
    );
  }

  const { attribution, path, risk, evidence } = investigation.intelligence;

  return (
    <>
      <CaseHeader investigation={investigation} />
      <CaseTabs />

      <ReportActions
        status={status}
        onPrint={() => window.print()}
        onReviewed={() => setStatus('Reviewed')}
        onPrepare={() => setPreparing(true)}
      />

      <article className="report-document">
        <ReportHeader investigation={investigation} status={status} />
        <ExecutiveSummary investigation={investigation} attribution={attribution} />
        <SubjectWalletSection investigation={investigation} />
        <TraceSummary investigation={investigation} path={path} attribution={attribution} />
        <AttributionFindings attribution={attribution} />
        <RiskFindings risk={risk} />
        <ReportEvidenceSummary caseId={investigation.id} evidence={evidence} />
        <InvestigativeAssessment
          investigation={investigation}
          attribution={attribution}
          evidence={evidence}
        />
        <footer className="report-footer">
          <strong>TRACEVAULT V2</strong>
          <span>GOVERNMENT LEA INTELLIGENCE DOSSIER · PRELIMINARY FORENSIC FINDINGS</span>
          <span className="mono">{investigation.id}</span>
        </footer>
      </article>

      {preparing && (
        <PrepareActionPanel
          investigation={investigation}
          onClose={() => setPreparing(false)}
        />
      )}
    </>
  );
}
