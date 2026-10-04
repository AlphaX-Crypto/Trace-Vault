const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const { getAuthHeaders, SEED_USERS } = require('./test_helper');

describe('Sprint 11 — Real Persistence & Workflow Integration Endpoints', () => {
  let server;
  let baseUrl;
  let authHeaders;
  let testCaseId;

  before(async () => {
    authHeaders = getAuthHeaders('INVESTIGATOR');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Create a dedicated case for integration testing
    const createRes = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        title: 'S11 Persistence Integration Case',
        description: 'Verifying end-to-end DB backed workflows',
        priority: 'HIGH',
        crime_type: 'FRAUD',
        subject_type: 'WALLET',
        blockchain: 'ethereum',
        subject_identifier: '0xS11IntegrationSubjectAddress'
      })
    });
    assert.strictEqual(createRes.status, 201);
    const createData = await createRes.json();
    testCaseId = createData.data.case_id;
  });

  after(() => {
    server.close();
  });

  // -------------------------------------------------------------
  // Cases Tests
  // -------------------------------------------------------------
  describe('Cases API', () => {
    it('GET /api/cases returns array containing newly persisted case', async () => {
      const res = await fetch(`${baseUrl}/api/cases`, { headers: authHeaders });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      const found = body.data.find((c) => c.case_id === testCaseId);
      assert.ok(found, 'Created case must be found in cases list');
      assert.strictEqual(found.title, 'S11 Persistence Integration Case');
    });

    it('GET /api/cases/:id returns case details for authorized user', async () => {
      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}`, { headers: authHeaders });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.case_id, testCaseId);
      assert.strictEqual(body.data.priority, 'HIGH');
    });

    it('GET /api/cases/:id returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}`);
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'UNAUTHENTICATED');
    });

    it('GET /api/cases/:id enforces case isolation / access denial for unassigned/nonexistent case (403)', async () => {
      const res = await fetch(`${baseUrl}/api/cases/CASE-NONEXISTENT-999`, { headers: authHeaders });
      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'FORBIDDEN');
    });
  });

  // -------------------------------------------------------------
  // Transactions Tests
  // -------------------------------------------------------------
  describe('Transactions API (GET /api/cases/:id/transactions)', () => {
    it('POST /api/cases/:id/transactions associates and persists transaction', async () => {
      const txPayload = {
        transaction_hash: '0xS11_test_tx_hash_001',
        blockchain: 'ethereum',
        timestamp: '2026-10-04T12:00:00Z',
        from_address: '0xS11IntegrationSubjectAddress',
        to_address: '0xIntermediaryDestinationAddress',
        asset: 'ETH',
        amount: 14.5,
        transaction_type: 'transfer',
        block_number: 19820492,
        source: 'Ethereum Node'
      };

      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(txPayload)
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.transaction_hash, '0xS11_test_tx_hash_001');
      assert.strictEqual(Number(body.data.amount), 14.5);
    });

    it('GET /api/cases/:id/transactions returns paginated transactions', async () => {
      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/transactions?page=1&limit=10`, {
        headers: authHeaders
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.pagination);
      assert.strictEqual(body.pagination.page, 1);
      assert.strictEqual(body.pagination.limit, 10);
      assert.ok(body.pagination.total >= 1);

      const found = body.data.find((t) => t.transaction_hash === '0xS11_test_tx_hash_001');
      assert.ok(found, 'Persisted transaction must be retrieved');
      assert.strictEqual(found.from_address, '0xS11IntegrationSubjectAddress');
    });

    it('GET /api/cases/:id/transactions supports keyword search filter', async () => {
      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/transactions?search=IntermediaryDestination`, {
        headers: authHeaders
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.length >= 1);
      assert.strictEqual(body.data[0].to_address, '0xIntermediaryDestinationAddress');
    });

    it('GET /api/cases/:id/transactions enforces case isolation for unassigned/invalid case (403)', async () => {
      const res = await fetch(`${baseUrl}/api/cases/CASE-INVALID-000/transactions`, {
        headers: authHeaders
      });
      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'FORBIDDEN');
    });
  });

  // -------------------------------------------------------------
  // Evidence Tests
  // -------------------------------------------------------------
  describe('Evidence API', () => {
    it('POST /api/cases/:id/evidence persists a structured evidentiary record', async () => {
      const evPayload = {
        evidence_id: 'EV-S11-001',
        type: 'OBSERVED_FACT',
        description: 'Direct on-chain execution transferring 14.50 ETH with priority fee',
        source: 'Ethereum Mainnet Archive Node',
        timestamp: '2026-10-04T12:00:00Z',
        status: 'SOURCE_VERIFIED',
        relevance: 'HIGH',
        transaction_hash: '0xS11_test_tx_hash_001',
        amount: 14.5,
        asset: 'ETH',
        from_address: '0xS11IntegrationSubjectAddress',
        to_address: '0xIntermediaryDestinationAddress'
      };

      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(evPayload)
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.evidence_id, 'EV-S11-001');
      assert.strictEqual(body.data.case_id, testCaseId);
      assert.strictEqual(body.data.type, 'OBSERVED_FACT');
    });

    it('GET /api/cases/:id/evidence returns persisted case evidence records', async () => {
      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/evidence`, {
        headers: authHeaders
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length >= 1);
      const found = body.data.find((e) => e.evidence_id === 'EV-S11-001');
      assert.ok(found, 'Created evidence record must be listed');
      assert.strictEqual(found.status, 'SOURCE_VERIFIED');
    });
  });

  // -------------------------------------------------------------
  // Disclosure Requests Tests
  // -------------------------------------------------------------
  describe('Disclosure Requests API', () => {
    it('POST /api/cases/:id/disclosure-request drafts requisition in DB', async () => {
      const discPayload = {
        target_vasp: 'Example Exchange',
        wallet_address: '0xIntermediaryDestinationAddress',
        jurisdiction: 'INDIA_LEA',
        purpose: 'SECTION_91_CRPC_OFFICIAL_REQUISITION'
      };

      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/disclosure-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(discPayload)
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.request_id);
      assert.strictEqual(body.data.case_id, testCaseId);
      assert.strictEqual(body.data.target_vasp, 'Example Exchange');
      assert.strictEqual(body.data.status, 'DRAFTED_PENDING_DISPATCH');
    });

    it('GET /api/cases/:id/disclosure-requests returns persisted requests for case', async () => {
      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/disclosure-requests`, {
        headers: authHeaders
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length >= 1);
      assert.strictEqual(body.data[0].case_id, testCaseId);
      assert.strictEqual(body.data[0].target_entity, 'Example Exchange');
      assert.strictEqual(body.data[0].request_type, 'SECTION_91_CRPC');
    });
  });
});
