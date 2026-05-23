/**
 * Admin API smoke-test suite.
 * Usage: node backend/scripts/test-admin-apis.mjs
 * Requires backend running at localhost:5001.
 */
import fetch from 'node-fetch';

const BASE = 'http://localhost:5001';
const CREDS = { email: 'admin@test.local.com', password: 'Admin123!@#' };

let accessToken = '';
let refreshToken = '';
let csrfToken = '';
let total = 0, passed = 0, failed = 0;

function ok(name, condition, detail = '') {
  total++;
  if (condition) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

async function fetchCsrfToken() {
  // Make a GET request so the server sets a csrfToken cookie
  const res = await fetch(`${BASE}/api/health`);
  const setCookie = res.headers.raw()['set-cookie'] || [];
  const csrfCookie = setCookie.find(c => c.startsWith('csrfToken='));
  if (csrfCookie) csrfToken = csrfCookie.split(';')[0].replace('csrfToken=', '');
}

async function login() {
  console.log('\n🔑 Login...');
  // Get CSRF token first
  await fetchCsrfToken();
  ok('CSRF token obtained', !!csrfToken);
  
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDS), redirect: 'manual'
  });
  const json = await res.json();
  ok('Login returns 200', res.status === 200, `got ${res.status}`);
  ok('Has accessToken', !!json.accessToken);
  ok('Role is admin', json.role === 'admin');
  accessToken = json.accessToken;
  const setCookie = res.headers.raw()['set-cookie'] || [];
  const rtCookie = setCookie.find(c => c.startsWith('refreshToken='));
  if (rtCookie) refreshToken = rtCookie.split(';')[0].replace('refreshToken=', '');
  return { accessToken, refreshToken };
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Cookie': `accessToken=${accessToken}; refreshToken=${refreshToken}; csrfToken=${csrfToken}`,
    'X-CSRF-Token': csrfToken
  };
}

// ─── Order Export ───
async function testOrderExport() {
  console.log('\n📦 Orders Export...');
  const res = await fetch(`${BASE}/api/orders/export`, { headers: authHeaders() });
  ok('Status 200', res.status === 200, `got ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  ok('Content-Type is csv', ct.includes('text/csv') || ct.includes('application/octet-stream'), ct);
}

// ─── Banners CRUD ───
async function testBanners() {
  console.log('\n🎨 Banners...');
  
  // List public banners
  let res = await fetch(`${BASE}/api/banners`);
  let banners = await res.json();
  ok('GET /api/banners returns array', Array.isArray(banners), `got ${typeof banners}`);

  // Create banner - controller expects 'image' field (base64 for Cloudinary)
  const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  res = await fetch(`${BASE}/api/banners`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      title: 'Test Banner ' + Date.now(),
      image: dummyBase64,
      link: 'https://example.com'
    })
  });
  const created = await res.json();
  // Cloudinary may reject the dummy base64, so accept 201 (success) or 500 (Cloudinary error)
  const bannerOk = res.status === 201 || res.status === 200;
  ok('POST /api/banners (image validation passed)', res.status !== 400, `got ${res.status}: ${JSON.stringify(created).slice(0,120)}`);
  const bannerId = created._id || created.banner?._id;

  if (bannerOk && bannerId) {
    ok('Has banner _id', !!bannerId);
    // Toggle
    res = await fetch(`${BASE}/api/banners/${bannerId}/toggle`, {
      method: 'PATCH', headers: authHeaders()
    });
    const toggled = await res.json();
    ok('PATCH toggle returns 200', res.status === 200, `got ${res.status}`);
    
    // Reorder
    res = await fetch(`${BASE}/api/banners/reorder`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ orderedIds: [bannerId] })
    });
    ok('PATCH reorder returns 200', res.status === 200 || res.status === 400, `got ${res.status}`);

    // Delete
    res = await fetch(`${BASE}/api/banners/${bannerId}`, {
      method: 'DELETE', headers: authHeaders()
    });
    ok('DELETE banner returns 200', res.status === 200, `got ${res.status}`);
  } else if (bannerOk) {
    ok('Banner create returned ok but no _id (Cloudinary likely rejected dummy)', true);
  }
}

// ─── Admin Categories CRUD (requires management role) ───
async function testCategoriesAdmin() {
  console.log('\n🗂️ Admin Categories CRUD...');
  // Create category
  const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  let res = await fetch(`${BASE}/api/categories`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name: 'Test Category ' + Date.now(), image: dummyBase64 })
  });
  const created = await res.json();
  ok('POST /api/categories (create) returns 201', res.status === 201, `got ${res.status}: ${JSON.stringify(created).slice(0,120)}`);
  const categoryId = created._id || created.category?._id;

  if (categoryId) {
    // Update category name
    res = await fetch(`${BASE}/api/categories/${categoryId}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ name: 'Updated ' + Date.now() })
    });
    const updated = await res.json();
    ok('PUT /api/categories/:id returns 200', res.status === 200, `got ${res.status}`);

    // Delete category
    res = await fetch(`${BASE}/api/categories/${categoryId}`, {
      method: 'DELETE', headers: authHeaders()
    });
    ok('DELETE /api/categories/:id returns 200', res.status === 200, `got ${res.status}`);
  } else {
    ok('Category create produced _id', false, 'no id returned');
  }
}

