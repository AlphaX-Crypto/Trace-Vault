const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const app = require('../src/app');
const caseService = require('../src/services/caseService');
const transactionRepository = require('../src/repositories/transactionRepository');
const intelligenceService = require('../src/services/intelligenceService');
const { getAuthHeaders } = require('./test_helper');

describe('Sprint 13 — Graph Intelligence & NetworkX Integration', () => {
  let server;
  let baseUrl;
  let investigatorAuth;
  let supervisorAuth;
  let unauthorizedAuth;
  let testCaseId;
  let emptyCaseId;
  const originalAnalyzeCaseGraph = intelligenceService.analyzeCaseGraph.bind(intelligenceService);
  let capturedIntelligenceCalls = [];

  before(async () => {
    investigatorAuth = getAuthHeaders('INVESTIGATOR');
    supervisorAuth = getAuthHeaders('SUPERVISOR');

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Create a primary test case via API to ensure initialization and assignment
    const caseRes = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        title: 'Sprint 13 NetworkX Graph Intelligence Case',
        description: 'Multi-rail cross-chain and domestic UPI traversal case',
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
        title: 'Sprint 13 Empty Case',
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

    // Seed transactions for testCaseId: 1 Crypto and 1 UPI to verify multi-rail
    await transactionRepository.createTransaction({
      transaction_hash: '0xhash_crypto_s13_001',
      blockchain: 'ethereum',
      timestamp: new Date().toISOString(),
      from_address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
      to_address: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
      asset: 'ETH',
      amount: '12.50000000',
      transaction_type: 'TRANSFER',
      block_number: 20914821,
      source: 'crypto_mock',
      metadata: { case_id: testCaseId, rail: 'ETHEREUM' }
    });

    await transactionRepository.createTransaction({
      transaction_hash: 'UTR20261004001',
      blockchain: 'upi',
      timestamp: new Date().toISOString(),
      from_address: 'suspect@okaxis',
      to_address: 'merchant@icici',
      asset: 'INR',
      amount: '50000.00',
      transaction_type: 'P2M',
      source: 'upi_mock',
      metadata: { case_id: testCaseId, rail: 'UPI' }
    });

    // Mock intelligenceService.analyzeCaseGraph to intercept calls and return canonical DTO
    intelligenceService.analyzeCaseGraph = async (params) => {
      capturedIntelligenceCalls.push(params);
      return {
        case_id: params.caseId,
        subject: params.subject,
        max_hops: params.maxHops,
        direction: params.direction,
        node_count: params.transactions.length > 0 ? 3 : 0,
        edge_count: params.transactions.length,
        nodes: params.transactions.length > 0 ? [
          { node_id: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982', entity_type: 'WALLET', rail: 'CRYPTO' },
          { node_id: '0x84C2EF17BD0038Fe942dF4426511aF890987e109', entity_type: 'INTERMEDIARY', rail: 'CRYPTO' },
          { node_id: 'merchant@icici', entity_type: 'VPA', rail: 'UPI' }
        ] : [],
        edges: params.transactions.map((tx) => ({
          source: tx.from_address,
          target: tx.to_address,
          amount: parseFloat(tx.amount),
          rail: tx.blockchain.toUpperCase()
        })),
        paths: [],
        metadata: {
          engine: 'NetworkX MultiDiGraph',
          traversal: 'deterministic_bfs',
          max_depth_enforced: params.maxHops
        }
      };
    };
    // Create an unassigned investigator for 403 forbidden test
    const userRepository = require('../src/repositories/userRepository');
    const authService = require('../src/services/authService');
    const roleRes = await userRepository.getRoleByName('INVESTIGATOR');
    const invBUser = await userRepository.createUser({
      username: 'investigator_unassigned',
      email: 'investigator_unassigned@tracevault.local',
      password_hash: '$2b$10$placeholderHashForInvUnassigned',
      role_id: roleRes.id,
      is_active: true
    }).catch(async () => {
      return userRepository.getUserByUsernameOrEmail('investigator_unassigned');
    });
    unauthorizedAuth = {
      Authorization: `Bearer ${authService.generateToken({ ...invBUser, role_name: 'INVESTIGATOR' })}`
    };
  });

  after(() => {
    intelligenceService.analyzeCaseGraph = originalAnalyzeCaseGraph;
    server.close();
  });

  it('1. Rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/graph/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_hops: 3 })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'UNAUTHENTICATED');
  });

  it('2. Rejects unauthorized investigator with 403 FORBIDDEN_CASE_ACCESS', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/graph/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...unauthorizedAuth },
      body: JSON.stringify({ max_hops: 3 })
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });

  it('3. Rejects request for non-existent case with 404', async () => {
    const res = await fetch(`${baseUrl}/api/cases/CASE-9999-999/graph/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...supervisorAuth },
      body: JSON.stringify({ max_hops: 3 })
    });

    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'CASE_NOT_FOUND');
  });

  it('4. Rejects invalid hop depth (< 1 or > 10) with 400 INVALID_HOP_DEPTH', async () => {
    // Test hops = 0
    const resZero = await fetch(`${baseUrl}/api/cases/${testCaseId}/graph/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({ max_hops: 0 })
    });
    assert.strictEqual(resZero.status, 400);
    const bodyZero = await resZero.json();
    assert.strictEqual(bodyZero.error.code, 'INVALID_HOP_DEPTH');

    // Test hops = 15
    const resHigh = await fetch(`${baseUrl}/api/cases/${testCaseId}/graph/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({ max_hops: 15 })
    });
    assert.strictEqual(resHigh.status, 400);
    const bodyHigh = await resHigh.json();
    assert.strictEqual(bodyHigh.error.code, 'INVALID_HOP_DEPTH');
  });

  it('4. Successfully analyzes case graph with multi-rail transactions', async () => {
    capturedIntelligenceCalls = [];

    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/graph/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        max_hops: 4,
        direction: 'both'
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);
    assert.strictEqual(body.data.max_hops, 4);
    assert.strictEqual(body.data.direction, 'both');
    assert.ok(body.data.nodes.length > 0);
    assert.ok(body.data.edges.length >= 2);

    // Verify calls passed to intelligence engine
    assert.strictEqual(capturedIntelligenceCalls.length, 1);
    const call = capturedIntelligenceCalls[0];
    assert.strictEqual(call.caseId, testCaseId);
    assert.strictEqual(call.maxHops, 4);
    assert.strictEqual(call.direction, 'both');

    // Multi-rail check: Verify both crypto and UPI transactions were dispatched
    const rails = call.transactions.map((tx) => tx.blockchain.toLowerCase());
    assert.ok(rails.includes('ethereum'), 'Expected ethereum transaction in payload');
    assert.ok(rails.includes('upi'), 'Expected UPI transaction in payload');
  });

  it('5. Handles directional filtering parameter correctly', async () => {
    capturedIntelligenceCalls = [];

    const resOutgoing = await fetch(`${baseUrl}/api/cases/${testCaseId}/graph/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({
        max_hops: 2,
        direction: 'outgoing'
      })
    });

    assert.strictEqual(resOutgoing.status, 200);
    const body = await resOutgoing.json();
    assert.strictEqual(body.data.direction, 'outgoing');
    assert.strictEqual(capturedIntelligenceCalls[0].direction, 'outgoing');
    assert.strictEqual(capturedIntelligenceCalls[0].maxHops, 2);
  });

  it('6. Handles empty case without transactions gracefully', async () => {
    capturedIntelligenceCalls = [];

    const res = await fetch(`${baseUrl}/api/cases/${emptyCaseId}/graph/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...investigatorAuth },
      body: JSON.stringify({ max_hops: 3 })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.node_count, 0);
    assert.strictEqual(body.data.edge_count, 0);
    assert.strictEqual(capturedIntelligenceCalls[0].transactions.length, 0);
  });

  it('7. GET /api/cases/:id/graph serves as convenience read endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/graph?max_hops=3&direction=incoming`, {
      method: 'GET',
      headers: { ...investigatorAuth }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, testCaseId);
    assert.strictEqual(body.data.max_hops, 3);
  });
});
