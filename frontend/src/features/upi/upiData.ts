import { UPIFraudAnalysisResult, UPIEntityContext } from './upiTypes';

export const MULE_UPI_ANALYSIS_DATA: UPIFraudAnalysisResult = {
  subject: 'vpa98@okhdfcbank',
  rail: 'UPI Domestic',
  analyzed_transactions: [
    {
      transaction_id: 'TX-UPI-001',
      transaction_reference: 'UTR-2026-UPI-918201',
      timestamp: '2026-09-29 08:30:15 UTC',
      amount: '₹49,500.00',
      currency: 'INR',
      sender_vpa: 'otc_desk@okhdfcbank',
      receiver_vpa: 'vpa98@okhdfcbank',
      sender_bank: 'HDFC Bank',
      receiver_bank: 'HDFC Bank',
      transaction_type: 'P2P',
      status: 'SUCCESS',
      device_reference: 'DEV-UPI-8842',
      signal_trigger: 'Rapid Pass-Through'
    },
    {
      transaction_id: 'TX-UPI-002',
      transaction_reference: 'UTR-2026-UPI-918202',
      timestamp: '2026-09-29 08:32:00 UTC',
      amount: '₹48,500.00',
      currency: 'INR',
      sender_vpa: 'vpa98@okhdfcbank',
      receiver_vpa: 'clearing_settle@okhdfcbank',
      sender_bank: 'HDFC Bank',
      receiver_bank: 'HDFC Bank',
      transaction_type: 'P2P',
      status: 'SUCCESS',
      device_reference: 'DEV-UPI-8842',
      signal_trigger: 'Rapid Pass-Through'
    },
    {
      transaction_id: 'TX-UPI-003',
      transaction_reference: 'UTR-2026-UPI-918203',
      timestamp: '2026-09-29 08:33:10 UTC',
      amount: '₹49,200.00',
      currency: 'INR',
      sender_vpa: 'otc_desk@okhdfcbank',
      receiver_vpa: 'vpa98@okhdfcbank',
      sender_bank: 'HDFC Bank',
      receiver_bank: 'HDFC Bank',
      transaction_type: 'P2P',
      status: 'SUCCESS',
      device_reference: 'DEV-UPI-8842',
      signal_trigger: 'Unusual Amount'
    },
    {
      transaction_id: 'TX-UPI-004',
      transaction_reference: 'UTR-2026-UPI-918204',
      timestamp: '2026-09-29 08:34:25 UTC',
      amount: '₹48,800.00',
      currency: 'INR',
      sender_vpa: 'vpa98@okhdfcbank',
      receiver_vpa: 'vpa02@icici',
      sender_bank: 'HDFC Bank',
      receiver_bank: 'ICICI Bank',
      transaction_type: 'P2P',
      status: 'SUCCESS',
      device_reference: 'DEV-UPI-8842',
      signal_trigger: 'Beneficiary Burst'
    },
    {
      transaction_id: 'TX-UPI-005',
      transaction_reference: 'UTR-2026-UPI-918205',
      timestamp: '2026-09-29 08:35:40 UTC',
      amount: '₹49,000.00',
      currency: 'INR',
      sender_vpa: 'vpa98@okhdfcbank',
      receiver_vpa: 'cashout_vpa@yesbank',
      sender_bank: 'HDFC Bank',
      receiver_bank: 'Yes Bank',
      transaction_type: 'P2P',
      status: 'SUCCESS',
      device_reference: 'DEV-UPI-8842',
      signal_trigger: 'High Value Velocity'
    },
    {
      transaction_id: 'TX-UPI-006',
      transaction_reference: 'UTR-2026-UPI-918206',
      timestamp: '2026-09-29 08:36:50 UTC',
      amount: '₹50,000.00',
      currency: 'INR',
      sender_vpa: 'vpa98@okhdfcbank',
      receiver_vpa: 'cashout_vpa@yesbank',
      sender_bank: 'HDFC Bank',
      receiver_bank: 'Yes Bank',
      transaction_type: 'P2P',
      status: 'FAILED',
      device_reference: 'DEV-UPI-8842',
      signal_trigger: 'Unusual Amount'
    }
  ],
  features: {
    transaction_count: 6,
    total_volume: '₹2,95,000.00',
    avg_amount: '₹49,166.67',
    max_amount: '₹50,000.00',
    min_amount: '₹48,500.00',
    median_amount: '₹49,100.00',
    time_span_seconds: 395.0,
    velocity_tx_per_minute: 0.91,
    unique_beneficiaries: 3,
    failed_attempt_count: 1,
    new_beneficiary_count: 3,
    new_device_count: 0,
    has_baseline: true,
    pass_through_detected: true,
    known_beneficiaries: ['utility@okhdfcbank', 'merchant@okhdfcbank'],
    new_beneficiaries: ['clearing_settle@okhdfcbank', 'vpa02@icici', 'cashout_vpa@yesbank']
  },
  findings: [
    {
      signal_id: 'UPI-SIG-PASSTHROUGH',
      signal_type: 'RAPID_PASS_THROUGH',
      severity: 'HIGH',
      confidence: 85.0,
      risk_contribution: 20.0,
      title: 'Rapid Pass-Through Flow Pattern',
      description: 'Potential fraud-risk signal detected: Inbound funds rapidly dispatched to another counterparty within 10 minutes.',
      reason: 'Subject received inbound funds and transferred >= 80% out within a 10-minute window, exhibiting intermediary pass-through flow dynamics.',
      transaction_ids: ['TX-UPI-001', 'TX-UPI-002'],
      affected_entities: ['vpa98@okhdfcbank', 'clearing_settle@okhdfcbank'],
      metrics: {
        pass_through_detected: true,
        window_seconds: 600.0,
        ratio_threshold: 0.80,
        actual_ratio: 0.98,
        inbound_amount: '₹49,500.00',
        outbound_amount: '₹48,500.00'
      },
      observedBehavior: {
        inflow: '₹49,500.00 at 08:30:15 UTC (from otc_desk@okhdfcbank)',
        outflow: '₹48,500.00 at 08:32:00 UTC (to clearing_settle@okhdfcbank)',
        elapsedTime: '105 seconds (97.98% volume swept)',
        details: 'Retained balance residue: ₹1,000.00'
      }
    },
    {
      signal_id: 'UPI-SIG-HIGHVALVEL',
      signal_type: 'HIGH_VALUE_VELOCITY',
      severity: 'CRITICAL',
      confidence: 90.0,
      risk_contribution: 25.0,
      title: 'High-Value Transaction Velocity',
      description: 'Potential fraud-risk signal detected: Substantial monetary volume transferred under rapid transaction velocity.',
      reason: 'Total volume of INR 2,95,000.00 transferred across 6 transactions in 395.0s (0.91 TX/min).',
      transaction_ids: ['TX-UPI-001', 'TX-UPI-002', 'TX-UPI-003', 'TX-UPI-004', 'TX-UPI-005', 'TX-UPI-006'],
      affected_entities: ['vpa98@okhdfcbank'],
      metrics: {
        total_volume: '₹2,95,000.00',
        transaction_count: 6,
        velocity_tx_per_minute: 0.91,
        time_span_seconds: 395.0
      },
      observedBehavior: {
        inflow: '₹98,700.00 across 2 inbound credits',
        outflow: '₹1,96,300.00 across 4 outbound disbursements',
        elapsedTime: '6 minutes 35 seconds total span',
        details: 'High-frequency burst exceeding standard individual retail velocity limits'
      }
    },
    {
      signal_id: 'UPI-SIG-BENBURST',
      signal_type: 'BENEFICIARY_BURST',
      severity: 'HIGH',
      confidence: 85.0,
      risk_contribution: 20.0,
      title: 'Rapid Beneficiary Dispersion',
      description: 'Potential fraud-risk signal detected: Multiple distinct counterparties targeted in rapid succession.',
      reason: '3 distinct counterparties paid within a 170.0s interval: cashout_vpa@yesbank, clearing_settle@okhdfcbank, vpa02@icici.',
      transaction_ids: ['TX-UPI-002', 'TX-UPI-004', 'TX-UPI-005'],
      affected_entities: ['clearing_settle@okhdfcbank', 'vpa02@icici', 'cashout_vpa@yesbank'],
      metrics: {
        unique_beneficiaries_in_window: 3,
        window_seconds: 300.0,
        span_seconds: 170.0
      },
      observedBehavior: {
        inflow: 'N/A (Dispersal phase)',
        outflow: '3 distinct external bank destinations (HDFC, ICICI, Yes Bank)',
        elapsedTime: '170.0 seconds interval',
        details: 'Sequential outbound routing across multiple commercial bank switches'
      }
    },
    {
      signal_id: 'UPI-SIG-UNUSUALAMT',
      signal_type: 'UNUSUAL_AMOUNT',
      severity: 'HIGH',
      confidence: 80.0,
      risk_contribution: 20.0,
      title: 'Unusual Transaction Amount',
      description: 'Potential fraud-risk signal detected: Outlier amount relative to established subject baseline profile.',
      reason: 'Transaction amounts (mean ₹49,166.67) are 19.8x the historical baseline average (INR 2,500.00), clustered just beneath ₹50,000 surveillance threshold.',
      transaction_ids: ['TX-UPI-001', 'TX-UPI-003', 'TX-UPI-006'],
      affected_entities: ['vpa98@okhdfcbank'],
      metrics: {
        baseline_avg_amount: '₹2,500.00',
        current_max_amount: '₹50,000.00',
        amount_deviation_ratio: 19.8,
        threshold_proximity: '97.6% - 100.0% of ₹50k limit'
      },
      observedBehavior: {
        inflow: '₹49,500.00 & ₹49,200.00',
        outflow: '₹48,500.00, ₹48,800.00, ₹49,000.00, ₹50,000.00',
        elapsedTime: 'Clustered structured smurfing amounts',
        details: 'Amounts intentionally structured below standard banking surveillance triggers'
      }
    }
  ],
  risk: {
    score: 85,
    level: 'HIGH',
    confidence: 88.0,
    methodology: 'Deterministic Behavioral Rules Engine v2.4'
  },
  reasoning_trace: [
    'Step 1: Normalizing 6 ingested UPI transactions for subject vpa98@okhdfcbank',
    'Step 2: Comparing with 3 historical baseline transactions (mean volume ₹2,500)',
    'Step 3: Evaluating Rapid Pass-Through heuristic (Inflow ₹49.5k swept to ₹48.5k in 105s)',
    'Step 4: Evaluating Multi-Bank Beneficiary Burst (HDFC, ICICI, Yes Bank in 170s)',
    'Step 5: Synthesizing deterministic findings and evidence items'
  ]
};

