import {ArrowRight,ExternalLink} from 'lucide-react'
import {Link} from 'react-router-dom'
import {formatWallet} from '../../utils/formatWallet'
import ReportSection from './ReportSection'

export default function TraceSummary({investigation,path,attribution}){return <ReportSection title="Transaction Trace Summary" number="03" action={<Link className="report-link no-print" to={`/case/${investigation.id}/graph`}>View Transaction Graph <ExternalLink/></Link>}><dl className="report-stat-strip"><div><dt>Traced transactions</dt><dd>{investigation.transactions}</dd></div><div><dt>Total traced flow</dt><dd>{investigation.flow}</dd></div><div><dt>Detected paths</dt><dd>{investigation.pathCount}</dd></div><div><dt>Primary path</dt><dd>{attribution.hops} hops</dd></div><div><dt>Destination</dt><dd>{attribution.displayName}</dd></div></dl><ol className="report-path">{path.map((item,index)=><li key={item.id}><span>{item.label}</span><code>{item.address?.startsWith('0x')?formatWallet(item.address):item.address}</code>{index<path.length-1&&<ArrowRight aria-hidden="true"/>}</li>)}</ol></ReportSection>}
