import { Panel } from '@xyflow/react'
const entries=[['suspect','Suspect Wallet'],['intermediary','Intermediary'],['unknown','Unknown Wallet'],['exchange','Exchange Deposit'],['vasp','Likely VASP'],['risk','Risk Indicator']]
export default function GraphLegend(){return <Panel position="bottom-left" className="graph-legend" aria-label="Graph legend">{entries.map(([tone,label])=><span key={tone}><i className={`legend-${tone}`}/>{label}</span>)}</Panel>}
