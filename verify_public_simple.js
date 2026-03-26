const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const hash = 'ed9a0b7120068f52b348e00579c5665fd5a653245f2dd13a1e13f7ab0baf06f4';

  try {
    console.log('Navigating to public portal...');
    await page.goto(`http://localhost:5173/q/${hash}`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'verification/public_portal_final.png', fullPage: true });
    console.log('Public portal screenshot taken.');
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
