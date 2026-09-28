const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const db = require('../src/db/connection');
const caseService = require('../src/services/caseService');
const { getAuthHeaders, getAuthToken, SEED_USERS } = require('./test_helper');

describe('Authentication & Session Management', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Ensure migrations and seeds are run
    await caseService.ensureInitialized();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  after(() => {
    server.close();
  });

  it('POST /api/auth/login authenticates with valid username and password (200)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'investigator',
        password: SEED_USERS.INVESTIGATOR.password
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.token);
    assert.strictEqual(body.data.user.username, 'investigator');
    assert.strictEqual(body.data.user.role, 'INVESTIGATOR');
    assert.strictEqual(body.data.user.password_hash, undefined);
  });

  it('POST /api/auth/login authenticates with valid email and password (200)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'supervisor@tracevault.local',
        password: SEED_USERS.SUPERVISOR.password
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.role, 'SUPERVISOR');
  });

  it('POST /api/auth/login rejects invalid password with generic error (401)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'investigator',
        password: 'WrongPassword123!'
      })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INVALID_CREDENTIALS');
    assert.strictEqual(body.error.message, 'Invalid credentials.');
  });

  it('POST /api/auth/login rejects non-existent user with generic error (401)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'unknown_ghost_officer',
        password: 'SomePassword123!'
      })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INVALID_CREDENTIALS');
    assert.strictEqual(body.error.message, 'Invalid credentials.');
  });

  it('GET /api/auth/me returns authenticated user profile (200)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: getAuthHeaders('INVESTIGATOR')
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.username, 'investigator');
    assert.strictEqual(body.data.role, 'INVESTIGATOR');
  });

  it('GET /api/auth/me rejects request missing Authorization header (401)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'UNAUTHENTICATED');
  });

  it('GET /api/auth/me rejects expired JWT token (401)', async () => {
    // Generate token with immediate expiration
    const expiredToken = jwt.sign(
      { userId: 1, username: 'investigator', role: 'INVESTIGATOR' },
      config.jwtSecret,
      { expiresIn: '-1s', issuer: 'tracevault-engine', audience: 'tracevault-client' }
    );

    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'TOKEN_EXPIRED');
  });

  it('GET /api/auth/me rejects invalid/tampered token (401)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.token' }
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INVALID_TOKEN');
  });

  it('POST /api/auth/logout signs out successfully (200)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders('INVESTIGATOR')
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.logged_out, true);
  });

  it('GET /api/cases without Authorization header is rejected (401)', async () => {
    const res = await fetch(`${baseUrl}/api/cases`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'UNAUTHENTICATED');
  });

  it('GET /api/auth/users accessible to ADMIN (200)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/users`, {
      headers: getAuthHeaders('ADMIN')
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 3);
  });

  it('GET /api/auth/users forbidden to INVESTIGATOR (403)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/users`, {
      headers: getAuthHeaders('INVESTIGATOR')
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });

  it('Verifies security headers are injected by Helmet', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(res.headers.get('x-frame-options'), 'SAMEORIGIN');
  });

  it('Verifies audit log trail records authentication events', async () => {
    const logs = await db.query(
      "SELECT * FROM audit_logs WHERE action IN ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'PERMISSION_DENIED') ORDER BY created_at DESC;"
    );
    assert.ok(logs.rows.length >= 2, 'Audit logs should contain recorded auth events');
  });
});
