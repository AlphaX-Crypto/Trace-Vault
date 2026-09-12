const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');

describe('Health Check API', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  after(() => {
    server.close();
  });

  it('GET /health returns 200 with service status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.service, 'tracevault-backend');
  });

  it('GET /health/intelligence returns service status payload', async () => {
    const res = await fetch(`${baseUrl}/health/intelligence`);
    // May be 200 or 503 depending on whether Python service is running locally
    assert([200, 503].includes(res.status));

    const body = await res.json();
    assert.strictEqual(body.service, 'tracevault-backend');
    assert.ok(body.intelligence_service);
  });
});
