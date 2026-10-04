import { DisclosureRequest } from './disclosureTypes';

export interface AvailableEvidenceItem {
  id: string;
  category: string;
  title: string;
  source: string;
  rail: string;
  summary: string;
}

export const AVAILABLE_EVIDENCE_CATALOG: AvailableEvidenceItem[] = [
  {
    id: 'EV-0001',
    category: 'OBSERVED_FACT',
    title: 'Ethereum Peeling Hop Transfer (42.50 ETH)',
    source: 'Ethereum Mainnet Archive Node',
    rail: 'Ethereum',
    summary: 'On-chain execution from subject address 0x71F9... to intermediary hop 0x84C2...'
  },
  {
    id: 'EV-0002',
    category: 'OBSERVED_FACT',
    title: 'Domestic UPI Rapid Inflow (₹49,500.00)',
    source: 'Authorized NPCI Core Clearing Feed',
    rail: 'UPI Domestic',
    summary: 'Inflow from OTC desk clearing node to vpa98@okhdfcbank.'
  },
  {
    id: 'EV-0003',
    category: 'RISK_INDICATOR',
    title: 'Mixer Contract Interaction Flag (30.00 ETH)',
    source: 'Risk Analysis Engine',
    rail: 'Ethereum',
    summary: 'Direct transfer to Tornado Cash smart contract pool 0x891C...0D55E.'
  },
  {
    id: 'EV-0004',
    category: 'SYSTEM_ANALYSIS',
    title: 'UPI Rapid Pass-Through Velocity Analysis',
    source: 'UPI Behavioral Analysis Engine',
    rail: 'UPI Domestic',
    summary: 'Turnover ratio 98.9% with outbound sweep completed within 165 seconds.'
  },
  {
    id: 'EV-0005',
    category: 'ATTRIBUTION_INDICATOR',
    title: 'Candidate VASP Identification — Example Exchange',
    source: 'VASP Intelligence Registry',
    rail: 'Ethereum / VASP',
    summary: 'Terminal deposit address 0x92DE8... matched to Example Exchange cluster (82% confidence).'
  },
  {
    id: 'EV-0006',
    category: 'SYSTEM_ANALYSIS',
    title: 'Physical Transit Inconsistency: Rapid Transit Speed Anomaly',
    source: 'Geospatial Intelligence Engine',
    rail: 'Multi-Rail Telemetry',
    summary: 'Observed timestamps indicate 2,567 km/h velocity between Mumbai and Bengaluru.'
  },
  {
    id: 'EV-0007',
    category: 'INVESTIGATOR_INTERPRETATION',
    title: 'Operational Modus Operandi Assessment',
    source: 'Lead Investigator Note',
    rail: 'Multi-Rail',
    summary: 'Investigative deduction of coordinated off-ramping activity.'
  },
  {
    id: 'EV-0008',
    category: 'OBSERVED_FACT',
    title: 'ATM Cash Withdrawal Outflow (₹53.00 L Total Batch)',
    source: 'Authorized Bank Feed (NEFT Clearing)',
    rail: 'HDFC Banking',
    summary: 'Immediate cash dispersal executed at domestic ATM terminals.'
  }
];

export const LEGAL_BASIS_PRESETS = [
  'Section 91 CrPC (Criminal Procedure Code) Requisition',
  'Section 69 Information Technology Act Disclosure Request',
  'Authorized Financial Intelligence Institutional Inquiry',
  'Applicable Judicial Order / Court Requisition',
  'Cross-Border Financial Crime Protocol Request'
];

export const REQUESTED_INFO_PRESETS = [
  'Customer / Account Identification & Registration Records',
  'KYC Documentation & Proof of Identity/Address',
  'Deposit & Withdrawal Transaction History (with Tx Hashes & IP Logs)',
  'Associated Counterparty Internal Ledger Off-Ramp Identifiers',
  'Device Telemetry & Login Session IP Access Logs',
  'Beneficial Party Identification & Linked Funding Sources'
];

