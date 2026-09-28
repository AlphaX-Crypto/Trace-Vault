export default function EvidenceSummary({evidence}){
  const verified=evidence.filter(item=>item.status==='Verified').length
  const review=evidence.filter(item=>item.status==='Needs Review'||item.status==='Insufficient').length
  const categories=[...new Set(evidence.map(item=>item.type))]
  return <section className="evidence-summary" aria-label="Evidence summary"><div><span>Evidence collected</span><strong>{evidence.length} items</strong></div><div><span>Verified mock records</span><strong>{verified}</strong></div><div><span>Needs review</span><strong>{review}</strong></div><div className="evidence-categories"><span>Categories</span><p>{categories.map(type=><b key={type}>{type}</b>)}</p></div></section>
}
