const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const db = require('../src/db/connection');
const migrator = require('../src/db/migrator');
const seed = require('../src/db/seed');
const caseRepository = require('../src/repositories/caseRepository');
const analysisRepository = require('../src/repositories/analysisRepository');
const evidenceRepository = require('../src/repositories/evidenceRepository');
const disclosureRepository = require('../src/repositories/disclosureRepository');
const auditRepository = require('../src/repositories/auditRepository');

describe('Database Persistence Layer (PostgreSQL)', () => {
  before(async () => {
    // Ensure migrations and seeds are executed
    await migrator.runMigrations();
    await seed.runSeeds();
  });

  after(async () => {
    await db.close();
  });

  it('Schema Migrator: records all 16 migrations in schema_migrations', async () => {
    const res = await db.query('SELECT name FROM schema_migrations ORDER BY name ASC;');
    assert.strictEqual(res.rows.length, 16);
    assert.strictEqual(res.rows[0].name, '001_create_roles.sql');
    assert.strictEqual(res.rows[15].name, '016_create_audit_logs.sql');
  });

  it('Database Seeds: populates demo roles, users, controlled VASPs, entities, and demo case', async () => {
    const rolesRes = await db.query('SELECT name FROM roles ORDER BY name;');
    assert.ok(rolesRes.rows.length >= 3);
    const roleNames = rolesRes.rows.map(r => r.name);
    assert.ok(roleNames.includes('INVESTIGATOR'));
    assert.ok(roleNames.includes('ADMIN'));

    const vaspRes = await db.query("SELECT * FROM vasps WHERE name = 'Example Exchange';");
    assert.strictEqual(vaspRes.rows.length, 1);
    assert.strictEqual(vaspRes.rows[0].reliability, 'VERIFIED');

    const entityRes = await db.query("SELECT * FROM entities WHERE identifier = 'exchange_deposit';");
    assert.strictEqual(entityRes.rows.length, 1);
    assert.strictEqual(entityRes.rows[0].entity_type, 'DEPOSIT_WALLET');

    const demoCase = await caseRepository.getCaseById('CASE-2026-001');
    assert.ok(demoCase);
    assert.strictEqual(demoCase.title, 'Operation CryptoSweep - Ransomware Cluster');
    assert.strictEqual(demoCase.crime_type, 'RANSOMWARE');
    assert.strictEqual(demoCase.priority, 'HIGH');
  });

  it('Case Repository: performs CRUD lifecycle operations', async () => {
    const caseId = `CASE-TEST-${Date.now().toString(36).toUpperCase()}`;
    const newCase = await caseRepository.createCase({
      case_id: caseId,
      title: 'Persistent Database Unit Test Case',
      description: 'Verifying PostgreSQL persistence',
      crime_type: 'TERROR_FINANCING',
      priority: 'CRITICAL',
      subject_type: 'WALLET',
      blockchain: 'ethereum',
      subject_identifier: '0x1111111111111111111111111111111111111111',
      status: 'OPEN'
    });

    assert.strictEqual(newCase.case_id, caseId);
    assert.strictEqual(newCase.status, 'OPEN');
    assert.strictEqual(newCase.priority, 'CRITICAL');

    // Fetch by ID
    const fetched = await caseRepository.getCaseById(caseId);
    assert.strictEqual(fetched.case_id, caseId);
    assert.strictEqual(fetched.crime_type, 'TERROR_FINANCING');

    // Update status
    const updated = await caseRepository.updateCaseStatus(caseId, 'ANALYZING');
    assert.strictEqual(updated.status, 'ANALYZING');

    // Verify all cases query includes new case
    const all = await caseRepository.getAllCases();
    const found = all.find(c => c.case_id === caseId);
    assert.ok(found);
    assert.strictEqual(found.status, 'ANALYZING');
  });

  it('Atomic Analysis Persistence: writes across 7 tables in a single transaction', async () => {
    const caseId = `CASE-PERSIST-${Date.now().toString(36).toUpperCase()}`;
    await caseRepository.createCase({
      case_id: caseId,
      title: 'Atomic Multi-Table Persistence Test',
      priority: 'HIGH'
    });

    const mockAnalysisResult = {
      analysis_id: `ANALYSIS-ATOMIC-${Date.now().toString(36).toUpperCase()}`,
      case_id: caseId,
      wallet: '0x9999999999999999999999999999999999999999',
      subject: '0x9999999999999999999999999999999999999999',
      blockchain: 'ethereum',
      status: 'Analysis complete',
      nearest_vasp: { name: 'Example Exchange' },
      confidence: 85.5,
      confidence_label: 'HIGH',
      risk: {
        score: 78.0,
        level: 'HIGH',
        explanation: 'Multi-hop path leading to known exchange deposit with layering signals.',
        signals: [
          {
            signal_id: 'SIG-101',
            signal_type: 'HIGH_RISK_INTERACTION',
            score: 75.0,
            severity: 'HIGH',
            description: 'Direct interaction with high-risk mixer'
          },
          {
            signal_id: 'SIG-102',
            signal_type: 'RAPID_DISPERSION',
            score: 60.0,
            severity: 'MEDIUM',
            description: 'Layering pattern detected across 3 hops'
          }
        ]
      },
      evidence: [
        {
          evidence_id: 'EV-101',
          evidence_type: 'DIRECT_DEPOSIT',
          description: 'Identified deposit address match for Example Exchange',
          relevance: 'HIGH',
          transaction_hash: '0xabc1230000000000000000000000000000000001',
          amount: 5.5,
          asset: 'ETH'
        },
        {
          evidence_id: 'EV-102',
          evidence_type: 'GRAPH_PATH',
          description: 'Shortest path found with 2 hops to VASP deposit',
          relevance: 'HIGH'
        }
      ],
      graph: {
        nodes: [
          { id: '0x9999999999999999999999999999999999999999', entity_type: 'WALLET', risk_score: 78.0 },
          { id: '0xintermediary_node_1', entity_type: 'INTERMEDIARY', risk_score: 45.0 },
          { id: '0xexchange_deposit_node', entity_type: 'DEPOSIT_WALLET', risk_score: 15.0 }
        ],
        edges: [
          {
            tx_hash: '0xtx_edge_1',
            from: '0x9999999999999999999999999999999999999999',
            to: '0xintermediary_node_1',
            amount: 10.0,
            asset: 'ETH'
          },
          {
            tx_hash: '0xtx_edge_2',
            from: '0xintermediary_node_1',
            to: '0xexchange_deposit_node',
            amount: 5.5,
            asset: 'ETH'
          }
        ]
      }
    };

    const saved = await analysisRepository.saveAnalysisResult(caseId, mockAnalysisResult);
    assert.strictEqual(saved.case_id, caseId);

    // 1. Verify analysis_results table
    const analysisRows = await db.query('SELECT * FROM analysis_results WHERE case_id = $1;', [caseId]);
    assert.strictEqual(analysisRows.rows.length, 1);
    assert.strictEqual(analysisRows.rows[0].nearest_vasp, 'Example Exchange');
    assert.strictEqual(Number(analysisRows.rows[0].confidence), 85.5);

    // 2. Verify risk_results table
    const riskRows = await db.query('SELECT * FROM risk_results WHERE analysis_id = $1;', [mockAnalysisResult.analysis_id]);
    assert.strictEqual(riskRows.rows.length, 1);
    assert.strictEqual(Number(riskRows.rows[0].score), 78.0);
    assert.strictEqual(riskRows.rows[0].level, 'HIGH');

    // 3. Verify risk_signals table
    const signalRows = await db.query('SELECT * FROM risk_signals WHERE risk_result_id = $1;', [riskRows.rows[0].id]);
    assert.strictEqual(signalRows.rows.length, 2);

    // 4. Verify evidence table
    const evidenceRows = await evidenceRepository.getEvidenceByCaseId(caseId);
    assert.strictEqual(evidenceRows.length, 2);
    assert.strictEqual(evidenceRows[0].evidence_id, 'EV-101');
    assert.strictEqual(Number(evidenceRows[0].amount), 5.5);

    // 5. Verify transactions table
    const txRows = await db.query("SELECT * FROM transactions WHERE transaction_hash IN ('0xtx_edge_1', '0xtx_edge_2');");
    assert.strictEqual(txRows.rows.length, 2);

    // 6. Verify entities table
    const entityRows = await db.query("SELECT * FROM entities WHERE identifier IN ('0x9999999999999999999999999999999999999999', '0xintermediary_node_1');");
    assert.strictEqual(entityRows.rows.length, 2);

    // 7. Verify case status transitioned to ANALYSIS_COMPLETE
    const updatedCase = await caseRepository.getCaseById(caseId);
    assert.strictEqual(updatedCase.status, 'ANALYSIS_COMPLETE');
    assert.strictEqual(updatedCase.subject_identifier, '0x9999999999999999999999999999999999999999');

    // 8. Verify audit_logs table
    const auditRows = await auditRepository.getAuditLogsByCaseId(caseId);
    assert.ok(auditRows.length >= 1);
    assert.strictEqual(auditRows[0].action, 'ANALYSIS_PERSISTED');
  });

  it('Transaction Rollback: aborts and rolls back completely on persistence failure', async () => {
    const caseId = `CASE-ROLLBACK-${Date.now().toString(36).toUpperCase()}`;
    await caseRepository.createCase({
      case_id: caseId,
      title: 'Rollback Verification Case'
    });

    // Execute multi-table write that fails mid-transaction
    let errorThrown = false;
    try {
      await db.transaction(async (client) => {
        await client.query("UPDATE cases SET status = 'ANALYZING' WHERE case_id = $1;", [caseId]);
        await client.query(
          "INSERT INTO analysis_results (analysis_id, case_id, subject, wallet, analysis_payload) VALUES ($1, $2, $3, $4, $5);",
          ['ANALYSIS-ROLLBACK-TEST', caseId, '0xwallet', '0xwallet', '{}']
        );
        throw new Error('Simulated database/disk failure mid-transaction');
      });
    } catch (err) {
      errorThrown = true;
      assert.strictEqual(err.message, 'Simulated database/disk failure mid-transaction');
    }

    assert.ok(errorThrown, 'db.transaction must rethrow error on failure');

    // Verify rollback left zero records in analysis_results
    const analysisCheck = await db.query('SELECT * FROM analysis_results WHERE case_id = $1;', [caseId]);
    assert.strictEqual(analysisCheck.rows.length, 0, 'No analysis_results rows should exist after rollback');

    // Verify case status remained OPEN (never committed to ANALYZING)
    const caseCheck = await caseRepository.getCaseById(caseId);
    assert.strictEqual(caseCheck.status, 'OPEN', 'Case status must remain OPEN after rollback');
  });

  it('Disclosure Requests & Audit Trail: persists and retrieves records', async () => {
    const caseId = 'CASE-2026-001';
    const reqId = `REQ-TEST-${Date.now().toString(36).toUpperCase()}`;

    const disclosure = await disclosureRepository.createDisclosureRequest({
      request_id: reqId,
      case_id: caseId,
      target_entity: 'Example Exchange',
      request_type: 'SECTION_91_CRPC',
      status: 'DRAFTED_PENDING_DISPATCH',
      request_payload: { reason: 'Ransomware extortion tracing' }
    });

    assert.strictEqual(disclosure.request_id, reqId);
    assert.strictEqual(disclosure.target_entity, 'Example Exchange');

    const fetchedList = await disclosureRepository.getDisclosureRequestsByCaseId(caseId);
    assert.ok(fetchedList.length >= 1);
    assert.ok(fetchedList.some(r => r.request_id === reqId));

    // Audit log
    await auditRepository.logAction({
      caseId,
      action: 'LEA_DISCLOSURE_DISPATCHED',
      resourceType: 'DISCLOSURE_REQUEST',
      resourceId: reqId,
      metadata: { target: 'Example Exchange' }
    });

    const audits = await auditRepository.getAuditLogsByCaseId(caseId);
    assert.ok(audits.some(a => a.action === 'LEA_DISCLOSURE_DISPATCHED'));
  });
});
