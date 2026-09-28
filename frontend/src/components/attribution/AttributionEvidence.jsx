export default function AttributionEvidence({evidence}){
  const items=evidence.filter(item=>item.type==='Attribution'||item.type==='Wallet'||item.type==='Path')
  return <section className="intel-panel attribution-evidence"><header><div><span>Supporting records</span><h2>Attribution evidence</h2></div><small>{items.length} items</small></header><div className="evidence-lines">{items.map(item=><article key={item.id}><div><span>{item.type}</span><strong>{item.description}</strong><p>{item.source}</p></div><b className={`record-status status-${item.status.toLowerCase().replaceAll(' ','-')}`}>{item.status}</b></article>)}</div></section>
}
