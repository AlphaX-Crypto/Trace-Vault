import Badge from '../common/Badge'

export default function RiskIndicatorTable({indicators}){
  return <section className="intel-panel risk-table-section"><header><div><span>Observed signals</span><h2>Risk indicators</h2></div><small>{indicators.length} contributors</small></header><div className="intel-table-scroll"><table className="intel-table"><thead><tr><th>Indicator</th><th>Severity</th><th>Observed entity</th><th>Contribution</th><th>Evidence</th><th>Status</th></tr></thead><tbody>{indicators.map(item=><tr key={item.id}><td><strong>{item.indicator}</strong><small>{item.reason}</small></td><td><Badge tone={item.severity}>{item.severity}</Badge></td><td className={item.entity.startsWith('0x')?'mono':''}>{item.entity}</td><td className="contribution">+{item.contribution}</td><td>{item.evidence}</td><td><span className="record-status">{item.status}</span></td></tr>)}</tbody></table></div></section>
}
