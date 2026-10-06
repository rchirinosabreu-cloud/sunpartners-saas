import { chromium } from 'playwright';
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const clientRoot = fileURLToPath(new URL('..', import.meta.url));
const root = resolve(clientRoot, '..');
const artifacts = resolve(root, 'artifacts');
mkdirSync(artifacts, { recursive: true });
const now = Date.now();
const date = offset => new Date(now + offset);
const day = 86400000;
const author = { id: 'test-user', nombre: 'Equipo Sunpartners', role: 'ADMIN' };
const makeAlert = (id, overrides = {}) => ({
  id, quotationId: `q-${id}`, inventoryItemId: `i-${id}`,
  productName: `Mesa de evento ${id}`, needed: 10, available: 7, deficit: 3,
  startDate: date(2 * day), endDate: date(3 * day), resolvedAt: null,
  motivo: 'Déficit físico en bodega',
  quotation: {
    id: `q-${id}`, nombre_evento: `Evento próximo ${id}`, consecutivo: 2500 + Number(id || 0),
    estado: 'APROBADA', archivedAt: null, deletedAt: null,
    montaje_inicio: date(2 * day), evento_fin: date(3 * day), desmontaje_fin: date(3 * day),
    client: { razon_social: 'Cliente de prueba' },
  },
  ...overrides,
});
const storedAlerts = Array.from({ length: 12 }, (_, i) => makeAlert(String(i + 1)));
storedAlerts[0].quotation.estado = 'CONFIRMED';
const expired = makeAlert('expired', { productName: 'Alerta de junio vencida' });
expired.quotation.desmontaje_fin = new Date('2026-06-17T23:00:00Z');
storedAlerts.push(expired);
for (const [id, state] of [['cancelled', 'CANCELADA'], ['rejected', 'RECHAZADA'], ['draft', 'BORRADOR']]) {
  const alert = makeAlert(id, { productName: `Alerta ${id}` });
  alert.quotation.estado = state;
  storedAlerts.push(alert);
}
for (const field of ['archivedAt', 'deletedAt']) {
  const alert = makeAlert(field);
  alert.quotation[field] = date(-day);
  storedAlerts.push(alert);
}
storedAlerts.push(makeAlert('resolved', { resolvedAt: date(-day) }));
const rescheduled = makeAlert('rescheduled', {
  productName: 'Equipo de evento reprogramado', startDate: date(-120 * day), endDate: date(-119 * day),
});
rescheduled.quotation.consecutivo = 2701;
storedAlerts.push(rescheduled);
const dismantling = makeAlert('dismantling', { productName: 'Equipo pendiente de desmontaje' });
dismantling.quotation.evento_fin = date(-day);
dismantling.quotation.desmontaje_fin = date(day);
dismantling.quotation.estado = 'EJECUCION';
dismantling.quotation.consecutivo = 2702;
storedAlerts.push(dismantling);
const expiring = makeAlert('expiring', { productName: 'Alerta que vence con el panel abierto' });
expiring.quotation.montaje_inicio = date(-3 * 3600000);
expiring.quotation.evento_fin = date(-10 * 60000);
expiring.quotation.desmontaje_fin = date(120000);
expiring.quotation.consecutivo = 2703;
storedAlerts.unshift(expiring);

