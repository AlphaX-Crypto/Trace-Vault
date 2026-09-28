const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const app = require('../src/app');
const intelligenceService = require('../src/services/intelligenceService');

describe('Full System Integration: Frontend Contract -> Express -> Python FastAPI -> NetworkX -> PostgreSQL', () => {
  let server;
  let baseUrl;
  let pythonProcess;
  const pythonPort = 8009;
  const originalBaseUrl = intelligenceService.baseUrl;
  const originalClient = intelligenceService.client;

  before(async () => {
    // 1. Start real Python FastAPI service on port 8009
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
        // Wait and retry
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    assert.ok(ready, 'FastAPI Python Intelligence Engine must start and become ready on port 8009');

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
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(() => {
    if (pythonProcess) {
      pythonProcess.kill();
    }
    intelligenceService.baseUrl = originalBaseUrl;
    intelligenceService.client = originalClient;
    if (server) {
      server.close();
    }
  });

  it('Executes complete investigator workflow across the integrated stack', async () => {
    // Step 1: Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'ok');

    // Step 2: Intelligence engine health check
    const intelHealthRes = await fetch(`${baseUrl}/health/intelligence`);
    assert.strictEqual(intelHealthRes.status, 200);
    const intelHealthData = await intelHealthRes.json();
    assert.strictEqual(intelHealthData.status, 'ok');
    assert.strictEqual(intelHealthData.intelligence_service.reachable, true);

    // Step 3: Get initial case listing (seeded casework)
    const listRes = await fetch(`${baseUrl}/api/cases`);
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.strictEqual(listData.success, true);
    assert.ok(Array.isArray(listData.data));
    assert.ok(listData.data.length >= 1);

    // Step 4: Create new case from Frontend UI intake
    const createCaseRes = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Operation BlueMatrix - Cross-Engine Investigation',
        description: 'Tracking unhosted suspect wallet through intermediary layering hops',
        priority: 'HIGH',
        crime_type: 'CYBER_EXTORTION',
        subject_type: 'WALLET',
        blockchain: 'ethereum',
        subject_identifier: 'A'
      })
    });

    assert.strictEqual(createCaseRes.status, 201);
    const createdCaseData = await createCaseRes.json();
    assert.strictEqual(createdCaseData.success, true);
    const caseId = createdCaseData.data.case_id;
    assert.ok(caseId);
    assert.strictEqual(createdCaseData.data.status, 'OPEN');

    // Step 5: Start Analysis (POST /api/cases/:id/analyze -> Node -> FastAPI Python NetworkX -> PostgreSQL)
    const analyzeRes = await fetch(`${baseUrl}/api/cases/${caseId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    // Verify AnalysisResult attributes
    assert.strictEqual(result.case_id, caseId);
    assert.strictEqual(result.wallet.toLowerCase(), 'a');
    assert.ok(result.nearest_vasp);
    assert.ok(result.risk);
    assert.ok(typeof result.risk.score === 'number');
    assert.ok(Array.isArray(result.evidence));
    assert.ok(result.graph);
    assert.ok(Array.isArray(result.graph.nodes));
    assert.ok(Array.isArray(result.graph.edges));
    const reasoningTrace = result.nearest_vasp?.metadata?.reasoning_trace || result.metadata?.reasoning_trace;
    assert.ok(reasoningTrace);
    assert.ok(reasoningTrace.length > 0);

    // Step 6: Retrieve persisted case (GET /api/cases/:id)
    const fetchedCaseRes = await fetch(`${baseUrl}/api/cases/${caseId}`);
    assert.strictEqual(fetchedCaseRes.status, 200);
    const fetchedCase = await fetchedCaseRes.json();
    assert.strictEqual(fetchedCase.success, true);
    assert.strictEqual(fetchedCase.data.status, 'ANALYSIS_COMPLETE');
    assert.ok(fetchedCase.data.analysis);

    // Step 7: Retrieve stored canonical analysis (GET /api/cases/:id/analysis)
    const getAnalysisRes = await fetch(`${baseUrl}/api/cases/${caseId}/analysis`);
    assert.strictEqual(getAnalysisRes.status, 200);
    const storedAnalysis = await getAnalysisRes.json();
    assert.strictEqual(storedAnalysis.success, true);
    assert.strictEqual(storedAnalysis.data.case_id, caseId);

    // Step 8: Retrieve evidence schedule (GET /api/cases/:id/evidence)
    const getEvidenceRes = await fetch(`${baseUrl}/api/cases/${caseId}/evidence`);
    assert.strictEqual(getEvidenceRes.status, 200);
    const evidenceData = await getEvidenceRes.json();
    assert.strictEqual(evidenceData.success, true);
    assert.ok(evidenceData.data.length >= 1);

    // Step 9: Draft Section 91 CrPC Disclosure Request (POST /api/cases/:id/disclosure-request)
    const disclosureRes = await fetch(`${baseUrl}/api/cases/${caseId}/disclosure-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_vasp: result.nearest_vasp.name || 'Example Exchange',
        wallet_address: result.wallet,
        jurisdiction: 'INDIA_LEA',
        purpose: 'Section 91 CrPC notice for suspect identity and KYC disclosure'
      })
    });

    assert.strictEqual(disclosureRes.status, 201);
    const disclosureData = await disclosureRes.json();
    assert.strictEqual(disclosureData.success, true);
    assert.ok(disclosureData.data.request_id);
    assert.strictEqual(disclosureData.data.case_id, caseId);
    assert.strictEqual(disclosureData.data.target_vasp, result.nearest_vasp.name || 'Example Exchange');
  });
});
