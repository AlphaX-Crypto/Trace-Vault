import React, { useState, useEffect } from 'react';
import { api, DataSourceState } from '../../api/client';

export interface RiskAnalysisWorkspaceProps {
  activeCaseId?: string;
  onBack: () => void;
  onNavigateToTransaction?: (txHash: string) => void;
  onNavigateToGraph?: (entityId?: string) => void;
  onNavigateToEvidence?: () => void;
  initialState?: 'analyzed' | 'empty' | 'loading' | 'error';
}

interface RiskSignal {
  id: string;
  name: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  contribution: number;
  summary: string;
  whyDetected: string;
  observedBehavior: {
    label: string;
    value: string;
  }[];
  metrics: {
    label: string;
    value: string;
  }[];
  supportingTx: {
    hash: string;
    label: string;
  };
  supportingEntity: {
    id: string;
    identifier: string;
    label: string;
  };
}

interface SupportingActivity {
  id: string;
  timestamp: string;
  rail: string;
  hash: string;
  from: string;
  to: string;
  amount: string;
  signal: string;
  signalSeverity: 'HIGH' | 'MEDIUM';
}

interface SupportingEntity {
  id: string;
  identifier: string;
  role: string;
  risk: 'High' | 'Medium' | 'Low';
  graphId: string;
}

const SIGNALS_DATA: RiskSignal[] = [
  {
    id: 'signal-1',
    name: 'Rapid Dispersion',
    severity: 'HIGH',
    category: 'Velocity / Structuring',
    contribution: 20,
    summary: '42.50 ETH dispersed across 8 new addresses within 4 minutes of receipt',
    whyDetected:
      'The subject address received a substantial inbound transfer of 42.50 ETH and immediately dispersed 99.95% of the funds across 8 newly created counterparty addresses within a 4-minute window. This behavior is characteristic of automated peeling and rapid dispersion aimed at fragmenting funds across multiple hops.',
    observedBehavior: [
      { label: 'Inflow', value: '42.50 ETH at 08:14 UTC' },
      { label: 'Outflow', value: '8 transactions totaling 42.48 ETH between 08:14 and 08:18 UTC' },
      { label: 'Retained balance', value: '0.02 ETH (residual balance)' }
    ],
    metrics: [
      { label: 'Dispersion Velocity', value: '10.6 ETH / min' },
      { label: 'Destination Age', value: 'All 8 destination addresses < 1 hour old' },
      { label: 'Peeling Factor', value: '99.95% balance swept' }
    ],
    supportingTx: {
      hash: '0x8ef2a9103c8b7b659fe10938bfe41209b0a124982',
      label: '0x8ef2a910...7b659f (42.50 ETH outbound)'
    },
    supportingEntity: {
      id: 'inter-a',
      identifier: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
      label: 'Intermediary Address A (Peeling Node)'
    }
  },
  {
    id: 'signal-2',
    name: 'Mixer / Privacy Pool Interaction',
    severity: 'HIGH',
    category: 'Anonymization',
    contribution: 20,
    summary: 'Indirect deposit of 30.00 ETH into privacy pool contract via intermediary hop',
    whyDetected:
      'Funds originating from the subject wallet were routed through an intermediary hop directly into known privacy pool smart contracts (Tornado Cash 10 ETH pool). The short time delta (6 minutes) and lack of operational delay indicate pre-programmed routing.',
    observedBehavior: [
      { label: 'Hop 1', value: '0x71F9A6... → 0x6D11A...E813C (30.00 ETH)' },
      { label: 'Hop 2', value: '0x6D11A...E813C → Tornado Cash 10 ETH Pool (3 deposits of 10.00 ETH each)' },
      { label: 'Time Delta', value: '6 minutes between arrival and pool deposit' }
    ],
    metrics: [
      { label: 'Hop Structure', value: '1-hop indirect routing' },
      { label: 'Anonymized Volume', value: '30.00 ETH equivalent' },
      { label: 'Contract Address', value: '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b' }
    ],
    supportingTx: {
      hash: '0x90272f6a88194c1e3e0984dacf746f1209384592',
      label: '0x90272f6a...cf746f (30.00 ETH Pool Deposit)'
    },
    supportingEntity: {
      id: 'mixer-1',
      identifier: '0x891C79028A3b7eF2904d98Fe942dF4426511aF89',
      label: 'Tornado Cash 10 ETH Pool'
    }
  },
  {
    id: 'signal-3',
    name: 'High Velocity Peeling',
    severity: 'MEDIUM',
    category: 'Peeling Chain',
    contribution: 15,
    summary: '4 consecutive peeling hops observed with decreasing amounts and new change addresses',
    whyDetected:
      'Consecutive peeling chain pattern where each hop strips a portion of value while forwarding the remaining balance to a fresh unverified change address. This deterministic pattern reduces exposure per hop and complicates single-transaction tracking.',
    observedBehavior: [
      { label: 'Hop 1', value: '42.50 ETH → 12.30 ETH stripped + 30.20 ETH forwarded' },
      { label: 'Hop 2', value: '30.20 ETH → 10.00 ETH stripped + 20.20 ETH forwarded' },
      { label: 'Hop 3', value: '20.20 ETH → 8.00 ETH stripped + 12.20 ETH forwarded' },
      { label: 'Hop 4', value: '12.20 ETH → 12.18 ETH forwarded to cross-chain bridge' }
    ],
    metrics: [
      { label: 'Chain Length', value: '4 consecutive hops' },
      { label: 'Strip Ratio', value: '28.9% stripped per hop average' },
      { label: 'Change Addresses', value: '4 single-use generation keys' }
    ],
    supportingTx: {
      hash: '0x94pd3819fa821c90038Fe942dF4426511aF890987',
      label: '0x94pd3819...ska134 (12.30 ETH peel)'
    },
    supportingEntity: {
      id: 'inter-b',
      identifier: '0x3AF17828C403dE4B07B4f114B5C1089b0A124982',
      label: 'Intermediary Address B (Hop 2 Relay)'
    }
  },
  {
    id: 'signal-4',
    name: 'Unusual Amount Structuring',
    severity: 'MEDIUM',
    category: 'Regulatory Threshold',
    contribution: 10,
    summary: 'Domestic UPI transfers structured just below standard reporting thresholds',
    whyDetected:
      'Multiple domestic payment transfers executed in rapid succession to designated intermediary accounts, each structured just below standard ₹50,000 regulatory surveillance thresholds following off-ramp liquidations.',
    observedBehavior: [
      { label: 'Transfer 1', value: '₹49,500 to vpa98@okhdfcbank at 08:32 UTC' },
      { label: 'Transfer 2', value: '₹48,800 to vpa98@okhdfcbank at 08:34 UTC' },
      { label: 'Transfer 3', value: '₹49,200 to vpa02@icici at 08:35 UTC' }
    ],
    metrics: [
      { label: 'Threshold Proximity', value: '97.6% - 99.0% of ₹50,000 limit' },
      { label: 'Off-Ramp Correlation', value: 'Tron TRC-20 OTC P2P liquidation' },
      { label: 'Velocity', value: '3 transfers within 3 minutes' }
    ],
    supportingTx: {
      hash: 'UPI_REF_9182390192849102830192',
      label: 'UPI_REF_91823901...92 (₹49,500 Domestic Transfer)'
    },
    supportingEntity: {
      id: 'vasp-1',
      identifier: 'vpa98@okhdfcbank',
      label: 'Intermediary Payment Endpoint (HDFC Bank)'
    }
  }
];

