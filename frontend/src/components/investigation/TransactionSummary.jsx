import { GitBranch, Repeat2 } from 'lucide-react'
import Card from '../common/Card'

export default function TransactionSummary({investigation}){
  return <Card className="transaction-summary-card" title="Transaction summary" subtitle="Normalized mock activity"><div className="summary-stat"><Repeat2 aria-hidden="true"/><div><strong className="mono">{investigation.transactions}</strong><span>traced transactions</span></div></div><dl className="compact-facts"><div><dt>Total flow</dt><dd className="mono">{investigation.flow}</dd></div><div><dt>Supported ledger</dt><dd>{investigation.blockchain}</dd></div><div><dt>Detected paths</dt><dd><GitBranch aria-hidden="true"/>{investigation.pathCount}</dd></div></dl></Card>
}
