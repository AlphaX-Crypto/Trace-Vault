export type FindingClassification =
  | 'OBSERVED_FACT'
  | 'SYSTEM_ANALYSIS'
  | 'ATTRIBUTION_INDICATOR'
  | 'RISK_INDICATOR'
  | 'INVESTIGATOR_INTERPRETATION';

export type ReportStatus = 'DRAFT' | 'UNDER REVIEW' | 'READY FOR REVIEW';

export interface SubjectSummary {
  subjectType: string;
  primaryIdentifier: string;
  secondaryIdentifier?: string;
  rails: string[];
  observedTransactionsCount: number;
  distinctCounterpartiesCount: number;
  riskScore: number;
  riskSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  attributionCandidate?: string;
  attributionConfidence?: number;
  locationSignalsCount: number;
  evidenceRecordsCount: number;
}

export interface ReportTransactionFinding {
  id: string;
  timestamp: string;
  rail: string;
  direction: 'INBOUND' | 'OUTBOUND' | 'INTERNAL_HOP';
  amount: string;
  from: string;
  to: string;
  relationship: string;
  classification: FindingClassification;
}

export interface ReportTraceHop {
  hopNumber: number;
  entityName: string;
  entityType: 'SUBJECT' | 'INTERMEDIARY' | 'DEPOSIT' | 'VASP' | 'VPA';
  identifier: string;
  transactionRef: string;
  amount: string;
  timestamp: string;
  association: string;
  classification: FindingClassification;
}

export interface ReportRiskSignal {
  id: string;
  signalName: string;
  category: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  whyDetected: string;
  supportingActivity: string;
  classification: FindingClassification;
}

export interface ReportUpiFinding {
  subjectVpa: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  detectedSignals: string[];
  supportingTransactions: string[];
  behavioralFindings: string;
  classification: FindingClassification;
}

export interface ReportVaspCandidate {
  candidateName: string;
  associationConfidence: number;
  basis: string[];
  supportingActivity: string;
  reviewStatus: 'Review Required' | 'Under Investigation' | 'Verified Corroboration';
  classification: FindingClassification;
}

export interface ReportGeospatialSignal {
  signalId: string;
  signalType: string;
  locationName: string;
  coordinates: string;
  timestamp: string;
  source: string;
  accuracy: string;
  relatedTransaction: string;
  derivedFinding?: string;
  classification: FindingClassification;
}

export interface ReportEvidenceSummaryItem {
  id: string;
  category: FindingClassification;
  title: string;
  source: string;
  status: string;
  integrity: string;
}

export interface ReportInvestigationGap {
  id: string;
  category: string;
  description: string;
  impact: string;
}

export interface ReportNextAction {
  id: string;
  actionTitle: string;
  description: string;
  targetWorkspace: 'Transactions' | 'Graph' | 'Risk' | 'UPI' | 'VASP' | 'Geospatial' | 'Evidence' | 'SAHYOG_HOOK';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface InvestigationReportData {
  reportId: string;
  caseId: string;
  caseTitle: string;
  caseType: string;
  generatedAt: string;
  status: ReportStatus;
  dataClassification: string;
  isSynthetic: boolean;
  subject: SubjectSummary;
  executiveSummary: {
    observedActivity: string;
    systemAnalysis: string;
    attributionFindings: string;
    locationCorrelations: string;
    evidenceAvailable: string;
    reviewStatus: string;
  };
  transactions: ReportTransactionFinding[];
  tracePaths: ReportTraceHop[];
  riskFindings: {
    score: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    signals: ReportRiskSignal[];
  };
  upiFindings: ReportUpiFinding;
  vaspFindings: ReportVaspCandidate[];
  geospatialFindings: ReportGeospatialSignal[];
  evidenceItems: ReportEvidenceSummaryItem[];
  investigatorInterpretations: {
    author: string;
    enteredAt: string;
    notes: string;
    classification: FindingClassification;
  }[];
  openQuestions: ReportInvestigationGap[];
  nextActions: ReportNextAction[];
}
