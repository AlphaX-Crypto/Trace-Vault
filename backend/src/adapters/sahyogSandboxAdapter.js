const crypto = require('crypto');

/**
 * Mock SAHYOG Sandbox Adapter (Backend Service)
 *
 * Strict Compliance:
 * - Operates strictly as a simulated sandbox environment.
 * - Reference identifiers always begin with 'SANDBOX-'.
 * - Explicitly communicates that no real regulatory filing or live external VASP/agency dispatch has occurred.
 * - Computes a canonical SHA-256 payload integrity digest (labeled Payload Integrity Digest).
 */
class SahyogSandboxAdapter {
  constructor() {
    this.adapterIdentifier = 'MOCK_SAHYOG_SANDBOX_ADAPTER_V2';
  }

  /**
   * Generates a deterministic or cryptographic SHA-256 integrity digest of request payload
   * @param {Object} payload
   * @returns {string} Hex encoded SHA-256 digest
   */
  computePayloadIntegrityDigest(payload) {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Validates mandatory disclosure requisition fields
   * @param {Object} data
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateRequisition(data) {
    const errors = [];
    if (!data.case_id && !data.caseId) {
      errors.push('Case identifier is required.');
    }
    const target = data.target_entity || data.target_vasp || data.recipient;
    if (!target || !String(target).trim()) {
      errors.push('Target recipient/entity is required.');
    }
    const legalBasis = data.legal_basis || data.purpose || data.request_type;
    if (!legalBasis || !String(legalBasis).trim()) {
      errors.push('Legal basis reference is required.');
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Dispatches disclosure request to simulated SAHYOG Sandbox
   * @param {Object} requisition
   * @returns {Object} Sandbox acknowledgment envelope
   */
  dispatchToSandbox(requisition) {
    const validation = this.validateRequisition(requisition);
    if (!validation.valid) {
      throw new Error(`Requisition validation failed: ${validation.errors.join('; ')}`);
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const cleanId = String(requisition.request_id || requisition.requestId || 'REQ-UNKNOWN').replace(/^DR-|^REQ-/, '');
    const referenceId = `SANDBOX-DR-${cleanId}`;
    const integrityDigest = this.computePayloadIntegrityDigest(requisition);

    return {
      success: true,
      reference_id: referenceId,
      status: 'SUBMITTED_SANDBOX',
      sahyog_status: 'ACCEPTED — SANDBOX',
      dispatched_at: nowIso,
      payload_integrity_digest: integrityDigest,
      adapter_identifier: this.adapterIdentifier,
      simulated_retention_days: 90,
      acknowledgment_message:
        'Simulated disclosure request accepted by SAHYOG sandbox adapter. In production, this would route to an authorized recipient gateway.',
      disclaimer:
        'SAHYOG SANDBOX / SIMULATED DISPATCH. No real regulatory filing or external VASP communication has taken place.',
      telemetry: {
        envelope_version: '2.0.0-sandbox',
        digest_algorithm: 'SHA-256',
        test_environment: true
      }
    };
  }

  /**
   * Simulates a recipient response from the SAHYOG Sandbox
   * @param {Object} requisition
   * @returns {Object} Simulated response envelope
   */
  simulateSandboxResponse(requisition) {
    const now = new Date();
    const nowIso = now.toISOString();
    const ref = requisition.sahyog_reference || requisition.reference_id || `SANDBOX-DR-${String(requisition.request_id || requisition.requestId || 'SIM').replace(/^DR-|^REQ-/, '')}`;

    return {
      reference_id: ref,
      status: 'RESPONSE_RECEIVED_SANDBOX',
      sahyog_status: 'COMPLETED — SANDBOX',
      received_at: nowIso,
      simulated_response_code: 'SAHYOG_ACK_200',
      acknowledgment_message:
        'Simulated recipient acknowledgment received: "Mock response acknowledging requisition receipt. Sandbox telemetry recorded."',
      adapter_identifier: this.adapterIdentifier,
      response_data: {
        records_found: true,
        match_confidence: 'CONFIRMED_IDENTIFIER',
        simulated_records_count: 2,
        notes: 'Simulated compliance response provided under sandbox conditions.'
      },
      disclaimer:
        'SAHYOG SANDBOX / SIMULATED RESPONSE. Data generated for testing and forensic verification only.'
    };
  }
}

module.exports = new SahyogSandboxAdapter();
