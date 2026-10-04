export interface UPITransaction {
  transaction_id: string;
  transaction_reference?: string;
  timestamp: string;
  amount: string;
  currency: string;
  sender_vpa: string;
  receiver_vpa: string;
  sender_bank?: string;
  receiver_bank?: string;
  transaction_type: 'P2P' | 'P2M' | 'COLLECT' | 'REFUND';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  device_reference?: string;
  signal_trigger?: string;
}

export interface UPIFraudFinding {
  signal_id: string;
  signal_type:
    | 'NEW_BENEFICIARY'
    | 'HIGH_TRANSACTION_VELOCITY'
    | 'TRANSACTION_BURST'
    | 'UNUSUAL_AMOUNT'
    | 'MULTIPLE_FAILED_ATTEMPTS'
    | 'NEW_DEVICE'
    | 'UNUSUAL_TRANSACTION_TIME'
    | 'BENEFICIARY_BURST'
    | 'HIGH_VALUE_VELOCITY'
    | 'RAPID_PASS_THROUGH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  risk_contribution: number;
  title: string;
  description: string;
  reason: string;
  transaction_ids: string[];
  affected_entities: string[];
  metrics: Record<string, any>;
  observedBehavior?: {
    inflow?: string;
    outflow?: string;
    elapsedTime?: string;
    details?: string;
  };
}

export interface UPIFeatures {
  transaction_count: number;
  total_volume: string;
  avg_amount: string;
  max_amount: string;
  min_amount: string;
  median_amount: string;
  time_span_seconds: number;
  velocity_tx_per_minute: number;
  unique_beneficiaries: number;
  failed_attempt_count: number;
  new_beneficiary_count: number;
  new_device_count: number;
  has_baseline: boolean;
  pass_through_detected: boolean;
  known_beneficiaries: string[];
  new_beneficiaries: string[];
}

export interface UPIRiskResult {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  methodology: string;
}

export interface UPIFraudAnalysisResult {
  subject: string;
  rail: string;
  analyzed_transactions: UPITransaction[];
  features: UPIFeatures;
  findings: UPIFraudFinding[];
  risk: UPIRiskResult;
  reasoning_trace: string[];
}

export interface UPIEntityContext {
  vpa: string;
  role: string;
  transactionCount: number;
  totalVolume: string;
  firstObserved: string;
  lastObserved: string;
  associatedSignals: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
