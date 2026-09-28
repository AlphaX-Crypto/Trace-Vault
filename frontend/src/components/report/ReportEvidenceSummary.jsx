import {ExternalLink} from 'lucide-react'
import {Link} from 'react-router-dom'
import ReportSection from './ReportSection'

export default function ReportEvidenceSummary({caseId,evidence}){const selected=evidence.slice(0,6);return <ReportSection title="Supporting Evidence" number="06" action={<Link className="report-link no-print" to={`/case/${caseId}/evidence`}>View Evidence Register <ExternalLink/></Link>}><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Evidence ID</th><th>Type</th><th>Description</th><th>Status</th></tr></thead><tbody>{selected.map(item=><tr key={item.id}><td className="mono">{item.id}</td><td>{item.type}</td><td>{item.description}</td><td>{item.status}</td></tr>)}</tbody></table></div></ReportSection>}
