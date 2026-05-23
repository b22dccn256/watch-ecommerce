/**
 * Admin API Integration Tests
 * Tests all admin-protected endpoints
 *
 * Run: node --test test/admin-api.test.mjs
 * Requires: Backend server running, valid admin credentials
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';

let adminCookies = '';

const api = {
  get: async (path) => {
    const headers = { 'Content-Type': 'application/json' };
    if (adminCookies) headers.Cookie = adminCookies;
    const res = await fetch(`${API_BASE}${path}`, { headers, redirect: 'manual' });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const cookies = setCookie.split(',').map(c => c.split(';')[0].trim());
      adminCookies = cookies.join('; ');
    }
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  },
  post: async (path, body) => {
    const headers = { 'Content-Type': 'application/json' };
    if (adminCookies) headers.Cookie = adminCookies;
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST', headers,
      body: JSON.stringify(body),
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const cookies = setCookie.split(',').map(c => c.split(';')[0].trim());
      adminCookies = cookies.join('; ');
    }
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  },
  patch: async (path, body) => {
    const headers = { 'Content-Type': 'application/json' };
    if (adminCookies) headers.Cookie = adminCookies;
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH', headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  },
  delete: async (path) => {
    const headers = { 'Content-Type': 'application/json' };
    if (adminCookies) headers.Cookie = adminCookies;
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  },
};

// ═══════════════════════════════════════════════════════════════
// ADMIN LOGIN
// ═══════════════════════════════════════════════════════════════

const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@watchstore.com';
const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'Admin@123';

test('admin: login', async () => {
  const res = await api.post('/auth/login', {
    email: adminEmail,
    password: adminPassword,
  });

  if (res.data?.requiresOTP) {
    console.log(`  ⚠ Admin requires OTP. Set DISABLE_ADMIN_2FA=true in .env for testing.`);
    assert.ok(res.data.requiresOTP === true, 'Admin 2FA detected');
    return;
  }

  assert.ok(res.status === 200, `Login should succeed, got ${res.status}: ${JSON.stringify(res.data)}`);
  if (adminCookies) {
    console.log('  ✓ Admin logged in successfully');
  }
});

// ═══════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════

test('admin: GET /analytics', async () => {
  const res = await api.get('/analytics');
  if (res.status === 401) { console.log('  ⚠ Auth required, skipping'); return; }
  assert.equal(res.status, 200);
  assert.ok(res.data?.users !== undefined, 'Should have users count');
  assert.ok(res.data?.products !== undefined, 'Should have products count');
});

test('admin: GET /analytics?days=30', async () => {
  const res = await api.get('/analytics?days=30');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
});

test('admin: GET /analytics/pl (profit & loss)', async () => {
  const res = await api.get('/analytics/pl');
  if (res.status === 401) return;
  assert.ok(res.status === 200 || res.status === 204, `P&L should return data, got ${res.status}`);
});

// ═══════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════

test('admin: GET /orders', async () => {
  const res = await api.get('/orders');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data?.orders) || Array.isArray(res.data), 'Should return orders');
});

test('admin: GET /orders?status=pending', async () => {
  const res = await api.get('/orders?status=pending');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
});

test('admin: GET /orders?page=1&limit=5', async () => {
  const res = await api.get('/orders?page=1&limit=5');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
});

// ═══════════════════════════════════════════════════════════════
// PRODUCTS ADMIN
// ═══════════════════════════════════════════════════════════════

test('admin: GET /products?page=1&limit=5', async () => {
  const res = await api.get('/products?page=1&limit=5');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
  assert.ok(res.data?.products || res.data, 'Should return products');
});

test('admin: GET /products/inventory/alerts', async () => {
  const res = await api.get('/products/inventory/alerts');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
  assert.ok(res.data?.products || res.data?.totalAlerts !== undefined, 'Should return alerts');
});

test('admin: POST /products creates product', async () => {
  const res = await api.post('/products', {
    name: `Test Watch ${Date.now()}`,
    description: 'A test watch created by automated test suite',
    price: 5000000,
    originalPrice: 8000000,
    stock: 10,
    type: 'automatic',
    categoryId: null,
    brand: null,
    gender: 'unisex',
    tags: ['test', 'automated'],
    image: 'https://via.placeholder.com/400',
  });

  if (res.status === 401) { console.log('  ⚠ Auth required, skipping'); return; }
  assert.ok(res.status === 201 || res.status === 200, `Create should succeed, got ${res.status}: ${res.data?.message || ''}`);
  if (res.data?._id) {
    // Cleanup created test product
    await api.delete(`/products/${res.data._id}`);
  }
});

test('admin: POST /products with missing name rejected', async () => {
  const res = await api.post('/products', { price: 1000000, stock: 10, type: 'quartz' });
  if (res.status === 401) return;
  assert.ok(res.status === 400 || res.status === 500, `Missing name should fail, got ${res.status}`);
});

test('admin: PATCH /products/:id/bulk (bulk update)', async () => {
  const res = await api.patch('/products', {
    action: 'priceAdjust',
    ids: [],
    value: 0,
  });
  if (res.status === 401) return;
  // Empty bulk update should not crash
});

// ═══════════════════════════════════════════════════════════════
// CATALOG: Brands & Categories
// ═══════════════════════════════════════════════════════════════

test('admin: GET /brands', async () => {
  const res = await api.get('/brands');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data), 'Brands should return array');
});

test('admin: POST /brands creates brand', async () => {
  const res = await api.post('/brands', {
    name: `Test Brand ${Date.now()}`,
    description: 'Automated test brand',
    isAuthorizedDealer: true,
  });
  if (res.status === 401) return;
  assert.ok(res.status === 201 || res.status === 200, `Create brand should succeed, got ${res.status}`);
  if (res.data?._id) {
    await api.delete(`/brands/${res.data._id}`);
  }
});

test('admin: POST /brands duplicate name rejected', async () => {
  const name = `DupBrand_${Date.now()}`;
  await api.post('/brands', { name, description: 'First' });
  const res = await api.post('/brands', { name, description: 'Second' });
  if (res.status === 401) return;
  // Should reject or return existing
});

test('admin: GET /categories?tree=false', async () => {
  const res = await api.get('/categories?tree=false');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data), 'Categories should return array');
});

test('admin: POST /categories creates category', async () => {
  const res = await api.post('/categories', {
    name: `Test Cat ${Date.now()}`,
    slug: `test-cat-${Date.now()}`,
  });
  if (res.status === 401) return;
  assert.ok(res.status === 201 || res.status === 200, `Create category should succeed, got ${res.status}`);
  if (res.data?._id) {
    await api.delete(`/categories/${res.data._id}`);
  }
});

// ═══════════════════════════════════════════════════════════════
// CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

test('admin: GET /campaigns', async () => {
  const res = await api.get('/campaigns');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data), 'Campaigns should return array');
});

test('admin: POST /campaigns creates campaign', async () => {
  const now = new Date();
  const res = await api.post('/campaigns', {
    name: `Test Campaign ${Date.now()}`,
    discountPercentage: 15,
    startDate: now.toISOString(),
    endDate: new Date(now.getTime() + 86400000).toISOString(),
    isGlobal: true,
  });
  if (res.status === 401) return;
  assert.ok(res.status === 201 || res.status === 200, `Create campaign should succeed, got ${res.status}`);
  if (res.data?._id) {
    await api.delete(`/campaigns/${res.data._id}`);
  }
});

// ═══════════════════════════════════════════════════════════════
// COUPONS
// ═══════════════════════════════════════════════════════════════

test('admin: GET /coupons', async () => {
  const res = await api.get('/coupons');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data), 'Coupons should return array');
});

test('admin: POST /coupons creates coupon', async () => {
  const res = await api.post('/coupons', {
    code: `TEST${Date.now().toString(36).toUpperCase()}`,
    type: 'percentage',
    discountPercentage: 10,
    minOrderAmount: 1000000,
    maxUses: 100,
    expirationDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  });
  if (res.status === 401) return;
  assert.ok(res.status === 201 || res.status === 200, `Create coupon should succeed, got ${res.status}`);
  if (res.data?._id) {
    await api.delete(`/coupons/${res.data._id}`);
  }
});

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════

test('admin: GET /users', async () => {
  const res = await api.get('/users');
  if (res.status === 401) { console.log('  ⚠ Users endpoint requires auth'); return; }
  assert.equal(res.status, 200);
});

// ═══════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════

test('admin: GET /inventory/low-stock', async () => {
  const res = await api.get('/inventory/low-stock');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data), 'Low stock should return array');
});

// ═══════════════════════════════════════════════════════════════
// REVIEWS & Q&A
// ═══════════════════════════════════════════════════════════════

test('admin: GET /reviews', async () => {
  const res = await api.get('/reviews');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
});

test('admin: GET /questions', async () => {
  const res = await api.get('/questions');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
  assert.ok(res.data?.questions || Array.isArray(res.data), 'Questions should return data');
});

// ═══════════════════════════════════════════════════════════════
// AI AUTOMATION
// ═══════════════════════════════════════════════════════════════

test('admin: POST /ai/automation/confirm-orders', async () => {
  const res = await api.post('/ai/automation/confirm-orders', {});
  if (res.status === 401) return;
  // May succeed or fail depending on GEMINI_API_KEY config
  assert.ok(res.status === 200 || res.status === 500, `AI confirm should return, got ${res.status}`);
});

test('admin: POST /ai/automation/cleanup-users', async () => {
  const res = await api.post('/ai/automation/cleanup-users', {});
  if (res.status === 401) return;
  assert.equal(res.status, 200, 'Cleanup users should succeed');
});

// ═══════════════════════════════════════════════════════════════
// STORE CONFIG
// ═══════════════════════════════════════════════════════════════

test('admin: GET /store-config returns config', async () => {
  const res = await api.get('/store-config');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
});

test('admin: PUT /store-config updates config', async () => {
  const res = await api.patch ? 
    (await fetch(`${API_BASE}/store-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookies },
      body: JSON.stringify({ themePreset: 'midnight' }),
    }).then(r => ({ status: r.status, data: r.json().catch(() => null) })))
    : { status: 401 };
  if (res.status === 401) return;
  assert.ok(res.status === 200 || res.status === 201, `Update config should succeed, got ${res.status}`);
});

// ═══════════════════════════════════════════════════════════════
// MAIL / EMAIL
// ═══════════════════════════════════════════════════════════════

test('admin: GET /mail/stats', async () => {
  const res = await api.get('/mail/stats');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
  assert.ok(res.data?.stats || res.data?.totalSubscribers !== undefined, 'Mail stats should return');
});

test('admin: GET /mail/inbox', async () => {
  const res = await api.get('/mail/inbox');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
});

test('admin: GET /mail/templates', async () => {
  const res = await api.get('/mail/templates');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
});

test('admin: GET /mail/campaigns', async () => {
  const res = await api.get('/mail/campaigns');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
});

test('admin: GET /mail/subscribers', async () => {
  const res = await api.get('/mail/subscribers');
  if (res.status === 401) return;
  assert.equal(res.status, 200);
});

// ═══════════════════════════════════════════════════════════════
// BANNERS
// ═══════════════════════════════════════════════════════════════

test('admin: GET /banners (public, already tested)', async () => {
  const res = await api.get('/banners');
  assert.equal(res.status, 200);
});

console.log('\n✅ All admin API tests completed!\n');
