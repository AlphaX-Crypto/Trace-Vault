import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOTS_DIR = 'C:/Users/Samarth/.gemini/antigravity-ide/brain/f10d02c2-5077-48f1-9238-26e3592f604f/scratch/screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`[PAGE ERROR] ${error.message}`);
  });

  const routes = [
    { name: '01_login', url: 'http://localhost:3000/login' },
    { name: '02_dashboard', url: 'http://localhost:3000/dashboard' },
    { name: '03_cases', url: 'http://localhost:3000/cases' },
    { name: '04_new_case', url: 'http://localhost:3000/cases/new' },
    { name: '05_investigation_overview', url: 'http://localhost:3000/investigations/INV-001/overview' },
    { name: '06_investigation_transactions', url: 'http://localhost:3000/investigations/INV-001/transactions' },
    { name: '07_investigation_graph', url: 'http://localhost:3000/investigations/INV-001/graph' },
    { name: '08_investigation_timeline', url: 'http://localhost:3000/investigations/INV-001/timeline' },
    { name: '09_investigation_risk', url: 'http://localhost:3000/investigations/INV-001/risk' },
    { name: '10_investigation_attribution', url: 'http://localhost:3000/investigations/INV-001/attribution' },
    { name: '11_investigation_geospatial', url: 'http://localhost:3000/investigations/INV-001/geospatial' },
    { name: '12_investigation_evidence', url: 'http://localhost:3000/investigations/INV-001/evidence' },
    { name: '13_investigation_report', url: 'http://localhost:3000/investigations/INV-001/report' },
    { name: '14_disclosure', url: 'http://localhost:3000/disclosure' },
    { name: '15_audit', url: 'http://localhost:3000/audit' },
    { name: '16_entity', url: 'http://localhost:3000/entity' }
  ];

  console.log('--- STARTING PLAYWRIGHT VERIFICATION ---');

  // First log in
  console.log('Navigating to Login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_login.png` });

  // Fill credentials and click submit
  await page.fill('input[type="text"]', 'TV-LE-8327');
  await page.fill('input[type="password"]', 'investigator123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  for (const r of routes) {
    if (r.name === '01_login') continue;
    console.log(`Navigating to ${r.name} (${r.url})...`);
    await page.goto(r.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const title = await page.title();
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/${r.name}.png` });
    console.log(`  -> Rendered: ${title}`);
  }

  await browser.close();

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log(`Total Routes Tested: ${routes.length}`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(err => console.error(err));
  } else {
    console.log('PASSED: Zero console or runtime errors detected!');
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
