import {Check,Copy} from 'lucide-react'
import {useState} from 'react'
import ReportSection from './ReportSection'

export default function SubjectWalletSection({investigation}){const[copied,setCopied]=useState(false);async function copy(){await navigator.clipboard.writeText(investigation.wallet);setCopied(true);setTimeout(()=>setCopied(false),1200)}return <ReportSection title="Subject Wallet" number="02"><dl className="report-facts subject-facts"><div className="wide"><dt>Wallet address</dt><dd className="mono">{investigation.wallet}<button className="report-copy no-print" type="button" aria-label="Copy wallet address" onClick={copy}>{copied?<Check/>:<Copy/>}</button></dd></div><div><dt>Blockchain</dt><dd>{investigation.blockchain}</dd></div><div><dt>Case reference</dt><dd className="mono">{investigation.id}</dd></div><div><dt>Analysis status</dt><dd>{investigation.status}</dd></div></dl></ReportSection>}
