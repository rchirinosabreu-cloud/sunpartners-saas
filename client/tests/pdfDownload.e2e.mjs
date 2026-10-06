import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { pdfQuotation } from './fixtures/pdfQuotation.js';

const clientRoot = fileURLToPath(new URL('..', import.meta.url));
const projectRoot = resolve(clientRoot, '..');
const outputDir = resolve(projectRoot, 'output/pdf');
const screenshots = resolve(projectRoot, 'artifacts');
mkdirSync(outputDir, { recursive: true });
mkdirSync(screenshots, { recursive: true });

const server = await createServer({
  root: clientRoot,
  server: { host: '127.0.0.1', port: 0 },
});
let browser;
try {
  await server.listen();
  const port = server.httpServer.address().port;
  browser = await chromium.launch({ headless: true, channel: process.env.PDF_BROWSER_CHANNEL || undefined });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1100 },
    timezoneId: 'America/Bogota',
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let quotation = structuredClone(pdfQuotation);
  await page.route('**/api/quotations/pdf-regression', route => route.fulfill({ json: quotation }));

  for (const scenario of ['quotation', 'quotation-multipage', 'quotation-natural-person']) {
    quotation = structuredClone(pdfQuotation);
    if (scenario === 'quotation-multipage') {
      quotation.items = Array.from({ length: 45 }, (_, i) => ({
        ...pdfQuotation.items[0], customName: `Equipo de sonido ${i + 1}`,
      }));
    }
    if (scenario === 'quotation-natural-person') quotation.client.documentType = 'CC';
    await page.goto(`http://127.0.0.1:${port}/cotizaciones/pdf-regression`);
    const button = page.getByRole('button', { name: 'Descargar PDF', exact: true });
    await button.waitFor();
    const pendingDownload = page.waitForEvent('download');
    await button.click();
    const download = await pendingDownload;
    assert.equal(await download.failure(), null);
    assert.equal(download.suggestedFilename(), 'Cotizacion_Evento_de_prueba_PDF_SP-123.pdf');
    const destination = resolve(outputDir, `${scenario}.pdf`);
    await download.saveAs(destination);
    const bytes = statSync(destination).size;
    assert.ok(bytes < 250000, `${scenario} is too large: ${bytes} bytes`);
    console.log(JSON.stringify({ scenario, bytes, destination }));
    if (scenario === 'quotation') {
      await page.screenshot({ path: resolve(screenshots, 'pdf-compression-ui.png'), fullPage: true });
    }
  }
  assert.deepEqual(errors, [], 'The quotation UI must not produce browser errors');
} finally {
  await browser?.close();
  await server.close();
}
