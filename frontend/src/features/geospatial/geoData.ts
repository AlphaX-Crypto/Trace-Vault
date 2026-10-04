import { CaseGeospatialData } from './geoTypes';

export const CASE_GEOSPATIAL_DATA: CaseGeospatialData = {
  caseId: 'CASE-2026-001',
  caseTitle: 'Cross-Rail Peeling Chain to Domestic VPA Sweep',
  subjectAddress: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982 / vpa98@okhdfcbank',
  rail: 'Ethereum / UPI Domestic',
  totalTransactionsObserved: 24,
  totalSignalsCount: 6,
  timeWindowStart: '2026-09-20',
  timeWindowEnd: '2026-09-29',
  coverageStatus: 'Partial',
  sourceStatus: 'Synthetic Demo',
  investigativeNotice:
    'Location signals are displayed only from available authorized, investigation-provided, or clearly marked synthetic sources. A correlated location signal does not by itself establish the identity, presence, or ownership of a person or device.',
  locationGroups: [
    {
      name: 'Bengaluru Central Transit Cluster',
      signalCount: 2,
      transactionCount: 2,
      timeWindow: '08:30:15 – 08:32:00 UTC',
      primaryCity: 'Bengaluru, Karnataka',
      signalIds: ['GEO-SIG-001', 'GEO-SIG-002']
    },
    {
      name: 'Mumbai Financial Dispersal Cluster',
      signalCount: 2,
      transactionCount: 2,
      timeWindow: '08:35:40 – 08:36:50 UTC',
      primaryCity: 'Mumbai, Maharashtra',
      signalIds: ['GEO-SIG-003', 'GEO-SIG-004']
    }
  ],
  signals: [
    {
      id: 'GEO-SIG-001',
      latitude: 12.9352,
      longitude: 77.6245,
      accuracy: '±30 m',
      accuracyMeters: 30,
      timestamp: '2026-09-29 08:30:15 UTC',
      city: 'Bengaluru',
      region: 'Karnataka',
      countryCode: 'IN',
      signalType: 'TRANSACTION LOCATION',
      source: 'Authorized Device Metadata',
      sourceReference: 'SESSION_ID_BLR_881920',
      relatedTransactionId: 'TX-UPI-001',
      relatedEntityId: 'vpa98@okhdfcbank',
      amount: '₹49,500.00',
      rail: 'UPI Domestic',
      correlationExplanation:
        'Financial activity (inbound P2P liquidity credit of ₹49,500) observed within available authorized device location window in Koramangala, Bengaluru.',
      isAnomaly: false
    },
    {
      id: 'GEO-SIG-002',
      latitude: 12.9784,
      longitude: 77.6408,
      accuracy: '±25 m',
      accuracyMeters: 25,
      timestamp: '2026-09-29 08:32:00 UTC',
      city: 'Bengaluru',
      region: 'Karnataka',
      countryCode: 'IN',
      signalType: 'TRANSACTION LOCATION',
      source: 'Authorized Device Metadata',
      sourceReference: 'SESSION_ID_BLR_881944',
      relatedTransactionId: 'TX-UPI-002',
      relatedEntityId: 'clearing_settle@okhdfcbank',
      amount: '₹48,500.00',
      rail: 'UPI Domestic',
      correlationExplanation:
        'Outbound pass-through sweep (₹48,500) dispatched 105 seconds after inbound credit. Geographic coordinate consistent with urban intra-city radio propagation.',
      isAnomaly: false
    },
    {
      id: 'GEO-SIG-003',
      latitude: 19.0760,
      longitude: 72.8777,
      accuracy: '±40 m',
      accuracyMeters: 40,
      timestamp: '2026-09-29 08:35:40 UTC',
      city: 'Mumbai',
      region: 'Maharashtra',
      countryCode: 'IN',
      signalType: 'TRANSACTION LOCATION',
      source: 'Authorized Device Metadata',
      sourceReference: 'SESSION_ID_MUM_910284',
      relatedTransactionId: 'TX-UPI-005',
      relatedEntityId: 'cashout_vpa@yesbank',
      amount: '₹49,000.00',
      rail: 'UPI Domestic',
      correlationExplanation:
        'Potential location inconsistency: Observed ~840 km from Bengaluru signal within 3 minutes 40 seconds (implied ground speed >13,000 km/h). Consistent with multi-party credential sharing or concurrent proxy sessions.',
      isAnomaly: true,
      anomalyDetails: 'LOCATION_INCONSISTENCY_SEQUENCE (implied relocation speed exceeds physical transit limits)'
    },
    {
      id: 'GEO-SIG-004',
      latitude: 18.9322,
      longitude: 72.8339,
      accuracy: '±50 m',
      accuracyMeters: 50,
      timestamp: '2026-09-29 08:36:50 UTC',
      city: 'Mumbai',
      region: 'Maharashtra',
      countryCode: 'IN',
      signalType: 'TERMINAL LOCATION',
      source: 'ATM / Terminal Network Registry',
      sourceReference: 'ATM_TERMINAL_ID_YES_4412',
      relatedTransactionId: 'TX-UPI-006',
      relatedEntityId: 'cashout_vpa@yesbank',
      amount: '₹50,000.00',
      rail: 'UPI Domestic',
      correlationExplanation:
        'Terminal location associated with failed disbursement attempt at Yes Bank Fort Commercial District ATM #4412.',
      isAnomaly: false
    },
    {
      id: 'GEO-SIG-005',
      latitude: 28.6139,
      longitude: 77.2090,
      accuracy: '±100 m',
      accuracyMeters: 100,
      timestamp: '2026-09-21 11:00:00 UTC',
      city: 'Delhi NCR',
      region: 'Delhi',
      countryCode: 'IN',
      signalType: 'HISTORICAL BASELINE LOCATION',
      source: 'Authorized Bank Metadata',
      sourceReference: 'CORE_BANKING_KYC_BASE',
      relatedTransactionId: 'GEO-BASE-401',
      relatedEntityId: 'Subject Account Baseline',
      amount: 'Account Registry',
      rail: 'Banking KYC',
      correlationExplanation:
        'Historical baseline activity recorded in Delhi NCR over preceding 60 days prior to subsequent southern rail activity.',
      isAnomaly: false
    },
    {
      id: 'GEO-SIG-006',
      latitude: 13.0827,
      longitude: 80.2707,
      accuracy: 'Coarse',
      timestamp: '2026-09-29 08:34:25 UTC',
      city: 'Chennai',
      region: 'Tamil Nadu',
      countryCode: 'IN',
      signalType: 'MERCHANT LOCATION',
      source: 'Merchant Registry Geocode',
      sourceReference: 'NPCI_MERCHANT_DIR_CH_902',
      relatedTransactionId: 'TX-UPI-004',
      relatedEntityId: 'acct02@icici',
      amount: '₹48,800.00',
      rail: 'UPI Domestic',
      correlationExplanation:
        'Registered commercial locality of P2P merchant counterparty observed in cross-bank disbursement leg.',
      isAnomaly: false
    }
  ]
};
