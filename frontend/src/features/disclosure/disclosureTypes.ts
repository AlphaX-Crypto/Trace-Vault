export type DisclosureStatus =
  | 'DRAFT'
  | 'UNDER REVIEW'
  | 'READY TO SUBMIT'
  | 'SUBMITTED — SANDBOX'
  | 'RESPONSE RECEIVED — SANDBOX'
  | 'CLOSED';

export type RecipientType =
  | 'VASP'
  | 'FINANCIAL_INSTITUTION'
  | 'PAYMENT_AGGREGATOR'
  | 'TELECOM_PROVIDER'
  | 'SERVICE_PROVIDER';

export type IdentifierType =
  | 'WALLET_ADDRESS'
  | 'UPI_VPA'
  | 'TRANSACTION_ID'
  | 'BANK_ACCOUNT_REF'
  | 'ENTITY_CLUSTER';

export interface SandboxResponsePayload {
  referenceId: string;
  sandboxStatus: 'ACCEPTED — SANDBOX' | 'PENDING_PROCESSING — SANDBOX' | 'COMPLETED — SANDBOX';
  timestamp: string;
  acknowledgmentMessage: string;
  adapterIdentifier: string;
  simulatedRetentionDays: number;
}

export interface RequestHistoryEntry {
  timestamp: string;
  fromStatus?: DisclosureStatus;
  toStatus: DisclosureStatus;
  actor: string;
  note: string;
}

export interface DisclosureRequest {
  requestId: string;
  caseId: string;
  caseTitle: string;
  recipient: string;
  recipientType: RecipientType;
  subjectIdentifier: string;
  identifierType: IdentifierType;
  requestType: string;
  legalBasis: string;
  requestPurpose: string;
  requestedInformation: string[];
  supportingEvidenceIds: string[];
  investigatorNotes?: string;
  status: DisclosureStatus;
  createdAt: string;
  updatedAt: string;
  sahyogReference?: string;
  sandboxResponse?: SandboxResponsePayload;
  history: RequestHistoryEntry[];
}

export interface NewDisclosureRequestInput {
  caseId: string;
  recipient: string;
  recipientType: RecipientType;
  subjectIdentifier: string;
  identifierType: IdentifierType;
  requestType: string;
  legalBasis: string;
  requestPurpose: string;
  requestedInformation: string[];
  supportingEvidenceIds: string[];
  investigatorNotes?: string;
}

export interface SandboxSubmissionResult {
  success: boolean;
  referenceId: string;
  status: DisclosureStatus;
  message: string;
  responsePayload: SandboxResponsePayload;
}
