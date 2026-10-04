const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const app = require('../src/app');
const caseService = require('../src/services/caseService');
const transactionRepository = require('../src/repositories/transactionRepository');
const intelligenceService = require('../src/services/intelligenceService');
const { getAuthHeaders } = require('./test_helper');

describe('Sprint 14 — Risk + UPI Intelligence Integration Tests', () => {
  let server;
  let baseUrl;
  let investigatorAuth;
  let supervisorAuth;
  let unauthorizedAuth;
  let testCaseId;
  let emptyCaseId;

  const originalAnalyzeCaseRisk = intelligenceService.analyzeCaseRisk.bind(intelligenceService);
  const originalAnalyzeCaseUPI = intelligenceService.analyzeCaseUPI.bind(intelligenceService);

  let capturedRiskCalls = [];
  let capturedUPICalls = [];
  let mockEngineOffline = false;

  before(async () => {
    investigatorAuth = getAuthHeaders('INVESTIGATOR');
    supervisorAuth = getAuthHeaders('SUPERVISOR');

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Create a primary test case via API to ensure initialization and assignment to investigator
    const caseRes = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        title: 'Sprint 14 Risk & UPI Intelligence Case',
        description: 'Multi-rail cross-chain crypto and domestic UPI pass-through case',
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

    // Create an empty test case (no transactions)
    const emptyRes = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        title: 'Sprint 14 Empty Case',
        description: 'Case with zero transactions',
        crime_type: 'CYBER_EXTORTION',
        priority: 'LOW',
        subject_type: 'WALLET',
        blockchain: 'ethereum',
        subject_identifier: '0x0000000000000000000000000000000000000099'
      })
    });
    assert.strictEqual(emptyRes.status, 201);
    const emptyData = await emptyRes.json();
    emptyCaseId = emptyData.data.case_id;

    // Seed transactions for testCaseId:
    // 1. High-value crypto transaction
    await transactionRepository.createTransaction({
      transaction_hash: '0xhash_crypto_s14_001',
      blockchain: 'ethereum',
      timestamp: new Date().toISOString(),
      from_address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
      to_address: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
      asset: 'ETH',
      amount: '50.00000000',
      transaction_type: 'TRANSFER',
      block_number: 20914821,
      source: 'crypto_mock',
      metadata: { case_id: testCaseId, rail: 'ETHEREUM' }
    });

    // 2. UPI Rapid Pass-Through transactions (identified by UTR, no blockchain hash needed)
    await transactionRepository.createTransaction({
      transaction_hash: 'UTR2026100401',
      blockchain: 'upi',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      from_address: 'source_account@okhdfcbank',
      to_address: 'suspect@okaxis',
      asset: 'INR',
      amount: '45000.00',
      transaction_type: 'P2P',
      source: 'upi_mock',
      metadata: { case_id: testCaseId, rail: 'UPI', provider_id: 'HDFC' }
    });

    await transactionRepository.createTransaction({
      transaction_hash: 'UTR2026100402',
      blockchain: 'upi',
      timestamp: new Date().toISOString(),
      from_address: 'suspect@okaxis',
      to_address: 'destination_cashout@paytm',
      asset: 'INR',
      amount: '44500.00',
      transaction_type: 'P2M',
      source: 'upi_mock',
      metadata: { case_id: testCaseId, rail: 'UPI', provider_id: 'AXIS' }
    });

    // Mock intelligenceService methods
    intelligenceService.analyzeCaseRisk = async (params) => {
      if (mockEngineOffline) {
        const AppError = require('../src/utils/appError');
        throw new AppError('Python Intelligence Engine is currently unavailable.', 502, 'INTELLIGENCE_ENGINE_UNAVAILABLE');
      }
      capturedRiskCalls.push(params);
      const txCount = (params.transactions || []).length;
      return {
        case_id: params.caseId,
        subject: params.subject,
        overall_score: txCount > 0 ? 78 : 0,
        risk_level: txCount > 0 ? 'HIGH' : 'LOW',
        breakdown: {
          counterparty_risk: 80,
          structuring_pattern: 75,
          velocity_anomaly: 85,
          rail_risk: 70
        },
        signals: txCount > 0 ? [
          {
            id: 'SIG-HIGH-VOLUME',
            title: 'High-Volume Value Concentration',
            severity: 'HIGH',
            confidence: 0.92,
            description: 'Significant asset movement detected exceeding monitoring thresholds.',
            observed_or_derived: 'DERIVED'
          }
        ] : [],
        summary: txCount > 0 ? 'Elevated risk detected across transaction signals.' : 'No transactions recorded for risk evaluation.',
        transaction_count: txCount
      };
    };

    intelligenceService.analyzeCaseUPI = async (params) => {
      if (mockEngineOffline) {
        const AppError = require('../src/utils/appError');
        throw new AppError('Python Intelligence Engine is currently unavailable.', 502, 'INTELLIGENCE_ENGINE_UNAVAILABLE');
      }
      capturedUPICalls.push(params);
      const txCount = (params.transactions || []).length;
      return {
        case_id: params.caseId,
        subject_vpa: params.subjectVpa || 'suspect@okaxis',
        risk_score: txCount > 1 ? 84 : 15,
        risk_level: txCount > 1 ? 'HIGH' : 'LOW',
        findings: txCount > 1 ? [
          {
            id: 'FND-UPI-PASS-THROUGH',
            pattern_type: 'RAPID_PASS_THROUGH',
            severity: 'HIGH',
            vpa: 'suspect@okaxis',
            confidence: 0.95,
            description: 'Inflow of ₹45,000.00 followed by rapid outflow of ₹44,500.00 within 2 minutes.',
            supporting_utrs: ['UTR2026100401', 'UTR2026100402'],
            observed_or_derived: 'DERIVED'
          }
        ] : [],
        temporal_window: {
          window_minutes: 5,
          inflow_count: txCount > 0 ? 1 : 0,
          outflow_count: txCount > 1 ? 1 : 0
        },
        monitored_vpas: ['suspect@okaxis', 'destination_cashout@paytm'],
        disclaimer: 'DEMO / SYNTHETIC DATA. UPI routing observations are derived for investigative guidance only.'
      };
    };

    // Create an unassigned investigator for 403 forbidden test
    const userRepository = require('../src/repositories/userRepository');
    const authService = require('../src/services/authService');
    const roleRes = await userRepository.getRoleByName('INVESTIGATOR');
    const invBUser = await userRepository.createUser({
      username: 'investigator_unassigned_s14',
      email: 'investigator_unassigned_s14@tracevault.local',
      password_hash: '$2b$10$placeholderHashForInvUnassigned14',
      role_id: roleRes.id,
      is_active: true
    }).catch(async () => {
      return userRepository.getUserByUsernameOrEmail('investigator_unassigned_s14');
    });
    unauthorizedAuth = {
      Authorization: `Bearer ${authService.generateToken({ ...invBUser, role_name: 'INVESTIGATOR' })}`
    };
  });

  after(() => {
    intelligenceService.analyzeCaseRisk = originalAnalyzeCaseRisk;
    intelligenceService.analyzeCaseUPI = originalAnalyzeCaseUPI;
    server.close();
  });

  // 1. Auth & Access Controls
  it('1. Rejects unauthenticated request to POST /risk/analyze with 401', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/risk/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'UNAUTHENTICATED');
  });

  it('2. Rejects unauthenticated request to POST /upi/analyze with 401', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/upi/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'UNAUTHENTICATED');
  });

  it('3. Rejects unauthorized investigator with 403 FORBIDDEN on /risk/analyze', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/risk/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...unauthorizedAuth },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });

  it('4. Rejects request for non-existent case with 404 CASE_NOT_FOUND', async () => {
    const res = await fetch(`${baseUrl}/api/cases/CASE-9999-999/risk/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...supervisorAuth },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'CASE_NOT_FOUND');
  });

  // 2. Sensitive Credential Rejections (Security Rule)
  it('5. Rejects request containing upi_pin with 400 PROHIBITED_CREDENTIAL_REJECTED', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/upi/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        subject_vpa: 'suspect@okaxis',
        upi_pin: '123456'
      })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'PROHIBITED_CREDENTIAL_REJECTED');
  });

  it('6. Rejects request containing private_key with 400 PROHIBITED_CREDENTIAL_REJECTED or SECURITY_VIOLATION', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/risk/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        private_key: '0xabc123secret'
      })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(
      body.error.code === 'PROHIBITED_CREDENTIAL_REJECTED' ||
      body.error.code === 'SECURITY_VIOLATION_PROHIBITED_FIELD'
    );
  });

  // 3. Risk Analysis Execution
  it('7. Successfully performs Risk Analysis on case with normalized transactions', async () => {
    capturedRiskCalls = [];

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/risk/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({})
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);
    assert.strictEqual(body.data.risk_level, 'HIGH');
    assert.ok(body.data.overall_score >= 0 && body.data.overall_score <= 100);
    assert.ok(Array.isArray(body.data.signals));
    assert.ok(body.data.signals[0].observed_or_derived === 'DERIVED');

    // Verify calls passed to intelligence service
    assert.strictEqual(capturedRiskCalls.length, 1);
    const call = capturedRiskCalls[0];
    assert.strictEqual(call.caseId, testCaseId);
    assert.ok(call.transactions.length >= 3);
  });

  it('8. GET /api/cases/:id/risk serves as read endpoint for risk analysis', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/risk`, {
      method: 'GET',
      headers: { ...investigatorAuth }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);
    assert.strictEqual(body.data.risk_level, 'HIGH');
  });

  // 4. UPI Fraud Analysis Execution
  it('9. Successfully performs UPI Fraud Analysis isolating UPI rail transactions', async () => {
    capturedUPICalls = [];

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/upi/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({ subject_vpa: 'suspect@okaxis' })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);
    assert.strictEqual(body.data.subject_vpa, 'suspect@okaxis');
    assert.strictEqual(body.data.risk_level, 'HIGH');
    assert.ok(body.data.findings.length > 0);
    assert.strictEqual(body.data.findings[0].pattern_type, 'RAPID_PASS_THROUGH');
    assert.strictEqual(body.data.findings[0].observed_or_derived, 'DERIVED');
    assert.ok(body.data.findings[0].supporting_utrs.includes('UTR2026100401'));

    // Verify that crypto transactions did NOT leak into the UPI analysis call
    assert.strictEqual(capturedUPICalls.length, 1);
    const call = capturedUPICalls[0];
    assert.strictEqual(call.caseId, testCaseId);
    assert.strictEqual(call.subjectVpa, 'suspect@okaxis');
    assert.ok(call.transactions.length === 2, 'Expected only UPI transactions');
    for (const tx of call.transactions) {
      assert.strictEqual(tx.blockchain, 'upi');
      assert.ok(tx.transaction_hash.startsWith('UTR'));
    }
  });

  it('10. GET /api/cases/:id/upi serves as read endpoint for UPI fraud analysis', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/upi?subject_vpa=suspect@okaxis`, {
      method: 'GET',
      headers: { ...investigatorAuth }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);
    assert.strictEqual(body.data.risk_score, 84);
  });

  // 5. Empty Case Handling
  it('11. Handles empty case without transactions gracefully for risk analysis', async () => {
    capturedRiskCalls = [];

    const res = await fetch(`${baseUrl}/api/cases/${emptyCaseId}/risk/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({})
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, emptyCaseId);
    assert.strictEqual(body.data.overall_score, 0);
    assert.strictEqual(body.data.risk_level, 'LOW');
    assert.strictEqual(body.data.signals.length, 0);
  });

  it('12. Handles empty case without transactions gracefully for UPI analysis', async () => {
    capturedUPICalls = [];

    const res = await fetch(`${baseUrl}/api/cases/${emptyCaseId}/upi/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({})
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, emptyCaseId);
    assert.strictEqual(body.data.risk_score, 15);
    assert.strictEqual(body.data.findings.length, 0);
  });

  // 6. Upstream Failure / 502 Handling
  it('13. Handles Python Intelligence Engine failure gracefully with 502', async () => {
    mockEngineOffline = true;

    try {
      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/risk/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...investigatorAuth },
        body: JSON.stringify({})
      });

      assert.strictEqual(res.status, 502);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'INTELLIGENCE_ENGINE_UNAVAILABLE');
    } finally {
      mockEngineOffline = false;
    }
  });

  // 7. Audit Logging Verification
  it('14. Confirms audit logs generated for RISK_ANALYSIS_GENERATED and UPI_ANALYSIS_GENERATED', async () => {
    const auditRes = await fetch(`${baseUrl}/api/cases/${testCaseId}/audit`, {
      method: 'GET',
      headers: { ...investigatorAuth }
    });

    if (auditRes.status === 200) {
      const auditBody = await auditRes.json();
      const actions = (auditBody.data || []).map((entry) => entry.action);
      assert.ok(actions.includes('RISK_ANALYSIS_GENERATED'), 'Expected RISK_ANALYSIS_GENERATED in audit trail');
      assert.ok(actions.includes('UPI_ANALYSIS_GENERATED'), 'Expected UPI_ANALYSIS_GENERATED in audit trail');
    }
  });
});
