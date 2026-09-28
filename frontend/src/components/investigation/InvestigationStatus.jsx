import { CheckCircle2, Clock3 } from 'lucide-react'
import Card from '../common/Card'

export default function InvestigationStatus({investigation}){
  return <Card className="investigation-status-card" title="Investigation status"><div className="status-primary"><CheckCircle2 aria-hidden="true"/><div><strong>{investigation.status}</strong><span>Automated mock sequence finished</span></div></div><dl className="compact-facts"><div><dt>Last updated</dt><dd><Clock3 aria-hidden="true"/>{investigation.updated}</dd></div><div><dt>Current workflow</dt><dd>{investigation.workflow}</dd></div><div><dt>Investigator</dt><dd>{investigation.investigator}</dd></div></dl></Card>
}
