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
const artifacts = resolve(clientRoot, '../artifacts');
mkdirSync(artifacts, { recursive: true });
const now = new Date();
const today = new Date(now.getTime() - 5 * 3600000).toISOString().slice(0, 10);
const start = new Date(`${today}T00:00:00-05:00`);
const yesterday = new Date(start.getTime() - 86400000).toISOString().slice(0, 10);
const workers = [{ id: 'u1', nombre: 'Equipo comercial' }, { id: 'u2', nombre: 'Equipo logístico' }];
const todayTasks = Array.from({ length: 6 }, (_, i) => ({
  id: `today-${i + 1}`, titulo: `Logro de hoy ${i + 1}`, status: 'REALIZADO', deletedAt: null,
  updatedAt: new Date(start.getTime() + (i + 1) * 600000),
  userId: workers[i < 4 ? 0 : 1].id, user: workers[i < 4 ? 0 : 1],
  client: { razon_social: 'Cliente de prueba' },
}));
const tasks = [
  ...todayTasks,
  { ...todayTasks[5], id: 'yesterday', titulo: 'Logro de ayer', updatedAt: new Date(start.getTime() - 1) },
  { ...todayTasks[0], id: 'tomorrow', titulo: 'Logro de otro día', updatedAt: new Date(start.getTime() + 86400000) },
  { ...todayTasks[0], id: 'old', titulo: 'Logro histórico de otro año', updatedAt: new Date('2025-01-01T15:00:00Z') },
  { ...todayTasks[0], id: 'deleted', titulo: 'Logro eliminado', deletedAt: now },
  { ...todayTasks[0], id: 'pending', titulo: 'Tarea pendiente', status: 'PENDIENTE' },
];
let lastWhere;
const db = {
  user: { findUnique: async () => ({ isActive: true, username: 'test', email: 'test@example.com' }) },
  task: { findMany: async ({ where }) => {
    lastWhere = where;
    return tasks.filter(task => task.status === where.status && task.deletedAt === where.deletedAt
      && (!where.userId || task.userId === where.userId)
      && (!where.updatedAt || ((!where.updatedAt.gte || task.updatedAt >= where.updatedAt.gte)
        && (!where.updatedAt.lt || task.updatedAt < where.updatedAt.lt)
        && (!where.updatedAt.lte || task.updatedAt <= where.updatedAt.lte))));
  } },
};
const dbPath = require.resolve('../../server/src/db.js');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };
const { getHistory } = require('../../server/src/controllers/taskController.js');
const { authMiddleware } = require('../../server/src/middleware/auth.js');
const app = express();
app.use(cookieParser());
app.get('/api/tasks/history', authMiddleware, getHistory);
app.get('/api/users', (_req, res) => res.json(workers));
app.get('/api/tasks/dashboard-stats', (_req, res) => res.json({ progresoMes: 50, totalRealizados: 20, logrosRecientes: todayTasks }));
app.get('/api/announcements', (_req, res) => res.json([]));
app.get('/api/inventory/alerts', (_req, res) => res.json([]));
app.get('/api/settings/global_motivational_quote', (_req, res) => res.json({ value: 'Los logros de cada día cuentan.' }));
const api = await new Promise(done => { const server = app.listen(0, '127.0.0.1', () => done(server)); });
const vite = await createServer({ root: clientRoot, server: {
  host: '127.0.0.1', port: 0,
  proxy: { '/api': { target: `http://127.0.0.1:${api.address().port}`, changeOrigin: true } },
} });
let browser;
try {
  await vite.listen();
  const base = `http://127.0.0.1:${vite.httpServer.address().port}`;
  assert.equal((await fetch(`${base}/api/tasks/history`)).status, 401);
  browser = await chromium.launch({ headless: true, channel: process.env.HISTORY_BROWSER_CHANNEL || undefined });
  // A different browser timezone proves that the UI still uses Bogota's date.
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 }, timezoneId: 'Asia/Tokyo' });
  await context.addCookies([{ name: 'token', url: base, httpOnly: true,
    value: jwt.sign({ userId: workers[0].id, role: 'ADMIN' }, process.env.JWT_SECRET || 'dev-secret-key') }]);
  const unfiltered = await context.request.get(`${base}/api/tasks/history`);
  assert.equal((await unfiltered.json()).flatMap(group => group.tasks).length, 6);
  assert.equal((await context.request.get(`${base}/api/tasks/history?startDate=2026-02-30`)).status(), 400);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  const historyButton = page.getByRole('button', { name: 'Ver historial del día', exact: true });
  await historyButton.click();
  await page.getByText('Logro de hoy 6', { exact: true }).waitFor();
  const dayField = page.getByLabel('Filtrar por Día');
  const workerField = page.getByLabel('Miembro');
  assert.equal(await dayField.inputValue(), today);
  // Five cards are previewed in the widget, but the modal returns all six.
  assert.equal(await page.getByText('Logro de hoy 6', { exact: true }).count(), 1);
  for (const title of ['Logro de ayer', 'Logro de otro día', 'Logro histórico de otro año', 'Logro eliminado', 'Tarea pendiente']) {
    assert.equal(await page.getByText(title, { exact: true }).count(), 0);
  }
  assert.equal(lastWhere.updatedAt.gte.toISOString(), start.toISOString());
  assert.equal(lastWhere.updatedAt.lt.getTime(), start.getTime() + 86400000);
  await page.screenshot({ path: resolve(artifacts, 'dashboard-history-today.png'), fullPage: true, animations: 'disabled' });

  await workerField.selectOption('u2');
  await page.getByText('2 tareas', { exact: true }).waitFor();
  assert.equal(await dayField.inputValue(), today);
  await dayField.fill(yesterday);
  await page.getByText('Logro de ayer', { exact: true }).waitFor();
  assert.equal(await workerField.inputValue(), 'u2');
  assert.equal(await page.getByText('Logro de hoy 6', { exact: true }).count(), 0);
  await dayField.fill('');
  await page.getByText('Logro de hoy 6', { exact: true }).waitFor();
  assert.equal(await dayField.inputValue(), today);
  assert.equal(await workerField.inputValue(), 'u2');

  await dayField.fill(yesterday);
  await page.getByText('Logro de ayer', { exact: true }).waitFor();
  await page.mouse.click(10, 10);
  await historyButton.click();
  await page.getByText('Logro de hoy 6', { exact: true }).waitFor();
  assert.equal(await dayField.inputValue(), today);
  assert.equal(await workerField.inputValue(), '');
  assert.deepEqual(errors, []);
  const report = { dailyHistoryCount: 6, otherDaysExcluded: true, deletedAndPendingExcluded: true,
    defaultApiScopedToToday: true, invalidDatesRejected: true, dateAndMemberFiltersIndependent: true,
    reopeningDefaultsToToday: true, browserTimezone: 'Asia/Tokyo', displayTimezone: 'America/Bogota',
    browserErrors: errors, storage: 'Fixture database; real history controller and authentication' };
  writeFileSync(resolve(artifacts, 'dashboard-history-verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  await vite.close();
  await new Promise(done => api.close(done));
}
