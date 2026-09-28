import { Handle, Position } from '@xyflow/react'
import { CircleHelp, Crosshair, TriangleAlert } from 'lucide-react'
import { formatWallet } from '../../utils/formatWallet'

export default function WalletNode({data,selected}){
  const isSuspect=data.category==='suspect'
  const isRisk=data.category==='risk'
  const Icon=isSuspect?Crosshair:isRisk?TriangleAlert:CircleHelp
  return <div className={`graph-node node-${data.category} ${selected?'is-selected':''} ${data.highlighted?'is-highlighted':''} ${data.dimmed?'is-dimmed':''}`} tabIndex="0" role="button" aria-label={`${data.label} ${formatWallet(data.address)}`}><Handle type="target" position={Position.Left}/><div className="node-heading"><Icon aria-hidden="true"/><span>{data.label}</span></div><strong className="mono">{formatWallet(data.address)}</strong>{data.risk&&<small>{data.risk} indicators</small>}<Handle type="source" position={Position.Right}/></div>
}
