export interface AssociationBasisAddressMatch {
  matchedRule: string;
  clusterName: string;
  entityType: string;
  verifiedTags: string[];
  registrySource: string;
  reliability: string;
  confidenceBase: number;
  details: string;
}

export interface AssociationBasisGraphRelationship {
  graphDistance: number;
  hopPenalty: number;
  subgraphTopology: string;
  centralityScore: string;
  proximityRating: string;
  details: string;
}

export interface PathStep {
  address: string;
  label: string;
  isSubject?: boolean;
  isTarget?: boolean;
  hopIndex: number;
}

export interface AssociationBasisTransactionPath {
  pathSequence: PathStep[];
  hopCount: number;
  flowVelocity: string;
  totalTransferred: string;
  timeSpan: string;
  details: string;
}

export interface AssociationBasis {
  addressMatch: AssociationBasisAddressMatch;
  graphRelationship: AssociationBasisGraphRelationship;
  transactionPath: AssociationBasisTransactionPath;
}

export interface AttributionSupportingTransaction {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  time: string;
  rail: string;
  status: string;
  type: string;
}

export interface CandidateVASP {
  id: string;
  name: string;
  legalEntity: string;
  jurisdiction: string;
  entityType: string;
  confidence: number;
  confidenceLabel: 'HIGH' | 'MODERATE' | 'LOW';
  hopDistance: number;
  totalVolume: string;
  depositClusterAddress: string;
  associationBasis: AssociationBasis;
  supportingTransactions: AttributionSupportingTransaction[];
  reasoningTrace: string[];
  lastActive: string;
}

export interface CaseSubjectAttribution {
  caseId: string;
  caseTitle: string;
  subjectAddress: string;
  rail: string;
  primaryAttributionId: string;
  candidates: CandidateVASP[];
  methodology: string;
  generatedAt: string;
}
