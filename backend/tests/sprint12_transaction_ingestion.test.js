const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const app = require('../src/app');
const { getAuthHeaders } = require('./test_helper');
const caseRepository = require('../src/repositories/caseRepository');
const transactionIngestionService = require('../src/services/transactionIngestionService');
const TransactionNormalizer = require('../src/services/transactionNormalizer');
const { CryptoMockAdapter } = require('../src/adapters/cryptoMockAdapter');
const { UPIMockAdapter } = require('../src/adapters/upiMockAdapter');
const { CANONICAL_RAILS } = require('../src/models/commonTransaction');

describe('Sprint 12 — Transaction Ingestion & Normalization Engine', () => {
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

    // Create case via API to ensure DB initialization and member assignment
    const createRes = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        title: 'Cross-Rail Peeling & Domestic UPI Laundering Network',
        description: 'Sprint 12 verification case for ingestion and multi-rail normalization.',
        crime_type: 'MONEY_LAUNDERING',
        priority: 'HIGH',
        subject_type: 'WALLET',
        blockchain: 'ethereum',
        subject_identifier: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982'
      })
    });
    assert.strictEqual(createRes.status, 201);
    const createData = await createRes.json();
    testCaseId = createData.data.case_id;
  });

  after(() => {
    server.close();
  });

  describe('Crypto Normalization & Validation', () => {
    const cryptoAdapter = new CryptoMockAdapter();

    it('validates and normalizes valid crypto transaction payload', () => {
      const raw = {
        tx_hash: '0x8ef2a9103c8b7b659fe10938bfe41209b0a124982',
        blockchain: 'ethereum',
        from_address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
        to_address: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
        amount: '42.50000000',
        asset: 'ETH',
        block_number: 20914820,
        timestamp: '2026-09-29T08:14:22.000Z',
        status: 'SUCCESS'
      };

      const val = cryptoAdapter.validateSourcePayload(raw);
      assert.equal(val.valid, true);

      const norm = TransactionNormalizer.normalizeCrypto(raw, testCaseId, 'crypto_mock');
      assert.equal(norm.id, raw.tx_hash);
      assert.equal(norm.rail, CANONICAL_RAILS.ETHEREUM);
      assert.equal(norm.asset, 'ETH');
      assert.equal(norm.amount, '42.50000000');
      assert.equal(norm.sender.address, raw.from_address);
      assert.equal(norm.receiver.address, raw.to_address);
      assert.equal(norm.block_number, 20914820);
      assert.equal(norm.case_id, testCaseId);
    });

    it('rejects malformed crypto record (missing required fields)', () => {
      const malformed = {
        amount: '10.0',
        from_address: '0x1234'
      };
      const val = cryptoAdapter.validateSourcePayload(malformed);
      assert.equal(val.valid, false);
      assert.ok(val.errors.some(e => e.includes('Transaction hash is required')));
      assert.ok(val.errors.some(e => e.includes('to_address is required')));
    });

    it('rejects prohibited credentials in crypto record (private key / seed phrase)', () => {
      const dangerous = {
        tx_hash: '0x8ef2a9103c8b7b659fe10938bfe41209b0a124982',
        from_address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
        to_address: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
        amount: '1.0',
        private_key: '0x0000000000000000000000000000000000000000000000000000000000000001'
      };
      const val = cryptoAdapter.validateSourcePayload(dangerous);
      assert.equal(val.valid, false);
      assert.ok(val.errors.some(e => e.includes('Prohibited credential field detected')));
    });

    it('normalizes heterogeneous rail spellings to canonical tokens', () => {
      const tronRaw = {
        tx_hash: 'TRC20_721629e5039E6103Ac3e16441b45502b4917C590',
        blockchain: 'TRON TRC-20',
        from_address: '0x18D502bfa4917C59039E6103Ac3e16441b45502b',
        to_address: '0x94A91B012F49028F3092019482b4902194820194',
        amount: '85000',
        asset: 'USDT'
      };
      const norm = TransactionNormalizer.normalizeCrypto(tronRaw, testCaseId);
      assert.equal(norm.rail, CANONICAL_RAILS.TRON);
      assert.equal(norm.asset, 'USDT');
    });
  });

  describe('UPI Normalization & Validation', () => {
    const upiAdapter = new UPIMockAdapter();

    it('validates and normalizes valid UPI transaction payload with neutral labels', () => {
      const raw = {
        transaction_ref: 'TX-UPI-001',
        utr: '9182049281920',
        remitter_vpa: 'otc_desk@okhdfcbank',
        beneficiary_vpa: 'vpa98@okhdfcbank',
        amount: '49500.00',
        currency: 'INR',
        timestamp: '2026-09-29T09:12:30.000Z',
        status: 'SUCCESS',
        upi_type: 'P2P'
      };

      const val = upiAdapter.validateSourcePayload(raw);
      assert.equal(val.valid, true);

      const norm = TransactionNormalizer.normalizeUPI(raw, testCaseId, 'upi_mock');
      assert.equal(norm.id, raw.transaction_ref);
      assert.equal(norm.rail, CANONICAL_RAILS.UPI_DOMESTIC);
      assert.equal(norm.asset, 'INR');
      assert.equal(norm.amount, '49500.00');
      assert.equal(norm.sender.address, 'otc_desk@okhdfcbank');
      assert.equal(norm.sender.bank_name, 'okhdfcbank');
      assert.equal(norm.receiver.address, 'vpa98@okhdfcbank');
      assert.equal(norm.receiver.bank_name, 'okhdfcbank');
      // Verifies neutral label: does NOT infer real-world personal identity or ownership
      assert.equal(norm.sender.display_label, 'Remitter VPA');
      assert.equal(norm.receiver.display_label, 'Beneficiary VPA');
    });

    it('rejects invalid VPA syntax', () => {
      const invalidVpa = {
        transaction_ref: 'TX-UPI-999',
        remitter_vpa: 'invalid-vpa-without-bank-handle',
        beneficiary_vpa: 'valid@okaxis',
        amount: '1000'
      };
      const val = upiAdapter.validateSourcePayload(invalidVpa);
      assert.equal(val.valid, false);
      assert.ok(val.errors.some(e => e.includes('Invalid remitter VPA format')));
    });

    it('rejects prohibited credentials in UPI payload (PIN / OTP)', () => {
      const dangerousUpi = {
        transaction_ref: 'TX-UPI-002',
        remitter_vpa: 'sender@okhdfcbank',
        beneficiary_vpa: 'receiver@icici',
        amount: '2000',
        upi_pin: '123456'
      };
      const val = upiAdapter.validateSourcePayload(dangerousUpi);
      assert.equal(val.valid, false);
      assert.ok(val.errors.some(e => e.includes("Prohibited credential field detected: 'upi_pin'")));
    });

    it('rejects negative transaction amount', () => {
      const negativeRaw = {
        transaction_ref: 'TX-UPI-003',
        remitter_vpa: 'sender@okhdfcbank',
        beneficiary_vpa: 'receiver@icici',
        amount: '-500'
      };
      const val = upiAdapter.validateSourcePayload(negativeRaw);
      assert.equal(val.valid, false);
      assert.ok(val.errors.some(e => e.includes('Amount must be a non-negative numeric value')));
    });
  });

  describe('Ingestion Service & Idempotency Pipeline', () => {
    it('ingests a batch of valid transactions and returns structured summary', async () => {
      const batch = [
        {
          tx_hash: '0xTEST_S12_A_001',
          blockchain: 'ethereum',
          from_address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
          to_address: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
          amount: '15.5',
          asset: 'ETH'
        },
        {
          tx_hash: '0xTEST_S12_A_002',
          blockchain: 'ethereum',
          from_address: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
          to_address: '0x3AF17828C403dE4B07B4f114B5C1089b0A124982',
          amount: '8.25',
          asset: 'ETH'
        }
      ];

      const res = await transactionIngestionService.ingestTransactions({
        caseId: testCaseId,
        rail: 'ethereum',
        rawTransactions: batch
      });

      assert.equal(res.total_submitted, 2);
      assert.equal(res.accepted, 2);
      assert.equal(res.rejected, 0);
      assert.equal(res.duplicates, 0);
      assert.equal(res.persisted_ids.length, 2);
    });

    it('enforces idempotency on duplicate ingestion without error or record explosion', async () => {
      const duplicatePayload = [
        {
          tx_hash: '0xTEST_IDEMPOTENT_001',
          blockchain: 'ethereum',
          from_address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
          to_address: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
          amount: '5.0',
          asset: 'ETH'
        }
      ];

      // First ingestion: accepted
      const firstRun = await transactionIngestionService.ingestTransactions({
        caseId: testCaseId,
        rail: 'ethereum',
        rawTransactions: duplicatePayload
      });
      assert.equal(firstRun.accepted, 1);

      // Second ingestion of identical record: idempotent update, no failure
      const secondRun = await transactionIngestionService.ingestTransactions({
        caseId: testCaseId,
        rail: 'ethereum',
        rawTransactions: duplicatePayload
      });
      assert.equal(secondRun.accepted, 1);

      // Intra-batch duplicate check
      const batchWithDuplicates = [duplicatePayload[0], duplicatePayload[0]];
      const intraBatchRes = await transactionIngestionService.ingestTransactions({
        caseId: testCaseId,
        rail: 'ethereum',
        rawTransactions: batchWithDuplicates
      });
      assert.equal(intraBatchRes.total_submitted, 2);
      assert.equal(intraBatchRes.accepted, 1);
      assert.equal(intraBatchRes.duplicates, 1);
    });

    it('isolates and reports malformed records without rejecting valid items in same batch', async () => {
      const mixedBatch = [
        {
          tx_hash: '0xTEST_MIXED_VALID_001',
          blockchain: 'ethereum',
          from_address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
          to_address: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
          amount: '12.0'
        },
        {
          // Missing tx_hash
          blockchain: 'ethereum',
          from_address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
          amount: '10.0'
        }
      ];

      const res = await transactionIngestionService.ingestTransactions({
        caseId: testCaseId,
        rail: 'ethereum',
        rawTransactions: mixedBatch
      });

      assert.equal(res.total_submitted, 2);
      assert.equal(res.accepted, 1);
      assert.equal(res.rejected, 1);
      assert.equal(res.errors.length, 1);
      assert.equal(res.errors[0].index, 1);
    });
  });

  describe('REST API Ingestion Endpoint (POST /api/cases/:id/transactions/ingest)', () => {
    it('authenticates and ingests transactions via HTTP API', async () => {
      const payload = {
        rail: 'ethereum',
        transactions: [
          {
            tx_hash: '0xHTTP_INGEST_001',
            blockchain: 'ethereum',
            from_address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
            to_address: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
            amount: '20.0',
            asset: 'ETH'
          }
        ]
      };

      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/transactions/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload)
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.accepted, 1);
      assert.equal(body.data.total_submitted, 1);
      assert.ok(body.data.persisted_ids.includes('0xHTTP_INGEST_001'));
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${baseUrl}/api/cases/${testCaseId}/transactions/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rail: 'ethereum', transactions: [] })
      });
      assert.equal(res.status, 401);
    });

    it('enforces case isolation on unauthorized case with 403', async () => {
      const res = await fetch(`${baseUrl}/api/cases/CASE-UNASSIGNED-999/transactions/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ rail: 'ethereum', transactions: [] })
      });
      assert.equal(res.status, 403);
    });
  });

  describe('Downstream Graph & Analytics Compatibility', () => {
    it('CommonTransaction cleanly converts to NetworkX-compatible graph edge dictionary', () => {
      const raw = {
        tx_hash: '0xGRAPH_EDGE_TEST',
        blockchain: 'ethereum',
        from_address: '0xSOURCE_NODE_A',
        to_address: '0xTARGET_NODE_B',
        amount: '14.25',
        asset: 'ETH',
        status: 'SUCCESS'
      };

      const normalized = TransactionNormalizer.normalizeCrypto(raw, testCaseId);
      const edge = normalized.toGraphEdge();

      assert.equal(edge.source, '0xSOURCE_NODE_A');
      assert.equal(edge.target, '0xTARGET_NODE_B');
      assert.equal(edge.rail, 'ethereum');
      assert.equal(edge.amount, 14.25);
      assert.equal(edge.asset, 'ETH');
      assert.equal(edge.transaction_hash, '0xGRAPH_EDGE_TEST');
    });
  });
});
