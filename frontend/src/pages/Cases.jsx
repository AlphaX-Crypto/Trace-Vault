import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import CaseTable from '../components/case/CaseTable';
import api from '../services/api';
import { normalizeCase } from '../services/normalizer';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Case registry</p>
          <h1>Investigations</h1>
          <p>Active cryptocurrency tracing and forensic intelligence casework.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button variant="secondary" onClick={fetchCases} disabled={loading} aria-label="Refresh case list">
            <RefreshCw className={loading ? 'spin' : ''} />
          </Button>
          <Link to="/cases/new">
            <Button>
              <Plus /> New case
            </Button>
          </Link>
        </div>
      </div>

      <Card
        title="All Registered Cases"
        subtitle={
          loading
            ? 'Connecting to backend database...'
            : error
            ? 'Connection error'
            : `${cases.length} investigation record${cases.length === 1 ? '' : 's'}`
        }
      >
        {loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Loading investigation casework from PostgreSQL database...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <AlertCircle style={{ color: 'var(--color-danger, #ef4444)', margin: '0 auto 1rem', width: 32, height: 32 }} />
            <p style={{ color: 'var(--color-danger, #ef4444)', marginBottom: '1rem' }}>{error}</p>
            <Button variant="secondary" onClick={fetchCases}>Retry Connection</Button>
          </div>
        )}

        {!loading && !error && cases.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: '1.25rem' }}>No investigations currently registered in the database.</p>
            <Link to="/cases/new">
              <Button><Plus /> Create First Case</Button>
            </Link>
          </div>
        )}

        {!loading && !error && cases.length > 0 && (
          <CaseTable items={cases} />
        )}
      </Card>
    </>
  );
}
