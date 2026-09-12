const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const caseService = require('../src/services/caseService');
const intelligenceService = require('../src/services/intelligenceService');

describe('Analysis & Intelligence Gateway API', () => {
  let server;
  let baseUrl;
  let testCaseId;
  const originalAnalyzeWallet = intelligenceService.analyzeWallet.bind(intelligenceService);

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Create a known case for testing
    const testCase = caseService.createCase({
      title: 'Analysis Test Case',
      description: 'Testing intelligence orchestration',
      priority: 'MEDIUM'
    });
    testCaseId = testCase.case_id;
  });

  after(() => {
    // Restore original method
    intelligenceService.analyzeWallet = originalAnalyzeWallet;
    server.close();
  });

  it('POST /api/cases/:id/analyze rejects non-existent case (404)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/NON_EXISTENT_ID_999/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: '0x0000000000000000000000000000000000000001',
        blockchain: 'ethereum'
      })
    });

    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'CASE_NOT_FOUND');
  });

  it('POST /api/cases/:id/analyze rejects missing wallet address (400)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockchain: 'ethereum'
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  });

  it('POST /api/cases/:id/analyze rejects unsupported blockchain (400)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: '0x0000000000000000000000000000000000000001',
        blockchain: 'bitcoin'
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'UNSUPPORTED_BLOCKCHAIN');
    assert.ok(body.error.message.includes('Sprint 1 supports'));
  });

  it('POST /api/cases/:id/analyze returns 502 when Python engine is unavailable', async () => {
    // Mock intelligenceService to simulate connection refusal
    const AppError = require('../src/utils/appError');
    intelligenceService.analyzeWallet = async () => {
      throw new AppError(
        'Python Intelligence Engine is currently unavailable.',
        502,
        'INTELLIGENCE_ENGINE_UNAVAILABLE'
      );
    };

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: '0x0000000000000000000000000000000000000001',
        blockchain: 'ethereum'
      })
    });

    assert.strictEqual(res.status, 502);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INTELLIGENCE_ENGINE_UNAVAILABLE');
  });

  it('POST /api/cases/:id/analyze succeeds with mock Python response (200)', async () => {
    const mockPythonResponse = {
      case_id: testCaseId,
      wallet: '0x0000000000000000000000000000000000000001',
      blockchain: 'ethereum',
      nearest_vasp: {
        name: 'Example Exchange',
        distance: 3,
        confidence: 82.5
      },
      risk: {
        score: 67,
        level: 'HIGH',
        indicators: ['Mixer interaction detected (+30)', 'Multiple intermediary hops (+10)']
      },
      path: [
        { from: '0x0000000000000000000000000000000000000001', to: '0xIntermediary', tx_hash: '0xabc' },
        { from: '0xIntermediary', to: 'EXCHANGE_DEPOSIT', tx_hash: '0xdef' }
      ],
      evidence: ['Path reaches tagged VASP deposit address at 3 hops']
    };

    intelligenceService.analyzeWallet = async () => mockPythonResponse;

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: '0x0000000000000000000000000000000000000001',
        blockchain: 'ethereum'
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);
    assert.strictEqual(body.data.nearest_vasp.name, 'Example Exchange');
    assert.strictEqual(body.data.risk.level, 'HIGH');
    assert.strictEqual(body.data.nearest_vasp.distance, 3);
  });

  it('GET /api/cases/:id/results retrieves the saved analysis result (200)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/results`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.count, 1);
    assert.strictEqual(body.data[0].nearest_vasp.name, 'Example Exchange');
  });
});
