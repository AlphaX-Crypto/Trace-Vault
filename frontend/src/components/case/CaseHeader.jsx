import { Link, useParams } from 'react-router-dom';
import Badge from '../common/Badge';
import { useInvestigation } from '../../utils/useInvestigation';
import './case.css';

export default function CaseHeader({ investigation: propInvestigation }) {
  const { id } = useParams();
  const { investigation } = useInvestigation(propInvestigation ? null : id, propInvestigation);
  const item = propInvestigation || investigation;

  if (!item) return null;

  return (
    <div className="case-header">
      <div>
        <div className="case-id mono">{item.id || item.case_id}</div>
        <h1>{item.name || item.title}</h1>
        <div className="case-meta">
          <span>{item.blockchain}</span>
          <Badge tone={item.riskLevel}>{item.riskLevel} · {item.riskScore}/100</Badge>
          <Badge>{item.status}</Badge>
        </div>
      </div>
      <Link className="button button-secondary" to="/cases">Back to cases</Link>
    </div>
  );
}