const SUPPORTING_ACTIVITIES: SupportingActivity[] = [
  {
    id: 'act-1',
    timestamp: '2026-09-29 08:14:22 UTC',
    rail: 'Ethereum',
    hash: '0x8ef2a9103c8b7b659fe10938bfe41209b0a124982',
    from: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
    to: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
    amount: '42.50 ETH',
    signal: 'Rapid Dispersion',
    signalSeverity: 'HIGH'
  },
  {
    id: 'act-2',
    timestamp: '2026-09-29 08:20:15 UTC',
    rail: 'Ethereum',
    hash: '0x90272f6a88194c1e3e0984dacf746f1209384592',
    from: '0x6D11A04913k8912E813C',
    to: '0x891C79028A...0D55E (Mixer)',
    amount: '30.00 ETH',
    signal: 'Mixer Interaction',
    signalSeverity: 'HIGH'
  },
  {
    id: 'act-3',
    timestamp: '2026-09-29 08:22:45 UTC',
    rail: 'Ethereum',
    hash: '0x94pd3819fa821c90038Fe942dF4426511aF890987',
    from: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
    to: '0x3AF17828C403dE4B07B4f114B5C1089b0A124982',
    amount: '12.30 ETH',
    signal: 'High Velocity Peeling',
    signalSeverity: 'MEDIUM'
  },
  {
    id: 'act-4',
    timestamp: '2026-09-29 08:35:10 UTC',
    rail: 'UPI Domestic',
    hash: 'UPI_REF_9182390192849102830192',
    from: '0x18D50244C...45502b',
    to: 'vpa98@okhdfcbank',
    amount: '₹49,500',
    signal: 'Unusual Structuring',
    signalSeverity: 'MEDIUM'
  }
];

const SUPPORTING_ENTITIES: SupportingEntity[] = [
  {
    id: 'ent-1',
    identifier: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
    role: 'Subject Wallet (Origin of Funds)',
    risk: 'High',
    graphId: 'suspect'
  },
  {
    id: 'ent-2',
    identifier: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
    role: 'Intermediary Address A (Peeling Node)',
    risk: 'High',
    graphId: 'inter-a'
  },
  {
    id: 'ent-3',
    identifier: '0x6D11A04913k8912E813C',
    role: 'Intermediary Address (Relay Node)',
    risk: 'High',
    graphId: 'unknown-1'
  },
  {
    id: 'ent-4',
    identifier: 'Tornado Cash 10 ETH Pool (0xd90e...F31b)',
    role: 'Privacy Pool Contract',
    risk: 'High',
    graphId: 'mixer-1'
  },
  {
    id: 'ent-5',
    identifier: 'vpa98@okhdfcbank',
    role: 'Intermediary Payment Endpoint',
    risk: 'High',
    graphId: 'vasp-1'
  }
];

