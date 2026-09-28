import Badge from '../common/Badge'
import ReportSection from './ReportSection'

export default function RiskFindings({risk}){return <ReportSection title="Risk Assessment" number="05" action={<Badge tone={risk.level}>{risk.level}</Badge>}><div className="report-risk"><div className="report-risk-score"><strong>{risk.score}</strong><span>/ 100</span></div><div className="report-risk-items">{risk.indicators.map(item=><div key={item.id}><span>{item.indicator}</span><b>+{item.contribution}</b><small>{item.reason}</small></div>)}</div></div><p className="report-disclaimer">Risk scores reflect investigative indicators and do not establish criminal activity.</p></ReportSection>}
