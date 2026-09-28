import {FileDown,Send} from 'lucide-react'
import Button from '../common/Button'

export default function ReportActions({status,onPrepare,onPrint,onReviewed}){return <div className="report-actions no-print"><div><span>Report status</span><strong>{status}</strong></div><div><Button variant="secondary" onClick={onPrint}><FileDown/>Print / Save as PDF</Button><Button variant="secondary" onClick={onReviewed}>Mark Reviewed</Button><Button onClick={onPrepare}><Send/>Prepare Action</Button></div></div>}
