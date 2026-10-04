const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const { getAuthHeaders } = require('./test_helper');

describe('Case Management API', () => {
  let server;
  let baseUrl;
  let createdCaseId;
  let authHeaders;

  before(async () => {
    authHeaders = getAuthHeaders('ADMIN');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  after(() => {
    server.close();
  });

  it('POST /api/cases creates a new investigation case', async () => {
    const payload = {
      title: 'Operation CryptoSweep',
      description: 'Suspicious crypto wallet investigation',
      priority: 'HIGH',
      crime_type: 'RANSOMWARE',
      subject_type: 'WALLET',
      blockchain: 'ethereum',
      subject_identifier: '0x0000000000000000000000000000000000000001'
    };

    const res = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.case_id);
    assert.strictEqual(body.data.title, payload.title);
    assert.strictEqual(body.data.priority, 'HIGH');
    assert.strictEqual(body.data.status, 'OPEN');

    createdCaseId = body.data.case_id;
  });

  it('POST /api/cases rejects case with missing title (400)', async () => {
    const res = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ description: 'No title provided' })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  });

  it('POST /api/cases rejects invalid priority (400)', async () => {
    const res = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ title: 'Test Case', priority: 'SUPER_URGENT' })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  });

  it('POST /api/cases rejects unsupported blockchain (400)', async () => {
    const res = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ title: 'Test Case', blockchain: 'bitcoin' })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'UNSUPPORTED_BLOCKCHAIN');
  });

  it('GET /api/cases returns all registered cases', async () => {
    const res = await fetch(`${baseUrl}/api/cases`, { headers: authHeaders });
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
  });

  it('GET /api/cases/:id returns specific case details', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${createdCaseId}`, { headers: authHeaders });
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, createdCaseId);
  });

  it('GET /api/cases/:id returns 404 for non-existent case ID', async () => {
    const res = await fetch(`${baseUrl}/api/cases/NON_EXISTENT_CASE_12345`, { headers: authHeaders });
    assert.strictEqual(res.status, 404);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'CASE_NOT_FOUND');
  });

  it('POST /api/cases/:id/disclosure-request drafts a SAHYOG request (201)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${createdCaseId}/disclosure-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        target_vasp: 'Binance Exchange',
        wallet_address: '0x0000000000000000000000000000000000000001',
        purpose: 'CYBERCRIME_INVESTIGATION'
      })
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.request_id);
    assert.strictEqual(body.data.case_id, createdCaseId);
    assert.strictEqual(body.data.adapter, 'MOCK_SAHYOG_SANDBOX_ADAPTER');
  });
});
