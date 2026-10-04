import {
  DisclosureRequest,
  DisclosureStatus,
  NewDisclosureRequestInput,
  SandboxResponsePayload,
  SandboxSubmissionResult
} from './disclosureTypes';

/**
 * Disclosure Adapter Interface
 * Keeps the SAHYOG platform integration isolated behind a clean contract.
 * Future authorized adapters (e.g. AuthorizedSahyogAdapter) can implement this same interface.
 */
export interface DisclosureAdapter {
  createRequest(input: NewDisclosureRequestInput): Promise<DisclosureRequest>;
  validateRequest(request: Partial<DisclosureRequest>): { valid: boolean; errors: string[] };
  submitRequest(request: DisclosureRequest): Promise<SandboxSubmissionResult>;
  simulateResponse(request: DisclosureRequest): Promise<DisclosureRequest>;
}

/**
 * Mock SAHYOG Sandbox Adapter
 * STRICT COMPLIANCE:
 * - Operates strictly as a sandbox/simulation environment.
 * - Reference identifiers always begin with 'SANDBOX-'.
 * - Explicitly communicates that no real regulatory filing or VASP submission has occurred.
 */
export class MockSahyogAdapter implements DisclosureAdapter {
  private static sequenceCounter = 4;

  validateRequest(request: Partial<DisclosureRequest>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.caseId?.trim()) errors.push('Case identifier is required.');
    if (!request.recipient?.trim()) errors.push('Recipient / VASP name is required.');
    if (!request.subjectIdentifier?.trim()) errors.push('Subject identifier is required.');
    if (!request.legalBasis?.trim()) errors.push('Legal / Authority Basis is required.');
    if (!request.requestPurpose?.trim()) errors.push('Request purpose narrative is required.');
    if (!request.requestedInformation || request.requestedInformation.length === 0) {
      errors.push('At least one item of requested information must be specified.');
    }
    if (!request.supportingEvidenceIds || request.supportingEvidenceIds.length === 0) {
      errors.push('At least one supporting evidence reference must be linked.');
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async createRequest(input: NewDisclosureRequestInput): Promise<DisclosureRequest> {
    const seq = String(MockSahyogAdapter.sequenceCounter++).padStart(3, '0');
    const requestId = `DR-2026-${seq}`;
    const now = new Date();
    const nowStr = `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 19)} UTC`;

    return {
      requestId,
      caseId: input.caseId,
      caseTitle: 'Cross-Rail Peeling Chain to Domestic VPA Sweep',
      recipient: input.recipient,
      recipientType: input.recipientType,
      subjectIdentifier: input.subjectIdentifier,
      identifierType: input.identifierType,
      requestType: input.requestType,
      legalBasis: input.legalBasis,
      requestPurpose: input.requestPurpose,
      requestedInformation: input.requestedInformation,
      supportingEvidenceIds: input.supportingEvidenceIds,
      investigatorNotes: input.investigatorNotes,
      status: 'DRAFT',
      createdAt: nowStr,
      updatedAt: nowStr,
      history: [
        {
          timestamp: nowStr,
          toStatus: 'DRAFT',
          actor: 'Investigator Samarth',
          note: 'Initial disclosure requisition drafted in TRACEVAULT.'
        }
      ]
    };
  }

  async createDraft(input: NewDisclosureRequestInput): Promise<DisclosureRequest> {
    return this.createRequest(input);
  }

  async submitRequest(request: DisclosureRequest): Promise<SandboxSubmissionResult> {
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      throw new Error(`Validation Failed: ${validation.errors.join(' ')}`);
    }

    const now = new Date();
    const nowStr = `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 19)} UTC`;
    const numPart = request.requestId.replace('DR-', '');
    const referenceId = `SANDBOX-DR-${numPart}`;

    const responsePayload: SandboxResponsePayload = {
      referenceId,
      sandboxStatus: 'ACCEPTED — SANDBOX',
      timestamp: nowStr,
      acknowledgmentMessage:
        'Simulated disclosure request accepted by the SAHYOG sandbox adapter. In production, this would route to an authorized recipient gateway.',
      adapterIdentifier: 'MOCK_SAHYOG_SANDBOX_ADAPTER_V2',
      simulatedRetentionDays: 90
    };

    return {
      success: true,
      referenceId,
      status: 'SUBMITTED — SANDBOX',
      message: 'Request dispatched through simulated SAHYOG sandbox.',
      responsePayload
    };
  }

  async submitToSandbox(request: DisclosureRequest): Promise<DisclosureRequest> {
    const res = await this.submitRequest(request);
    const now = new Date();
    const nowStr = `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 19)} UTC`;
    return {
      ...request,
      status: 'SUBMITTED — SANDBOX',
      sahyogReference: res.referenceId,
      updatedAt: nowStr,
      sandboxResponse: res.responsePayload,
      history: [
        ...request.history,
        {
          timestamp: nowStr,
          fromStatus: request.status,
          toStatus: 'SUBMITTED — SANDBOX',
          actor: 'Investigator Samarth',
          note: `Dispatched to SAHYOG Sandbox adapter. Reference: ${res.referenceId}`
        }
      ]
    };
  }

  async simulateResponse(request: DisclosureRequest): Promise<DisclosureRequest> {
    const now = new Date();
    const nowStr = `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 19)} UTC`;
    const newStatus: DisclosureStatus = 'RESPONSE RECEIVED — SANDBOX';

    const updatedResponse: SandboxResponsePayload = {
      referenceId: request.sahyogReference || `SANDBOX-DR-${request.requestId.replace('DR-', '')}`,
      sandboxStatus: 'COMPLETED — SANDBOX',
      timestamp: nowStr,
      acknowledgmentMessage:
        'Simulated recipient acknowledgment received: "Mock response acknowledging requisition receipt. Sandbox telemetry recorded."',
      adapterIdentifier: 'MOCK_SAHYOG_SANDBOX_ADAPTER_V2',
      simulatedRetentionDays: 90
    };

    return {
      ...request,
      status: newStatus,
      updatedAt: nowStr,
      sandboxResponse: updatedResponse,
      history: [
        ...request.history,
        {
          timestamp: nowStr,
          fromStatus: request.status,
          toStatus: newStatus,
          actor: 'SAHYOG Sandbox Simulation Engine',
          note: 'Simulated sandbox recipient receipt response logged.'
        }
      ]
    };
  }

  async updateStatus(
    request: DisclosureRequest,
    newStatus: DisclosureStatus,
    note?: string
  ): Promise<DisclosureRequest> {
    const now = new Date();
    const nowStr = `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 19)} UTC`;
    return {
      ...request,
      status: newStatus,
      updatedAt: nowStr,
      history: [
        ...request.history,
        {
          timestamp: nowStr,
          fromStatus: request.status,
          toStatus: newStatus,
          actor: 'Investigator Samarth',
          note: note || `Requisition status transitioned to ${newStatus}.`
        }
      ]
    };
  }
}

// Default export singleton instance
export const mockSahyogAdapter = new MockSahyogAdapter();
