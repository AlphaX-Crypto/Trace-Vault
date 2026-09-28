const types=['All','Transaction','Wallet','Attribution','Risk','Path']
const statuses=['All statuses','Verified','Supporting','Corroborating','Needs Review','Detected','Insufficient']

export default function EvidenceFilters({type,onTypeChange,status,onStatusChange,count}){
  return <div className="evidence-filters"><div className="filter-tabs" aria-label="Filter evidence by type">{types.map(option=><button key={option} type="button" aria-pressed={type===option} onClick={()=>onTypeChange(option)}>{option}</button>)}</div><div className="filter-status"><label htmlFor="evidence-status">Status</label><select id="evidence-status" value={status} onChange={event=>onStatusChange(event.target.value)}>{statuses.map(option=><option key={option}>{option}</option>)}</select><span>{count} records</span></div></div>
}
