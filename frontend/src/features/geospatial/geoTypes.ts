export type GeoSignalType =
  | 'TRANSACTION LOCATION'
  | 'MERCHANT LOCATION'
  | 'TERMINAL LOCATION'
  | 'AUTHORIZED DEVICE LOCATION'
  | 'AUTHORIZED NETWORK LOCATION'
  | 'HISTORICAL BASELINE LOCATION'
  | 'INVESTIGATION PROVIDED LOCATION'
  | 'SYNTHETIC LOCATION';

export type GeoSourceType =
  | 'Authorized Device Metadata'
  | 'Authorized Bank Metadata'
  | 'Merchant Registry Geocode'
  | 'ATM / Terminal Network Registry'
  | 'Investigation Input'
  | 'Synthetic Demo Dataset';

export interface LocationSignalItem {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: string;
  accuracyMeters?: number;
  timestamp: string;
  city: string;
  region: string;
  countryCode: string;
  signalType: GeoSignalType;
  source: GeoSourceType;
  sourceReference?: string;
  relatedTransactionId?: string;
  relatedEntityId?: string;
  amount?: string;
  rail: string;
  correlationExplanation: string;
  isAnomaly?: boolean;
  anomalyDetails?: string;
}

export interface LocationGroup {
  name: string;
  signalCount: number;
  transactionCount: number;
  timeWindow: string;
  primaryCity: string;
  signalIds: string[];
}

export interface CaseGeospatialData {
  caseId: string;
  caseTitle: string;
  subjectAddress: string;
  rail: string;
  totalTransactionsObserved: number;
  totalSignalsCount: number;
  timeWindowStart: string;
  timeWindowEnd: string;
  coverageStatus: 'Available' | 'Partial' | 'None';
  sourceStatus: 'Authorized Feed' | 'Synthetic Demo' | 'Investigation Provided';
  signals: LocationSignalItem[];
  locationGroups: LocationGroup[];
  investigativeNotice: string;
}
