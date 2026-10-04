const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const caseService = require('../src/services/caseService');
const userRepository = require('../src/repositories/userRepository');
const authService = require('../src/services/authService');
const db = require('../src/db/connection');

describe('Case-Level Access Control & Permissions', () => {
  let server;
  let baseUrl;

  let tokenInvA;
  let tokenInvB;
  let tokenSupervisor;
  let tokenAdmin;

  let caseA;
  let caseB;

  before(async () => {
    await caseService.ensureInitialized();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // 1. Get or create Investigator A (User 1)
    const invAUser = await userRepository.getUserByUsernameOrEmail('investigator');
    tokenInvA = authService.generateToken(invAUser);

    // 2. Create Investigator B
    const roleRes = await userRepository.getRoleByName('INVESTIGATOR');
    const invBUser = await userRepository.createUser({
      username: 'investigator_b',
      email: 'investigator_b@tracevault.local',
      password_hash: '$2b$10$placeholderHashForInvBUser',
      role_id: roleRes.id,
      is_active: true
    }).catch(async () => {
      return userRepository.getUserByUsernameOrEmail('investigator_b');
    });
    tokenInvB = authService.generateToken({ ...invBUser, role_name: 'INVESTIGATOR' });

    // 3. Supervisor and Admin tokens
    const supUser = await userRepository.getUserByUsernameOrEmail('supervisor');
    tokenSupervisor = authService.generateToken(supUser);

    const admUser = await userRepository.getUserByUsernameOrEmail('admin');
    tokenAdmin = authService.generateToken(admUser);

    // 4. Create Case A assigned to Investigator A
    caseA = await caseService.createCase({
      title: 'Case Alpha - Assigned to Investigator A',
      priority: 'HIGH',
      subject_identifier: '0x1111111111111111111111111111111111111111'
    }, invAUser);

    // 5. Create Case B assigned to Investigator B
    caseB = await caseService.createCase({
      title: 'Case Beta - Assigned to Investigator B',
      priority: 'MEDIUM',
      subject_identifier: '0x2222222222222222222222222222222222222222'
    }, invBUser);
  });

  after(() => {
    server.close();
  });

  it('Investigator A can access Case A (200)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${caseA.case_id}`, {
      headers: { Authorization: `Bearer ${tokenInvA}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, caseA.case_id);
  });

  it('Investigator A CANNOT access Case B (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${caseB.case_id}`, {
      headers: { Authorization: `Bearer ${tokenInvA}` }
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
    assert.ok(body.error.message.includes('permission to access this investigation case'));
  });

  it('Investigator B can access Case B (200)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${caseB.case_id}`, {
      headers: { Authorization: `Bearer ${tokenInvB}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.case_id, caseB.case_id);
  });

  it('Investigator B CANNOT access Case A (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${caseA.case_id}`, {
      headers: { Authorization: `Bearer ${tokenInvB}` }
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });

  it('Supervisor can access both Case A and Case B (200)', async () => {
    const resA = await fetch(`${baseUrl}/api/cases/${caseA.case_id}`, {
      headers: { Authorization: `Bearer ${tokenSupervisor}` }
    });
    assert.strictEqual(resA.status, 200);

    const resB = await fetch(`${baseUrl}/api/cases/${caseB.case_id}`, {
      headers: { Authorization: `Bearer ${tokenSupervisor}` }
    });
    assert.strictEqual(resB.status, 200);
  });

  it('Admin can access both Case A and Case B (200)', async () => {
    const resA = await fetch(`${baseUrl}/api/cases/${caseA.case_id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    assert.strictEqual(resA.status, 200);

    const resB = await fetch(`${baseUrl}/api/cases/${caseB.case_id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    assert.strictEqual(resB.status, 200);
  });

  it('Investigator A cannot draft disclosure request on Case B (403)', async () => {
    const res = await fetch(`${baseUrl}/api/cases/${caseB.case_id}/disclosure-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenInvA}`
      },
      body: JSON.stringify({
        target_vasp: 'Unauthorized Exchange',
        wallet_address: '0x2222222222222222222222222222222222222222'
      })
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });

  it('Verifies PERMISSION_DENIED events are logged in audit_logs for unauthorized case access', async () => {
    const logs = await db.query(
      "SELECT * FROM audit_logs WHERE action = 'PERMISSION_DENIED' AND resource_type = 'CASE_ACCESS' ORDER BY created_at DESC LIMIT 5;"
    );
    assert.ok(logs.rows.length >= 1, 'At least one case PERMISSION_DENIED audit entry should exist');
  });
});
