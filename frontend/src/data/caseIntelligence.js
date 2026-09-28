const addresses={
  intermediaryA:'0x84C2E91A0F17BD',
  intermediaryB:'0x3AF172DE9B28C4',
  exchangeDeposit:'0x92DE8841FC11A7',
  riskService:'0xB91C72A8F0D55E',
}

const transactionHashes={
  primary1:'0xtxprimary18f31c9a4',
  primary2:'0xtxprimary28f31c9a4',
  primary3:'0xtxprimary38f31c9a4',
}

function assetFor(blockchain){return {Ethereum:'ETH',Bitcoin:'BTC',Tron:'USDT',Polygon:'USDC'}[blockchain]||'ETH'}

function createAttribution(investigation){
  const hasProbableVasp=!String(investigation.vasp).toLowerCase().startsWith('no probable')
  if(!hasProbableVasp)return {
    hasProbableVasp:false,
    entityName:null,
    displayName:'No probable VASP identified',
    status:'Insufficient confidence',
    confidence:investigation.confidence,
    confidenceLabel:'Low confidence',
    hops:investigation.hops,
    entityType:'Unattributed destination',
    source:'Mock tagged entity dataset',
    method:'Transaction-path proximity + tagged entity intelligence',
    explanation:'The current transaction path does not provide sufficient evidence to confidently associate the destination with a tagged VASP.',
  }
  return {
    hasProbableVasp:true,
    entityName:investigation.vasp,
    displayName:investigation.vasp,
    status:'Likely associated',
    confidence:investigation.confidence,
    confidenceLabel:investigation.confidence>=70?'High confidence':'Moderate confidence',
    hops:investigation.hops,
    entityType:'VASP / Exchange',
    source:'Mock tagged entity dataset',
    method:'Transaction-path proximity + tagged entity intelligence',
    explanation:`The observed path reaches an address probably associated with ${investigation.vasp}. This is a mock intelligence assessment, not an ownership determination.`,
  }
}

function createPath(investigation,attribution){
  const asset=assetFor(investigation.blockchain)
  const base=[
    {id:'suspect',label:'Suspect Wallet',role:'Origin under review',address:investigation.wallet,hop:0,amount:null},
    {id:'intermediary-a',label:'Intermediary A',role:'Forwarding wallet',address:addresses.intermediaryA,hop:1,amount:`2.4 ${asset}`},
    {id:'intermediary-b',label:'Intermediary B',role:'Rapid redistribution',address:addresses.intermediaryB,hop:2,amount:`2.1 ${asset}`},
  ]
  if(attribution.hasProbableVasp)return [...base,
    {id:'exchange-deposit',label:'Exchange Deposit',role:'Tagged deposit address',address:addresses.exchangeDeposit,hop:3,amount:`1.9 ${asset}`},
    {id:'likely-vasp',label:'Likely VASP',role:'Probable entity association',address:attribution.entityName,hop:3,amount:null},
  ]
  return [...base,{id:'unknown-destination',label:'Unattributed destination',role:'No tagged entity match',address:'0x19EFC6B72A044D',hop:attribution.hops,amount:`1.9 ${asset}`}]
}

function createRisk(investigation){
  const primary=investigation.id==='TV-2026-041'
  const indicators=primary?[
    {id:'RI-01',indicator:'Mixer exposure',severity:'High',entity:addresses.riskService,contribution:30,evidence:'Transaction path',status:'Detected',reason:'A connected path displays patterns consistent with a possible mixer interaction.'},
    {id:'RI-02',indicator:'Cross-chain activity',severity:'Medium',entity:'Suspect Wallet',contribution:17,evidence:'Case activity',status:'Detected',reason:'The mock case includes movement across ledger boundaries.'},
    {id:'RI-03',indicator:'Rapid redistribution',severity:'Medium',entity:'Intermediary B',contribution:10,evidence:'Transaction timing',status:'Detected',reason:'Funds were forwarded after a short holding interval.'},
    {id:'RI-04',indicator:'Intermediary hops',severity:'Low',entity:'Transaction path',contribution:10,evidence:'Path analysis',status:'Supporting',reason:'The route includes multiple forwarding wallets before the tagged destination.'},
  ]:[
    {id:'RI-01',indicator:'Intermediary hops',severity:'Medium',entity:'Transaction path',contribution:Math.min(investigation.riskScore,20),evidence:'Path analysis',status:'Detected',reason:'The mock path includes intermediary wallet activity.'},
    {id:'RI-02',indicator:'Velocity anomaly',severity:'Low',entity:'Suspect Wallet',contribution:Math.max(investigation.riskScore-20,0),evidence:'Transaction timing',status:'Supporting',reason:'Observed timing merits investigator review.'},
  ]
  return {score:investigation.riskScore,level:investigation.riskLevel,indicators,explanation:`The ${investigation.riskLevel} risk score is driven by ${indicators.map(item=>item.indicator.toLowerCase()).join(' and ')}. These signals are investigative indicators only and should be reviewed alongside supporting evidence.`}
}

