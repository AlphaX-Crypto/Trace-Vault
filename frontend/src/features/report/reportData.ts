import { InvestigationReportData } from './reportTypes';

export const initialReportData: InvestigationReportData = {
  reportId: 'REP-2026-001-A',
  caseId: 'CASE-2026-001',
  caseTitle: 'Cross-Rail Peeling Chain to Domestic VPA Sweep',
  caseType: 'Cross-Rail Financial Investigation',
  generatedAt: '2026-09-29 08:50:00 UTC',
  status: 'UNDER REVIEW',
  dataClassification: 'DEMO / SYNTHETIC DATA',
  isSynthetic: true,

  subject: {
    subjectType: 'Multi-Rail Financial Entity',
    primaryIdentifier: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
    secondaryIdentifier: 'vpa98@okhdfcbank',
    rails: ['Ethereum Mainnet', 'Tron TRC-20', 'UPI Domestic', 'HDFC Core Banking'],
    observedTransactionsCount: 24,
    distinctCounterpartiesCount: 8,
    riskScore: 72,
    riskSeverity: 'HIGH',
    attributionCandidate: 'Example Exchange (Deposit Cluster 9)',
    attributionConfidence: 82,
    locationSignalsCount: 3,
    evidenceRecordsCount: 8
  },

  executiveSummary: {
    observedActivity:
      'Twenty-four transactions across Ethereum and domestic UPI rails were observed within the investigation window (08:28 to 08:45 UTC). Initial on-chain execution transferred 42.50 ETH through two intermediate staging addresses before consolidating into a known exchange deposit structure.',
    systemAnalysis:
      'Deterministic graph traversal identified a 3-hop peeling fragmentation signature. In parallel, domestic UPI telemetry identified rapid pass-through dispersal where ₹49,500.00 inbound credits were re-routed into multiple sub-accounts within 180 seconds of clearing.',
    attributionFindings:
      'Transaction path and cluster address correlation indicates an 82% candidate association between the terminal Ethereum deposit address (0x92DE...C11A7) and Example Exchange custodial infrastructure. Attribution remains candidate-level and does not verify identity.',
    locationCorrelations:
      'Telemetry associated with UPI transaction TX-UPI-005 originated in Bengaluru (12.9716° N) at 08:35 UTC, preceded 23 minutes earlier by banking access recorded in Mumbai (19.0760° N). The implied transit velocity exceeds physical feasibility thresholds, indicating distributed access or proxy routing.',
    evidenceAvailable:
      'Eight structured evidence records have been cataloged in the Evidence Register (3 Observed Facts, 2 System Analysis findings, 1 Attribution Indicator, 1 Risk Indicator, and 1 Investigator Interpretation).',
    reviewStatus:
      'Report is currently Under Investigator Review. Prioritized next steps require candidate VASP disclosure preparation and cross-rail settlement desk review.'
  },

  transactions: [
    {
      id: '0x8ef2a9103c8b7b659fe10938bfe41209b0a124982',
      timestamp: '2026-09-29 08:28:12 UTC',
      rail: 'Ethereum Mainnet',
      direction: 'OUTBOUND',
      amount: '42.50 ETH',
      from: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
      to: '0x84C2EF17BD0038F3...87e109',
      relationship: 'Primary Peeling Hop 1 (High Gas Priority)',
      classification: 'OBSERVED_FACT'
    },
    {
      id: '0x90272f6a8819320e891c79028a6f120938',
      timestamp: '2026-09-29 08:29:40 UTC',
      rail: 'Ethereum / Mixer Pool',
      direction: 'OUTBOUND',
      amount: '30.00 ETH',
      from: '0x6D11A04913k...E813C',
      to: '0x891C79028A...0D55E (Mixer Pool)',
      relationship: 'Anonymization Privacy Pool Deposit Interaction',
      classification: 'RISK_INDICATOR'
    },
    {
      id: 'TX-UPI-001 (UPI_REF_9182049281920)',
      timestamp: '2026-09-29 08:30:15 UTC',
      rail: 'UPI Domestic',
      direction: 'INBOUND',
      amount: '₹49,500.00',
      from: 'otc_desk@okhdfcbank',
      to: 'vpa98@okhdfcbank',
      relationship: 'Domestic Clearing Inflow from OTC Desk VPA',
      classification: 'OBSERVED_FACT'
    },
    {
      id: 'TX-UPI-002 (UPI_REF_9182049281921)',
      timestamp: '2026-09-29 08:33:00 UTC',
      rail: 'UPI Domestic',
      direction: 'OUTBOUND',
      amount: '₹49,000.00',
      from: 'vpa98@okhdfcbank',
      to: 'merchant_sweep@icici',
      relationship: 'Rapid Dispersal Sweep (165s post-inflow)',
      classification: 'SYSTEM_ANALYSIS'
    },
    {
      id: '0x721629e590417281029e96521948fc',
      timestamp: '2026-09-29 08:34:10 UTC',
      rail: 'Tron TRC-20',
      direction: 'INTERNAL_HOP',
      amount: '85,000 USDT',
      from: '0x18D50244C...45502b',
      to: 'vpa98@okhdfcbank',
      relationship: 'P2P Liquidated Bridge Transfer to Domestic Entity',
      classification: 'ATTRIBUTION_INDICATOR'
    },
    {
      id: 'NEFT_CLEARING_881920384',
      timestamp: '2026-09-29 08:45:10 UTC',
      rail: 'HDFC Banking',
      direction: 'OUTBOUND',
      amount: '₹53.00 L',
      from: 'HDFC A/C ...8192',
      to: 'Cash ATM Dispersal Terminal',
      relationship: 'Batch ATM Cash Withdrawal Outflow',
      classification: 'OBSERVED_FACT'
    }
  ],

  tracePaths: [
    {
      hopNumber: 0,
      entityName: 'Suspect Origin Wallet',
      entityType: 'SUBJECT',
      identifier: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
      transactionRef: 'Initial Subject Origin',
      amount: 'Initial Balance: 43.24 ETH',
      timestamp: '2026-09-29 08:28:00 UTC',
      association: 'Originating Account',
      classification: 'OBSERVED_FACT'
    },
    {
      hopNumber: 1,
      entityName: 'Intermediary Hop A',
      entityType: 'INTERMEDIARY',
      identifier: '0x84C2EF17BD0038F3...87e109',
      transactionRef: '0x8ef2a9103c8b7b659fe10938bfe41209b0a124982',
      amount: '42.50 ETH',
      timestamp: '2026-09-29 08:28:12 UTC',
      association: 'Peeling Stage 1 Transfer',
      classification: 'OBSERVED_FACT'
    },
    {
      hopNumber: 2,
      entityName: 'Intermediary Hop B',
      entityType: 'INTERMEDIARY',
      identifier: '0x3AF17828C403dE...828C4',
      transactionRef: '0xad9f7c992a013fe0984da3',
      amount: '0.30 ETH (Split peeling tranche)',
      timestamp: '2026-09-29 08:31:40 UTC',
      association: 'Layering Subdivision Hop',
      classification: 'SYSTEM_ANALYSIS'
    },
    {
      hopNumber: 3,
      entityName: 'Candidate VASP Deposit Gateway',
      entityType: 'VASP',
      identifier: '0x92DE8...C11A7',
      transactionRef: '0xbf82910a837c7104b209c1',
      amount: '0.30 ETH',
      timestamp: '2026-09-29 08:34:10 UTC',
      association: 'Candidate Example Exchange (82% Confidence)',
      classification: 'ATTRIBUTION_INDICATOR'
    }
  ],

  riskFindings: {
    score: 72,
    severity: 'HIGH',
    signals: [
      {
        id: 'RSK-001',
        signalName: 'Multi-Hop Peeling Fragmentation',
        category: 'Blockchain Heuristics',
        severity: 'HIGH',
        whyDetected: 'Automated 3-hop value reduction with rapid succession transfers under 180 seconds.',
        supportingActivity: 'Tx 0x8ef2... transfer followed by subsequent splitting tranches across 0x84C2... and 0x3AF1...',
        classification: 'RISK_INDICATOR'
      },
      {
        id: 'RSK-002',
        signalName: 'Mixer Contract Interaction Flag',
        category: 'Sanction / Anonymization',
        severity: 'HIGH',
        whyDetected: 'Direct on-chain execution with known smart contract pool 0x891C...0D55E.',
        supportingActivity: 'Transaction 0x90272f6a... sent 30.00 ETH to privacy contract at 08:29:40 UTC.',
        classification: 'RISK_INDICATOR'
      },
      {
        id: 'RSK-003',
        signalName: 'Rapid Domestic Pass-Through Velocity',
        category: 'UPI Behavioral Analysis',
        severity: 'HIGH',
        whyDetected: 'Outbound dispersal initiated 165 seconds after inbound credit, leaving near-zero lingering balance.',
        supportingActivity: '₹49,500.00 credited via TX-UPI-001 and swept via TX-UPI-002 to merchant_sweep@icici.',
        classification: 'RISK_INDICATOR'
      },
      {
        id: 'RSK-004',
        signalName: 'Structured Transaction Values',
        category: 'Policy Threshold Monitoring',
        severity: 'MEDIUM',
        whyDetected: 'Multiple domestic transfers structured deliberately below standard ₹50,000 threshold.',
        supportingActivity: 'TX-UPI-001 (₹49,500.00) and TX-UPI-002 (₹49,000.00) executed within single session.',
        classification: 'SYSTEM_ANALYSIS'
      }
    ]
  },

  upiFindings: {
    subjectVpa: 'vpa98@okhdfcbank',
    riskScore: 78,
    riskLevel: 'HIGH',
    detectedSignals: [
      'Rapid Pass-Through Dispersal (<180s dwell time)',
      'Sub-50k Structuring Pattern (₹49,500.00 / ₹49,000.00)',
      'High Velocity Turnover Ratio (98.9% drained)'
    ],
    supportingTransactions: [
      'TX-UPI-001 (Inflow ₹49,500.00)',
      'TX-UPI-002 (Outflow ₹49,000.00)',
      'TX-UPI-005 (Inflow ₹49,200.00)'
    ],
    behavioralFindings:
      'Subject VPA functions as a conduit node. Account maintains negligible holding balance, routing incoming domestic funds immediately to secondary consolidation VPAs.',
    classification: 'SYSTEM_ANALYSIS'
  },

  vaspFindings: [
    {
      candidateName: 'Example Exchange',
      associationConfidence: 82,
      basis: [
        'Known Deposit Address Cluster Match',
        'Direct Transaction Path (3 hops)',
        'Graph Clustering Topology (0x92DE8...C11A7)'
      ],
      supportingActivity:
        'Transfer of 0.30 ETH received at terminal deposit address displaying co-spending signatures with Example Exchange hot wallet infrastructure.',
      reviewStatus: 'Review Required',
      classification: 'ATTRIBUTION_INDICATOR'
    }
  ],

  geospatialFindings: [
    {
      signalId: 'GEO-SIG-001',
      signalType: 'Transaction Access Location',
      locationName: 'Bengaluru, Karnataka, India',
      coordinates: '12.9716° N, 77.5946° E',
      timestamp: '2026-09-29 08:35:40 UTC',
      source: 'Authorized Transaction Telemetry Feed',
      accuracy: '±100m',
      relatedTransaction: 'TX-UPI-005',
      derivedFinding: 'Corresponds to registered merchant payment gateway location.',
      classification: 'OBSERVED_FACT'
    },
    {
      signalId: 'GEO-SIG-002',
      signalType: 'Banking Session Login Location',
      locationName: 'Mumbai, Maharashtra, India',
      coordinates: '19.0760° N, 72.8777° E',
      timestamp: '2026-09-29 08:12:00 UTC',
      source: 'Authorized Core Banking Telemetry Feed',
      accuracy: '±150m',
      relatedTransaction: 'AUTH-SESS-9812',
      derivedFinding: 'Initial mobile banking authentication session recorded prior to transfer initiation.',
      classification: 'OBSERVED_FACT'
    },
    {
      signalId: 'GEO-SIG-003',
      signalType: 'Physical Transit Velocity Anomaly',
      locationName: 'Mumbai → Bengaluru Transit Vector',
      coordinates: 'Inter-City Vector (984 km)',
      timestamp: '2026-09-29 08:12 to 08:35 UTC',
      source: 'Geospatial Intelligence Engine Analysis',
      accuracy: 'Analytical Metric',
      relatedTransaction: 'TX-UPI-005 & AUTH-SESS-9812',
      derivedFinding:
        'Observed timestamps imply an effective travel speed of 2,567 km/h across 984 km in 23 minutes, exceeding physical feasibility thresholds. Indicates distributed multi-actor operation or VPN/proxy routing.',
      classification: 'SYSTEM_ANALYSIS'
    }
  ],

  evidenceItems: [
    {
      id: 'EV-0001',
      category: 'OBSERVED_FACT',
      title: 'Ethereum Peeling Hop Transfer (42.50 ETH)',
      source: 'Ethereum Mainnet Archive Node',
      status: 'AVAILABLE',
      integrity: 'Source Verified'
    },
    {
      id: 'EV-0002',
      category: 'OBSERVED_FACT',
      title: 'Domestic UPI Rapid Inflow (₹49,500.00)',
      source: 'Authorized NPCI Core Clearing Feed',
      status: 'AVAILABLE',
      integrity: 'Source Verified'
    },
    {
      id: 'EV-0003',
      category: 'RISK_INDICATOR',
      title: 'Mixer Contract Interaction Flag (30.00 ETH)',
      source: 'Risk Analysis Engine',
      status: 'AVAILABLE',
      integrity: 'Source Verified'
    },
    {
      id: 'EV-0004',
      category: 'SYSTEM_ANALYSIS',
      title: 'UPI Rapid Pass-Through Velocity Analysis',
      source: 'UPI Behavioral Analysis Engine',
      status: 'REVIEWED',
      integrity: 'Source Available'
    },
    {
      id: 'EV-0005',
      category: 'ATTRIBUTION_INDICATOR',
      title: 'Candidate VASP Identification — Example Exchange',
      source: 'VASP Intelligence Registry',
      status: 'REVIEW_REQUIRED',
      integrity: 'Source Available'
    },
    {
      id: 'EV-0006',
      category: 'SYSTEM_ANALYSIS',
      title: 'Physical Transit Inconsistency: Rapid Transit Speed Anomaly',
      source: 'Geospatial Intelligence Engine',
      status: 'REVIEWED',
      integrity: 'Source Available'
    },
    {
      id: 'EV-0007',
      category: 'INVESTIGATOR_INTERPRETATION',
      title: 'Syndicate Operational Modus Operandi Assessment',
      source: 'Lead Investigator Note',
      status: 'REVIEWED',
      integrity: 'Source Available'
    },
    {
      id: 'EV-0008',
      category: 'OBSERVED_FACT',
      title: 'ATM Cash Withdrawal Outflow (₹53.00 L Total Batch)',
      source: 'Authorized Bank Feed (NEFT Clearing)',
      status: 'AVAILABLE',
      integrity: 'Source Verified'
    }
  ],

  investigatorInterpretations: [
    {
      author: 'Lead Investigator Samarth',
      enteredAt: '2026-09-29 08:42:00 UTC',
      notes:
        'Observed transaction velocity and rapid pass-through structuring across Ethereum peelings and UPI domestic clearing indicate coordinated multi-rail movement. The terminal deposit address at Example Exchange warrants targeted disclosure verification. Transit speed anomalies between Mumbai and Bengaluru strongly suggest multi-party concurrent device access rather than a single physical traveler.',
      classification: 'INVESTIGATOR_INTERPRETATION'
    }
  ],

  openQuestions: [
    {
      id: 'GAP-001',
      category: 'Identity Attribution',
      description: 'Identity not established from blockchain telemetry alone. Ethereum and TRC-20 addresses remain pseudonymous.',
      impact: 'Requires formal VASP KYC disclosure records to correlate with legal entity identity.'
    },
    {
      id: 'GAP-002',
      category: 'Custodial Verification',
      description: 'Candidate VASP association (82%) with Example Exchange is heuristic and based on deposit address clustering.',
      impact: 'Internal account ledger records from the exchange operator are necessary to establish beneficial ownership.'
    },
    {
      id: 'GAP-003',
      category: 'Physical Telemetry Coverage',
      description: 'Geospatial observations are derived from network connection endpoints and IP geofencing; device hardware has not been physically inspected.',
      impact: 'Cannot definitively rule out proxy or VPN relays without carrier-level cell tower triangulation.'
    },
    {
      id: 'GAP-004',
      category: 'Unidentified Counterparties',
      description: 'Intermediary Tron TRC-20 hop (0x18D5...45502b) counterparty identity remains uncataloged.',
      impact: 'Additional cross-chain graph crawling required to determine upstream funding genesis.'
    }
  ],

  nextActions: [
    {
      id: 'ACT-001',
      actionTitle: 'Review Candidate VASP Association',
      description: 'Inspect cluster 9 co-spending heuristic and evaluate 82% confidence basis with Example Exchange.',
      targetWorkspace: 'VASP',
      status: 'PENDING'
    },
    {
      id: 'ACT-002',
      actionTitle: 'Inspect Supporting Transactions in Explorer',
      description: 'Validate block confirmations, gas limits, and clearing timestamps for 0x8ef2... and TX-UPI-001.',
      targetWorkspace: 'Transactions',
      status: 'PENDING'
    },
    {
      id: 'ACT-003',
      actionTitle: 'Examine Geospatial Transit Inconsistency',
      description: 'Verify ISP autonomous system numbers (ASNs) associated with Mumbai and Bengaluru endpoints.',
      targetWorkspace: 'Geospatial',
      status: 'PENDING'
    },
    {
      id: 'ACT-004',
      actionTitle: 'Review Unaudited Evidence Records',
      description: 'Perform formal investigator sign-off on EV-2026-005 (VASP candidate) and EV-2026-004 (velocity analysis).',
      targetWorkspace: 'Evidence',
      status: 'PENDING'
    },
    {
      id: 'ACT-005',
      actionTitle: 'Prepare VASP Disclosure Request Dossier',
      description: 'Compile verified trace records into future SAHYOG platform disclosure format (Workflow hook - no live transmission).',
      targetWorkspace: 'SAHYOG_HOOK',
      status: 'PENDING'
    }
  ]
};
