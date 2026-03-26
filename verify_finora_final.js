const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 }
  });
  const page = await context.newPage();

  // Use the known valid hash from the DB
  const hash = 'ed9a0b7120068f52b348e00579c5665fd5a653245f2dd13a1e13f7ab0baf06f4';
  const url = `http://localhost:5173/q/${hash}`;

  try {
    console.log('Capturing Final Public Portal (Finora Style)...');
    await page.goto(url);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'verification/public_portal_finora.png', fullPage: true });

    console.log('Capturing Approval Modal (Finora Style)...');
    await page.click('button:has-text("Confirmar Propuesta")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'verification/modal_approve_finora.png' });
    await page.keyboard.press('Escape');

    console.log('Capturing Rejection Modal (Finora Style)...');
    await page.click('button:has-text("Solicitar Ajustes")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'verification/modal_reject_finora.png' });

    console.log('Verification successful.');
  } catch (err) {
    console.error('Final verification failed:', err);
  } finally {
    await browser.close();
  }
})();
