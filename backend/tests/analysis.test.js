const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const caseService = require('../src/services/caseService');
const intelligenceService = require('../src/services/intelligenceService');
const AppError = require('../src/utils/appError');
const { getAuthHeaders } = require('./test_helper');

describe('Analysis & Intelligence Gateway API', () => {
  let server;
  let baseUrl;
  let testCaseId;
  let authHeaders;
  const originalAnalyzeWallet = intelligenceService.analyzeWallet.bind(intelligenceService);

  before(async () => {
    await caseService.ensureInitialized();
    authHeaders = getAuthHeaders('ADMIN');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Create a known case for testing
    const testCase = await caseService.createCase({
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
      headers: { 'Content-Type': 'application/json', ...authHeaders },
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
      headers: { 'Content-Type': 'application/json', ...authHeaders },
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
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        wallet_address: '0x0000000000000000000000000000000000000001',
        blockchain: 'bitcoin'
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'UNSUPPORTED_BLOCKCHAIN');
  });

  it('POST /api/cases/:id/analyze returns 502 when Python engine is unavailable', async () => {
    intelligenceService.analyzeWallet = async () => {
      throw new AppError(
        'Python Intelligence Engine is currently unavailable.',
        502,
        'INTELLIGENCE_ENGINE_UNAVAILABLE'
      );
    };

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        wallet_address: '0x0000000000000000000000000000000000000001',
        blockchain: 'ethereum'
      })
    });

    assert.strictEqual(res.status, 502);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INTELLIGENCE_ENGINE_UNAVAILABLE');

    // Case status should have reverted to OPEN
    const c = caseService.getCaseById(testCaseId);
    assert.strictEqual(c.status, 'OPEN');
  });

  it('POST /api/cases/:id/analyze returns 504 on timeout', async () => {
    intelligenceService.analyzeWallet = async () => {
      throw new AppError(
        'Python Intelligence Engine timed out.',
        504,
        'INTELLIGENCE_ENGINE_TIMEOUT'
      );
    };

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        wallet_address: '0x0000000000000000000000000000000000000001',
        blockchain: 'ethereum'
      })
    });

    assert.strictEqual(res.status, 504);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INTELLIGENCE_ENGINE_TIMEOUT');
  });

  it('POST /api/cases/:id/analyze returns 502 on invalid schema from Python', async () => {
    intelligenceService.analyzeWallet = async () => {
      throw new AppError(
        "Python Intelligence Engine response missing required field: 'risk'",
        502,
        'INTELLIGENCE_SCHEMA_INVALID'
      );
    };

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        wallet_address: '0x0000000000000000000000000000000000000001',
        blockchain: 'ethereum'
      })
    });

    assert.strictEqual(res.status, 502);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INTELLIGENCE_SCHEMA_INVALID');
  });

  it('POST /api/cases/:id/analyze succeeds with canonical AnalysisResult (200)', async () => {
    const canonicalResult = {
      case_id: testCaseId,
      subject: '0x0000000000000000000000000000000000000001',
      wallet: '0x0000000000000000000000000000000000000001',
      blockchain: 'ethereum',
      status: 'Analysis complete',
      nearest_vasp: {
        entity: 'Example Exchange',
        name: 'Example Exchange',
        entity_type: 'DEPOSIT_WALLET',
        distance: 3,
        hops: 3,
        confidence: 60.0,
        confidence_label: 'MODERATE',
        source: 'controlled_test_registry',
        explanation: 'Observed transaction path reaches address associated with Example Exchange after 3 hops.',
        supporting_evidence: ['Transaction path reached a tagged DEPOSIT_WALLET address.']
      },
      attribution: [
        {
          entity: 'Example Exchange',
          name: 'Example Exchange',
          entity_type: 'DEPOSIT_WALLET',
          distance: 3,
          confidence: 60.0,
          confidence_label: 'MODERATE'
        }
      ],
      risk: {
        score: 50.0,
        level: 'MEDIUM',
        signals: [
          { id: 'RS-01', signal_type: 'MIXER_EXPOSURE', score: 30.0, severity: 'HIGH' }
        ],
        indicators: ['Mixer interaction detected (+30)']
      },
      graph: {
        nodes: [{ id: '0x0000000000000000000000000000000000000001' }, { id: 'exchange_deposit' }],
        edges: [{ id: 'tx01', from_node: '0x0000000000000000000000000000000000000001', to_node: 'exchange_deposit' }]
      },
      trace_paths: [
        {
          hop_count: 3,
          source: '0x0000000000000000000000000000000000000001',
          destination: 'exchange_deposit',
          nodes: [],
          edges: []
        }
      ],
      path: ['0x0000000000000000000000000000000000000001', 'b', 'c', 'exchange_deposit'],
      confidence: {
        base_score: 90.0,
        hop_penalty: 30.0,
        final_confidence: 60.0,
        confidence_label: 'MODERATE'
      },
      evidence: [
        {
          id: 'EV-001',
          type: 'TRANSACTION',
          description: 'Transfer along path',
          source: 'Blockchain Transaction Record',
          status: 'Verified',
          relevance: 'HIGH'
        },
        {
          id: 'EV-002',
          type: 'GRAPH_PATH',
          description: 'Directed path reaches deposit wallet',
          source: 'networkx_graph',
          status: 'Verified',
          relevance: 'HIGH'
        },
        {
          id: 'EV-003',
          type: 'VASP_REGISTRY',
          description: 'Associated with Example Exchange',
          source: 'controlled_test_registry',
          status: 'Supporting',
          relevance: 'HIGH'
        }
      ],
      metadata: {
        engine: 'TRACEVAULT NetworkX Intelligence Engine v2.0'
      }
    };

    intelligenceService.analyzeWallet = async () => canonicalResult;

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        wallet_address: '0x0000000000000000000000000000000000000001',
        blockchain: 'ethereum',
        max_hops: 3
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);
    assert.strictEqual(body.data.nearest_vasp.name, 'Example Exchange');
    assert.strictEqual(body.data.nearest_vasp.confidence, 60.0);
    assert.strictEqual(body.data.nearest_vasp.confidence_label, 'MODERATE');

    // Case status should now be ANALYSIS_COMPLETE
    const c = caseService.getCaseById(testCaseId);
    assert.strictEqual(c.status, 'ANALYSIS_COMPLETE');
    assert.ok(c.analysis);
  });

  it('GET /api/cases/:id/analysis returns the stored canonical analysis result (200)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/analysis`, { headers: authHeaders });
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);
    assert.strictEqual(body.data.nearest_vasp.entity, 'Example Exchange');
    assert.strictEqual(body.data.confidence.final_confidence, 60.0);
  });

  it('GET /api/cases/:id/evidence returns structured evidence schedule (200)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/evidence`, { headers: authHeaders });
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.strictEqual(body.data.length, 3);
    assert.strictEqual(body.data[0].type, 'TRANSACTION');
    assert.strictEqual(body.data[1].type, 'GRAPH_PATH');
    assert.strictEqual(body.data[2].type, 'VASP_REGISTRY');
  });

  it('GET /api/cases/:id/results returns array of historical results (200)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/results`, { headers: authHeaders });
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.count, 1);
    assert.strictEqual(body.data[0].nearest_vasp.name, 'Example Exchange');
  });

  it('GET /api/cases/:id/analysis returns 404 for unanalyzed case', async () => {
    const unanalyzed = caseService.createCase({ title: 'Unanalyzed Case' });
    const res = await fetch(`${baseUrl}/api/cases/${unanalyzed.case_id}/analysis`, { headers: authHeaders });
    assert.strictEqual(res.status, 404);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'ANALYSIS_NOT_FOUND');
  });
});
