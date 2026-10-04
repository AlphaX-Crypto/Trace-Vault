import { CaseSubjectAttribution } from './attributionTypes';

export const CASE_VASP_ATTRIBUTION_DATA: CaseSubjectAttribution = {
  caseId: 'CASE-2026-001',
  caseTitle: 'Cross-Rail Peeling Chain to Domestic VPA Sweep',
  subjectAddress: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
  rail: 'Ethereum Mainnet',
  primaryAttributionId: 'vasp-a',
  methodology: 'Deterministic Graph BFS + Registry Heuristics (NetworkX)',
  generatedAt: '2026-09-29 08:35:12 UTC',
  candidates: [
    {
      id: 'vasp-a',
      name: 'VASP A — Example Exchange',
      legalEntity: 'Example Global Markets Ltd.',
      jurisdiction: 'Seychelles / Cayman Islands',
      entityType: 'Centralized Exchange (VASP)',
      confidence: 82,
      confidenceLabel: 'HIGH',
      hopDistance: 1,
      totalVolume: '42.50 ETH (~$148,750)',
      depositClusterAddress: '0x84C2EF17BD0038F6170e9D479428B71587e109',
      lastActive: '3 mins ago',
      associationBasis: {
        addressMatch: {
          matchedRule: 'RULE_1_KNOWN_VASP_ADDRESS & RULE_2_KNOWN_DEPOSIT_WALLET',
          clusterName: 'Example Exchange Hot Wallet Cluster #14',
          entityType: 'CENTRALIZED_VASP_DEPOSIT',
          verifiedTags: ['CEX', 'KYC_ON_RAMP', 'KNOWN_DEPOSIT_FORWARDER', 'CLUSTER_14'],
          registrySource: 'VaspRegistry (Authoritative Enterprise Internal Index)',
          reliability: 'VERIFIED_OFFICIAL',
          confidenceBase: 90,
          details: 'Direct attribution match against verified deposit forwarder contract registered to Example Exchange corporate entity.'
        },
        graphRelationship: {
          graphDistance: 1,
          hopPenalty: 8,
          subgraphTopology: 'Direct Directed Edge (Subject → Candidate Deposit)',
          centralityScore: '0.84 (High In-Degree Hub)',
          proximityRating: 'IMMEDIATE_PROXIMITY',
          details: 'Immediate 1-hop topological adjacency. No obfuscation mixer or peeling hops detected between subject and deposit router.'
        },
        transactionPath: {
          hopCount: 1,
          flowVelocity: 'Direct Settlement (Immediate)',
          totalTransferred: '42.50 ETH',
          timeSpan: '12 seconds',
          pathSequence: [
            {
              address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
              label: 'Subject Wallet (Under Investigation)',
              isSubject: true,
              hopIndex: 0
            },
            {
              address: '0x84C2EF17BD0038F6170e9D479428B71587e109',
              label: 'Example Exchange Deposit Router',
              isTarget: true,
              hopIndex: 1
            }
          ],
          details: 'Primary outbound fund liquidation path routed into verified exchange omnibus clearing structure.'
        }
      },
      supportingTransactions: [
        {
          txHash: '0x8ef2a9103c8b7b659fe10938bfe41209b0a124982',
          from: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
          to: '0x84C2EF17BD0038F6170e9D479428B71587e109',
          amount: '42.50 ETH',
          time: '2026-09-29 08:30:15 UTC',
          rail: 'Ethereum',
          status: 'SUCCESS',
          type: 'Direct Deposit Transfer'
        },
        {
          txHash: '0x94pd3819284729104829103847291048291ska134',
          from: '0x84C2EF17BD0038F6170e9D479428B71587e109',
          to: '0x3AF17828C403dE4B07B4f114B5C1089b0A1828C4',
          amount: '12.30 ETH',
          time: '2026-09-29 08:31:02 UTC',
          rail: 'Ethereum',
          status: 'SUCCESS',
          type: 'Internal Exchange Sweep'
        }
      ],
      reasoningTrace: [
        "1. Subject wallet '0x71F9A6...89b0A1' initiated direct outbound transfer of 42.50 ETH.",
        "2. Destination node '0x84C2EF...87e109' matched authoritative VaspRegistry entry for Example Exchange.",
        "3. Address classified as an active deposit sweep router belonging to exchange custody cluster #14.",
        "4. Graph distance calculated at exactly 1 directed hop (hop penalty: -8.0%).",
        "5. Final attribution confidence established at 82.0% (HIGH) based on 90.0% base minus 8.0% hop penalty.",
        "6. Subpoena package and LEA disclosure record ready for production."
      ]
    },
    {
      id: 'vasp-b',
      name: 'VASP B — Kraken Custody & Settlement',
      legalEntity: 'Payward, Inc.',
      jurisdiction: 'United States / FinCEN Registered',
      entityType: 'Institutional Custodian (VASP)',
      confidence: 64,
      confidenceLabel: 'MODERATE',
      hopDistance: 2,
      totalVolume: '18.20 ETH (~$63,700)',
      depositClusterAddress: '0x3AF17828C403dE4B07B4f114B5C1089b0A1828C4',
      lastActive: '12 mins ago',
      associationBasis: {
        addressMatch: {
          matchedRule: 'RULE_3_KNOWN_ENTITY_CLUSTER & RULE_6_SOURCE_RELIABILITY',
          clusterName: 'Kraken Cold/Warm Liquidity Transit',
          entityType: 'INSTITUTIONAL_VASP',
          verifiedTags: ['US_REGULATED', 'INSTITUTIONAL_OTC', 'CUSTODY_SETTLEMENT'],
          registrySource: 'Public + Commercial Intelligence Registry',
          reliability: 'VERIFIED_CORROBORATED',
          confidenceBase: 80,
          details: 'Secondary hop matches Kraken OTC clearing desk transit address corroborated across 3 independent heuristics.'
        },
        graphRelationship: {
          graphDistance: 2,
          hopPenalty: 16,
          subgraphTopology: '2-Hop Peeling Transit (Subject → Peel Node → Kraken Router)',
          centralityScore: '0.62 (Moderate Out-Degree)',
          proximityRating: 'SECONDARY_PROXIMITY',
          details: 'Separated by 1 intermediary peel hop. Intermediary address retains 30.20 ETH change while dispatching 12.30 ETH to Kraken.'
        },
        transactionPath: {
          hopCount: 2,
          flowVelocity: 'Deferred Peeling (2 mins elapsed)',
          totalTransferred: '18.20 ETH',
          timeSpan: '105 seconds',
          pathSequence: [
            {
              address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
              label: 'Subject Wallet',
              isSubject: true,
              hopIndex: 0
            },
            {
              address: '0x84C2EF17BD0038F6170e9D479428B71587e109',
              label: 'Intermediary Peeling Node',
              hopIndex: 1
            },
            {
              address: '0x3AF17828C403dE4B07B4f114B5C1089b0A1828C4',
              label: 'Kraken Settlement Transit',
              isTarget: true,
              hopIndex: 2
            }
          ],
          details: 'Partial balance split into intermediary peel address prior to secondary transmission to Kraken custodial rails.'
        }
      },
      supportingTransactions: [
        {
          txHash: '0xad9f7c992014819284019284019284014c1e3e0984da',
          from: '0x84C2EF17BD0038F6170e9D479428B71587e109',
          to: '0x3AF17828C403dE4B07B4f114B5C1089b0A1828C4',
          amount: '12.30 ETH',
          time: '2026-09-29 08:32:00 UTC',
          rail: 'Ethereum',
          status: 'SUCCESS',
          type: 'Peeling Dispersal Hop'
        },
        {
          txHash: '0x5c7210984029184029184029184029184019281a8b9',
          from: '0x3AF17828C403dE4B07B4f114B5C1089b0A1828C4',
          to: 'Kraken Hot Wallet 02',
          amount: '5.90 ETH',
          time: '2026-09-29 08:34:10 UTC',
          rail: 'Ethereum',
          status: 'SUCCESS',
          type: 'Omnibus Aggregation'
        }
      ],
      reasoningTrace: [
        "1. Subject wallet dispersed funds into intermediary peeling node '0x84C2EF...87e109'.",
        "2. Intermediary node routed secondary tranche of 12.30 ETH into '0x3AF178...828C4'.",
        "3. Target address is tagged as Kraken Institutional Custody / Transit address.",
        "4. Graph distance established at 2 hops (hop penalty: -16.0%).",
        "5. Attribution confidence calculated at 64.0% (MODERATE) reflecting 2-hop structural decay.",
        "6. Recommend formal request to Kraken compliance team under Section 91 CrPC / MLAT."
      ]
    },
    {
      id: 'vasp-c',
      name: 'VASP C — OKX P2P Liquidity Desk',
      legalEntity: 'Aux Cayes FinTech Co. Ltd.',
      jurisdiction: 'Bahamas / Dubai VARA Licensed',
      entityType: 'P2P Trading Counterparty (VASP)',
      confidence: 41,
      confidenceLabel: 'LOW',
      hopDistance: 3,
      totalVolume: '8.45 ETH (~$29,575)',
      depositClusterAddress: '0x18D50244C581902840192840192840145502b',
      lastActive: '45 mins ago',
      associationBasis: {
        addressMatch: {
          matchedRule: 'RULE_4_GRAPH_PROXIMITY & RULE_5_PATH_EVIDENCE',
          clusterName: 'OKX Merchant Escrow Pool #09',
          entityType: 'P2P_MERCHANT_ESCROW',
          verifiedTags: ['P2P_MERCHANT', 'HIGH_TURNOVER', 'CROSS_RAIL_GATEWAY'],
          registrySource: 'Commercial On-Chain Cluster Index',
          reliability: 'PROVISIONAL_MATCH',
          confidenceBase: 70,
          details: 'Address identified as high-volume P2P escrow desk facilitating fiat conversions into domestic UPI corridors.'
        },
        graphRelationship: {
          graphDistance: 3,
          hopPenalty: 29,
          subgraphTopology: '3-Hop Peeling & Conversion Cascade',
          centralityScore: '0.45 (Dispersed Endpoint)',
          proximityRating: 'DISTAL_PROXIMITY',
          details: 'Separated by 3 hops involving multiple intermediary wallets. Confidence dampened significantly by distance.'
        },
        transactionPath: {
          hopCount: 3,
          flowVelocity: 'Multi-Stage Layering (8 mins elapsed)',
          totalTransferred: '8.45 ETH',
          timeSpan: '8.5 minutes',
          pathSequence: [
            {
              address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
              label: 'Subject Wallet',
              isSubject: true,
              hopIndex: 0
            },
            {
              address: '0x84C2EF17BD0038F6170e9D479428B71587e109',
              label: 'Hop 1 Peel Node',
              hopIndex: 1
            },
            {
              address: '0x3AF17828C403dE4B07B4f114B5C1089b0A1828C4',
              label: 'Hop 2 Layering Node',
              hopIndex: 2
            },
            {
              address: '0x18D50244C581902840192840192840145502b',
              label: 'OKX P2P Escrow Counterparty',
              isTarget: true,
              hopIndex: 3
            }
          ],
          details: 'Complex peeling chain terminating at an active P2P merchant wallet linked directly to domestic UPI off-ramps.'
        }
      },
      supportingTransactions: [
        {
          txHash: '0x721629e590419e96521948fc0918204918204918204',
          from: '0x3AF17828C403dE4B07B4f114B5C1089b0A1828C4',
          to: '0x18D50244C581902840192840145502b',
          amount: '8.45 ETH',
          time: '2026-09-29 08:35:40 UTC',
          rail: 'Ethereum',
          status: 'SUCCESS',
          type: 'P2P Escrow Funding'
        },
        {
          txHash: 'TRC20_039d819284019284019284019284019284sldnb3',
          from: '0x18D50244C581902840192840145502b',
          to: 'vpa98@okhdfcbank',
          amount: '₹71,40,000 (UPI)',
          time: '2026-09-29 08:36:12 UTC',
          rail: 'UPI Domestic',
          status: 'SUCCESS',
          type: 'Off-Ramp Dispersal'
        }
      ],
      reasoningTrace: [
        "1. Subject funds traced through a 3-stage peeling sequence.",
        "2. Third-hop destination '0x18D502...45502b' recognized as an OKX P2P liquidity merchant.",
        "3. Entity subsequently liquidated crypto holdings into domestic UPI VPA 'vpa98@okhdfcbank'.",
        "4. Graph distance of 3 hops imposes significant hop decay penalty (-29.0%).",
        "5. Attribution confidence assessed at 41.0% (LOW/PROVISIONAL).",
        "6. Key cross-rail evidentiary bridge connecting crypto peeling chain to domestic UPI activity."
      ]
    }
  ]
};
