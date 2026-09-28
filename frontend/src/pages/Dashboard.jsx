import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Database,
  FileSearch,
  Network,
  Plus,
  ShieldAlert,
  RefreshCw,
  Server
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import CaseTable from '../components/case/CaseTable';
import api from '../services/api';
import { normalizeCase } from '../services/normalizer';
import './dashboard.css';

export default function Dashboard() {
  const [cases, setCases] = useState([]);
  const [health, setHealth] = useState({ backend: 'checking', intelligence: 'checking' });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch real cases from backend
      const caseList = await api.getCases();
      const normalized = Array.isArray(caseList) ? caseList.map(normalizeCase) : [];
      setCases(normalized);

      // 2. Check health of services
      try {
        const bHealth = await api.checkHealth();
        setHealth((prev) => ({ ...prev, backend: bHealth.status === 'ok' ? 'Online' : 'Degraded' }));
      } catch (_) {
        setHealth((prev) => ({ ...prev, backend: 'Offline' }));
      }

      try {
        const iHealth = await api.checkIntelligenceHealth();
        setHealth((prev) => ({
          ...prev,
          intelligence: iHealth.status === 'ok' ? 'Online' : 'Degraded'
        }));
      } catch (_) {
        setHealth((prev) => ({ ...prev, intelligence: 'Offline' }));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute live metrics from real database cases
  const totalCases = cases.length;
  const criticalOrHighCases = cases.filter(
    (c) => c.priority === 'CRITICAL' || c.priority === 'HIGH' || c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL'
  ).length;
  const analyzedCases = cases.filter((c) => c.status === 'ANALYSIS_COMPLETE').length;
  const pendingCases = cases.filter((c) => c.status === 'OPEN' || c.status === 'ANALYZING').length;

  const dynamicMetrics = [
    {
      label: 'Active Investigations',
      value: String(totalCases),
      delta: `${analyzedCases} analyzed`,
      tone: 'neutral',
      Icon: BriefcaseBusiness
    },
    {
      label: 'High / Critical Risk',
      value: String(criticalOrHighCases),
      delta: 'Requires LEA review',
      tone: criticalOrHighCases > 0 ? 'critical' : 'low',
      Icon: ShieldAlert
    },
    {
      label: 'Completed Traces',
      value: String(analyzedCases),
      delta: 'PostgreSQL verified',
      tone: 'medium',
      Icon: Database
    },
    {
      label: 'Intake Queue',
      value: String(pendingCases),
      delta: `${pendingCases} pending analysis`,
      tone: 'low',
      Icon: Network
    }
  ];

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">
            Backend System Status ·{' '}
            <span
              style={{
                color: health.backend === 'Online' ? 'var(--color-success, #22c55e)' : 'var(--color-warning, #eab308)',
                fontWeight: 600
              }}
            >
              API {health.backend}
            </span>{' '}
            ·{' '}
            <span
              style={{
                color:
                  health.intelligence === 'Online'
                    ? 'var(--color-success, #22c55e)'
                    : 'var(--color-warning, #eab308)',
                fontWeight: 600
              }}
            >
              Intelligence Engine {health.intelligence}
            </span>
          </p>
          <h1>Financial Fraud Intelligence Dashboard</h1>
          <p>
            Monitor live casework, inspect NetworkX graph traversals, and coordinate VASP attribution.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button variant="secondary" onClick={loadDashboardData} disabled={loading} aria-label="Refresh metrics">
            <RefreshCw className={loading ? 'spin' : ''} />
          </Button>
          <Link to="/cases/new">
            <Button>
              <Plus /> New case
            </Button>
          </Link>
        </div>
      </div>

      <section className="metric-grid" aria-label="Investigation metrics">
        {dynamicMetrics.map((metric) => {
          const { Icon } = metric;
          return (
            <article className={`metric-card metric-${metric.tone}`} key={metric.label}>
              <div className="metric-icon">
                <Icon />
              </div>
              <div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.delta}</small>
              </div>
            </article>
          );
        })}
      </section>

      <div className="dashboard-grid">
        <Card
          className="activity-card"
          title="Investigation Activity"
          subtitle="System execution audit across active casework"
          action={<span className="live-label"><i />Live PostgreSQL</span>}
        >
          <div style={{ padding: '1.25rem 0', color: 'var(--text-muted)' }}>
            <p style={{ margin: '0 0 1rem' }}>
              The TRACEVAULT investigation engine correlates on-chain transactions across unhosted wallets,
              identifies intermediary fund-layering hops, and attributes candidate VASP deposit wallets.
            </p>
          </div>
          <div className="activity-footer">
            <div>
              <FileSearch />
              <span>
                <strong>{totalCases}</strong> registered cases
              </span>
            </div>
            <div>
              <Network />
              <span>
                <strong>{analyzedCases}</strong> VASP paths traversed
              </span>
            </div>
            <div>
              <Server />
              <span>
                <strong>PostgreSQL</strong> authoritative store
              </span>
            </div>
          </div>
        </Card>

        <Card
          className="risk-card"
          title="Risk Prioritization"
          subtitle="Casework categorized by analytical risk"
        >
          <div className="risk-total">
            <div>
              <span>{totalCases}</span>
              <small>REGISTERED CASES</small>
            </div>
            <p>Risk signals guide review priority and do not establish legal wrongdoing.</p>
          </div>
          <div className="risk-bars">
            <div className="risk-row">
              <div>
                <span>Critical / High</span>
                <b>{criticalOrHighCases} cases</b>
              </div>
              <div className="risk-track">
                <span
                  className="risk-fill high"
                  style={{
                    width: `${totalCases > 0 ? Math.round((criticalOrHighCases / totalCases) * 100) : 0}%`
                  }}
                />
              </div>
            </div>
            <div className="risk-row">
              <div>
                <span>Medium / Low</span>
                <b>{totalCases - criticalOrHighCases} cases</b>
              </div>
              <div className="risk-track">
                <span
                  className="risk-fill low"
                  style={{
                    width: `${totalCases > 0 ? Math.round(((totalCases - criticalOrHighCases) / totalCases) * 100) : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="recent-card"
          title="Recent Investigations"
          subtitle="Real casework stored in PostgreSQL"
          action={
            <Link className="text-link" to="/cases">
              View all cases <ArrowRight />
            </Link>
          }
        >
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading cases...
            </div>
          ) : cases.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No cases created yet.
            </div>
          ) : (
            <CaseTable items={cases.slice(0, 4)} />
          )}
        </Card>

        <Card className="queue-card" title="Operational Queue" subtitle="Current workflow status">
          <div className="stage-list">
            <div>
              <span>
                <i>01</i> Intake / Registered
              </span>
              <strong>{cases.filter((c) => c.status === 'OPEN').length}</strong>
            </div>
            <div>
              <span>
                <i>02</i> In Analysis
              </span>
              <strong>{cases.filter((c) => c.status === 'ANALYZING').length}</strong>
            </div>
            <div>
              <span>
                <i>03</i> Analysis Complete
              </span>
              <strong>{cases.filter((c) => c.status === 'ANALYSIS_COMPLETE').length}</strong>
            </div>
            <div>
              <span>
                <i>04</i> Review / Closed
              </span>
              <strong>{cases.filter((c) => c.status === 'REVIEW' || c.status === 'CLOSED').length}</strong>
            </div>
          </div>
          <div className="index-status">
            <span className="context-pulse" />
            <div>
              <b>System Operational</b>
              <small>Node.js API + PostgreSQL + FastAPI NetworkX</small>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
