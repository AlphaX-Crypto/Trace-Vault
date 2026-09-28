import { Landmark, Route } from 'lucide-react'
import Card from '../common/Card'
import ConfidenceBadge from './ConfidenceBadge'

export default function AttributionCard({investigation}){
  return <Card className="attribution-card" title="Nearest likely VASP" subtitle="Probabilistic attribution from mock analysis" action={<Landmark aria-hidden="true"/>}><p className="attribution-copy">Likely associated with</p><strong className="attribution-name">{investigation.vasp}</strong><div className="attribution-facts"><span><Route aria-hidden="true"/><b>{investigation.hops} hops</b> path distance</span><ConfidenceBadge value={investigation.confidence}/></div></Card>
}
