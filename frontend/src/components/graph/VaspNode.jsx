import { Handle, Position } from '@xyflow/react'
import { Building2 } from 'lucide-react'

export default function VaspNode({data,selected}){return <div className={`graph-node node-vasp ${selected?'is-selected':''} ${data.highlighted?'is-highlighted':''} ${data.dimmed?'is-dimmed':''}`} tabIndex="0" role="button" aria-label={`Likely VASP ${data.entity}, ${data.confidence}% attribution confidence`}><Handle type="target" position={Position.Left}/><div className="node-heading"><Building2 aria-hidden="true"/><span>Likely VASP</span></div><strong>{data.entity}</strong><small>{data.confidence}% attribution confidence</small></div>}