// A read-only Prisma-shaped fixture store. The real router, authentication and
// alert query run against it; no production database or records are accessed.
function matches(record, where) {
  return Object.entries(where).every(([key, condition]) => {
    const value = record[key];
    if (condition === null || typeof condition !== 'object') return value === condition;
    if ('is' in condition) return matches(value, condition.is);
    if ('in' in condition) return condition.in.includes(value);
    if ('gt' in condition) return new Date(value) > new Date(condition.gt);
    return matches(value, condition);
  });
}
let lastQuery;
let hideAllAlerts = false;
const db = {
  user: { findUnique: async () => ({ isActive: true, email: 'test@example.com', username: 'test' }) },
  inventoryAlert: { findMany: async query => {
    lastQuery = query;
    return hideAllAlerts ? [] : storedAlerts.filter(alert => matches(alert, query.where));
  } },
};
const dbPath = require.resolve('../../server/src/db.js');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use('/api/inventory', require('../../server/src/routes/inventory.js'));
let announcements = [{
  id: 'a1', contenido: 'Reunión del equipo: revisemos la programación de los próximos eventos.',
  tipo: 'INFO', authorId: author.id, author, createdAt: date(-day),
}];
app.get('/api/announcements', (_req, res) => res.json(announcements));
app.post('/api/announcements', (req, res) => {
  const created = { ...req.body, id: `a${announcements.length + 1}`, author, createdAt: new Date() };
  announcements.unshift(created);
  res.status(201).json(created);
});
app.get('/api/settings/global_motivational_quote', (_req, res) => res.json({ value: 'Información clara para coordinar cada evento.' }));
app.get('/api/tasks/dashboard-stats', (_req, res) => res.json({
  progresoMes: 75, totalRealizados: 84, completedInMonth: 9, totalCreatedInMonth: 12,
  logrosRecientes: [
    { id: 't1', titulo: 'Montaje listo para el encuentro regional', user: author, updatedAt: date(-3600000), client: { razon_social: 'Cliente de prueba' } },
    { id: 't2', titulo: 'Confirmación del transporte', user: author, updatedAt: date(-7200000) },
  ],
}));
const api = await new Promise(resolveServer => {
  const server = app.listen(0, '127.0.0.1', () => resolveServer(server));
});
const apiPort = api.address().port;
const vite = await createServer({ root: clientRoot, server: {
  host: '127.0.0.1', port: 0,
  proxy: { '/api': { target: `http://127.0.0.1:${apiPort}`, changeOrigin: true } },
} });
let browser;
try {
  await vite.listen();
  const base = `http://127.0.0.1:${vite.httpServer.address().port}`;
  const unauthorized = await fetch(`${base}/api/inventory/alerts`);
  assert.equal(unauthorized.status, 401);
  browser = await chromium.launch({ headless: true, channel: process.env.DASHBOARD_BROWSER_CHANNEL || undefined });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1400 }, timezoneId: 'America/Bogota' });
  await context.addCookies([{ name: 'token', value: jwt.sign({ userId: author.id, role: 'ADMIN' }, process.env.JWT_SECRET || 'dev-secret-key'), url: base, httpOnly: true }]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date(now) });
  await page.clock.pauseAt(new Date(now));
  await page.goto(base);
  const announceSection = page.getByRole('region', { name: 'Anuncios', exact: true });
  const inventorySection = page.getByRole('region', { name: 'Alertas de Inventario Comprometido', exact: true });
  const achievements = page.getByRole('region', { name: 'Logros Recientes', exact: true });
  await announceSection.getByText(announcements[0].contenido).waitFor();
  await inventorySection.getByText('Equipo de evento reprogramado').waitFor();
  await inventorySection.getByText('Equipo pendiente de desmontaje').waitFor();
  assert.equal(await inventorySection.getByText('Alerta de junio vencida').count(), 0);
  assert.equal(await inventorySection.getByText('Alerta cancelled').count(), 0);
  assert.equal(await inventorySection.getByRole('link').count(), 15);
  assert.equal(lastQuery.where.quotation.is.archivedAt, null);
  assert.equal(lastQuery.where.quotation.is.deletedAt, null);

  const ab = await announceSection.boundingBox();
  const ib = await inventorySection.boundingBox();
  const lb = await achievements.boundingBox();
  assert.ok(Math.abs(ab.width - (ib.width + lb.width + 24)) < 2, 'Announcements must span both lower columns');
  assert.ok(ib.y >= ab.y + ab.height + 23, 'Inventory alerts must sit below announcements');
  assert.ok(Math.abs(ib.y - lb.y) < 2, 'Alerts and achievements must share the lower row');
  assert.ok(Math.abs(ib.height - lb.height) < 2, 'Alerts and achievements must have equal height');
  assert.ok(Math.abs(ib.width / lb.width - 1.5) < 0.02, 'The lower columns must use a 60/40 ratio');
  const scroll = inventorySection.getByLabel('Alertas vigentes');
  assert.ok(await scroll.evaluate(el => el.scrollHeight > el.clientHeight && el.clientHeight <= 300));

  await page.getByRole('button', { name: 'Nuevo Anuncio', exact: true }).click();
  await page.clock.runFor(500);
  const newMessage = 'Recordatorio: confirmar horarios y responsables antes de cada montaje.';
  await page.getByPlaceholder('Escribe el anuncio aquí...').fill(newMessage);
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await announceSection.getByText(newMessage).waitFor();
  await page.clock.runFor(350);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(artifacts, 'dashboard-announcements-desktop.png'), fullPage: true, animations: 'disabled' });

  await page.clock.runFor(120000);
  await inventorySection.getByText('14 vigentes').waitFor();
  assert.equal(await inventorySection.getByText(expiring.productName).count(), 0);
  assert.equal(await announceSection.getByText(newMessage).count(), 1);
  assert.ok(Math.abs((await inventorySection.boundingBox()).height - (await achievements.boundingBox()).height) < 2,
    'Widget heights must stay equal after an alert expires');
  await page.screenshot({ path: resolve(artifacts, 'dashboard-expired-alert-removed.png'), fullPage: true, animations: 'disabled' });

  await page.setViewportSize({ width: 900, height: 1200 });
  const narrowAnnouncement = await announceSection.boundingBox();
  const narrowInventory = await inventorySection.boundingBox();
  assert.ok(narrowInventory.y > narrowAnnouncement.y, 'Announcements must come first on narrow screens');
  await page.screenshot({ path: resolve(artifacts, 'dashboard-announcements-narrow.png'), fullPage: true, animations: 'disabled' });
  hideAllAlerts = true;
  await page.clock.runFor(60000);
  await inventorySection.getByText('Sin alertas de inventario vigentes').waitFor();
  assert.equal(await announceSection.getByText(newMessage).count(), 1);
  await page.setViewportSize({ width: 1600, height: 1400 });
  assert.ok(Math.abs((await inventorySection.boundingBox()).height - (await achievements.boundingBox()).height) < 2,
    'Widget heights must stay equal when inventory alerts are empty');
  assert.deepEqual(errors, []);
  const report = { activeCount: 15, countAfterExpiry: 14, announcementPublished: true,
    expiredCancelledArchivedDeletedResolvedExcluded: true, rescheduledDatesUsed: true,
    dismantlingStillActive: true, announcementsFullWidthAbove: true, lowerColumnRatio: '60/40',
    equalLowerWidgetHeights: true, alertsScrollable: true,
    narrowAnnouncementsFirst: true, emptyStateWorks: true, browserErrors: errors,
    storage: 'Fixture database; real inventory route and authentication' };
  writeFileSync(resolve(artifacts, 'dashboard-alerts-verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  await vite.close();
  await new Promise(resolveClose => api.close(resolveClose));
}
