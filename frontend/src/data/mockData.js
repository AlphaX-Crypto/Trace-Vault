export const cases=[{id:'TV-2026-041',name:'Cross-Chain Exit Pattern',blockchain:'Ethereum',wallet:'0x71F9A82D93AE84C2',vasp:'Example Exchange',confidence:82,hops:3,riskScore:67,riskLevel:'HIGH',transactions:412,status:'Analysis complete',investigator:'T. JD',updated:'12 min ago',flow:'84.7 ETH'},{id:'TV-2026-038',name:'Mixer Inflow Review',blockchain:'Bitcoin',wallet:'bc1q8rx9ap2v7hqd',vasp:'Northstar Custody',confidence:74,hops:4,riskScore:83,riskLevel:'CRITICAL',transactions:286,status:'Evidence review',investigator:'M. Rao',updated:'34 min ago',flow:'31.2 BTC'},{id:'TV-2026-036',name:'Layered Deposit Cluster',blockchain:'Tron',wallet:'TNE7Qp1c42A9kL8x',vasp:'HarborX',confidence:69,hops:2,riskScore:58,riskLevel:'MEDIUM',transactions:173,status:'Tracing paths',investigator:'T. JD',updated:'1 hr ago',flow:'640K USDT'},{id:'TV-2026-029',name:'Merchant Wallet Diversion',blockchain:'Polygon',wallet:'0x9A3B72C819E04F7D',vasp:'No probable VASP yet',confidence:38,hops:5,riskScore:31,riskLevel:'MEDIUM',transactions:96,status:'Open',investigator:'A. Sen',updated:'Yesterday',flow:'18.4K USDC'},{id:'TV-2026-024',name:'Rapid Consolidation Chain',blockchain:'Ethereum',wallet:'0xC8841A52BF78D301',vasp:'Meridian Markets',confidence:77,hops:3,riskScore:72,riskLevel:'HIGH',transactions:351,status:'Report drafting',investigator:'M. Rao',updated:'2 days ago',flow:'126.1 ETH'}]
export const dashboardMetrics=[{label:'Active cases',value:'18',delta:'+3 this week',tone:'accent'},{label:'High-risk reviews',value:'07',delta:'2 awaiting evidence',tone:'high'},{label:'Wallets analyzed',value:'1,284',delta:'Across 6 ledgers',tone:'neutral'},{label:'Likely VASP attributions',value:'43',delta:'≥ 70% confidence',tone:'low'}]
export const riskDistribution=[{level:'CRITICAL',count:2,percent:11},{level:'HIGH',count:5,percent:28},{level:'MEDIUM',count:7,percent:39},{level:'LOW',count:4,percent:22}]
export const activityData=[18,29,24,46,34,52,44,61,53,73,59,68,47,56]
export const investigationStages=[{label:'Tracing paths',count:6},{label:'Attribution review',count:4},{label:'Evidence review',count:5},{label:'Report drafting',count:3}]
export const dashboardTotals={systemStatus:'Operational',lastIndexed:'4 min ago',transactionsIndexed:'2.8M'}

export const analysisSteps=[
  'Validating wallet',
  'Fetching transactions',
  'Normalizing transaction data',
  'Building transaction graph',
  'Searching transaction paths',
  'Identifying nearest likely VASP',
  'Calculating risk & confidence',
]

export const riskIndicators=[
  {label:'Transaction Pattern',value:85},
  {label:'Counterparty Association',value:72},
  {label:'Behavioral Flags',value:68},
]

export function createMockInvestigation(submission){
  const unit={Ethereum:'ETH',Bitcoin:'BTC',Tron:'USDT',Polygon:'USDC'}[submission.blockchain]||'units'
  return {
    ...submission,
    id:submission.caseId,
    name:submission.title,
    status:'Analysis complete',
    updated:'Just now',
    workflow:'Overview ready for investigator review',
    vasp:'Example Exchange',
    confidence:82,
    hops:Number(submission.hopDepth),
    riskScore:67,
    riskLevel:'HIGH',
    transactions:412,
    pathCount:6,
    flow:`84.7 ${unit}`,
    indicators:riskIndicators,
  }
}
