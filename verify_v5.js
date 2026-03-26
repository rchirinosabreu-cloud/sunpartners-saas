const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // 1. Login
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@sunpartners.co');
    await page.fill('input[type="password"]', 'SunBTL2026_Premium');
    await page.click('button[type="submit"]');

    // Wait for either dashboard OR "/"
    await Promise.race([
        page.waitForURL('**/'),
        page.waitForURL('**/dashboard'),
        page.waitForSelector('h2:has-text("Constructor")'),
        page.waitForSelector('h1:has-text("Sunpartners")')
    ]);

    console.log('Login successful or at least navigated.');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'verification/post_login.png' });

    // 2. Navigate to New Quotation directly
    console.log('Navigating to New Quotation...');
    await page.goto('http://localhost:5173/cotizaciones/nueva');
    await page.waitForSelector('h2:has-text("CONSTRUCTOR DE COTIZACIONES")');
    await page.screenshot({ path: 'verification/internal_constructor_v5.png' });
    console.log('Internal Constructor verified.');

    // 3. Create a quick quotation
    await page.selectOption('select', { index: 1 });
    await page.fill('input[type="text"] >> nth=0', 'Verificación Final Estilo Finora');
    await page.click('button:has-text("Siguiente Estación")');
    await page.waitForTimeout(500);

    // Station 2
    await page.click('button:has-text("Siguiente Estación")');
    await page.waitForTimeout(500);

    // Station 3
    await page.click('button:has-text("+ Equipo")');
    await page.waitForTimeout(500);
    await page.selectOption('table select', { index: 1 });
    await page.click('button:has-text("Siguiente Estación")');
    await page.waitForTimeout(500);

    // Station 4
    await page.click('button:has-text("Finalizar Propuesta Maestro")');
    await page.waitForNavigation();
    console.log('Quotation created.');

    // 4. Generate Link
    await page.click('button:has-text("Enviar y Generar Link")');
    await page.waitForSelector('button:has-text("Ver Portal")');

    const [publicPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('button:has-text("Ver Portal")')
    ]);

    await publicPage.waitForLoadState();
    await publicPage.waitForTimeout(2000);
    await publicPage.screenshot({ path: 'verification/public_portal_v5.png', fullPage: true });
    console.log('Public Portal verified.');

  } catch (err) {
    console.error('Error:', err);
    await page.screenshot({ path: 'verification/error_v5.png' });
  } finally {
    await browser.close();
  }
})();
