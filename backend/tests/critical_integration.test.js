const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const app = require('../src/app');
const intelligenceService = require('../src/services/intelligenceService');
const { getAuthHeaders } = require('./test_helper');

describe('Critical Integration: Express -> FastAPI Python Engine -> NetworkX -> Express', () => {
  let server;
  let baseUrl;
  let pythonProcess;
  let authHeaders;
  const pythonPort = 8008;
  const originalBaseUrl = intelligenceService.baseUrl;
  const originalClient = intelligenceService.client;

  before(async () => {
    // 1. Start real Python FastAPI service on port 8008
    const pythonExe = path.resolve(__dirname, '../../intelligence-engine/.venv/Scripts/python.exe');
    const pythonCwd = path.resolve(__dirname, '../../intelligence-engine');

    pythonProcess = spawn(
      pythonExe,
      ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(pythonPort)],
      { cwd: pythonCwd, stdio: 'pipe' }
    );

    // Wait for FastAPI to become ready
    const maxRetries = 30;
    let ready = false;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${pythonPort}/health`);
        if (res.ok) {
          const body = await res.json();
          if (body.status === 'ok') {
            ready = true;
            break;
          }
        }
      } catch (_) {
        // Retry
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    assert.ok(ready, 'FastAPI Python Intelligence Engine must start and become ready on port 8008');

    // 2. Point IntelligenceService to live FastAPI instance
    intelligenceService.baseUrl = `http://127.0.0.1:${pythonPort}`;
    const axios = require('axios');
    intelligenceService.client = axios.create({
      baseURL: intelligenceService.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // 3. Start Node Express application
    authHeaders = getAuthHeaders('ADMIN');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(() => {
    // Teardown
    if (pythonProcess) {
      pythonProcess.kill();
    }
    intelligenceService.baseUrl = originalBaseUrl;
    intelligenceService.client = originalClient;
    if (server) {
      server.close();
    }
  });

  it('Executes full live pipeline: Case Creation -> Analysis -> NetworkX BFS Traversal -> Canonical Storage', async () => {
    // Step 1: POST /api/cases
    const caseRes = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        title: 'Operation Ironclad - Live Cross-Engine E2E',
        description: 'End-to-end trace from Express to Python NetworkX pipeline',
        priority: 'CRITICAL',
        crime_type: 'CYBER_EXTORTION',
        subject_type: 'WALLET',
        blockchain: 'ethereum',
        subject_identifier: 'A'
      })
    });

    assert.strictEqual(caseRes.status, 201);
    const caseData = await caseRes.json();
    assert.strictEqual(caseData.success, true);
    const caseId = caseData.data.case_id;
    assert.ok(caseId);
    assert.strictEqual(caseData.data.status, 'OPEN');

    // Step 2: POST /api/cases/:id/analyze -> Node calls FastAPI -> Python executes NetworkX pipeline
    const analyzeRes = await fetch(`${baseUrl}/api/cases/${caseId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        wallet_address: 'A',
        blockchain: 'ethereum',
        max_hops: 3
      })
    });

    assert.strictEqual(analyzeRes.status, 200);
    const analyzeData = await analyzeRes.json();
    assert.strictEqual(analyzeData.success, true);

    const result = analyzeData.data;

    // Verify canonical contract integrity:
    // 1. Case ID & Wallet
    assert.strictEqual(result.case_id, caseId);
    assert.strictEqual(result.wallet, 'a');
    assert.strictEqual(result.blockchain, 'ethereum');
    assert.strictEqual(result.status, 'Analysis complete');

    // 2. NetworkX Graph visualization structure
    assert.ok(result.graph, 'Graph container must exist');
    assert.ok(Array.isArray(result.graph.nodes), 'Graph nodes must be an array');
    assert.ok(Array.isArray(result.graph.edges), 'Graph edges must be an array');
    assert.ok(result.graph.nodes.length >= 4, 'Graph must contain at least 4 nodes');

    // 3. Reconstructed path sequence
    assert.deepStrictEqual(result.path, ['a', 'b', 'c', 'exchange_deposit']);

    // 4. TracePath container
    assert.ok(Array.isArray(result.trace_paths));
    assert.strictEqual(result.trace_paths.length, 1);
    assert.strictEqual(result.trace_paths[0].hop_count, 3);
    assert.strictEqual(result.trace_paths[0].source, 'a');
    assert.strictEqual(result.trace_paths[0].destination, 'exchange_deposit');

    // 5. VASP Attribution (nearest_vasp and attribution list)
    assert.ok(result.nearest_vasp, 'nearest_vasp must exist');
    assert.strictEqual(result.nearest_vasp.name, 'Example Exchange');
    assert.strictEqual(result.nearest_vasp.entity_type, 'DEPOSIT_WALLET');
    assert.strictEqual(result.nearest_vasp.distance, 3);
    assert.strictEqual(result.nearest_vasp.confidence, 60.0);
    assert.strictEqual(result.nearest_vasp.confidence_label, 'MODERATE');
    assert.strictEqual(result.nearest_vasp.source, 'controlled_test_registry');
    assert.ok(result.nearest_vasp.metadata.reasoning_trace.length >= 8);

    assert.ok(Array.isArray(result.attribution));
    assert.strictEqual(result.attribution.length, 1);
    assert.strictEqual(result.attribution[0].name, 'Example Exchange');

    // 6. Multi-Factor Risk Assessment
    assert.ok(result.risk, 'Risk result must exist');
    assert.ok(result.risk.score >= 50.0);
    assert.ok(['MEDIUM', 'HIGH'].includes(result.risk.level));
    assert.ok(result.risk.signals.some((s) => s.signal_type === 'MIXER_EXPOSURE'));

    // 7. Structured Evidence Schedule
    assert.ok(Array.isArray(result.evidence));
    assert.ok(result.evidence.length >= 6);
    const evidenceTypes = new Set(result.evidence.map((e) => e.type));
    assert.ok(evidenceTypes.has('TRANSACTION'));
    assert.ok(evidenceTypes.has('GRAPH_PATH'));
    assert.ok(evidenceTypes.has('ENTITY_TAG'));
    assert.ok(evidenceTypes.has('VASP_REGISTRY'));
    assert.ok(evidenceTypes.has('HOP_DISTANCE'));

    // Step 3: GET /api/cases/:id/analysis -> Verify exact canonical result returned from stored case
    const getAnalysisRes = await fetch(`${baseUrl}/api/cases/${caseId}/analysis`, { headers: authHeaders });
    assert.strictEqual(getAnalysisRes.status, 200);
    const storedAnalysis = await getAnalysisRes.json();
    assert.strictEqual(storedAnalysis.success, true);
    assert.strictEqual(storedAnalysis.data.case_id, caseId);
    assert.strictEqual(storedAnalysis.data.nearest_vasp.name, 'Example Exchange');
    assert.strictEqual(storedAnalysis.data.nearest_vasp.confidence, 60.0);

    // Step 4: GET /api/cases/:id/evidence -> Verify forensic evidence endpoint
    const evidenceRes = await fetch(`${baseUrl}/api/cases/${caseId}/evidence`, { headers: authHeaders });
    assert.strictEqual(evidenceRes.status, 200);
    const evidenceData = await evidenceRes.json();
    assert.strictEqual(evidenceData.success, true);
    assert.ok(Array.isArray(evidenceData.data));
    assert.ok(evidenceData.data.length >= 6);

    // Step 5: GET /api/cases/:id -> Verify case status transitioned to ANALYSIS_COMPLETE
    const updatedCaseRes = await fetch(`${baseUrl}/api/cases/${caseId}`, { headers: authHeaders });
    assert.strictEqual(updatedCaseRes.status, 200);
    const updatedCase = await updatedCaseRes.json();
    assert.strictEqual(updatedCase.data.status, 'ANALYSIS_COMPLETE');
    assert.ok(updatedCase.data.analysis);
  });
});
