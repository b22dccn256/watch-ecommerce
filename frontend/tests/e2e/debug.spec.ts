import { test, expect, request as playwrightRequest } from '@playwright/test';

test('debug storageState and cookies', async ({ page }) => {
  const BACKEND = process.env.E2E_BACKEND_URL || 'http://localhost:5000';
  const FRONTEND = process.env.PW_BASE_URL || 'http://localhost:5173';
  const api = await playwrightRequest.newContext({ baseURL: BACKEND });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE CONSOLE ERROR:', msg.text());
    else console.log('PAGE CONSOLE:', msg.type(), msg.text());
  });
  const loginRes = await api.post('/api/auth/login', { data: { email: 'admin@test.local', password: 'Admin123!@#' } });
  console.log('login ok', loginRes.ok());
  const loginJson = await loginRes.json().catch(() => null);
  console.log('login body', loginJson);
  const state = await api.storageState();
  console.log('storageState cookies:', JSON.stringify(state.cookies, null, 2));
  await page.context().addCookies(state.cookies);
  const cookies5173 = await page.context().cookies(FRONTEND + '/');
  const cookies5000 = await page.context().cookies(BACKEND + '/');
  console.log('cookies for 5173:', cookies5173);
  console.log('cookies for 5000:', cookies5000);
  await page.goto(FRONTEND + '/secret-dashboard');
  await page.waitForLoadState('networkidle');
  console.log('page url after goto:', page.url());
  const profileFromBrowser = await page.evaluate(async () => {
    try {
      const r = await fetch('/api/auth/profile', { credentials: 'include' });
      const text = await r.text();
      return { status: r.status, text };
    } catch (e) {
      return { error: String(e) };
    }
  });
  console.log('profile fetch from browser:', profileFromBrowser);
  const body = await page.content();
  console.log('body length', body.length, 'indexOf Watch Admin', body.indexOf('Watch Admin'));
  // print small snippet around Watch Admin if present
  const idx = body.indexOf('Watch Admin');
  if (idx >= 0) console.log('snippet:', body.slice(Math.max(0, idx - 120), idx + 120));
  console.log('first 2000 chars of body:\n', body.slice(0, 2000));
  const visible = await page.getByText('Watch Admin').isVisible().catch(() => false);
  console.log('Watch Admin visible?', visible);
  // Try clicking Products tab to inspect Products panel
  try {
    await page.getByRole('button', { name: 'Sản phẩm' }).click();
    await page.waitForLoadState('networkidle');
    const bodyAfter = await page.content();
    console.log('body length after clicking products', bodyAfter.length);
    const idx2 = bodyAfter.indexOf('Thêm mới');
    console.log('indexOf Thêm mới', idx2);
    if (idx2 >= 0) console.log('snippet around Thêm mới:', bodyAfter.slice(Math.max(0, idx2 - 120), idx2 + 120));
  } catch (e) {
    console.log('error clicking products:', String(e));
  }
  await api.dispose();
});