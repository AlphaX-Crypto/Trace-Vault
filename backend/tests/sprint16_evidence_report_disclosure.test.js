const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const app = require('../src/app');
const caseService = require('../src/services/caseService');
const { getAuthHeaders } = require('./test_helper');

describe('Sprint 16 — Evidence → Report → Authorized Disclosure Integration Tests', () => {
  let server;
  let baseUrl;
  let investigatorAuth;
  let supervisorAuth;
  let unauthorizedAuth;
  let testCaseId;
  let otherCaseId;
  let createdEvidenceId;
  let createdReportId;
  let createdRequestId;

  before(async () => {
    investigatorAuth = getAuthHeaders('INVESTIGATOR');
    supervisorAuth = getAuthHeaders('SUPERVISOR');

    await caseService.ensureInitialized();

    // Create an unassigned investigator for 403 forbidden test
    const userRepository = require('../src/repositories/userRepository');
    const authService = require('../src/services/authService');
    const roleRes = await userRepository.getRoleByName('INVESTIGATOR');
    const invBUser = await userRepository.createUser({
      username: 'investigator_unassigned_s16',
      email: 'investigator_unassigned_s16@tracevault.local',
      password_hash: '$2b$10$placeholderHashForInvUnassigned16',
      role_id: roleRes.id,
      is_active: true
    }).catch(async () => {
      return userRepository.getUserByUsernameOrEmail('investigator_unassigned_s16');
    });
    unauthorizedAuth = {
      Authorization: `Bearer ${authService.generateToken({ ...invBUser, role_name: 'INVESTIGATOR' })}`
    };

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // 1. Create primary test case
    const caseRes = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        title: 'Sprint 16 Evidence-Report-Disclosure Case',
        description: 'Comprehensive workflow case testing evidentiary chain and sandbox disclosure',
        crime_type: 'MONEY_LAUNDERING',
        priority: 'HIGH',
        subject_type: 'WALLET',
        blockchain: 'ethereum',
        subject_identifier: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982'
      })
    });
    assert.strictEqual(caseRes.status, 201);
    const caseData = await caseRes.json();
    testCaseId = caseData.data.case_id;

    // 2. Create second test case for isolation checks
    const case2Res = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        title: 'Sprint 16 Isolation Secondary Case',
        description: 'Used to verify case isolation on evidence and reports',
        crime_type: 'CYBER_EXTORTION',
        priority: 'MEDIUM'
      })
    });
    assert.strictEqual(case2Res.status, 201);
    const case2Data = await case2Res.json();
    otherCaseId = case2Data.data.case_id;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. Authentication check
  it('1. Rejects unauthenticated requests to Evidence, Report, and Disclosure endpoints with 401', async () => {
    const res1 = await fetch(`${baseUrl}/api/cases/${testCaseId}/evidence`);
    assert.strictEqual(res1.status, 401);

    const res2 = await fetch(`${baseUrl}/api/cases/${testCaseId}/reports`);
    assert.strictEqual(res2.status, 401);

    const res3 = await fetch(`${baseUrl}/api/cases/${testCaseId}/disclosure-requests`);
    assert.strictEqual(res3.status, 401);
  });

  // 2. Authorization check
  it('2. Rejects unauthorized investigator on a case with 403 FORBIDDEN', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/evidence`, {
      headers: unauthorizedAuth
    });
    assert.strictEqual(res.status, 403);
  });

  // 3. Evidence creation with OBSERVED_FACT classification
  it('3. Creates structured evidence record with explicit OBSERVED_FACT classification', async () => {
    const payload = {
      evidence_id: 'EV-S16-0001',
      type: 'TRANSACTION_RECEIPT',
      description: 'Observed blockchain transfer of 42.50 ETH to intermediate peeling wallet',
      source: 'Ethereum Public Ledger',
      status: 'AVAILABLE',
      relevance: 'HIGH',
      transaction_hash: '0x8ef2a9103c8b7b659fe10938bfe41209b0a124982',
      from_address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
      to_address: '0x84C2EF17BD0038827e1091290384712098471092',
      amount: 42.50,
      asset: 'ETH',
      metadata: {
        observed_or_derived: 'OBSERVED_FACT',
        block_number: 19820381
      }
    };

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.evidence_id, 'EV-S16-0001');
    assert.strictEqual(body.data.case_id, testCaseId);
    assert.strictEqual(body.data.metadata.observed_or_derived, 'OBSERVED_FACT');
    createdEvidenceId = body.data.evidence_id;
  });

  // 4. Evidence retrieval by case
  it('4. Retrieves evidentiary register for the case with correct properties', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/evidence`, {
      headers: investigatorAuth
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    const found = body.data.find((e) => e.evidence_id === 'EV-S16-0001');
    assert.ok(found);
    assert.strictEqual(found.case_id, testCaseId);
  });

  // 5. Evidence status update & investigator review
  it('5. Updates evidence status and records investigator review note', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/evidence/${createdEvidenceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        status: 'REVIEWED',
        notes: 'Verified transaction against node receipt. Confirmed peeling signature.'
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'REVIEWED');
    assert.strictEqual(body.data.metadata.investigator_notes, 'Verified transaction against node receipt. Confirmed peeling signature.');
  });

  // 6. Evidence isolation across cases
  it('6. Enforces strict case isolation: evidence from case A is not accessible under case B', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${otherCaseId}/evidence/${createdEvidenceId}`, {
      headers: investigatorAuth
    });
    assert.strictEqual(res.status, 404);
  });

  // 7. Rejection of prohibited credentials in evidence submission
  it('7. Rejects evidence payloads containing prohibited credentials (private_key, seed_phrase)', async () => {
    const forbiddenPayload = {
      evidence_id: 'EV-MALICIOUS-01',
      type: 'CREDENTIAL_LEAK',
      description: 'Attempt to submit private keys',
      private_key: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    };

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify(forbiddenPayload)
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'SECURITY_VIOLATION_PROHIBITED_FIELD');
  });

  // 8. Investigation Report Generation
  it('8. Compiles and persists an Investigation Report incorporating evidence schedule and SHA-256 payload integrity digest', async () => {
    const reportPayload = {
      title: 'Formal Forensic Dossier — Cross-Rail Peeling Investigation',
      status: 'DRAFT',
      classification: 'OFFICIAL_INVESTIGATION_RECORD',
      executive_summary: 'Target wallet 0x71F9A executed rapid multi-hop dispersion across peeling relays.',
      notes: [
        {
          author: 'Inspector Samarth',
          classification: 'INVESTIGATOR_INTERPRETATION',
          text: 'Behavioral pattern indicates automated peeling script liquidation.'
        }
      ]
    };

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify(reportPayload)
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.id);
    assert.strictEqual(body.data.case_id, testCaseId);
    assert.ok(body.data.report_payload.payload_integrity_digest);
    assert.strictEqual(body.data.report_payload.payload_integrity_digest.length, 64); // SHA-256 hex string
    assert.ok(body.data.report_payload.evidence_schedule.length >= 1);
    createdReportId = body.data.id;
  });

  // 9. Report retrieval and case isolation
  it('9. Retrieves reports for the case and verifies case isolation against other cases', async () => {
    const listRes = await fetch(`${baseUrl}/api/cases/${testCaseId}/reports`, {
      headers: investigatorAuth
    });
    assert.strictEqual(listRes.status, 200);
    const listBody = await listRes.json();
    assert.strictEqual(listBody.success, true);
    assert.ok(listBody.data.length >= 1);

    const singleRes = await fetch(`${baseUrl}/api/cases/${testCaseId}/reports/${createdReportId}`, {
      headers: investigatorAuth
    });
    assert.strictEqual(singleRes.status, 200);

    const isolationRes = await fetch(`${baseUrl}/api/cases/${otherCaseId}/reports/${createdReportId}`, {
      headers: investigatorAuth
    });
    assert.strictEqual(isolationRes.status, 404);
  });

  // 10. Report status update (e.g. from DRAFT to REVIEW)
  it('10. Updates report status through workflow lifecycle', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/reports/${createdReportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...supervisorAuth },
      body: JSON.stringify({
        status: 'UNDER_REVIEW'
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.status, 'UNDER_REVIEW');
  });

  // 11. Disclosure Request Creation with Sandbox Adapter
  it('11. Drafts an authorized disclosure request targeting candidate VASP with legal basis and payload integrity digest', async () => {
    const disclosurePayload = {
      target_vasp: 'Example Exchange Liquidation Desk',
      wallet_address: '0x84C2EF17BD0038827e1091290384712098471092',
      jurisdiction: 'INDIA_LEA',
      purpose: 'INVESTIGATION_UNDER_SECTION_91_CRPC',
      legal_basis: 'Section 91 CrPC',
      attached_evidence: [createdEvidenceId]
    };

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/disclosure-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify(disclosurePayload)
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.request_id);
    assert.strictEqual(body.data.status, 'DRAFTED_PENDING_DISPATCH');
    assert.ok(body.data.payload_integrity_digest);
    assert.strictEqual(body.data.adapter, 'MOCK_SAHYOG_SANDBOX_ADAPTER');
    createdRequestId = body.data.request_id;
  });

  // 12. Disclosure requests listing
  it('12. Lists all disclosure requests for the case', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/disclosure-requests`, {
      headers: investigatorAuth
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    const found = body.data.find((d) => d.request_id === createdRequestId);
    assert.ok(found);
  });

  // 13. Disclosure dispatch to SAHYOG Sandbox
  it('13. Dispatches disclosure request to simulated SAHYOG Sandbox and returns SANDBOX- acknowledgment reference', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/disclosure-requests/${createdRequestId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({ action: 'SUBMIT' })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'SUBMITTED_SANDBOX');
    assert.ok(body.data.request_payload.sandbox_submission.reference_id.startsWith('SANDBOX-DR-'));
    assert.ok(body.data.request_payload.sandbox_submission.payload_integrity_digest);
    assert.ok(body.data.request_payload.sandbox_submission.disclaimer.includes('SAHYOG SANDBOX'));
  });

  // 14. Disclosure response simulation from SAHYOG Sandbox
  it('14. Simulates recipient response from SAHYOG Sandbox with explicit sandbox telemetry and disclaimer', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/disclosure-requests/${createdRequestId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({ action: 'SIMULATE_RESPONSE' })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'RESPONSE_RECEIVED_SANDBOX');
    assert.ok(body.data.request_payload.sandbox_response.reference_id.startsWith('SANDBOX-DR-'));
    assert.ok(body.data.request_payload.sandbox_response.disclaimer.includes('SIMULATED RESPONSE'));
  });

  // 15. Audit trail records all workflow actions
  it('15. Verifies audit log captured EVIDENCE_CREATED, REPORT_CREATED, DISCLOSURE_REQUEST_CREATED, and DISCLOSURE dispatch actions', async () => {
    const auditRepository = require('../src/repositories/auditRepository');
    const logs = await auditRepository.getAuditLogsByCaseId(testCaseId);

    const actions = logs.map((l) => l.action);
    assert.ok(actions.includes('CASE_CREATED'));
    assert.ok(actions.includes('EVIDENCE_CREATED'));
    assert.ok(actions.includes('EVIDENCE_STATUS_CHANGED'));
    assert.ok(actions.includes('REPORT_CREATED'));
    assert.ok(actions.includes('DISCLOSURE_REQUEST_CREATED'));
    assert.ok(actions.includes('DISCLOSURE_SUBMITTED_SANDBOX'));
    assert.ok(actions.includes('DISCLOSURE_RESPONSE_SIMULATED'));
  });
});
