import Badge from '../common/Badge'

export default function RiskAssessment({risk}){
  return <section className="intel-panel risk-assessment"><header><div><span>Prioritization</span><h2>Risk assessment</h2></div><Badge tone={risk.level}>{risk.level}</Badge></header><div className="risk-overview"><div className="risk-number"><strong>{risk.score}</strong><span>/ 100</span></div><div className="risk-contributors">{risk.indicators.map(item=><div key={item.id}><span>{item.indicator}</span><b>+{item.contribution}</b><i><span style={{width:`${item.contribution}%`}}/></i></div>)}</div></div><p className="risk-disclaimer">Risk score reflects investigative indicators and does not establish criminal activity.</p><aside><strong>Why this score?</strong><p>{risk.explanation}</p></aside></section>
}
