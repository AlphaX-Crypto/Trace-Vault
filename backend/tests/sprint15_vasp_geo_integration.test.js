const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const app = require('../src/app');
const transactionRepository = require('../src/repositories/transactionRepository');
const intelligenceService = require('../src/services/intelligenceService');
const { getAuthHeaders } = require('./test_helper');

describe('Sprint 15 — VASP Attribution + Geospatial Intelligence Integration Tests', () => {
  let server;
  let baseUrl;
  let investigatorAuth;
  let supervisorAuth;
  let unauthorizedAuth;
  let testCaseId;
  let emptyCaseId;

  const originalAnalyzeCaseVASP = intelligenceService.analyzeCaseVASP.bind(intelligenceService);
  const originalAnalyzeCaseGeospatial = intelligenceService.analyzeCaseGeospatial.bind(intelligenceService);

  let capturedVaspCalls = [];
  let capturedGeoCalls = [];
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
        title: 'Sprint 15 VASP & Geospatial Intelligence Case',
        description: 'Case with blockchain VASP candidate transactions and location signals',
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

    // Create an empty test case (no transactions/locations)
    const emptyRes = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        title: 'Sprint 15 Empty Case',
        description: 'Case with zero transactions or location signals',
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
    // 1. Blockchain transaction towards an exchange deposit wallet
    await transactionRepository.createTransaction({
      transaction_hash: '0xhash_crypto_s15_001',
      blockchain: 'ethereum',
      timestamp: new Date().toISOString(),
      from_address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
      to_address: '0xEXCHANGE_DEPOSIT',
      asset: 'ETH',
      amount: '42.50000000',
      transaction_type: 'TRANSFER',
      block_number: 20914821,
      source: 'crypto_mock',
      metadata: { case_id: testCaseId, rail: 'ETHEREUM' }
    });

    // 2. UPI transaction (must not be treated as blockchain VASP data)
    await transactionRepository.createTransaction({
      transaction_hash: 'UTR2026100499',
      blockchain: 'upi',
      timestamp: new Date().toISOString(),
      from_address: 'suspect@okaxis',
      to_address: 'destination@paytm',
      asset: 'INR',
      amount: '50000.00',
      transaction_type: 'P2M',
      source: 'upi_mock',
      metadata: { case_id: testCaseId, rail: 'UPI' }
    });

    // Mock intelligenceService methods
    intelligenceService.analyzeCaseVASP = async (params) => {
      if (mockEngineOffline) {
        const AppError = require('../src/utils/appError');
        throw new AppError('Python Intelligence Engine is currently unavailable.', 502, 'INTELLIGENCE_ENGINE_UNAVAILABLE');
      }
      capturedVaspCalls.push(params);
      const txCount = (params.transactions || []).length;
      return {
        case_id: params.caseId,
        subject: params.subject,
        candidates: txCount > 0 ? [
          {
            vasp_id: 'vasp-a',
            name: 'Example Exchange',
            legalEntity: 'Example Global Markets Ltd.',
            association_confidence: 0.82,
            confidence_percent: 82.0,
            confidence_label: 'HIGH',
            hop_distance: 1,
            target_address: '0xEXCHANGE_DEPOSIT',
            indicators: [
              {
                type: 'ADDRESS_MATCH',
                description: 'Target address matched registry record for Example Exchange.',
                observed_or_derived: 'DERIVED'
              },
              {
                type: 'GRAPH_RELATIONSHIP',
                description: 'Directed path distance: 1 hop from subject wallet.',
                observed_or_derived: 'DERIVED'
              },
              {
                type: 'TRANSACTION_PATH',
                description: 'Transfer flow path: 0x71F9... -> 0xEXCHANGE_DEPOSIT.',
                observed_or_derived: 'DERIVED'
              }
            ],
            supporting_transaction_ids: ['0xhash_crypto_s15_001'],
            disclaimer: 'Potential VASP association derived from available transaction and attribution indicators.'
          }
        ] : [],
        metadata: {
          engine: 'TRACEVAULT NetworkX VaspIdentifier',
          generated_at: new Date().toISOString(),
          data_source: 'DEMO / SYNTHETIC DATA'
        }
      };
    };

    intelligenceService.analyzeCaseGeospatial = async (params) => {
      if (mockEngineOffline) {
        const AppError = require('../src/utils/appError');
        throw new AppError('Python Intelligence Engine is currently unavailable.', 502, 'INTELLIGENCE_ENGINE_UNAVAILABLE');
      }
      capturedGeoCalls.push(params);
      const signalCount = (params.locationSignals || []).length;
      return {
        case_id: params.caseId,
        subject: params.subject,
        findings: signalCount > 1 ? [
          {
            id: 'GEO-FND-001',
            type: 'LOCATION_INCONSISTENCY',
            signal_type: 'IMPOSSIBLE_TRAVEL_SEQUENCE',
            name: 'Implied Relocation Velocity Anomaly',
            severity: 'HIGH',
            confidence: 0.88,
            description: 'Relocation speed between Bengaluru and Mumbai observations exceeds physical limits.',
            supporting_transaction_ids: ['TX-UPI-001', 'TX-UPI-005'],
            supporting_location_signal_ids: ['GEO-SIG-001', 'GEO-SIG-002'],
            observed_or_derived: 'DERIVED'
          }
        ] : [],
        location_signals: (params.locationSignals || []).map((s, idx) => ({
          id: s.source_reference || `GEO-SIG-${idx + 1}`,
          timestamp: s.timestamp || new Date().toISOString(),
          latitude: s.latitude,
          longitude: s.longitude,
          confidence: 0.85,
          source: 'DEMO / SYNTHETIC',
          observed_or_derived: 'OBSERVED'
        })),
        metadata: {
          engine: 'TRACEVAULT GeospatialIntelligenceEngine',
          generated_at: new Date().toISOString(),
          data_source: 'DEMO / SYNTHETIC DATA'
        }
      };
    };

    // Create an unassigned investigator for 403 forbidden test
    const userRepository = require('../src/repositories/userRepository');
    const authService = require('../src/services/authService');
    const roleRes = await userRepository.getRoleByName('INVESTIGATOR');
    const invBUser = await userRepository.createUser({
      username: 'investigator_unassigned_s15',
      email: 'investigator_unassigned_s15@tracevault.local',
      password_hash: '$2b$10$placeholderHashForInvUnassigned15',
      role_id: roleRes.id,
      is_active: true
    }).catch(async () => {
      return userRepository.getUserByUsernameOrEmail('investigator_unassigned_s15');
    });
    unauthorizedAuth = {
      Authorization: `Bearer ${authService.generateToken({ ...invBUser, role_name: 'INVESTIGATOR' })}`
    };
  });

  after(() => {
    intelligenceService.analyzeCaseVASP = originalAnalyzeCaseVASP;
    intelligenceService.analyzeCaseGeospatial = originalAnalyzeCaseGeospatial;
    server.close();
  });

  // 1. Unauthenticated VASP request
  it('1. Rejects unauthenticated request to POST /vasp/analyze with 401', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/vasp/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'UNAUTHENTICATED');
  });

  // 2. Unauthorized VASP case
  it('2. Rejects unauthorized investigator with 403 FORBIDDEN on /vasp/analyze', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/vasp/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...unauthorizedAuth },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });

  // 3. Missing case
  it('3. Rejects request for non-existent case with 404 CASE_NOT_FOUND', async () => {
    const res = await fetch(`${baseUrl}/api/cases/CASE-9999-999/vasp/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...supervisorAuth },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'CASE_NOT_FOUND');
  });

  // 4. VASP case isolation & blockchain transactions reach VASP engine
  it('4. VASP case isolation: blockchain transactions reach VASP engine', async () => {
    capturedVaspCalls = [];

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/vasp/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({ max_hops: 4 })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);

    assert.strictEqual(capturedVaspCalls.length, 1);
    const call = capturedVaspCalls[0];
    assert.strictEqual(call.caseId, testCaseId);
    assert.strictEqual(call.maxHops, 4);
    assert.ok(call.transactions.length >= 1);
  });

  // 5. UPI transactions are NOT treated as blockchain VASP data
  it('5. UPI transactions are filtered out and not treated as blockchain VASP data', async () => {
    capturedVaspCalls = [];

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/vasp/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({})
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(capturedVaspCalls.length, 1);
    const call = capturedVaspCalls[0];

    // Ensure none of the transactions sent to VASP engine are UPI
    for (const tx of call.transactions) {
      const rail = String(tx.blockchain || tx.rail || '').toLowerCase();
      assert.ok(!rail.includes('upi'), 'UPI transactions must not be sent to VASP attribution');
    }
  });

  // 6. VASP response contract & DERIVED semantics
  it('6. VASP response contract adheres strictly to specification with DERIVED semantics', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/vasp/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({})
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    const data = body.data;

    assert.ok(Array.isArray(data.candidates));
    assert.ok(data.candidates.length >= 1);
    const cand = data.candidates[0];
    assert.ok(cand.name);
    assert.ok(typeof cand.association_confidence === 'number');
    assert.ok(Array.isArray(cand.indicators));
    assert.strictEqual(cand.indicators[0].observed_or_derived, 'DERIVED');
    assert.strictEqual(data.metadata.data_source, 'DEMO / SYNTHETIC DATA');
  });

  // 7. GET /api/cases/:id/vasp convenience read endpoint
  it('7. GET /api/cases/:id/vasp serves as convenience read endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/vasp`, {
      method: 'GET',
      headers: { ...investigatorAuth }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);
    assert.ok(body.data.candidates.length >= 1);
  });

  // 8. Python VASP failure -> safe gateway error (502)
  it('8. Handles Python VASP engine failure gracefully with 502', async () => {
    mockEngineOffline = true;

    try {
      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/vasp/analyze`, {
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

  // 9. Unauthenticated geo request
  it('9. Rejects unauthenticated request to POST /geospatial/analyze with 401', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/geospatial/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'UNAUTHENTICATED');
  });

  // 10. Unauthorized geo case
  it('10. Rejects unauthorized investigator with 403 on /geospatial/analyze', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/geospatial/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...unauthorizedAuth },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });

  // 11. Geo case isolation
  it('11. Geo case isolation: preserves case context and signals', async () => {
    capturedGeoCalls = [];

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/geospatial/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        location_signals: [
          {
            source_reference: 'GEO-TEST-01',
            latitude: 12.9716,
            longitude: 77.5946,
            timestamp: new Date().toISOString(),
            city: 'Bengaluru'
          },
          {
            source_reference: 'GEO-TEST-02',
            latitude: 19.0760,
            longitude: 72.8777,
            timestamp: new Date(Date.now() + 120000).toISOString(),
            city: 'Mumbai'
          }
        ]
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);

    assert.strictEqual(capturedGeoCalls.length, 1);
    assert.strictEqual(capturedGeoCalls[0].caseId, testCaseId);
    assert.strictEqual(capturedGeoCalls[0].locationSignals.length, 2);
  });

  // 12. Empty location data handling
  it('12. Handles empty location signals gracefully with deterministic baseline', async () => {
    capturedGeoCalls = [];

    const res = await fetch(`${baseUrl}/api/cases/${emptyCaseId}/geospatial/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({ location_signals: [] })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, emptyCaseId);
    assert.strictEqual(body.data.findings.length, 0);
    assert.strictEqual(body.data.location_signals.length, 0);
  });

  // 13. Geospatial response contract with OBSERVED vs DERIVED semantics
  it('13. Geospatial response contract enforces OBSERVED signals and DERIVED findings', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/geospatial/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        location_signals: [
          {
            source_reference: 'GEO-TEST-01',
            latitude: 12.9716,
            longitude: 77.5946,
            city: 'Bengaluru'
          },
          {
            source_reference: 'GEO-TEST-02',
            latitude: 19.0760,
            longitude: 72.8777,
            city: 'Mumbai'
          }
        ]
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    const data = body.data;

    assert.ok(Array.isArray(data.findings));
    assert.ok(data.findings.length >= 1);
    assert.strictEqual(data.findings[0].observed_or_derived, 'DERIVED');
    assert.strictEqual(data.findings[0].type, 'LOCATION_INCONSISTENCY');

    assert.ok(Array.isArray(data.location_signals));
    assert.strictEqual(data.location_signals[0].observed_or_derived, 'OBSERVED');
  });

  // 14. GET /api/cases/:id/geospatial convenience read endpoint
  it('14. GET /api/cases/:id/geospatial serves as convenience read endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/geospatial`, {
      method: 'GET',
      headers: { ...investigatorAuth }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);
  });

  // 15. Python geo failure & synthetic metadata preserved
  it('15. Handles Python geo failure gracefully and preserves DEMO / SYNTHETIC metadata', async () => {
    mockEngineOffline = true;

    try {
      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/geospatial/analyze`, {
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
});
