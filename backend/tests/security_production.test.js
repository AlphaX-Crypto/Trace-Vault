const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const config = require('../src/config/env');
const caseService = require('../src/services/caseService');
const authService = require('../src/services/authService');
const auditRepository = require('../src/repositories/auditRepository');
const db = require('../src/db/connection');
const { getAuthHeaders, getAuthToken, SEED_USERS } = require('./test_helper');

describe('Production Hardening & Operational Readiness (Phase 8)', () => {
  let server;
  let baseUrl;

  before(async () => {
    await caseService.ensureInitialized();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('Configuration Safety & Production Validation', () => {
    it('Rejects startup in production when JWT_SECRET is the default fallback', () => {
      assert.throws(() => {
        config.validateConfig({
          nodeEnv: 'production',
          jwtSecret: config.DEV_FALLBACK_JWT_SECRET,
          databaseUrl: 'postgres://user:pass@localhost:5432/tracevault',
          corsOrigin: 'https://tracevault.gov.in'
        });
      }, /fallback dev secret is forbidden/i);
    });

    it('Rejects startup in production when JWT_SECRET is shorter than 32 characters', () => {
      assert.throws(() => {
        config.validateConfig({
          nodeEnv: 'production',
          jwtSecret: 'short_secret',
          databaseUrl: 'postgres://user:pass@localhost:5432/tracevault',
          corsOrigin: 'https://tracevault.gov.in'
        });
      }, /at least 32 characters/i);
    });

    it('Rejects startup in production when DATABASE_URL is missing', () => {
      assert.throws(() => {
        config.validateConfig({
          nodeEnv: 'production',
          jwtSecret: 'a_very_secure_production_jwt_secret_key_32_chars_long',
          databaseUrl: '',
          corsOrigin: 'https://tracevault.gov.in'
        });
      }, /DATABASE_URL must be specified/i);
    });

    it('Rejects startup in production when CORS_ORIGIN is wildcard *', () => {
      assert.throws(() => {
        config.validateConfig({
          nodeEnv: 'production',
          jwtSecret: 'a_very_secure_production_jwt_secret_key_32_chars_long',
          databaseUrl: 'postgres://user:pass@localhost:5432/tracevault',
          corsOrigin: '*'
        });
      }, /CORS_ORIGIN cannot be a wildcard/i);
    });

    it('Validates cleanly when production variables are properly configured', () => {
      const result = config.validateConfig({
        nodeEnv: 'production',
        jwtSecret: 'a_very_secure_production_jwt_secret_key_32_chars_long',
        databaseUrl: 'postgres://user:pass@localhost:5432/tracevault',
        corsOrigin: 'https://tracevault.gov.in'
      });
      assert.strictEqual(result, true);
    });
  });

  describe('Health Probes & Credential Leakage Prevention', () => {
    it('GET /health reports liveness and uptime without leaking secrets', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.service, 'tracevault-backend');
      assert.ok(typeof data.uptime_seconds === 'number');
      assert.ok(data.timestamp);

      // Verify no secrets or config leaked
      const bodyStr = JSON.stringify(data);
      assert.strictEqual(bodyStr.includes('password'), false);
      assert.strictEqual(bodyStr.includes('DATABASE_URL'), false);
      assert.strictEqual(bodyStr.includes('postgres://'), false);
    });

    it('GET /health/database reports connectivity safely without exposing connection string', async () => {
      const res = await fetch(`${baseUrl}/health/database`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.database.status, 'connected');
      assert.ok(typeof data.database.latency_ms === 'number');

      // Verify zero leak of connection details
      const bodyStr = JSON.stringify(data);
      assert.strictEqual(bodyStr.includes('postgres://'), false);
      assert.strictEqual(bodyStr.includes('password'), false);
    });

    it('GET /health/ready evaluates readiness of database and upstream engine', async () => {
      const res = await fetch(`${baseUrl}/health/ready`);
      assert.ok(res.status === 200 || res.status === 503);
      const data = await res.json();
      assert.ok(data.checks.database);
      assert.ok(data.checks.intelligence);
    });
  });

  describe('Observability & Request Correlation', () => {
    it('Preserves incoming X-Request-ID correlation header in response', async () => {
      const customRequestId = 'req-tracevault-audit-12345';
      const res = await fetch(`${baseUrl}/health`, {
        headers: { 'X-Request-ID': customRequestId }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('x-request-id'), customRequestId);
    });

    it('Generates a new UUID correlation header if X-Request-ID is omitted', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.strictEqual(res.status, 200);
      const requestId = res.headers.get('x-request-id');
      assert.ok(requestId);
      assert.ok(requestId.length >= 16);
    });
  });

  describe('Session Security & Practical Token Revocation', () => {
    it('Revokes token upon logout and rejects subsequent access with TOKEN_REVOKED', async () => {
      // 1. Generate dedicated investigator token
      const token = getAuthToken('INVESTIGATOR');
      const authHeaders = { Authorization: `Bearer ${token}` };

      // 2. Validate token works before logout
      const beforeRes = await fetch(`${baseUrl}/api/auth/me`, { headers: authHeaders });
      assert.strictEqual(beforeRes.status, 200);

      // 3. Logout with this token
      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: authHeaders
      });
      assert.strictEqual(logoutRes.status, 200);

      // 4. Verify token is now rejected with 401 TOKEN_REVOKED
      const afterRes = await fetch(`${baseUrl}/api/auth/me`, { headers: authHeaders });
      assert.strictEqual(afterRes.status, 401);
      const afterBody = await afterRes.json();
      assert.strictEqual(afterBody.error.code, 'TOKEN_REVOKED');
    });
  });

  describe('Append-Only Audit Trail Sanitization', () => {
    it('Redacts sensitive keys and crypto keys from audit metadata', async () => {
      const fakePrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const logEntry = await auditRepository.logAction({
        userId: 1,
        action: 'TEST_AUDIT_ACTION',
        resourceType: 'TEST',
        metadata: {
          username: 'investigator',
          password: 'UnsafePassword123',
          auth_token: 'secret-jwt-token-string',
          target_private_key: fakePrivateKey,
          safe_field: 'valid_context'
        }
      });

      assert.ok(logEntry);
      const parsedMetadata = typeof logEntry.metadata === 'string'
        ? JSON.parse(logEntry.metadata)
        : logEntry.metadata;

      assert.strictEqual(parsedMetadata.username, 'investigator');
      assert.strictEqual(parsedMetadata.safe_field, 'valid_context');
      assert.strictEqual(parsedMetadata.password, '[REDACTED]');
      assert.strictEqual(parsedMetadata.auth_token, '[REDACTED]');
      assert.strictEqual(parsedMetadata.target_private_key, '[REDACTED]');
    });
  });

  describe('Security Headers & Frame Options', () => {
    it('Includes X-Frame-Options SAMEORIGIN and X-Content-Type-Options nosniff', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.strictEqual(res.headers.get('x-frame-options'), 'SAMEORIGIN');
      assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
      assert.strictEqual(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    });
  });
});
