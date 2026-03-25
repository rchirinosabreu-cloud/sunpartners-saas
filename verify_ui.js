import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Internal UI (Login and Stations)
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@sunpartners.co');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for auth redirect
    await page.waitForTimeout(3000);

    // Station 2 (Logistics "Blindaje")
    await page.goto('http://localhost:5173/cotizaciones/nueva');
    await page.waitForTimeout(3000);
    await page.click('text=02. LOGÍSTICA');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'verification/station2_logistics.png' });
    console.log('Station 2 captured');

    // Station 3 (Calculator)
    await page.click('text=03. INVENTARIO');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'verification/station3_calculator.png' });
    console.log('Station 3 captured');

    // 2. Public Portal
    const hash = 'ed9a0b7120068f52b348e00579c5665fd5a653245f2dd13a1e13f7ab0baf06f4';
    await page.goto(`http://localhost:5173/q/${hash}`);
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'verification/public_portal.png', fullPage: true });
    console.log('Public Portal captured');

  } catch (err) {
    console.error('Error during verification:', err);
    // Take a screenshot of the error state if possible
    await page.screenshot({ path: 'verification/error_state.png' });
  } finally {
    await browser.close();
  }
})();
