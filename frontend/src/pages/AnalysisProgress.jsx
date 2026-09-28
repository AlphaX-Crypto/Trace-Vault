import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Network, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import AnalysisStep from '../components/investigation/AnalysisStep';
import Button from '../components/common/Button';
import api from '../services/api';
import './phase2.css';

const WORKFLOW_STAGES = [
  'Initializing investigation & verifying case',
  'Normalizing blockchain transactions',
  'Building NetworkX transaction graph',
  'Executing BFS path traversal',
  'Attributing potential VASP associations',
  'Calculating risk indicators & signals',
  'Compiling forensic evidence schedule',
  'Persisting investigation in PostgreSQL'
];

export default function AnalysisProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const caseId = params.id || location.state?.caseId;
  const walletAddress = location.state?.walletAddress;
  const blockchain = location.state?.blockchain || 'ethereum';
  const maxHops = location.state?.maxHops || 3;

  // Request Lifecycle: 'SUBMITTED' | 'PROCESSING' | 'RESULT_RECEIVED' | 'COMPLETE' | 'ERROR'
  const [lifecycleState, setLifecycleState] = useState('SUBMITTED');
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const hasInitiatedRef = useRef(false);

  const runAnalysis = async () => {
    if (!caseId) {
      setErrorMessage('No case ID provided for analysis.');
      setLifecycleState('ERROR');
      return;
    }

    setLifecycleState('SUBMITTED');
    setCurrentStageIndex(0);
    setErrorMessage(null);

    // Progress animation during request lifecycle
    const timer = setInterval(() => {
      setCurrentStageIndex((idx) => {
        if (idx < WORKFLOW_STAGES.length - 2) return idx + 1;
        return idx;
      });
    }, 450);

    try {
      setLifecycleState('PROCESSING');

      let targetWallet = walletAddress;
      // If wallet not in router state, fetch case from backend to obtain subject_identifier
      if (!targetWallet) {
        const caseRecord = await api.getCase(caseId);
        targetWallet = caseRecord.subject_identifier;
      }

      if (!targetWallet) {
        throw new Error('Case does not have an associated suspect wallet address to analyze.');
      }

      // Dispatch real analysis request to Express backend -> Python FastAPI -> NetworkX
      const result = await api.analyzeCase(caseId, {
        wallet_address: targetWallet,
        blockchain: blockchain.toLowerCase(),
        max_hops: maxHops
      });

      clearInterval(timer);
      setCurrentStageIndex(WORKFLOW_STAGES.length - 1);
      setLifecycleState('RESULT_RECEIVED');
      setAnalysisResult(result);

      // Brief confirmation pause before navigating to overview
      setTimeout(() => {
        setLifecycleState('COMPLETE');
        setTimeout(() => {
          navigate(`/case/${encodeURIComponent(caseId)}/overview`, { replace: true });
        }, 600);
      }, 500);
    } catch (err) {
      clearInterval(timer);
      console.error('Analysis failed:', err);
      setErrorMessage(err.message || 'Analysis could not be completed by intelligence engine.');
      setLifecycleState('ERROR');
    }
  };

  useEffect(() => {
    if (!hasInitiatedRef.current) {
      hasInitiatedRef.current = true;
      runAnalysis();
    }
  }, []);

  const percent = Math.round(((currentStageIndex + 1) / WORKFLOW_STAGES.length) * 100);

  return (
    <div className="analysis-page">
      <div className="phase-heading">
        <div>
          <p className="eyebrow">Real Intelligence Pipeline</p>
          <h1>
            {lifecycleState === 'COMPLETE'
              ? 'Analysis complete'
              : lifecycleState === 'ERROR'
              ? 'Analysis halted'
              : 'Executing graph intelligence pipeline'}
          </h1>
          <p>
            {lifecycleState === 'ERROR'
              ? 'An error occurred during backend analysis.'
              : 'Traversing multi-hop ledger graph, identifying VASP associations, and generating forensic evidence.'}
          </p>
        </div>
        <span className="phase-marker mono">ANALYSIS / 02</span>
      </div>

      <section className="analysis-workspace" aria-live="polite">
        <div className="analysis-target">
          <Network aria-hidden="true" />
          <div>
            <span>Target ledger</span>
            <strong>{blockchain.toUpperCase()}</strong>
          </div>
          <div>
            <span>Case Reference</span>
            <strong className="mono">{caseId || 'UNKNOWN'}</strong>
          </div>
          <div>
            <span>Suspect wallet</span>
            <strong className="mono">{walletAddress || 'Case Target'}</strong>
          </div>
        </div>

        {lifecycleState !== 'ERROR' ? (
          <>
            <div className="progress-readout">
              <div>
                <span>Investigation progression</span>
                <strong className="mono">{String(percent).padStart(2, '0')}%</strong>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={percent}
              >
                <span style={{ width: `${percent}%` }} />
              </div>
            </div>

            <ol className="analysis-steps">
              {WORKFLOW_STAGES.map((step, index) => {
                let status = 'pending';
                if (index < currentStageIndex) status = 'completed';
                else if (index === currentStageIndex) status = 'current';
                return (
                  <AnalysisStep
                    key={step}
                    index={index}
                    label={step}
                    status={status}
                  />
                );
              })}
            </ol>

            {lifecycleState === 'COMPLETE' && (
              <div className="analysis-complete">
                <CheckCircle2 aria-hidden="true" />
                <span>
                  <strong>Analysis Complete</strong>
                  Persisted to PostgreSQL. Opening investigation overview…
                </span>
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: '2.5rem',
            textAlign: 'center',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid var(--color-danger, #ef4444)',
            borderRadius: '6px',
            margin: '1.5rem 0'
          }}>
            <AlertCircle style={{ color: 'var(--color-danger, #ef4444)', margin: '0 auto 1rem', width: 36, height: 36 }} />
            <h3 style={{ color: 'var(--color-danger, #ef4444)', marginBottom: '0.75rem' }}>Intelligence Analysis Failed</h3>
            <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem', color: 'var(--text-muted)' }}>{errorMessage}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to={`/case/${encodeURIComponent(caseId)}/overview`} className="button button-secondary">
                <ArrowLeft /> Return to Case
              </Link>
              <Button onClick={runAnalysis}>
                <RefreshCw /> Retry Analysis
              </Button>
            </div>
          </div>
        )}
      </section>

      <p className="analysis-disclaimer">
        Live investigation pipeline: NetworkX BFS pathfinding → Heuristic VASP attribution → Risk intelligence → PostgreSQL persistence.
      </p>
    </div>
  );
}