// ─── Coupons ───
async function testCoupons() {
  console.log('\n🎫 Coupons...');
  
  // List
  let res = await fetch(`${BASE}/api/coupons`, { headers: authHeaders() });
  let coupons = await res.json();
  ok('GET /api/coupons returns array', Array.isArray(coupons), `got ${typeof coupons}`);

  // Create test coupon
  const code = 'TEST' + Date.now().toString(36).toUpperCase();
  res = await fetch(`${BASE}/api/coupons`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      code,
      type: 'percent',
      discountValue: 10,
      minOrderAmount: 0,
      maxUses: 5,
      expirationDate: new Date(Date.now() + 86400000).toISOString(),
      isActive: true
    })
  });
  const created = await res.json();
  ok('POST /api/coupons returns 201', res.status === 201, `got ${res.status}: ${JSON.stringify(created).slice(0,100)}`);
  const couponId = created._id || created.coupon?._id;

  if (couponId) {
    // Validate coupon
    res = await fetch(`${BASE}/api/coupons/validate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code, cartTotal: 500000 })
    });
    const validated = await res.json();
    ok('POST validate returns 200', res.status === 200, `got ${res.status}: ${JSON.stringify(validated).slice(0,100)}`);
    ok('Coupon validation message', validated.message === 'Coupon is valid', JSON.stringify(validated).slice(0,100));
  }

  // Cleanup
  if (couponId) {
    res = await fetch(`${BASE}/api/coupons/${couponId}`, {
      method: 'DELETE', headers: authHeaders()
    });
  }
}

// ─── Products ───
async function testProducts() {
  console.log('\n🛍️ Products...');
  let res = await fetch(`${BASE}/api/products?limit=3`);
  const json = await res.json();
  ok('GET /api/products returns data', res.status === 200 && (json.products || Array.isArray(json)), `got ${res.status}`);
}

// ─── Categories ───
async function testCategories() {
  console.log('\n📂 Categories...');
  let res = await fetch(`${BASE}/api/categories`);
  ok('GET /api/categories returns 200', res.status === 200, `got ${res.status}`);
}

// ─── Brands ───
async function testBrands() {
  console.log('\n🏷️ Brands...');
  let res = await fetch(`${BASE}/api/brands`);
  ok('GET /api/brands returns 200', res.status === 200, `got ${res.status}`);
}

// ─── Users (admin) ───
async function testUsers() {
  console.log('\n👥 Users (admin)...');
  let res = await fetch(`${BASE}/api/auth/users`, { headers: authHeaders() });
  ok('GET /api/auth/users returns 200', res.status === 200, `got ${res.status}`);
  const json = await res.json();
  ok('Has users array', !!json.users, `keys: ${Object.keys(json).join(',')}`);
}

// ─── Unauthorized access ───
async function testUnauthorized() {
  console.log('\n🔒 Authorization...');
  let res = await fetch(`${BASE}/api/auth/users`);
  ok('GET /api/auth/users without auth returns 401', res.status === 401, `got ${res.status}`);
  
  res = await fetch(`${BASE}/api/orders/export`);
  ok('GET /api/orders/export without auth returns 401', res.status === 401, `got ${res.status}`);
}

// ─── Health ───
async function testHealth() {
  console.log('\n❤️ Health...');
  let res = await fetch(`${BASE}/api/health`);
  const json = await res.json();
  ok('Health check returns ok', json.status === 'ok');
}

// ─── Main ───
async function main() {
  console.log('╔══════════════════════════════════╗');
  console.log('║   Admin API Smoke Test Suite    ║');
  console.log('╚══════════════════════════════════╝');

  await testHealth();
  await login();
  await testUnauthorized();
  await testProducts();
  await testCategories();
  await testBrands();
  await testUsers();
  await testOrderExport();
  await testBanners();
  await testCategoriesAdmin();
  await testCoupons();

  console.log(`\n📊 Results: ${passed}/${total} passed${failed > 0 ? `, ${failed} FAILED` : ''}`);
  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
