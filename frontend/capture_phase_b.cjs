const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const outDir = 'C:/Users/Samarth/.gemini/antigravity/brain/7808609c-86d3-4a72-b925-41b3b21b7737/validation';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // 1. Capture Hero Sequence at 1440x900
  const context1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context1440.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000/');

  // 01_hero_initial (300ms after load)
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '01_hero_initial.png') });
  console.log('Saved 01_hero_initial.png');

  // 02_hero_typography (800ms)
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '02_hero_typography.png') });
  console.log('Saved 02_hero_typography.png');

  // 03_hero_core (1400ms)
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '03_hero_core.png') });
  console.log('Saved 03_hero_core.png');

  // 04_hero_ready (2200ms)
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '04_hero_ready.png') });
  console.log('Saved 04_hero_ready.png');

  // Trigger Application Transition
  console.log('Clicking primary CTA button to transition...');
  await page.click('button.primary-cta-button');

  // Wait for transition animation to complete (800ms)
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '05_application_transition.png') });
  console.log('Saved 05_application_transition.png');

  // 2. Validate at 1920x1080
  const context1920 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page1920 = await context1920.newPage();
  await page1920.goto('http://localhost:3000/');
  await page1920.waitForTimeout(2200);
  await page1920.screenshot({ path: path.join(outDir, 'hero_1920x1080.png') });
  console.log('Saved hero_1920x1080.png');

  // 3. Validate at 1366x768
  const context1366 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page1366 = await context1366.newPage();
  await page1366.goto('http://localhost:3000/');
  await page1366.waitForTimeout(2200);
  await page1366.screenshot({ path: path.join(outDir, 'hero_1366x768.png') });
  console.log('Saved hero_1366x768.png');

  await browser.close();
  console.log('All captures complete!');
})();
