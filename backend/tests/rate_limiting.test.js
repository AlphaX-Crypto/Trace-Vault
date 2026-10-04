const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const http = require('http');
const rateLimit = require('express-rate-limit');
const ApiResponse = require('../src/utils/apiResponse');

describe('Security & Rate Limiting Enforcement', () => {
  let server;
  let baseUrl;

  before(async () => {
    const testApp = express();
    testApp.use(express.json());

    // Specific test rate limiter with small threshold
    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 3,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        return ApiResponse.error(
          res,
          'Too many authentication attempts. Please try again after 15 minutes.',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }
    });

    testApp.post('/test-limit', testLimiter, (req, res) => {
      res.json({ success: true, count: 'ok' });
    });

    server = http.createServer(testApp);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  after(() => {
    server.close();
  });

  it('Allows requests within rate limit threshold', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${baseUrl}/test-limit`, { method: 'POST' });
      assert.strictEqual(res.status, 200);
    }
  });

  it('Blocks 4th request when threshold is exceeded with 429 RATE_LIMIT_EXCEEDED', async () => {
    const res = await fetch(`${baseUrl}/test-limit`, { method: 'POST' });
    assert.strictEqual(res.status, 429);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(body.error.message.includes('Too many authentication attempts'));
  });
});
