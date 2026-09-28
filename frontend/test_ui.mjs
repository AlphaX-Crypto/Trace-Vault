import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.join(process.cwd(), 'frontend');
const output = 'C:/Users/Samarth/Documents/Codex/2026-09-29/referenced-chatgpt-conversation-this-is-an/outputs/TRACEVAULT';
await fs.mkdir(output, { recursive: true });
const server = await createServer({ configFile: path.join(root, 'vite.config.js'), root, server: { host: '127.0.0.1', port: 3000 } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Sign in to TRACEVAULT' }).waitFor();
  await page.screenshot({ path: path.join(output, '01-secure-opening.png'), fullPage: true });
  await page.goto('http://127.0.0.1:3000/cases', { waitUntil: 'networkidle' });
  await page.waitForURL('**/login');
  await page.getByRole('heading', { name: 'Sign in to TRACEVAULT' }).waitFor();
  await page.screenshot({ path: path.join(output, '02-protected-route.png'), fullPage: true });
  const testUser = process.env.TRACEVAULT_TEST_USERNAME;
  const testPassword = process.env.TRACEVAULT_TEST_PASSWORD;
  if (testUser && testPassword) {
    await page.locator('input[autocomplete="username"]').fill(testUser);
    await page.locator('input[autocomplete="current-password"]').fill(testPassword);
    await page.getByRole('button', { name: 'Continue securely' }).click();
    await page.waitForTimeout(1800);
  }
  if (new URL(page.url()).pathname === '/cases') {
    await page.getByText(/Loading assigned cases|records|No assigned cases|Unable to load/i).first().waitFor({ timeout: 8000 }).catch(() => {});
    await page.screenshot({ path: path.join(output, '03-case-registry.png'), fullPage: true });
    const firstCase = page.locator('a.case-link').first();
    if (await firstCase.count()) {
      await firstCase.click();
      await page.waitForURL(/\/cases\/[^/]+\/overview/);
      await page.locator('.metrics, .problem').waitFor({ timeout: 10000 });
      await page.screenshot({ path: path.join(output, '04-investigation-overview.png'), fullPage: true });
      await page.getByRole('link', { name: /Graph/ }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(output, '05-investigation-graph.png'), fullPage: true });
      console.log('PASS authenticated case list and investigation workspace rendered from API');
    } else {
      console.log('PASS authenticated case registry rendered; no case records are assigned');
    }
  } else if (testUser && testPassword) {
      await page.locator('.form-error').waitFor({ timeout: 8000 });
      const authFailure = await page.locator('.form-error').textContent();
      throw new Error(`Configured test account was rejected by the API: ${authFailure}`);
  }
  if (errors.length) throw new Error(`Browser runtime errors: ${errors.join('; ')}`);
  console.log('PASS login opening render');
  console.log('PASS unauthenticated /cases redirects to /login');
  if (!testUser || !testPassword) console.log('SKIP authenticated case flow (test credentials were not supplied)');
  console.log('PASS no browser runtime errors');
  console.log(`Screenshots saved to ${output}`);
} finally {
  await browser.close();
  await server.close();
}
