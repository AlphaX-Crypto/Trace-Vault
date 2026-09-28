import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react'

export default function TransactionEdge({id,sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,data,markerEnd}){
  const [edgePath,labelX,labelY]=getSmoothStepPath({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,borderRadius:4})
  const state=data.highlighted?'is-highlighted':data.dimmed?'is-dimmed':data.risk?'is-risk':''
  return <><BaseEdge id={id} path={edgePath} markerEnd={markerEnd} className={`transaction-edge ${state}`}/><EdgeLabelRenderer><div className={`edge-label ${state}`} style={{transform:`translate(-50%, -50%) translate(${labelX}px,${labelY}px)`}}><strong>{data.isAssociation?'Probable association':`${data.amount} ${data.asset}`}</strong>{!data.isAssociation&&<span>{data.direction}</span>}</div></EdgeLabelRenderer></>
}
