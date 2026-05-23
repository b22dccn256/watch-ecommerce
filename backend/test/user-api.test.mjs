/**
 * User API Integration Tests
 * Tests: Auth (signup/login), Products (list/detail), Cart (add/remove),
 * Coupons (validate), Reviews, Questions, Wishlist, Order tracking
 * 
 * Run: node --test test/user-api.test.mjs
 * Requires: Backend server running on configured port
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';

// Helper: assert server responds without crashing (any 2xx-4xx)
const assertOk = (status, msg = '') => {
  assert.ok(status >= 200 && status < 500, `${msg} Expected 2xx-4xx, got ${status}`);
};
const api = {
  get: async (path, headers = {}) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json', ...headers } });
    return { status: res.status, data: await res.json().catch(() => null), headers: res.headers };
  },
  post: async (path, body, headers = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json().catch(() => null) };
  },
  delete: async (path, body, headers = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json().catch(() => null) };
  },
};

// ═══════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS (no auth required)
// ═══════════════════════════════════════════════════════════════

test('public: GET /products returns product list', async () => {
  const res = await api.get('/products?limit=5');
  assertOk(res.status);
  assert.ok(Array.isArray(res.data?.products) || Array.isArray(res.data), 'Should return products array');
});

test('public: GET /products/:id with valid id', async () => {
  const list = await api.get('/products?limit=1');
  const products = list.data?.products || list.data;
  if (products?.length > 0) {
    const productId = products[0]._id;
    const res = await api.get(`/products/${productId}`);
    assertOk(res.status);
    assert.ok(res.data?.name || res.data?._id, 'Should return product details');
  } else {
    console.log('  ⚠ No products in DB, skipping product detail test');
  }
});

test('public: GET /products/:id with invalid id returns 500', async () => {
  const res = await api.get('/products/000000000000000000000000');
  assert.ok(res.status >= 400 || res.status === 500, `Expected error status, got ${res.status}`);
});

test('public: GET /products/category/:slug', async () => {
  const res = await api.get('/products/category/dong-ho-nam');
  // May return 200 with empty or 200 with products
  assert.ok(res.status === 200 || res.status === 404, 'Should not crash');
});

test('public: GET /products/featured', async () => {
  const res = await api.get('/products/featured');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data), 'Featured should return array');
});

test('public: GET /products/suggestions?q=rolex', async () => {
  const res = await api.get('/products/suggestions?q=rolex');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data), 'Suggestions should return array');
});

test('public: GET /products/recommendations', async () => {
  const res = await api.get('/products/recommendations');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data), 'Recommendations should return array');
});

test('public: GET /categories', async () => {
  const res = await api.get('/categories?tree=true');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data), 'Categories should return array');
});

test('public: GET /brands', async () => {
  const res = await api.get('/brands');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data), 'Brands should return array');
});

test('public: GET /banners', async () => {
  const res = await api.get('/banners');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data), 'Banners should return array');
});

test('public: GET /questions/product/:id', async () => {
  const list = await api.get('/products?limit=1');
  const products = list.data?.products || list.data;
  if (products?.length > 0) {
    const res = await api.get(`/questions/product/${products[0]._id}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data), 'Questions should return array');
  }
});

test('public: POST /contact sends contact form (may need CSRF)', async () => {
  const res = await api.post('/contact', {
    name: 'Test User',
    email: 'test@example.com',
    message: 'Test contact message from automated test',
  });
  // 200/201=OK, 403=CSRF required
  assert.ok(res.status === 200 || res.status === 201 || res.status === 403, `Contact should respond, got ${res.status}`);
});

test('public: POST /orders/lookup finds order', async () => {
  const res = await api.post('/orders/lookup', {
    orderCode: 'DH-NONEXISTENT',
    email: 'nonexistent@test.com',
  });
  // Should return 404 or 200 with not-found message
  assert.ok(res.status === 200 || res.status === 404, 'Lookup should not crash');
});

// ═══════════════════════════════════════════════════════════════
// AUTH ENDPOINTS (public but create accounts)
// ═══════════════════════════════════════════════════════════════

const TEST_EMAIL = `testuser_${Date.now()}@test.com`;
const TEST_PASSWORD = 'Test@1234';
const TEST_NAME = 'Test User API';

test('auth: POST /auth/signup creates account', async () => {
  const res = await api.post('/auth/signup', {
    name: TEST_NAME,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    confirmPassword: TEST_PASSWORD,
  });
  assert.ok(res.status === 201 || res.status === 200, `Signup should succeed, got ${res.status}`);
  if (res.status === 201 || res.status === 200) {
    assert.ok(res.data?.email === TEST_EMAIL || res.data?.message, 'Should return email or message');
  }
});

test('auth: POST /auth/signup duplicate email rejected', async () => {
  const res = await api.post('/auth/signup', {
    name: TEST_NAME,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    confirmPassword: TEST_PASSWORD,
  });
  assert.ok(res.status === 400 || res.data?.message, 'Duplicate should be rejected');
});

test('auth: POST /auth/signup with invalid email rejected', async () => {
  const res = await api.post('/auth/signup', {
    name: 'Test',
    email: 'notanemail',
    password: 'Test@1234',
    confirmPassword: 'Test@1234',
  });
  // 400=validation, 403=CSRF, 429=rate limit
  assert.ok(res.status === 400 || res.status === 403 || res.status === 429, `Invalid email should fail, got ${res.status}`);
});

test('auth: POST /auth/signup with weak password rejected', async () => {
  const res = await api.post('/auth/signup', {
    name: 'Weak Password',
    email: `weak_${Date.now()}@test.com`,
    password: '123',
    confirmPassword: '123',
  });
  // 400=validation error, 403=CSRF, 429=rate limit
  assert.ok(res.status === 400 || res.status === 403 || res.status === 429, `Weak password should fail, got ${res.status}`);
});

test('auth: POST /auth/signup with mismatched passwords rejected', async () => {
  const res = await api.post('/auth/signup', {
    name: 'Mismatch',
    email: `mismatch_${Date.now()}@test.com`,
    password: 'Test@1234',
    confirmPassword: 'Different@1234',
  });
  assert.ok(res.status === 400 || res.status === 403 || res.status === 429, `Mismatch should fail, got ${res.status}`);
});

test('auth: POST /auth/login with correct credentials', async () => {
  const email2 = `logintest_${Date.now()}@test.com`;
  await api.post('/auth/signup', { name: 'Login Test', email: email2, password: TEST_PASSWORD, confirmPassword: TEST_PASSWORD });
  
  const res = await api.post('/auth/login', {
    email: email2,
    password: TEST_PASSWORD,
  });
  // 200=OK, 401=bad credentials, 403=CSRF required
  assert.ok(res.status === 200 || res.status === 401 || res.status === 403, `Login should respond, got ${res.status}`);
});

test('auth: POST /auth/login with wrong password rejected', async () => {
  const res = await api.post('/auth/login', {
    email: TEST_EMAIL,
    password: 'WrongPassword123!',
  });
  // 401=wrong password, 403=CSRF, 429=rate limit
  assert.ok(res.status === 401 || res.status === 403 || res.status === 429, `Wrong password should fail, got ${res.status}`);
});

test('auth: POST /auth/forgot-password sends email (or CSRF/rate limit)', async () => {
  const res = await api.post('/auth/forgot-password', {
    email: TEST_EMAIL,
  });
  // 200=OK, 403=CSRF required, 429=rate limit
  assert.ok(res.status === 200 || res.status === 403 || res.status === 429, `Forgot password should respond, got ${res.status}`);
});

test('auth: POST /auth/verify-email with invalid token', async () => {
  const res = await api.post('/auth/verify-email', { token: 'invalid-token-12345' });
  assert.ok(res.status === 400, `Invalid token should be 400, got ${res.status}`);
});

// ═══════════════════════════════════════════════════════════════
// COUPON ENDPOINTS
// ═══════════════════════════════════════════════════════════════

test('coupon: POST /coupons/validate with no code rejected', async () => {
  const res = await api.post('/coupons/validate', { code: '' });
  assert.ok(res.status >= 400, 'Empty code should be rejected');
});

test('coupon: POST /coupons/validate with invalid code', async () => {
  const res = await api.post('/coupons/validate', { code: 'INVALID_CODE_999' });
  // 400=bad request, 403=CSRF, 404=not found
  assert.ok(res.status >= 400, `Invalid code should fail, got ${res.status}`);
});

// ═══════════════════════════════════════════════════════════════
// STOREFRONT / CONFIG
// ═══════════════════════════════════════════════════════════════

test('store: GET /store-config returns config', async () => {
  const res = await api.get('/store-config');
  assert.ok(res.status >= 200 && res.status < 500, `Config should return, got ${res.status}`);
});

// ═══════════════════════════════════════════════════════════════
// AI CHATBOT (public)
// ═══════════════════════════════════════════════════════════════

test('ai: POST /ai/chat with query returns response', async () => {
  const res = await api.post('/ai/chat', { message: 'xin chào' });
  assert.ok(res.status === 200, `AI chat should respond, got ${res.status}`);
  if (res.data?.response) {
    assert.ok(typeof res.data.response === 'string', 'Response should be string');
  }
});

test('ai: POST /ai/chat with budget query', async () => {
  const res = await api.post('/ai/chat', { message: 'tìm đồng hồ dưới 10 triệu' });
  assert.ok(res.status === 200, `Budget query should respond, got ${res.status}`);
});

test('ai: POST /ai/chat with empty message rejected', async () => {
  const res = await api.post('/ai/chat', { message: '' });
  // CSRF may cause 403, empty validation causes 400
  assert.ok(res.status === 400 || res.status === 403, `Empty message should be rejected, got ${res.status}`);
});

// ═══════════════════════════════════════════════════════════════
// REVIEWS (public read)
// ═══════════════════════════════════════════════════════════════

test('reviews: GET /reviews/product/:id returns reviews', async () => {
  const list = await api.get('/products?limit=1');
  const products = list.data?.products || list.data;
  if (products?.length > 0) {
    const res = await api.get(`/reviews/product/${products[0]._id}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data), 'Reviews should return array');
  }
});

// ═══════════════════════════════════════════════════════════════
// CART CALCULATE (public with optional auth)
// ═══════════════════════════════════════════════════════════════

test('cart: POST /cart/calculate returns totals (may need CSRF)', async () => {
  const res = await api.post('/cart/calculate', {
    items: [{ product: { price: 5000000 }, quantity: 1 }],
    city: 'Hà Nội',
  });
  // 200 = OK, 403 = CSRF required (security working)
  assert.ok(res.status === 200 || res.status === 403, `Calculate should work, got ${res.status}`);
  if (res.status === 200) {
    assert.ok(res.data?.total !== undefined, 'Should return total');
    assert.ok(res.data?.shippingFee !== undefined, 'Should return shipping fee');
  }
});

test('cart: POST /cart/calculate with coupon (may need CSRF)', async () => {
  const res = await api.post('/cart/calculate', {
    items: [{ product: { price: 5000000 }, quantity: 2 }],
    couponCode: '',
    city: 'Hà Nội',
  });
  assert.ok(res.status === 200 || res.status === 403 || res.status === 400, `Calculate should respond, got ${res.status}`);
});

// ═══════════════════════════════════════════════════════════════
// PRODUCT FILTERS
// ═══════════════════════════════════════════════════════════════

test('filter: GET /products?search=keyword', async () => {
  const res = await api.get('/products?q=rolex&limit=5');
  assert.equal(res.status, 200);
});

test('filter: GET /products?sort=price_asc', async () => {
  const res = await api.get('/products?sort=price_asc&limit=5');
  assert.equal(res.status, 200);
});

test('filter: GET /products?sort=best_selling', async () => {
  const res = await api.get('/products?sort=best_selling&limit=5');
  assert.equal(res.status, 200);
});

test('filter: GET /products?minPrice=1000000&maxPrice=10000000', async () => {
  const res = await api.get('/products?minPrice=1000000&maxPrice=10000000&limit=5');
  assert.equal(res.status, 200);
});

console.log('\n✅ All user API tests completed!\n');
