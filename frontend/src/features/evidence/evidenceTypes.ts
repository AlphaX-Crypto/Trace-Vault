// TRACEVAULT Phase P6: Evidence Workspace Domain Types
// Strictly aligned with backend InvestigationEvidenceLinker & EvidenceItem models

export type EvidenceCategoryType =
  | 'OBSERVED_FACT'
  | 'SYSTEM_ANALYSIS'
  | 'ATTRIBUTION_INDICATOR'
  | 'RISK_INDICATOR'
  | 'INVESTIGATOR_INTERPRETATION';

export type EvidenceStatusType =
  | 'AVAILABLE'
  | 'REVIEW_REQUIRED'
  | 'REVIEWED'
  | 'INSUFFICIENT_SUPPORT'
  | 'DISPUTED';

export type SourceIntegrityStatus =
  | 'SOURCE_VERIFIED'
  | 'SOURCE_AVAILABLE'
  | 'SOURCE_UNAVAILABLE';

export type SourceType =
  | 'UPI_FEED'
  | 'BLOCKCHAIN_LEDGER'
  | 'VASP_REGISTRY'
  | 'GEOSPATIAL_SIGNAL'
  | 'RISK_ENGINE'
  | 'ATTRIBUTION_ENGINE'
  | 'INVESTIGATOR_INPUT'
  | 'SYNTHETIC_DEMO';

export interface EvidenceRecord {
  id: string; // e.g. EV-0001
  caseId: string; // e.g. CASE-2026-001
  category: EvidenceCategoryType;
  title: string;
  description: string;
  source: string; // e.g. 'Authorized NPCI UPI Feed', 'Ethereum Mainnet Archive Node'
  sourceType: SourceType;
  sourceReference?: string; // e.g. Block #19820492, UPI UTR 9182049281920
  observedAt: string; // ISO 8601 UTC
  ingestedAt: string; // ISO 8601 UTC
  timestamp: string; // Display timestamp
  status: EvidenceStatusType;
  sourceIntegrity: SourceIntegrityStatus;
  
  // Related Investigative Objects
  relatedTransactionId?: string; // e.g. TX-UPI-001, 0x8ef2...
  relatedEntityId?: string; // e.g. vpa98@okhdfcbank, 0x71F9...
  relatedLocationId?: string; // e.g. GEO-SIG-003 (Mumbai)
  relatedRiskSignalId?: string; // e.g. RS-01 (Rapid Pass-Through)
  relatedVaspCandidate?: string; // e.g. Example Exchange (82%)

  // Chain-of-custody & Technical Metadata (no fabricated hashes)
  technicalHash?: string; // Real transaction hash if blockchain/banking record
  amount?: string; // Display amount e.g. ₹49,500.00 or 42.50 ETH
  rail?: 'Ethereum' | 'UPI Domestic' | 'Tron TRC-20' | 'Multi-Rail' | 'Banking';
  
  // Distinct Investigator Interpretation
  investigatorNotes?: string;
  annotatedBy?: string;
  annotatedAt?: string;
}

export interface EvidenceCounts {
  total: number;
  observedFacts: number;
  systemAnalysis: number;
  riskIndicators: number;
  attributionIndicators: number;
  investigatorInterpretations: number;
}

export interface EvidenceFilterState {
  searchQuery: string;
  category: string;
  source: string;
  status: string;
  relatedObject: string;
}