export const RiskAnalysisWorkspace: React.FC<RiskAnalysisWorkspaceProps> = ({
  activeCaseId = 'CASE-2026-001',
  onBack,
  onNavigateToTransaction,
  onNavigateToGraph,
  onNavigateToEvidence,
  initialState = 'analyzed'
}) => {
  const [viewState, setViewState] = useState<'analyzed' | 'empty' | 'loading' | 'error'>(initialState);
  const [loadingStep, setLoadingStep] = useState(1);
  const [expandedSignals, setExpandedSignals] = useState<Record<string, boolean>>({
    'signal-1': true
  });
  const [evidenceAddedMap, setEvidenceAddedMap] = useState<Record<string, boolean>>({});

  const [dataSource, setDataSource] = useState<DataSourceState>('DEMO_SYNTHETIC');
  const [liveRiskScore, setLiveRiskScore] = useState<number>(72);
  const [liveRiskLevel, setLiveRiskLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [liveSignalCount, setLiveSignalCount] = useState<number>(4);

  useEffect(() => {
    let isMounted = true;
    async function loadRiskData() {
      try {
        const isHealthy = await api.checkHealth();
        if (!isHealthy) {
          if (isMounted) setDataSource('DEMO_SYNTHETIC');
          return;
        }

        const res = await api.post<any>(`/api/cases/${activeCaseId}/risk/analyze`, {});
        if (!isMounted) return;

        if (res.success && res.data) {
          setDataSource('LIVE_BACKEND');
          if (typeof res.data.overall_score === 'number') {
            setLiveRiskScore(res.data.overall_score);
          }
          if (res.data.risk_level) {
            setLiveRiskLevel(res.data.risk_level);
          }
          if (Array.isArray(res.data.signals)) {
            setLiveSignalCount(res.data.signals.length);
          }
        } else {
          setDataSource('DEMO_SYNTHETIC');
        }
      } catch {
        if (isMounted) setDataSource('BACKEND_UNAVAILABLE');
      }
    }

    loadRiskData();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSignal = (signalId: string) => {
    setExpandedSignals((prev) => ({
      ...prev,
      [signalId]: !prev[signalId]
    }));
  };

  const handleAddEvidence = (signalId: string) => {
    setEvidenceAddedMap((prev) => ({ ...prev, [signalId]: true }));
    if (onNavigateToEvidence) {
      // Available for case evidence linking
    }
    setTimeout(() => {
      setEvidenceAddedMap((prev) => ({ ...prev, [signalId]: false }));
    }, 2500);
  };

  const handleRunAnalysis = async () => {
    setViewState('loading');
    setLoadingStep(1);

    try {
      const res = await api.post<any>('/api/cases/CASE-2026-001/risk/analyze', {});
      if (res.success && res.data) {
        setDataSource('LIVE_BACKEND');
        if (typeof res.data.overall_score === 'number') {
          setLiveRiskScore(res.data.overall_score);
        }
        if (res.data.risk_level) {
          setLiveRiskLevel(res.data.risk_level);
        }
        if (Array.isArray(res.data.signals)) {
          setLiveSignalCount(res.data.signals.length);
        }
      }
    } catch {
      // Keep existing behavior or fall back gracefully
    }

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= 5) {
          clearInterval(stepInterval);
          setViewState('analyzed');
          return 5;
        }
        return prev + 1;
      });
    }, 300);
  };

  const formatAddress = (addr: string) => {
    if (addr.includes('@') || addr.includes('Bank') || addr.includes('Pool')) return addr;
    if (addr.length > 20) return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
    return addr;
  };

  return (
    <div className="risk-workspace-root font-sans">
      {/* 1. Standard Page Context Header */}
      <header className="risk-context-header font-sans">
        <div className="header-left">
          <nav className="breadcrumb-nav font-sans" aria-label="Breadcrumb">
            <button type="button" onClick={onBack} className="breadcrumb-link">
              Cases
            </button>
            <span className="breadcrumb-sep">/</span>
            <button type="button" onClick={onBack} className="breadcrumb-link">
              CASE-2026-001
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Risk Analysis</span>
          </nav>
          <div className="header-titles">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="page-main-title font-sans">Risk Analysis</h1>
              <span
                className="font-mono"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background:
                    dataSource === 'LIVE_BACKEND'
                      ? '#ECFDF5'
                      : dataSource === 'BACKEND_UNAVAILABLE'
                      ? '#FEF2F2'
                      : '#F1F5F9',
                  color:
                    dataSource === 'LIVE_BACKEND'
                      ? '#047857'
                      : dataSource === 'BACKEND_UNAVAILABLE'
                      ? '#B91C1C'
                      : '#475569',
                  border: `1px solid ${
                    dataSource === 'LIVE_BACKEND'
                      ? '#A7F3D0'
                      : dataSource === 'BACKEND_UNAVAILABLE'
                      ? '#FECACA'
                      : '#CBD5E1'
                  }`
                }}
              >
                {dataSource === 'LIVE_BACKEND'
                  ? '● LIVE BACKEND'
                  : dataSource === 'BACKEND_UNAVAILABLE'
                  ? '✕ BACKEND OFFLINE (FIXTURE)'
                  : '○ DEMO / SYNTHETIC'}
              </span>
            </div>
            <p className="page-main-sub font-sans">
              Review risk signals and supporting activity associated with this investigation.
            </p>
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions-row font-sans">
            {onNavigateToGraph && (
              <button
                type="button"
                onClick={() => onNavigateToGraph('suspect')}
                className="btn-secondary-action font-sans"
              >
                Inspect Trace Graph →
              </button>
            )}
            {onNavigateToTransaction && (
              <button
                type="button"
                onClick={() => onNavigateToTransaction('0x8ef2a9103c8b7b659fe10938bfe41209b0a124982')}
                className="btn-primary-action font-sans"
              >
                View in Transactions →
              </button>
            )}
          </div>

          {/* Compact View Switcher for State Validation */}
          <div className="state-simulator-bar font-sans">
            <span className="sim-label">Status:</span>
            {(['analyzed', 'empty', 'loading', 'error'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setViewState(st);
                  if (st === 'loading') setLoadingStep(3);
                }}
                className={`pill-btn ${viewState === st ? 'active' : ''}`}
              >
                {st === 'analyzed' ? 'Analyzed (72)' : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="risk-main-content">
        {/* STATE: LOADING */}
        {viewState === 'loading' && (
          <div className="risk-state-box font-sans">
            <div className="loading-spinner" />
            <div className="state-title font-sans">Evaluating Deterministic Risk Heuristics...</div>
            <p className="state-desc font-sans">
              {loadingStep === 1 && 'Scanning multi-rail ingress and egress velocity... (Step 1 of 5)'}
              {loadingStep === 2 && 'Tracing 4-hop peeling fragmentation across Ethereum ledger... (Step 2 of 5)'}
              {loadingStep === 3 && 'Evaluating on-chain velocity heuristics & mixer interactions... (Step 3 of 5)'}
              {loadingStep === 4 && 'Cross-correlating domestic payment structured disbursements... (Step 4 of 5)'}
              {loadingStep >= 5 && 'Compiling deterministic score and explainability factors... (Step 5 of 5)'}
            </p>
            <div className="linear-progress-track">
              <div
                className="linear-progress-fill"
                style={{ width: `${(loadingStep / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STATE: ERROR */}
        {viewState === 'error' && (
          <div className="risk-state-box font-sans">
            <div className="state-icon-alert">⚠</div>
            <div className="state-title font-sans">Risk Evaluation Service Unavailable</div>
            <p className="state-desc font-sans">
              RPC node response timeout on Ethereum archive node: Unable to verify block receipts for hop 0x8ef2a910.
            </p>
            <div className="state-actions-row">
              <button type="button" onClick={handleRunAnalysis} className="btn-state-action primary font-sans">
                Retry Evaluation
              </button>
              <button type="button" onClick={() => setViewState('analyzed')} className="btn-state-action font-sans">
                Load Cached Assessment
              </button>
            </div>
          </div>
        )}

        {/* STATE: EMPTY */}
        {viewState === 'empty' && (
          <div className="risk-state-box font-sans">
            <div className="state-icon-doc">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="state-title font-sans">NO RISK ASSESSMENT RECORDED</div>
            <p className="state-desc font-sans">
              Deterministic risk analysis has not been executed for subject 0x71F9A6809403dE4B07B4f114B5C1089b0A124982.
            </p>
            <div className="state-actions-row">
              <button type="button" onClick={handleRunAnalysis} className="btn-state-action primary font-sans">
                Execute Risk Analysis →
              </button>
              <button type="button" onClick={() => setViewState('analyzed')} className="btn-state-action font-sans">
                Load Sample Findings
              </button>
            </div>
          </div>
        )}

        {/* STATE: ANALYZED (Primary View) */}
        {viewState === 'analyzed' && (
          <div className="risk-container">
            {/* 1. Primary Risk Summary Card */}
            {/* 1. Primary Risk Summary Card (Side-by-Side Two-Column Layout) */}
            <section className="clean-white-card risk-summary-card font-sans">
              <div className="risk-summary-left">
                <div className="summary-section-label">OVERALL RISK SCORE</div>
                <div className="summary-score-row">
                  <div className="score-numbers font-mono">
                    <span className="score-num">{liveRiskScore}</span>
                    <span className="score-den">/ 100</span>
                  </div>
                  <div className="score-badge-wrap">
                    <span className={`risk-badge-${liveRiskLevel.toLowerCase()} font-sans`}>{liveRiskLevel} RISK</span>
                    <span className="score-badge-sub">Requires Direct Corroboration</span>
                  </div>
                </div>
                <p className="summary-caption font-sans">
                  Investigative risk assessment based on {liveSignalCount} explainable risk signals across velocity, privacy pools, and structured liquidation.
                </p>
              </div>

              <div className="risk-summary-divider" />

              <div className="risk-summary-right">
                <div className="summary-section-label">ASSESSMENT TARGET & STATUS</div>
                <div className="meta-list">
                  <div className="meta-row">
                    <span className="meta-label">Subject Identifier:</span>
                    <span className="meta-val font-mono">0x71F9A6809403dE4B07B4f114B5C1089b0A124982</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Evaluation Date:</span>
                    <span className="meta-val font-mono">2026-09-29 08:35:12 UTC</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Evaluation Status:</span>
                    <span className="meta-val text-green font-medium">Complete ({liveSignalCount} Signals Triggered)</span>
                  </div>
                </div>
                <div className="meta-actions">
                  <button type="button" onClick={handleRunAnalysis} className="btn-quiet-action font-sans">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Re-evaluate Signals
                  </button>
                </div>
              </div>
            </section>

            {/* 2. Risk Signal Breakdown */}
            <section className="clean-white-card breakdown-card font-sans">
              <div className="card-top-header">
                <div>
                  <h3 className="card-title font-sans">Risk Signal Breakdown</h3>
                  <p className="card-sub-description font-sans">
                    Proportional derivation of the 72 / 100 overall assessment across deterministic rule categories.
                  </p>
                </div>
                <div className="breakdown-sum font-mono">
                  Sum: 20 + 20 + 15 + 10 + 7 = <strong>72 / 100</strong>
                </div>
              </div>

              {/* Segmented calm horizontal contribution bar */}
              <div className="breakdown-bar-track">
                <div className="bar-seg seg-dispersion" style={{ width: '20%' }} title="Rapid Dispersion: +20">
                  <span className="seg-label font-mono">+20</span>
                </div>
                <div className="bar-seg seg-mixer" style={{ width: '20%' }} title="Mixer / Pool Interaction: +20">
                  <span className="seg-label font-mono">+20</span>
                </div>
                <div className="bar-seg seg-peeling" style={{ width: '15%' }} title="High Velocity Peeling: +15">
                  <span className="seg-label font-mono">+15</span>
                </div>
                <div className="bar-seg seg-structuring" style={{ width: '10%' }} title="Unusual Amount Structuring: +10">
                  <span className="seg-label font-mono">+10</span>
                </div>
                <div className="bar-seg seg-base" style={{ width: '7%' }} title="Base Account Risk: +7">
                  <span className="seg-label font-mono">+7</span>
                </div>
                <div className="bar-seg seg-unassigned" style={{ width: '28%' }} title="Unassigned: 28 pts clean">
                  <span className="seg-label font-mono">28 Clean</span>
                </div>
              </div>

              {/* Summary Cards Row */}
              <div className="breakdown-cards-grid font-sans">
                <div className="breakdown-item-card">
                  <div className="item-top">
                    <span className="item-dot dot-dispersion" />
                    <span className="item-name font-sans">Rapid Dispersion</span>
                  </div>
                  <div className="item-points font-mono text-red">+20 pts</div>
                  <div className="item-desc font-sans">42.50 ETH split across 8 addresses in 4m</div>
                </div>

                <div className="breakdown-item-card">
                  <div className="item-top">
                    <span className="item-dot dot-mixer" />
                    <span className="item-name font-sans">Mixer / Pool Interaction</span>
                  </div>
                  <div className="item-points font-mono text-red">+20 pts</div>
                  <div className="item-desc font-sans">Privacy pool contract relay routing</div>
                </div>

                <div className="breakdown-item-card">
                  <div className="item-top">
                    <span className="item-dot dot-peeling" />
                    <span className="item-name font-sans">High Velocity Peeling</span>
                  </div>
                  <div className="item-points font-mono text-amber">+15 pts</div>
                  <div className="item-desc font-sans">4 consecutive peel and change hops</div>
                </div>

                <div className="breakdown-item-card">
                  <div className="item-top">
                    <span className="item-dot dot-structuring" />
                    <span className="item-name font-sans">Unusual Amount Structuring</span>
                  </div>
                  <div className="item-points font-mono text-amber">+10 pts</div>
                  <div className="item-desc font-sans">3 domestic transfers near ₹50k limit</div>
                </div>

                <div className="breakdown-item-card">
                  <div className="item-top">
                    <span className="item-dot dot-base" />
                    <span className="item-name font-sans">Base Account Risk</span>
                  </div>
                  <div className="item-points font-mono text-blue">+7 pts</div>
                  <div className="item-desc font-sans">Fresh address with zero prior history</div>
                </div>
              </div>
            </section>

            {/* 3. Explainable Risk Signals Section */}
            <section className="clean-white-card signals-section font-sans">
              <div className="card-top-header">
                <div>
                  <h3 className="card-title font-sans">Explainable Risk Signals ({SIGNALS_DATA.length})</h3>
                  <p className="card-sub-description font-sans">
                    Detailed investigative findings with underlying observations, measured metrics, and supporting links.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-toggle-all font-sans"
                  onClick={() => {
                    const allOpen = Object.keys(expandedSignals).length === SIGNALS_DATA.length;
                    if (allOpen) {
                      setExpandedSignals({});
                    } else {
                      const next: Record<string, boolean> = {};
                      SIGNALS_DATA.forEach((s) => { next[s.id] = true; });
                      setExpandedSignals(next);
                    }
                  }}
                >
                  {Object.keys(expandedSignals).length === SIGNALS_DATA.length ? 'Collapse All' : 'Expand All'}
                </button>
              </div>

              <div className="signals-list">
                {SIGNALS_DATA.map((sig, idx) => {
                  const isExpanded = !!expandedSignals[sig.id];
                  const isAdded = !!evidenceAddedMap[sig.id];
                  return (
                    <div
                      key={sig.id}
                      className={`signal-item-card ${isExpanded ? 'expanded' : ''}`}
                    >
                      {/* Accordion Row Header */}
                      <div
                        className="signal-header-row"
                        onClick={() => toggleSignal(sig.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleSignal(sig.id);
                          }
                        }}
                      >
                        <div className="sig-left">
                          <span className="sig-num font-mono">0{idx + 1}</span>
                          <div className="sig-title-block">
                            <div className="sig-title-line">
                              <span className="sig-title font-sans">{sig.name}</span>
                              <span className={`sig-pill pill-${sig.severity.toLowerCase()} font-mono`}>
                                {sig.severity} (+{sig.contribution} pts)
                              </span>
                              <span className="category-pill font-sans">{sig.category}</span>
                            </div>
                            <p className="sig-summary font-sans">{sig.summary}</p>
                          </div>
                        </div>

                        <div className="sig-right">
                          <span className="chevron-icon font-mono">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Signal Details */}
                      {isExpanded && (
                        <div className="signal-expanded-body font-sans">
                          {/* Why this signal was raised */}
                          <div className="why-box font-sans">
                            <h4 className="why-title font-sans">Why this signal was raised</h4>
                            <p className="why-text font-sans">{sig.whyDetected}</p>
                          </div>

                          {/* Classification Pillars */}
                          <div className="classification-pillars-row font-sans">
                            <div className="pillar-item">
                              <span className="pillar-badge cat-badge-observed font-sans">OBSERVED FACT</span>
                              <span className="pillar-text font-sans">Verifiable on-chain movements and timestamps</span>
                            </div>
                            <div className="pillar-item">
                              <span className="pillar-badge cat-badge-analysis font-sans">SYSTEM ANALYSIS</span>
                              <span className="pillar-text font-sans">Algorithmic velocity and peeling threshold detection</span>
                            </div>
                            <div className="pillar-item">
                              <span className="pillar-badge cat-badge-interpretation font-sans">INVESTIGATOR CONSIDERATION</span>
                              <span className="pillar-text font-sans">Cross-correlate downstream destination entities</span>
                            </div>
                          </div>

                          {/* 2-Column Details: Observed Behavior & Measured Metrics */}
                          <div className="details-two-col font-sans">
                            <div className="sub-detail-box">
                              <h5 className="sub-box-title font-sans">Observed Activity</h5>
                              <div className="obs-list font-sans">
                                {sig.observedBehavior.map((item, bIdx) => (
                                  <div key={bIdx} className="obs-row">
                                    <span className="obs-lbl font-sans">{item.label}:</span>
                                    <span className="obs-val font-mono">{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="sub-detail-box">
                              <h5 className="sub-box-title font-sans">Measured Metrics</h5>
                              <div className="obs-list font-sans">
                                {sig.metrics.map((metric, mIdx) => (
                                  <div key={mIdx} className="obs-row">
                                    <span className="obs-lbl font-sans">{metric.label}:</span>
                                    <span className="obs-val font-mono">{metric.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Supporting Evidence Action Bar */}
                          <div className="signal-footer-bar font-sans">
                            <div className="footer-links-group">
                              <span className="footer-label font-sans">Supporting Activity:</span>
                              {onNavigateToTransaction && (
                                <button
                                  type="button"
                                  className="btn-link-action font-sans"
                                  onClick={() => onNavigateToTransaction(sig.supportingTx.hash)}
                                >
                                  Inspect Transaction ({formatAddress(sig.supportingTx.hash)}) →
                                </button>
                              )}
                              {onNavigateToGraph && (
                                <button
                                  type="button"
                                  className="btn-link-action font-sans"
                                  onClick={() => onNavigateToGraph(sig.supportingEntity.id)}
                                >
                                  Focus in Graph ({sig.supportingEntity.label}) →
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddEvidence(sig.id)}
                              className="btn-add-evidence-pill font-sans"
                            >
                              {isAdded ? '✓ Added to Case Evidence' : '+ Add to Case Evidence'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 4. Supporting Activity Table */}
            <section className="clean-white-card supporting-activity-card font-sans">
              <div className="card-top-header">
                <div>
                  <h3 className="card-title font-sans">Supporting Activity ({SUPPORTING_ACTIVITIES.length})</h3>
                  <p className="card-sub-description font-sans">
                    Multi-rail transactions and payment clearing records associated with the active risk assessment.
                  </p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="risk-activity-table font-sans">
                  <thead>
                    <tr>
                      <th>Timestamp (UTC)</th>
                      <th>Rail</th>
                      <th>Transaction Identifier</th>
                      <th>Origin Address (From)</th>
                      <th>Destination (To)</th>
                      <th>Traced Amount</th>
                      <th>Triggered Signal</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SUPPORTING_ACTIVITIES.map((act) => (
                      <tr key={act.id} className="table-row">
                        <td className="font-mono text-muted text-xs">{act.timestamp.split(' ')[1]}</td>
                        <td>
                          <span className="rail-pill font-sans">{act.rail}</span>
                        </td>
                        <td className="font-mono text-xs font-medium">
                          {formatAddress(act.hash)}
                        </td>
                        <td className="font-mono text-secondary text-xs">
                          {formatAddress(act.from)}
                        </td>
                        <td className="font-mono text-secondary text-xs">
                          {formatAddress(act.to)}
                        </td>
                        <td className="font-mono font-medium text-xs">{act.amount}</td>
                        <td>
                          <span className={`signal-tag tag-${act.signalSeverity.toLowerCase()} font-sans`}>
                            {act.signal}
                          </span>
                        </td>
                        <td>
                          {onNavigateToTransaction && (
                            <button
                              type="button"
                              className="btn-table-action font-sans"
                              onClick={() => onNavigateToTransaction(act.hash)}
                            >
                              Inspect →
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. Supporting Entities */}
            <section className="clean-white-card supporting-entities-card font-sans">
              <div className="card-top-header">
                <div>
                  <h3 className="card-title font-sans">Supporting Entities ({SUPPORTING_ENTITIES.length})</h3>
                  <p className="card-sub-description font-sans">
                    Key addresses, smart contracts, and domestic payment endpoints linked to this risk profile.
                  </p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="risk-activity-table font-sans">
                  <thead>
                    <tr>
                      <th>Entity Identifier</th>
                      <th>Investigative Role</th>
                      <th>Risk Indicator</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SUPPORTING_ENTITIES.map((ent) => (
                      <tr key={ent.id} className="table-row">
                        <td className="font-mono text-xs font-medium">
                          {ent.identifier}
                        </td>
                        <td className="font-sans text-xs text-secondary">
                          {ent.role}
                        </td>
                        <td>
                          <span className="risk-pill-badge font-sans">
                            {ent.risk} Indicator
                          </span>
                        </td>
                        <td>
                          {onNavigateToGraph && (
                            <button
                              type="button"
                              className="btn-table-action font-sans"
                              onClick={() => onNavigateToGraph(ent.graphId)}
                            >
                              View in Graph →
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      <style>{`
        .risk-workspace-root {
          width: 100%;
          min-height: calc(100vh - 72px);
          background-color: #f8fafc;
          color: #111827;
          display: flex;
          flex-direction: column;
        }

        .risk-context-header {
          padding: 24px 32px 20px 32px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          flex-wrap: wrap;
          background: #ffffff;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .breadcrumb-link {
          background: none;
          border: none;
          padding: 0;
          color: #2563eb;
          font-size: 13px;
          cursor: pointer;
          font-weight: 500;
        }

        .breadcrumb-link:hover {
          text-decoration: underline;
        }

        .breadcrumb-sep {
          color: #94a3b8;
          font-size: 13px;
        }

        .breadcrumb-current {
          color: #64748b;
          font-weight: 500;
        }

        .header-titles {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .page-main-title {
          font-size: 22px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .page-main-sub {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          max-width: 680px;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .header-actions-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-primary-action {
          background: #2563eb;
          color: #ffffff;
          border: 1px solid #2563eb;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-primary-action:hover {
          background: #1d4ed8;
        }

        .btn-secondary-action {
          background: #ffffff;
          color: #111827;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-secondary-action:hover {
          background: #f8fafc;
        }

        .state-simulator-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 3px 8px;
        }

        .sim-label {
          font-size: 11px;
          color: #64748b;
          margin-right: 2px;
        }

        .pill-btn {
          background: transparent;
          border: 1px solid transparent;
          color: #64748b;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pill-btn:hover {
          color: #111827;
          background: #e2e8f0;
        }

        .pill-btn.active {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #2563eb;
          font-weight: 500;
        }

        .risk-main-content {
          padding: 24px 32px 48px 32px;
          flex: 1;
        }

        .risk-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .clean-white-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 22px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .card-top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .card-sub-description {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }

        /* 1. Primary Risk Summary (Side-by-Side Two-Column Layout) */
        .clean-white-card.risk-summary-card {
          display: grid !important;
          grid-template-columns: 1fr 1px 1fr !important;
          align-items: stretch !important;
          padding: 24px 28px !important;
          gap: 28px !important;
        }

        @media (max-width: 1024px) {
          .clean-white-card.risk-summary-card {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .risk-summary-divider {
            display: none !important;
          }
        }

        .risk-summary-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
        }

        .summary-section-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .summary-score-row {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .score-numbers {
          display: flex;
          align-items: baseline;
        }

        .score-num {
          font-size: 40px;
          font-weight: 700;
          color: #111827;
          line-height: 1;
        }

        .score-den {
          font-size: 18px;
          font-weight: 500;
          color: #64748b;
          margin-left: 6px;
        }

        .score-badge-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .risk-badge-high {
          display: inline-block;
          align-self: flex-start;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .score-badge-sub {
          font-size: 11px;
          color: #64748b;
        }

        .summary-caption {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .risk-summary-divider {
          width: 1px;
          background: #e2e8f0;
        }

        .risk-summary-right {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
        }

        .meta-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          padding-bottom: 4px;
          border-bottom: 1px dashed #f1f5f9;
        }

        .meta-label {
          color: #64748b;
          font-weight: 500;
        }

        .meta-val {
          color: #111827;
        }

        .meta-actions {
          margin-top: 6px;
        }

        .btn-quiet-action {
          background: transparent;
          border: none;
          color: #2563eb;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          font-weight: 500;
        }

        .btn-quiet-action:hover {
          text-decoration: underline;
        }

        /* 2. Breakdown */
        .breakdown-sum {
          font-size: 12px;
          color: #64748b;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .breakdown-bar-track {
          display: flex;
          height: 18px;
          border-radius: 6px;
          overflow: hidden;
          background: #f1f5f9;
          margin-bottom: 18px;
          border: 1px solid #e2e8f0;
        }

        .bar-seg {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .seg-label {
          font-size: 10px;
          font-weight: 600;
          color: #ffffff;
          line-height: 1;
        }

        .seg-dispersion { background: #f87171; }
        .seg-mixer { background: #fb923c; }
        .seg-peeling { background: #fbbf24; }
        .seg-structuring { background: #60a5fa; }
        .seg-base { background: #a78bfa; }
        .seg-unassigned { background: #e2e8f0; }
        .seg-unassigned .seg-label { color: #64748b; }

        .breakdown-cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        .breakdown-item-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-top {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .item-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot-dispersion { background: #f87171; }
        .dot-mixer { background: #fb923c; }
        .dot-peeling { background: #fbbf24; }
        .dot-structuring { background: #60a5fa; }
        .dot-base { background: #a78bfa; }

        .item-name {
          font-size: 11.5px;
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-points {
          font-size: 13px;
          font-weight: 700;
        }

        .item-desc {
          font-size: 11px;
          color: #64748b;
          line-height: 1.35;
        }

        /* 3. Signals List */
        .btn-toggle-all {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 12px;
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-toggle-all:hover {
          background: #f8fafc;
        }

        .signals-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .signal-item-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.15s ease;
        }

        .signal-item-card:hover {
          border-color: #cbd5e1;
        }

        .signal-item-card.expanded {
          border-color: #bfdbfe;
        }

        .signal-header-row {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          background: #ffffff;
        }

        .signal-header-row:hover {
          background: #f8fafc;
        }

        .sig-left {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .sig-num {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 2px 7px;
          border-radius: 4px;
          margin-top: 2px;
        }

        .sig-title-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sig-title-line {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sig-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .sig-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .pill-high { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .pill-medium { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
        .pill-low { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

        .category-pill {
          font-size: 11px;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .sig-summary {
          font-size: 12.5px;
          color: #64748b;
          margin: 0;
        }

        .chevron-icon {
          font-size: 11px;
          color: #94a3b8;
        }

        .signal-expanded-body {
          padding: 18px 20px 20px 20px;
          background: #fafbfc;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .why-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px 16px;
        }

        .why-title {
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 6px 0;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .why-text {
          font-size: 13px;
          color: #334155;
          line-height: 1.5;
          margin: 0;
        }

        .classification-pillars-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .pillar-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 10px;
        }

        .pillar-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .cat-badge-observed { background: #eff6ff; color: #2563eb; }
        .cat-badge-analysis { background: #f5f3ff; color: #7c3aed; }
        .cat-badge-interpretation { background: #ecfdf5; color: #059669; }

        .pillar-text {
          font-size: 11.5px;
          color: #64748b;
        }

        .details-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .sub-detail-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sub-box-title {
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0;
        }

        .obs-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .obs-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          gap: 12px;
        }

        .obs-lbl {
          color: #64748b;
          flex-shrink: 0;
        }

        .obs-val {
          color: #111827;
          text-align: right;
          word-break: break-word;
        }

        .signal-footer-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          gap: 12px;
          flex-wrap: wrap;
        }

        .footer-links-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .footer-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .btn-link-action {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #2563eb;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-link-action:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .btn-add-evidence-pill {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #334155;
          font-size: 12px;
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-add-evidence-pill:hover {
          background: #f8fafc;
        }

        /* Tables */
        .table-responsive {
          overflow-x: auto;
        }

        .risk-activity-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .risk-activity-table th {
          text-align: left;
          padding: 11px 14px;
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .risk-activity-table td {
          padding: 13px 14px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .table-row:hover td {
          background-color: #f8fafc;
        }

        .rail-pill {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 500;
          display: inline-block;
          white-space: nowrap;
        }

        .signal-tag {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .tag-high { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .tag-medium { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }

        .risk-pill-badge {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .btn-table-action {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #2563eb;
          font-size: 11.5px;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-table-action:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        /* States */
        .risk-state-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 64px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .state-icon-alert {
          font-size: 32px;
          color: #ef4444;
        }

        .state-icon-doc {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #f1f5f9;
        }

        .state-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .state-desc {
          font-size: 13px;
          color: #64748b;
          max-width: 480px;
          line-height: 1.5;
        }

        .state-actions-row {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .btn-state-action {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #334155;
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-state-action.primary {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        .linear-progress-track {
          width: 240px;
          height: 6px;
          background: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
          margin-top: 8px;
        }

        .linear-progress-fill {
          height: 100%;
          background: #2563eb;
          transition: width 0.3s ease;
        }

        .text-red { color: #dc2626; }
        .text-amber { color: #d97706; }
        .text-blue { color: #2563eb; }
        .text-green { color: #16a34a; }

        @media (max-width: 1024px) {
          .breakdown-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .details-two-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
