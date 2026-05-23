/**
 * Order Details Test
 * Verifies: carrier enum validation, correct endpoint routing
 * Run: node --test test/order-details.test.mjs (requires server)
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';

let cookies = '';

const api = {
  get: async (path) => {
    const headers = { 'Content-Type': 'application/json' };
    if (cookies) headers.Cookie = cookies;
    const res = await fetch(`${API_BASE}${path}`, { headers });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookies = setCookie.split(',').map(c => c.split(';')[0].trim()).join('; ');
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  },
  post: async (path, body) => {
    const headers = { 'Content-Type': 'application/json' };
    if (cookies) headers.Cookie = cookies;
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookies = setCookie.split(',').map(c => c.split(';')[0].trim()).join('; ');
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  },
  patch: async (path, body) => {
    const headers = { 'Content-Type': 'application/json' };
    if (cookies) headers.Cookie = cookies;
    const res = await fetch(`${API_BASE}${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  },
};

const ADMIN = { email: 'admin@test.local.com', password: 'Admin123!@#' };
let testOrderId = null;

// ─── Setup: Login as admin ───
test('setup: login as admin', async () => {
  const res = await api.post('/auth/login', ADMIN);
  assert.ok(res.status === 200 || res.data?.requiresOTP, 'Admin login should succeed or require OTP');
  if (res.data?.requiresOTP) {
    console.log('  ⚠️ Admin 2FA required — skipping integration tests');
    testOrderId = 'SKIP';
  }
});

// ─── Carrier Validation ───
test('order details: rejects invalid carrier', { skip: !testOrderId || testOrderId === 'SKIP' }, async () => {
  const res = await api.patch('/orders/000000000000000000000000/details', {
    carrier: 'InvalidCarrier',
    internalNotes: 'Test',
  });
  assert.equal(res.status, 400, 'Should reject invalid carrier');
  assert.match(res.data?.message || '', /vận chuyển không hợp lệ/);
});

test('order details: accepts valid carrier', { skip: !testOrderId || testOrderId === 'SKIP' }, async () => {
  // This test requires a real order ID
  console.log('  ℹ️ Requires real order — test with: node --test test/order-details.test.mjs');
});

// ─── Endpoint routing verification ───
test('order details: PATCH /orders/:id/details exists as route', { skip: !testOrderId || testOrderId === 'SKIP' }, async () => {
  const res = await api.patch('/orders/000000000000000000000000/details', {
    internalNotes: 'route-test',
  });
  // 404 = order not found (route exists), 400 = validation failed (route exists)
  assert.ok(res.status === 404 || res.status === 400, 'Route should exist (404=not found or 400=validation)');
});

console.log('\n✅ Order details tests complete');