function createEvidence(investigation,attribution,risk,path){
  const asset=assetFor(investigation.blockchain)
  const attributionDescription=attribution.hasProbableVasp?`Possible relationship to ${attribution.entityName}`:'No tagged VASP association meets the confidence threshold'
  return [
    {id:'EV-001',type:'Transaction',description:`Outgoing transfer of 2.4 ${asset}`,entity:'Suspect Wallet → Intermediary A',source:'Mock blockchain dataset',status:'Verified',timestamp:'2026-09-12 14:32 UTC',metadata:{from:investigation.wallet,to:addresses.intermediaryA,amount:'2.4',asset,transactionHash:transactionHashes.primary1,notes:'Normalized outbound transfer included in the primary path.'}},
    {id:'EV-002',type:'Transaction',description:`Forwarding transfer of 2.1 ${asset}`,entity:'Intermediary A → Intermediary B',source:'Mock blockchain dataset',status:'Verified',timestamp:'2026-09-12 14:33 UTC',metadata:{from:addresses.intermediaryA,to:addresses.intermediaryB,amount:'2.1',asset,transactionHash:transactionHashes.primary2,notes:'Short holding interval observed in the fictional transaction record.'}},
    {id:'EV-003',type:'Wallet',description:attribution.hasProbableVasp?'Tagged exchange deposit address observed':'Destination address has no sufficient tagged entity match',entity:attribution.hasProbableVasp?addresses.exchangeDeposit:'0x19EFC6B72A044D',source:'Mock tagged entity dataset',status:attribution.hasProbableVasp?'Supporting':'Needs Review',timestamp:'2026-09-12 14:33 UTC',metadata:{address:attribution.hasProbableVasp?addresses.exchangeDeposit:'0x19EFC6B72A044D',notes:'Tag is fictional and provided only for interface demonstration.'}},
    {id:'EV-004',type:'Path',description:`Primary transaction path spans ${attribution.hops} hops`,entity:'Suspect Wallet → Destination',source:'Mock path analysis',status:'Verified',timestamp:'2026-09-12 14:34 UTC',metadata:{hopDistance:attribution.hops,path:path.map(item=>item.label).join(' → '),notes:'Path is precomputed mock intelligence; no graph search runs in the browser.'}},
    {id:'EV-005',type:'Attribution',description:attributionDescription,entity:attribution.hasProbableVasp?'Likely VASP':'Unattributed destination',source:'Mock attribution result',status:attribution.hasProbableVasp?'Supporting':'Insufficient',timestamp:'2026-09-12 14:34 UTC',metadata:{entity:attribution.entityName||'No probable VASP identified',confidence:attribution.confidence,hopDistance:attribution.hops,evidenceSource:attribution.source,notes:attribution.explanation}},
    {id:'EV-006',type:'Risk',description:`${risk.indicators[0].indicator} indicator detected`,entity:risk.indicators[0].entity,source:'Mock risk engine',status:'Detected',timestamp:'2026-09-12 14:34 UTC',metadata:{riskIndicator:risk.indicators[0].indicator,contribution:risk.indicators[0].contribution,relatedNode:risk.indicators[0].entity,reason:risk.indicators[0].reason,notes:'Indicator requires investigator interpretation and does not establish criminal activity.'}},
    {id:'EV-007',type:'Risk',description:`${risk.indicators[1].indicator} requires review`,entity:risk.indicators[1].entity,source:'Mock risk engine',status:'Needs Review',timestamp:'2026-09-12 14:35 UTC',metadata:{riskIndicator:risk.indicators[1].indicator,contribution:risk.indicators[1].contribution,relatedNode:risk.indicators[1].entity,reason:risk.indicators[1].reason,notes:'Corroboration should be sought before drawing conclusions.'}},
    {id:'EV-008',type:'Path',description:'Destination behavior compared with tagged entity patterns',entity:attribution.hasProbableVasp?attribution.entityName:'Unknown destination',source:'Mock behavioral model',status:attribution.hasProbableVasp?'Corroborating':'Needs Review',timestamp:'2026-09-12 14:36 UTC',metadata:{hopDistance:attribution.hops,notes:'Behavioral similarity is supporting intelligence and is not legal proof.'}},
  ]
}

export function getCaseIntelligence(investigation){
  const attribution=createAttribution(investigation)
  const path=createPath(investigation,attribution)
  const risk=createRisk(investigation)
  const evidence=createEvidence(investigation,attribution,risk,path)
  return {attribution,path,risk,evidence,addresses,transactionHashes}
}
