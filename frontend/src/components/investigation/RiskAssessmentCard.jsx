import Card from '../common/Card'
import Badge from '../common/Badge'

export default function RiskAssessmentCard({investigation}){
  return <Card className="risk-assessment-card" title="Risk assessment" subtitle="Prioritization signals for investigator review" action={<Badge tone={investigation.riskLevel}>{investigation.riskLevel}</Badge>}><div className="risk-score"><strong>{investigation.riskScore}</strong><span>/ 100</span></div><div className="indicator-list">{investigation.indicators.map(indicator=><div className="indicator" key={indicator.label}><div><span>{indicator.label}</span><strong>{indicator.value}%</strong></div><div className="indicator-track"><span style={{width:`${indicator.value}%`}}/></div></div>)}</div><p className="responsibility-note">Risk reflects fictional investigative indicators and is not proof of wrongdoing.</p></Card>
}
