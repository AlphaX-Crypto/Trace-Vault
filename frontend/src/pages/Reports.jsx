import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, RefreshCw } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import api from '../services/api';
import { normalizeCase } from '../services/normalizer';

export default function Reports() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await api.getCases();
      setCases(Array.isArray(data) ? data.map(normalizeCase) : []);
    } catch (err) {
      console.error('Failed to load cases for reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dossier Repository</p>
          <h1>Investigation Reports</h1>
          <p>Court-ready intelligence summaries and Section 91 CrPC disclosure records.</p>
        </div>
        <Button variant="secondary" onClick={loadCases} disabled={loading}>
          <RefreshCw className={loading ? 'spin' : ''} />
        </Button>
      </div>

      <Card
        title="Case Intelligence Reports"
        subtitle={loading ? 'Loading dossiers...' : `${cases.length} case reports available`}
      >
        {loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Loading case report index...</p>
          </div>
        )}

        {!loading && cases.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No investigation cases available yet.</p>
          </div>
        )}

        {!loading && cases.length > 0 && (
          <div className="case-table-wrap">
            <table className="case-table">
              <thead>
                <tr>
                  <th>Case / Reference</th>
                  <th>Ledger</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Report Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/case/${encodeURIComponent(c.id)}/report`}>
                        <strong>{c.name}</strong>
                        <span className="mono">{c.id}</span>
                      </Link>
                    </td>
                    <td>{c.blockchain}</td>
                    <td>
                      <Badge tone={c.riskLevel}>{c.riskLevel}</Badge>
                    </td>
                    <td>{c.status}</td>
                    <td>
                      <Link
                        to={`/case/${encodeURIComponent(c.id)}/report`}
                        className="button button-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                      >
                        <FileText style={{ width: 14, height: 14, marginRight: 4 }} /> View Dossier{' '}
                        <ArrowRight style={{ width: 14, height: 14 }} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
