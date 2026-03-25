import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1600 });

  const hash = 'ed9a0b7120068f52b348e00579c5665fd5a653245f2dd13a1e13f7ab0baf06f4';
  const url = `http://localhost:5173/q/${hash}`;
  console.log(`Visiting: ${url}`);

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.goto(url, { waitUntil: 'networkidle' });

  // Give it a bit more time for any internal React effects
  await page.waitForTimeout(2000);

  const content = await page.content();
  console.log('Page content length:', content.length);

  await page.screenshot({ path: 'verification/public_portal_v3.png', fullPage: true });
  console.log('Public Portal v3 captured');

  await browser.close();
})();
