import {Check,Copy,X} from 'lucide-react'
import {useState} from 'react'

function Detail({label,value,mono=false,copy=false}){
  const [copied,setCopied]=useState(false)
  if(value===undefined||value===null)return null
  async function copyValue(){await navigator.clipboard.writeText(String(value));setCopied(true);setTimeout(()=>setCopied(false),1200)}
  return <div><dt>{label}</dt><dd className={mono?'mono':''}>{value}{copy&&<button type="button" className="copy-detail" aria-label={`Copy ${label}`} onClick={copyValue}>{copied?<Check/>:<Copy/>}</button>}</dd></div>
}

export default function EvidenceDetailPanel({item,onClose}){
  if(!item)return <aside className="evidence-detail is-empty"><div><span>Evidence detail</span><strong>Select an evidence record</strong><p>Choose a row to inspect its full mock provenance and supporting context.</p></div></aside>
  const meta=item.metadata||{}
  return <aside className="evidence-detail"><header><div><span>Evidence detail</span><strong className="mono">{item.id}</strong></div><button type="button" aria-label="Close evidence detail" onClick={onClose}><X/></button></header><div className="evidence-detail-body"><span className={`record-status status-${item.status.toLowerCase().replaceAll(' ','-')}`}>{item.status}</span><h2>{item.description}</h2><dl><Detail label="Type" value={item.type}/><Detail label="Related entity" value={item.entity} mono={item.entity.includes('0x')}/><Detail label="Source" value={item.source}/><Detail label="Timestamp" value={item.timestamp} mono/><Detail label="From" value={meta.from} mono copy/><Detail label="To" value={meta.to} mono copy/><Detail label="Amount" value={meta.amount&&`${meta.amount} ${meta.asset}`}/><Detail label="Transaction hash" value={meta.transactionHash} mono copy/><Detail label="Address" value={meta.address} mono copy/><Detail label="Entity" value={meta.entity}/><Detail label="Attribution confidence" value={meta.confidence!==undefined?`${meta.confidence}%`:null}/><Detail label="Hop distance" value={meta.hopDistance!==undefined?`${meta.hopDistance} hops`:null}/><Detail label="Evidence source" value={meta.evidenceSource}/><Detail label="Risk indicator" value={meta.riskIndicator}/><Detail label="Contribution" value={meta.contribution!==undefined?`+${meta.contribution}`:null}/><Detail label="Related node" value={meta.relatedNode} mono={String(meta.relatedNode||'').startsWith('0x')}/><Detail label="Reason" value={meta.reason}/></dl>{meta.notes&&<section><span>Supporting notes</span><p>{meta.notes}</p></section>}</div></aside>
}
