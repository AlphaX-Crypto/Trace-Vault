const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const { getAuthHeaders } = require('./test_helper');

describe('Security & Input Sanitization', () => {
  let server;
  let baseUrl;
  let authHeaders;

  before(async () => {
    authHeaders = getAuthHeaders('ADMIN');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  after(() => {
    server.close();
  });

  it('Rejects request containing 64-character private key (400)', async () => {
    const rawPrivateKey = '4f3edf983ac636a65a842ce7c78d32707f781a95e7d56637b77051fe44458f2f';

    const res = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        title: 'Leaked Key Case',
        description: `Investigating key: ${rawPrivateKey}`
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'SECURITY_VIOLATION_PRIVATE_KEY');
    assert.ok(body.error.message.includes('Potential private key detected'));
  });

  it('Rejects request containing 12-word seed phrase (400)', async () => {
    const seedPhrase = 'witch collapse practice feed shame open despair creek road again ice least';

    const res = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        title: 'Seed Phrase Case',
        description: seedPhrase
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'SECURITY_VIOLATION_SEED_PHRASE');
    assert.ok(body.error.message.includes('Potential seed phrase detected'));
  });

  it('Rejects request with prohibited field name private_key (400)', async () => {
    const res = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        title: 'Prohibited Key Field',
        private_key: 'some_value'
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'SECURITY_VIOLATION_PROHIBITED_FIELD');
  });

  it('Ensures error responses never leak stack traces', async () => {
    const res = await fetch(`${baseUrl}/api/cases/INVALID_ID_9999`, {
      headers: authHeaders
    });
    const body = await res.json();

    assert.strictEqual(res.status, 404);
    assert.strictEqual(body.stack, undefined);
    assert.strictEqual(body.error.stack, undefined);
  });
});