export const MULE_UPI_ENTITIES: UPIEntityContext[] = [
  {
    vpa: 'vpa98@okhdfcbank',
    role: 'Investigated Subject VPA (Primary Account)',
    transactionCount: 6,
    totalVolume: '₹2,95,000.00',
    firstObserved: '2026-09-29 08:30:15 UTC',
    lastObserved: '2026-09-29 08:36:50 UTC',
    associatedSignals: ['Rapid Pass-Through', 'High Value Velocity', 'Unusual Amount'],
    riskLevel: 'HIGH'
  },
  {
    vpa: 'otc_desk@okhdfcbank',
    role: 'Inbound Funding Origin (P2P Crypto Conversion)',
    transactionCount: 2,
    totalVolume: '₹98,700.00',
    firstObserved: '2026-09-29 08:30:15 UTC',
    lastObserved: '2026-09-29 08:33:10 UTC',
    associatedSignals: ['Rapid Pass-Through', 'High Value Velocity'],
    riskLevel: 'HIGH'
  },
  {
    vpa: 'clearing_settle@okhdfcbank',
    role: 'Pass-Through Destination (First Hop Sweep)',
    transactionCount: 1,
    totalVolume: '₹48,500.00',
    firstObserved: '2026-09-29 08:32:00 UTC',
    lastObserved: '2026-09-29 08:32:00 UTC',
    associatedSignals: ['Rapid Pass-Through'],
    riskLevel: 'HIGH'
  },
  {
    vpa: 'vpa02@icici',
    role: 'Secondary Layering Beneficiary (Cross-Bank Hop)',
    transactionCount: 1,
    totalVolume: '₹48,800.00',
    firstObserved: '2026-09-29 08:34:25 UTC',
    lastObserved: '2026-09-29 08:34:25 UTC',
    associatedSignals: ['Beneficiary Burst'],
    riskLevel: 'MEDIUM'
  },
  {
    vpa: 'cashout_vpa@yesbank',
    role: 'Terminal Dispersal VPA (ATM Cash Withdrawal Point)',
    transactionCount: 2,
    totalVolume: '₹99,000.00',
    firstObserved: '2026-09-29 08:35:40 UTC',
    lastObserved: '2026-09-29 08:36:50 UTC',
    associatedSignals: ['Beneficiary Burst', 'High Value Velocity'],
    riskLevel: 'HIGH'
  }
];
