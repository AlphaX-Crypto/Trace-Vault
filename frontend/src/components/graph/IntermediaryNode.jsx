import { Handle, Position } from '@xyflow/react'
import { GitCommitHorizontal } from 'lucide-react'
import { formatWallet } from '../../utils/formatWallet'

export default function IntermediaryNode({data,selected}){return <div className={`graph-node node-intermediary ${selected?'is-selected':''} ${data.highlighted?'is-highlighted':''} ${data.dimmed?'is-dimmed':''}`} tabIndex="0" role="button" aria-label={`${data.label} ${formatWallet(data.address)}`}><Handle type="target" position={Position.Left}/><div className="node-heading"><GitCommitHorizontal aria-hidden="true"/><span>{data.label}</span></div><strong className="mono">{formatWallet(data.address)}</strong><small>Intermediary wallet</small><Handle type="source" position={Position.Right}/></div>}
