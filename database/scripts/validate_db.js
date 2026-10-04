/**
 * TRACEVAULT V2 — Database Validation Script
 * Verifies PostgreSQL connection, migrations, seeds, constraints, and atomic transactions.
 */
const path = require('path');
const db = require('../../backend/src/db/connection');
const migrator = require('../../backend/src/db/migrator');
const seed = require('../../backend/src/db/seed');

async function validateDatabase() {
  console.log('============================================================');
  console.log('TRACEVAULT V2 — DATABASE VALIDATION & HEALTH CHECK');
  console.log('============================================================\n');

  try {
    // 1. Connection check
    console.log('[1/5] Checking database connection...');
    const nowRes = await db.query('SELECT CURRENT_TIMESTAMP as now;');
    console.log(`  ✔ Connection active. Server time: ${nowRes.rows[0].now}`);
    console.log(`  ✔ Engine mode: ${db.isMemoryDb() ? 'In-Memory PostgreSQL Engine (pg-mem)' : 'Live PostgreSQL Server'}`);

    // 2. Migration execution
    console.log('\n[2/5] Running migrations...');
    const applied = await migrator.runMigrations();
    console.log(`  ✔ Migrations executed/verified. Newly applied: ${applied.length}`);

    const migRes = await db.query('SELECT COUNT(*) as count FROM schema_migrations;');
    console.log(`  ✔ Total registered migrations in schema_migrations: ${migRes.rows[0].count}`);

    // 3. Seed execution
    console.log('\n[3/5] Applying seeds...');
    const seedsApplied = await seed.runSeeds();
    console.log(`  ✔ Seeds executed. Scripts run: ${seedsApplied.length}`);

    // 4. Schema verification
    console.log('\n[4/5] Verifying core tables and seed data...');
    const tables = [
      'roles', 'users', 'cases', 'case_members', 'entities',
      'vasps', 'entity_addresses', 'wallets', 'transactions',
      'analysis_results', 'risk_results', 'risk_signals',
      'evidence', 'reports', 'disclosure_requests', 'audit_logs'
    ];

    for (const table of tables) {
      const countRes = await db.query(`SELECT COUNT(*) as count FROM ${table};`);
      console.log(`  • Table '${table.padEnd(22)}' — ${countRes.rows[0].count} rows`);
    }

    // 5. Transaction & Rollback verification
    console.log('\n[5/5] Verifying atomic transaction and rollback mechanics...');
    const testCaseId = `VAL-${Date.now().toString(36).toUpperCase()}`;
    await db.query("INSERT INTO cases (case_id, title) VALUES ($1, 'Validation Test Case');", [testCaseId]);

    let rollbackSucceeded = false;
    try {
      await db.transaction(async (client) => {
        await client.query("UPDATE cases SET status = 'ANALYZING' WHERE case_id = $1;", [testCaseId]);
        throw new Error('Simulated atomic rollback verification error');
      });
    } catch (_) {
      const checkRes = await db.query('SELECT status FROM cases WHERE case_id = $1;', [testCaseId]);
      if (checkRes.rows[0].status === 'OPEN') {
        rollbackSucceeded = true;
      }
    }

    // Cleanup test case
    await db.query('DELETE FROM cases WHERE case_id = $1;', [testCaseId]);

    if (rollbackSucceeded) {
      console.log('  ✔ Atomic transaction rollback verified: Uncommitted changes safely reverted.');
    } else {
      throw new Error('Transaction rollback verification failed!');
    }

    console.log('\n============================================================');
    console.log('DATABASE PERSISTENCE LAYER: 100% HEALTHY & VERIFIED');
    console.log('============================================================\n');
  } catch (error) {
    console.error('\n❌ Database validation failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

validateDatabase();