export const INITIAL_DISCLOSURE_REQUESTS: DisclosureRequest[] = [
  {
    requestId: 'DR-2026-001',
    caseId: 'CASE-2026-001',
    caseTitle: 'Cross-Rail Peeling Chain to Domestic VPA Sweep',
    recipient: 'Example Exchange',
    recipientType: 'VASP',
    subjectIdentifier: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
    identifierType: 'WALLET_ADDRESS',
    requestType: 'Customer / Account Information & Deposit Traces',
    legalBasis: 'Section 91 CrPC (Criminal Procedure Code) Requisition',
    requestPurpose:
      'Identification of account holder and beneficial party associated with terminal deposit address 0x92DE8...C11A7 linked to 42.50 ETH peeling flow.',
    requestedInformation: [
      'Customer / Account Identification & Registration Records',
      'KYC Documentation & Proof of Identity/Address',
      'Deposit & Withdrawal Transaction History (with Tx Hashes & IP Logs)',
      'Associated Counterparty Internal Ledger Off-Ramp Identifiers'
    ],
    supportingEvidenceIds: ['EV-0001', 'EV-0003', 'EV-0005'],
    investigatorNotes:
      'Candidate VASP attribution indicates 82% confidence based on deposit cluster 9. Prompt requisition of deposit logs is required before asset liquidation.',
    status: 'SUBMITTED — SANDBOX',
    createdAt: '2026-09-29 09:15:00 UTC',
    updatedAt: '2026-09-29 09:22:30 UTC',
    sahyogReference: 'SANDBOX-DR-2026-001',
    sandboxResponse: {
      referenceId: 'SANDBOX-DR-2026-001',
      sandboxStatus: 'ACCEPTED — SANDBOX',
      timestamp: '2026-09-29 09:22:30 UTC',
      acknowledgmentMessage:
        'Simulated disclosure request accepted by the SAHYOG sandbox adapter. In production, this would route to an authorized recipient gateway.',
      adapterIdentifier: 'MOCK_SAHYOG_SANDBOX_ADAPTER_V2',
      simulatedRetentionDays: 90
    },
    history: [
      {
        timestamp: '2026-09-29 09:15:00 UTC',
        toStatus: 'DRAFT',
        actor: 'Investigator Samarth',
        note: 'Requisition drafted following VASP attribution findings.'
      },
      {
        timestamp: '2026-09-29 09:18:20 UTC',
        fromStatus: 'DRAFT',
        toStatus: 'UNDER REVIEW',
        actor: 'Investigator Samarth',
        note: 'Submitted for secondary review.'
      },
      {
        timestamp: '2026-09-29 09:20:00 UTC',
        fromStatus: 'UNDER REVIEW',
        toStatus: 'READY TO SUBMIT',
        actor: 'Supervisor Rao',
        note: 'Evidence references validated.'
      },
      {
        timestamp: '2026-09-29 09:22:30 UTC',
        fromStatus: 'READY TO SUBMIT',
        toStatus: 'SUBMITTED — SANDBOX',
        actor: 'Investigator Samarth',
        note: 'Dispatched through SAHYOG Sandbox Adapter (Reference: SANDBOX-DR-2026-001).'
      }
    ]
  },
  {
    requestId: 'DR-2026-002',
    caseId: 'CASE-2026-001',
    caseTitle: 'Cross-Rail Peeling Chain to Domestic VPA Sweep',
    recipient: 'HDFC Bank Domestic Settlement Gateway',
    recipientType: 'FINANCIAL_INSTITUTION',
    subjectIdentifier: 'vpa98@okhdfcbank',
    identifierType: 'UPI_VPA',
    requestType: 'Domestic VPA KYC & Clearing Telemetry',
    legalBasis: 'Section 91 CrPC (Criminal Procedure Code) Requisition',
    requestPurpose:
      'Requisition of customer KYC details and immediate beneficiary bank routing for high-velocity domestic pass-through account.',
    requestedInformation: [
      'Customer / Account Identification & Registration Records',
      'KYC Documentation & Proof of Identity/Address',
      'Device Telemetry & Login Session IP Access Logs'
    ],
    supportingEvidenceIds: ['EV-0002', 'EV-0004', 'EV-0008'],
    investigatorNotes:
      'Account displayed rapid 165s drainage of ₹49,500.00 inbound tranche, indicating domestic rapid turnover pattern.',
    status: 'UNDER REVIEW',
    createdAt: '2026-09-29 09:25:00 UTC',
    updatedAt: '2026-09-29 09:28:10 UTC',
    history: [
      {
        timestamp: '2026-09-29 09:25:00 UTC',
        toStatus: 'DRAFT',
        actor: 'Investigator Samarth',
        note: 'Drafted requisition targeting domestic VPA conduit.'
      },
      {
        timestamp: '2026-09-29 09:28:10 UTC',
        fromStatus: 'DRAFT',
        toStatus: 'UNDER REVIEW',
        actor: 'Investigator Samarth',
        note: 'Moved to review queue.'
      }
    ]
  },
  {
    requestId: 'DR-2026-003',
    caseId: 'CASE-2026-001',
    caseTitle: 'Cross-Rail Peeling Chain to Domestic VPA Sweep',
    recipient: 'Decentralized Privacy Pool Smart Contract Operator',
    recipientType: 'SERVICE_PROVIDER',
    subjectIdentifier: '0x891C79028A...0D55E',
    identifierType: 'WALLET_ADDRESS',
    requestType: 'Relayer Deposit Index Query',
    legalBasis: 'Authorized Financial Intelligence Institutional Inquiry',
    requestPurpose:
      'Assessment of relayer transactions associated with 30.00 ETH privacy deposit.',
    requestedInformation: [
      'Deposit & Withdrawal Transaction History (with Tx Hashes & IP Logs)'
    ],
    supportingEvidenceIds: ['EV-0003'],
    investigatorNotes:
      'Exploratory inquiry into decentralized pool relayer nodes.',
    status: 'DRAFT',
    createdAt: '2026-09-29 09:30:00 UTC',
    updatedAt: '2026-09-29 09:30:00 UTC',
    history: [
      {
        timestamp: '2026-09-29 09:30:00 UTC',
        toStatus: 'DRAFT',
        actor: 'Investigator Samarth',
        note: 'Initial draft created.'
      }
    ]
  }
];
