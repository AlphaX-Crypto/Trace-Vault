import {getCaseIntelligence} from './caseIntelligence'

const assetByLedger={Ethereum:'ETH',Bitcoin:'BTC',Tron:'USDT',Polygon:'USDC'}

export const primaryPathNodeIds=['suspect','intermediary-a','intermediary-b','exchange-deposit','likely-vasp','unknown-destination']

export const graphFilterDefinitions=[
  {key:'unknown',label:'Unknown wallets'},
  {key:'intermediary',label:'Intermediaries'},
  {key:'risk',label:'Risk indicators'},
  {key:'vasp',label:'VASP entities'},
]

export function createGraphMockData(investigation){
  const asset=assetByLedger[investigation.blockchain]||'ETH'
  const intelligence=investigation.intelligence||getCaseIntelligence(investigation)
  const attribution=intelligence.attribution
  const nodes=[
    {id:'suspect',type:'wallet',position:{x:20,y:225},data:{category:'suspect',depth:0,direction:'both',label:'Suspect Wallet',address:investigation.wallet,risk:investigation.riskLevel,metadata:{transactionCount:investigation.transactions,inbound:`36.2 ${asset}`,outbound:`45.2 ${asset}`,firstSeen:'2026-08-14 09:42 UTC',lastSeen:'2026-09-12 08:16 UTC',indicators:['High-velocity redistribution','Repeated intermediary routing']}}},
    {id:'intermediary-a',type:'intermediary',position:{x:245,y:225},data:{category:'intermediary',depth:1,direction:'outgoing',label:'Intermediary A',address:'0x84C2E91A0F17BD',metadata:{transactionCount:64,inbound:`2.4 ${asset}`,outbound:`2.1 ${asset}`,firstSeen:'2026-09-09 16:31 UTC',lastSeen:'2026-09-10 02:08 UTC',indicators:['Rapid forwarding pattern']}}},
    {id:'intermediary-b',type:'intermediary',position:{x:470,y:225},data:{category:'intermediary',depth:2,direction:'outgoing',label:'Intermediary B',address:'0x3AF172DE9B28C4',metadata:{transactionCount:27,inbound:`2.1 ${asset}`,outbound:`1.9 ${asset}`,firstSeen:'2026-09-10 02:08 UTC',lastSeen:'2026-09-10 02:24 UTC',indicators:['Short holding interval']}}},
    ...(attribution.hasProbableVasp?[
      {id:'exchange-deposit',type:'exchangeDeposit',position:{x:695,y:225},data:{category:'exchange',depth:3,direction:'outgoing',label:'Exchange Deposit',address:intelligence.addresses.exchangeDeposit,entity:attribution.entityName,confidence:attribution.confidence,metadata:{transactionCount:14,inbound:`1.9 ${asset}`,outbound:`1.86 ${asset}`,firstSeen:'2026-09-10 02:24 UTC',lastSeen:'2026-09-11 12:05 UTC',indicators:['Mixer inflow match','High velocity redistribution']}}},
      {id:'likely-vasp',type:'vasp',position:{x:920,y:225},data:{category:'vasp',depth:3,direction:'outgoing',label:'Likely VASP',entity:attribution.entityName,confidence:attribution.confidence,address:'Entity attribution record',metadata:{pathDistance:`${attribution.hops} hops`,evidenceSource:attribution.source,firstSeen:'2026-09-10 02:24 UTC',lastSeen:'2026-09-12 07:50 UTC',indicators:['Probable deposit-address association']}}},
    ]:[
      {id:'unknown-destination',type:'wallet',position:{x:695,y:225},data:{category:'unknown',depth:3,direction:'outgoing',label:'Unattributed Destination',address:'0x19EFC6B72A044D',metadata:{transactionCount:3,inbound:`1.9 ${asset}`,outbound:`0.09 ${asset}`,firstSeen:'2026-09-10 02:24 UTC',lastSeen:'2026-09-12 06:17 UTC',indicators:['No sufficient tagged entity match']}}},
    ]),
    {id:'unknown-upper',type:'wallet',position:{x:245,y:25},data:{category:'unknown',depth:1,direction:'outgoing',label:'Unknown Wallet',address:'0x6D11A90F2E813C',metadata:{transactionCount:8,inbound:`0.74 ${asset}`,outbound:`0.68 ${asset}`,firstSeen:'2026-09-09 18:10 UTC',lastSeen:'2026-09-10 04:42 UTC',indicators:[]}}},
    {id:'risk-service',type:'wallet',position:{x:470,y:25},data:{category:'risk',depth:2,direction:'outgoing',label:'Possible Mixer Indicator',address:'0xB91C72A8F0D55E',risk:'MEDIUM',metadata:{transactionCount:39,inbound:`0.68 ${asset}`,outbound:`0.61 ${asset}`,firstSeen:'2026-09-10 04:42 UTC',lastSeen:'2026-09-10 05:01 UTC',indicators:['Mixer-pattern proximity','Fragmented outputs']}}},
    {id:'intermediary-side',type:'intermediary',position:{x:470,y:430},data:{category:'intermediary',depth:2,direction:'outgoing',label:'Intermediary C',address:'0xD42A10CF7E094B',metadata:{transactionCount:11,inbound:`0.42 ${asset}`,outbound:`0.38 ${asset}`,firstSeen:'2026-09-10 07:14 UTC',lastSeen:'2026-09-11 11:20 UTC',indicators:[]}}},
    {id:'unknown-low',type:'wallet',position:{x:695,y:430},data:{category:'unknown',depth:3,direction:'outgoing',label:'Unknown Wallet',address:'0x19EFC6B72A044D',metadata:{transactionCount:3,inbound:`0.38 ${asset}`,outbound:`0.09 ${asset}`,firstSeen:'2026-09-11 11:20 UTC',lastSeen:'2026-09-12 06:17 UTC',indicators:['Low-volume unrelated transfer']}}},
    {id:'incoming-source',type:'wallet',position:{x:20,y:430},data:{category:'unknown',depth:1,direction:'incoming',label:'Unknown Source',address:'0x771AB20D5C8F42',metadata:{transactionCount:5,inbound:`5.8 ${asset}`,outbound:`4.2 ${asset}`,firstSeen:'2026-09-08 12:11 UTC',lastSeen:'2026-09-09 09:06 UTC',indicators:[]}}},
  ]
  const edge=(id,source,target,amount,extra={})=>({id,source,target,type:'transaction',data:{amount,asset,txHash:`0x${id.replaceAll('-','')}8f31c9a4`,timestamp:'2026-09-10 02:24 UTC',direction:'outgoing',...extra}})
  const edges=[
    edge('tx-primary-1','suspect','intermediary-a','2.4',{isPrimaryPath:true}),
    edge('tx-primary-2','intermediary-a','intermediary-b','2.1',{isPrimaryPath:true}),
    ...(attribution.hasProbableVasp?[
      edge('tx-primary-3','intermediary-b','exchange-deposit','1.9',{isPrimaryPath:true}),
      edge('entity-link','exchange-deposit','likely-vasp','', {isPrimaryPath:true,isAssociation:true}),
    ]:[edge('tx-primary-3','intermediary-b','unknown-destination','1.9',{isPrimaryPath:true})]),
    edge('tx-upper-1','suspect','unknown-upper','0.74'),
    edge('tx-risk-1','unknown-upper','risk-service','0.68',{risk:'MEDIUM'}),
    edge('tx-side-1','intermediary-a','intermediary-side','0.42'),
    edge('tx-side-2','intermediary-side','unknown-low','0.38'),
    {...edge('tx-incoming-1','incoming-source','suspect','4.2'),data:{amount:'4.2',asset,txHash:'0xincoming91bd45',timestamp:'2026-09-09 09:06 UTC',direction:'incoming'}},
  ]
  return {nodes,edges}
}
