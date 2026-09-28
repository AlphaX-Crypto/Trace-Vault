import {Landmark,ShieldQuestion} from 'lucide-react'

export default function AttributionSummary({attribution}){
  return <section className={`intel-panel attribution-summary ${attribution.hasProbableVasp?'is-probable':'is-insufficient'}`}>
    <header><div><span>Attribution summary</span><h2>{attribution.hasProbableVasp?'Nearest likely VASP':'Current attribution result'}</h2></div>{attribution.hasProbableVasp?<Landmark aria-hidden="true"/>:<ShieldQuestion aria-hidden="true"/>}</header>
    <div className="attribution-result"><div><span>{attribution.status}</span><strong>{attribution.displayName}</strong><p>{attribution.explanation}</p></div><div className="attribution-result-facts"><span><small>Confidence</small><b>{attribution.confidence}%</b></span><span><small>Distance</small><b>{attribution.hops} hops</b></span></div></div>
    <dl className="intel-definition-grid"><div><dt>Entity type</dt><dd>{attribution.entityType}</dd></div><div><dt>Entity source</dt><dd>{attribution.source}</dd></div><div className="wide"><dt>Attribution method</dt><dd>{attribution.method}</dd></div></dl>
    <p className="mock-intelligence-note">Frontend display of precomputed fictional intelligence. No ownership determination is made.</p>
  </section>
}
