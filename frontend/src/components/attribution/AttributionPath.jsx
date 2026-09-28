import {ArrowDown,ExternalLink} from 'lucide-react'
import {Link} from 'react-router-dom'
import {formatWallet as shortenWallet} from '../../utils/formatWallet'

export default function AttributionPath({caseId,path}){
  return <section className="intel-panel attribution-path"><header><div><span>Supporting path</span><h2>Attribution path</h2></div><Link className="button button-secondary" to={`/case/${caseId}/graph`}>View in Transaction Graph <ExternalLink aria-hidden="true"/></Link></header><ol>{path.map((node,index)=><li key={node.id}><div className="path-hop">{node.hop===0?'Origin':`Hop ${node.hop}`}</div><div className="path-node"><strong>{node.label}</strong><span>{node.role}</span><code>{node.address?.startsWith('0x')?shortenWallet(node.address):node.address}</code></div>{node.amount&&<span className="path-amount">{node.amount}</span>}{index<path.length-1&&<ArrowDown className="path-arrow" aria-hidden="true"/>}</li>)}</ol></section>
}
