import { useParams } from 'react-router-dom';
import { AlertCircle, RefreshCw, Cpu, CheckCircle } from 'lucide-react';
import CaseHeader from '../components/case/CaseHeader';
import CaseTabs from '../components/case/CaseTabs';
import AttributionSummary from '../components/attribution/AttributionSummary';
import ConfidenceMeter from '../components/attribution/ConfidenceMeter';
import AttributionPath from '../components/attribution/AttributionPath';
import AttributionEvidence from '../components/attribution/AttributionEvidence';
import RiskAssessment from '../components/attribution/RiskAssessment';
import RiskIndicatorTable from '../components/attribution/RiskIndicatorTable';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useInvestigation } from '../utils/useInvestigation';
import './phase4.css';

export default function AttributionRisk() {
  const { id } = useParams();
  const { investigation, loading, error, reload } = useInvestigation(id);

  if (loading) {
    return (
      <>
        <CaseHeader />
        <CaseTabs />
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading attribution findings and risk intelligence...</p>
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
            {error || 'Unable to load attribution intelligence.'}
          </p>
          <Button variant="secondary" onClick={reload}><RefreshCw /> Retry</Button>
        </div>
      </>
    );
  }

  const { attribution, path, risk, evidence, reasoningTrace } = investigation.intelligence;

  return (
    <>
      <CaseHeader investigation={investigation} />
      <CaseTabs />

      <div className="intel-page-title">
        <div>
          <span>Case Intelligence & Attribution</span>
          <h2>Attribution and Risk Findings</h2>
          <p>Explainable analytical VASP association and heuristic risk indicators.</p>
        </div>
        <div>
          <span>Assigned Authority</span>
          <strong>{investigation.investigator || 'CYBERCRIME INVESTIGATION WING'}</strong>
        </div>
      </div>

      <div className="attribution-layout">
        <AttributionSummary attribution={attribution} />
        <ConfidenceMeter attribution={attribution} />
      </div>

      {reasoningTrace && reasoningTrace.length > 0 && (
        <Card
          className="reasoning-trace-card"
          title="Explainable Reasoning Trace"
          subtitle="System execution audit from NetworkX traversal to heuristic VASP attribution"
          action={<Cpu aria-hidden="true" />}
        >
          <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {reasoningTrace.map((step, idx) => (
              <li key={idx} style={{ color: 'var(--text-normal, #cbd5e1)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-heading, #f8fafc)', marginRight: '0.5rem' }}>
                  Step {idx + 1}:
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="attribution-supporting">
        <AttributionPath caseId={investigation.id} path={path} />
        <AttributionEvidence evidence={evidence} />
      </div>

      <RiskAssessment risk={risk} />
      <RiskIndicatorTable indicators={risk.indicators} />
    </>
  );
}
