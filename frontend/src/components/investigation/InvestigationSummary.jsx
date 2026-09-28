import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../common/Card'
import Badge from '../common/Badge'

export default function InvestigationSummary({investigation}){
  return <Card className="investigation-summary" title="Investigation summary" subtitle="Mock analytical outcome"><p>Analysis identified transaction paths connecting the suspect wallet to a likely VASP through {investigation.hops} intermediary hops.</p><dl><div><dt>Likely VASP</dt><dd>{investigation.vasp}</dd></div><div><dt>Confidence</dt><dd>{investigation.confidence}%</dd></div><div><dt>Risk level</dt><dd><Badge tone={investigation.riskLevel}>{investigation.riskLevel}</Badge></dd></div><div><dt>Path distance</dt><dd>{investigation.hops} hops</dd></div></dl><Link className="button button-primary" to={`/case/${investigation.id}/graph`}>View Transaction Graph <ArrowRight aria-hidden="true"/></Link></Card>
}
