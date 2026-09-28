import { Handle, Position } from '@xyflow/react'
import { Landmark } from 'lucide-react'
import { formatWallet } from '../../utils/formatWallet'

export default function ExchangeDepositNode({data,selected}){return <div className={`graph-node node-exchange ${selected?'is-selected':''} ${data.highlighted?'is-highlighted':''} ${data.dimmed?'is-dimmed':''}`} tabIndex="0" role="button" aria-label={`Exchange deposit ${formatWallet(data.address)}`}><Handle type="target" position={Position.Left}/><div className="node-heading"><Landmark aria-hidden="true"/><span>Exchange Deposit</span></div><strong className="mono">{formatWallet(data.address)}</strong><small>Probable {data.entity} relationship</small><Handle type="source" position={Position.Right}/></div>}
