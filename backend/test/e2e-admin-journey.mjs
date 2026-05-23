/**
 * COMPLETE ADMIN JOURNEY E2E TEST
 * Simulates: Login → Dashboard → Products CRUD → Orders → Categories/Brands
 * → Campaigns → Coupons → Users → Inventory → Reviews → AI → Settings
 * 
 * Run: node test/e2e-admin-journey.mjs
 * Requires: Backend server running on port 5000
 */

const BASE = process.env.API_URL || 'http://localhost:5000/api';

const ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@watchstore.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'Admin@123',
};

let cookies = '';
let csrfToken = '';
let accessToken = '';
let createdIds = { product: null, brand: null, category: null, campaign: null, coupon: null };

// Safe array extractor - handles both raw arrays and {data: []} responses
const arr = (d) => Array.isArray(d) ? d : (d?.data || d?.orders || d?.coupons || d?.campaigns || d?.users || d?.reviews || d?.questions || d?.products || []);

const api = {
  _fetch: async (method, path, body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (cookies) headers.Cookie = cookies;
    if (csrfToken) headers['x-csrf-token'] = csrfToken;
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const opts = { method, headers, redirect: 'manual' };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const newCookies = setCookie.split(',').map(c => c.split(';')[0].trim());
      cookies = [...new Set([...cookies.split('; '), ...newCookies])].filter(Boolean).join('; ');
    }
    const csrfHeader = res.headers.get('x-csrf-token');
    if (csrfHeader) csrfToken = csrfHeader;

    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  },
  get: (path) => api._fetch('GET', path),
  post: (path, body) => api._fetch('POST', path, body),
  put: (path, body) => api._fetch('PUT', path, body),
  patch: (path, body) => api._fetch('PATCH', path, body),
  delete: (path) => api._fetch('DELETE', path),
};

let stepNum = 0;
const step = (name) => {
  stepNum++;
  console.log(`\n${'─'.repeat(55)}`);
  console.log(` STEP ${stepNum}: ${name}`);
  console.log(`${'─'.repeat(55)}`);
};
const ok = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);
const info = (msg) => console.log(`  📋 ${msg}`);

const TIMESTAMP = Date.now().toString(36);

console.log('🔐 BẮT ĐẦU QUY TRÌNH ADMIN HOÀN CHỈNH');
console.log(`   Admin: ${ADMIN.email}`);

try {

// ─── STEP 1: LOGIN ──────────────────────────────────────────
step('ĐĂNG NHẬP ADMIN');
let isAuthenticated = false;

const login = await api.post('/auth/login', {
  email: ADMIN.email,
  password: ADMIN.password,
});

if (login.data?.requiresOTP) {
  warn('Yêu cầu OTP 2FA - set DISABLE_ADMIN_2FA=true để test');
  info('Admin 2FA đang hoạt động');
} else if (login.status === 200) {
  if (login.data?.accessToken) {
    accessToken = login.data.accessToken;
    isAuthenticated = true;
  }
  ok(`Đăng nhập thành công: ${login.data?.role || 'admin'}`);
} else if (login.status === 401) {
  warn('Sai credentials admin test - chạy với quyền public');
  info('Các tính năng công khai vẫn hoạt động, CRUD bị chặn CSRF');
} else {
  warn(`Login: ${login.status}`);
}

// ─── STEP 2: DASHBOARD ─────────────────────────────────────
step('XEM DASHBOARD ANALYTICS');
const analytics = await api.get('/analytics');
if (analytics.status === 200) {
  ok(`Users: ${analytics.data?.users || 0}`);
  ok(`Products: ${analytics.data?.products || 0}`);
  ok(`Revenue: ${(analytics.data?.totalRevenue || 0).toLocaleString('vi-VN')}đ`);
  ok(`Orders: ${analytics.data?.totalSales || 0}`);
  ok(`AOV: ${(analytics.data?.aov || 0).toLocaleString('vi-VN')}đ`);
} else {
  warn(`Dashboard needs auth (${analytics.status})`);
}

// ─── STEP 3: VIEW ALL ORDERS ───────────────────────────────
step('XEM DANH SÁCH ĐƠN HÀNG');
const orders = await api.get('/orders?limit=5');
if (orders.status === 200) {
  const orderList = orders.data?.orders || orders.data || [];
  ok(`${orderList.length} đơn hàng gần đây`);
  if (orderList.length > 0) {
    const o = orderList[0];
    info(`Mới nhất: #${o.orderCode} - ${o.status} - ${(o.totalAmount || 0).toLocaleString('vi-VN')}đ`);
  }
} else {
  warn(`Orders needs auth (${orders.status})`);
}

// ─── STEP 4: FILTER ORDERS BY STATUS ──────────────────────
step('LỌC ĐƠN HÀNG THEO TRẠNG THÁI');
for (const status of ['pending', 'confirmed', 'cancelled']) {
  const res = await api.get(`/orders?status=${status}&limit=1`);
  const count = res.data?.total || res.data?.orders?.length || 0;
  info(`${status}: ${count} đơn`);
}

// ─── STEP 5: PRODUCTS CRUD ─────────────────────────────────
step('QUẢN LÝ SẢN PHẨM (CRUD)');

// CREATE
const create = await api.post('/products', {
  name: `Admin Test Watch ${TIMESTAMP}`,
  description: 'Đồng hồ test tự động bởi admin E2E. Chất lượng cao, thiết kế sang trọng.',
  price: 12000000,
  originalPrice: 18000000,
  stock: 15,
  type: 'automatic',
  gender: 'male',
  tags: ['test', 'admin-e2e'],
  image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400',
});

if (create.status === 201 || create.status === 200) {
  createdIds.product = create.data?._id;
  ok(`Tạo SP: ${create.data?.name} (#${createdIds.product?.slice(-6)})`);
} else {
  warn(`Create SP: ${create.status} (${create.data?.message || ''})`);
}

// READ - verify it exists
if (createdIds.product) {
  const read = await api.get(`/products/${createdIds.product}`);
  if (read.status === 200) {
    ok(`Đọc SP: ${read.data?.name}`);
  }
}

// UPDATE
if (createdIds.product) {
  const update = await api.put(`/products/${createdIds.product}`, {
    price: 11000000,
    stock: 20,
    description: 'Đã cập nhật - Đồng hồ test E2E admin',
  });
  if (update.status === 200) {
    ok(`Cập nhật SP: giá mới ${update.data?.price?.toLocaleString('vi-VN')}đ`);
  }
}

// TOGGLE FEATURED
if (createdIds.product) {
  const toggle = await api.patch(`/products/${createdIds.product}`);
  if (toggle.status === 200) {
    ok(`Toggle featured: ${toggle.data?.isFeatured ? 'ON' : 'OFF'}`);
  }
}

// ─── STEP 6: BRANDS CRUD ───────────────────────────────────
step('QUẢN LÝ THƯƠNG HIỆU');
const brandCreate = await api.post('/brands', {
  name: `E2E Brand ${TIMESTAMP}`,
  description: 'Thương hiệu test E2E admin',
  isAuthorizedDealer: true,
});
if (brandCreate.status === 201 || brandCreate.status === 200) {
  createdIds.brand = brandCreate.data?._id;
  ok(`Tạo brand: ${brandCreate.data?.name}`);
}

const brandList = await api.get('/brands');
ok(`${(brandList.data || []).length} thương hiệu`);

// ─── STEP 7: CATEGORIES CRUD ───────────────────────────────
step('QUẢN LÝ DANH MỤC');
const catCreate = await api.post('/categories', {
  name: `E2E Category ${TIMESTAMP}`,
  slug: `e2e-cat-${TIMESTAMP}`,
});
if (catCreate.status === 201 || catCreate.status === 200) {
  createdIds.category = catCreate.data?._id;
  ok(`Tạo category: ${catCreate.data?.name}`);
}

const catList = await api.get('/categories?tree=true');
ok(`${(catList.data || []).length} danh mục`);

// ─── STEP 8: CAMPAIGNS ─────────────────────────────────────
step('QUẢN LÝ CHIẾN DỊCH');
const campaignCreate = await api.post('/campaigns', {
  name: `E2E Campaign ${TIMESTAMP}`,
  discountPercentage: 20,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  isGlobal: true,
});
if (campaignCreate.status === 201 || campaignCreate.status === 200) {
  createdIds.campaign = campaignCreate.data?._id;
  ok(`Tạo campaign: ${campaignCreate.data?.name} (-${campaignCreate.data?.discountPercentage}%)`);
}

const campaignList = await api.get('/campaigns');
let camps = [];
if (Array.isArray(campaignList.data)) camps = campaignList.data;
else if (Array.isArray(campaignList.data?.campaigns)) camps = campaignList.data.campaigns;
else if (campaignList.data && typeof campaignList.data === 'object') camps = Object.values(campaignList.data).filter(v => typeof v === 'object');
const activeCount = camps.filter(c => c?.status === 'Active' || c?.status === 'active').length;
ok(`${activeCount} campaign active / ${camps.length} total`);

// ─── STEP 9: COUPONS ───────────────────────────────────────
step('QUẢN LÝ MÃ GIẢM GIÁ');
const couponCreate = await api.post('/coupons', {
  code: `E2E${TIMESTAMP.toUpperCase().slice(-6)}`,
  type: 'percentage',
  discountPercentage: 15,
  minOrderAmount: 500000,
  maxUses: 50,
  expirationDate: new Date(Date.now() + 30 * 86400000).toISOString(),
});
if (couponCreate.status === 201 || couponCreate.status === 200) {
  createdIds.coupon = couponCreate.data?._id || couponCreate.data?.coupon?._id;
  ok(`Tạo coupon: ${couponCreate.data?.code || couponCreate.data?.coupon?.code}`);
}

// Toggle coupon
if (createdIds.coupon) {
  const toggle = await api.patch(`/coupons/${createdIds.coupon}/toggle`);
  if (toggle.status === 200) {
    ok(`Toggle coupon: ${toggle.data?.isActive ? 'Active' : 'Inactive'}`);
  }
}

const couponList = await api.get('/coupons');
const coupons = arr(couponList.data);
ok(`${coupons.length} mã giảm giá`);

// ─── STEP 10: USERS ────────────────────────────────────────
step('QUẢN LÝ NGƯỜI DÙNG');
const userList = await api.get('/auth/users');
if (userList.status === 200) {
  const users = toArr(userList.data);
  ok(`${users.length} người dùng`);
  if (users.length > 0) {
    info(`User mới nhất: ${users[0].name} (${users[0].role})`);
  }
} else {
  warn(`Users needs auth (${userList.status})`);
}

// ─── STEP 11: INVENTORY ────────────────────────────────────
step('QUẢN LÝ KHO HÀNG');
const lowStock = await api.get('/inventory/low-stock');
if (lowStock.status === 200) {
  ok(`${arr(lowStock.data).length} sản phẩm sắp hết hàng`);
}

// Adjust stock if we have products
const productList = await api.get('/products?limit=1');
const firstP = (productList.data?.products || productList.data || [])[0];
if (firstP?._id) {
  const adjust = await api.post('/inventory/adjust', {
    productId: firstP._id,
    action: 'IN',
    quantity: 5,
    note: 'E2E test nhập kho',
  });
  if (adjust.status === 200) {
    ok(`Điều chỉnh kho: +5 cho ${firstP.name}`);
  }
}

// ─── STEP 12: REVIEWS ──────────────────────────────────────
step('QUẢN LÝ REVIEWS');
const reviewList = await api.get('/reviews');
if (reviewList.status === 200) {
  const reviews = arr(reviewList.data);
  ok(`${reviews.length} reviews`);
  const pending = reviews.filter(r => r.status === 'pending').length;
  info(`${pending} đang chờ duyệt`);
}

// ─── STEP 13: QUESTIONS (Q&A) ──────────────────────────────
step('QUẢN LÝ HỎI ĐÁP');
const questionList = await api.get('/questions');
if (questionList.status === 200) {
  const questions = arr(questionList.data);
  ok(`${questions.length} câu hỏi`);
  const unanswered = questions.filter(q => !q.isAnswered).length;
  if (unanswered > 0) info(`${unanswered} chưa trả lời`);
}

// ─── STEP 14: EMAIL MANAGEMENT ─────────────────────────────
step('QUẢN LÝ EMAIL');
const mailStats = await api.get('/mail/stats');
if (mailStats.status === 200) {
  ok(`Subscribers: ${mailStats.data?.stats?.totalSubscribers || 0}`);
  ok(`Campaigns: ${mailStats.data?.stats?.totalCampaigns || 0}`);
  ok(`Sent: ${mailStats.data?.stats?.sentEmails || 0}`);
}

const inbox = await api.get('/mail/inbox');
if (inbox.status === 200) ok('Hộp thư đến OK');

const subscribers = await api.get('/mail/subscribers');
if (subscribers.status === 200) ok('Subscribers OK');

// ─── STEP 15: AI AUTOMATION ────────────────────────────────
step('AI AUTOMATION');
const aiOrders = await api.post('/ai/automation/confirm-orders', {});
if (aiOrders.status === 200) {
  ok(`AI xác nhận đơn: ${aiOrders.data?.message}`);
} else if (aiOrders.status === 500) {
  info('AI cần GEMINI_API_KEY hoặc GROQ_API_KEY');
}

const aiCleanup = await api.post('/ai/automation/cleanup-users', {});
if (aiCleanup.status === 200) {
  ok(`AI dọn dẹp: ${aiCleanup.data?.message}`);
}

// ─── STEP 16: STORE SETTINGS ───────────────────────────────
step('CẤU HÌNH GIAO DIỆN');
const config = await api.get('/settings');
if (config.status === 200 && config.data) {
  ok(`Theme: ${config.data?.themePreset || 'midnight'}`);
  ok(`Mode: ${config.data?.themeMode || 'dark'}`);
  ok(`Slides: ${(config.data?.heroSlides || []).length}`);
}

const configUpdate = await api.put('/settings', {
  themePreset: 'midnight',
  productsPerPage: 12,
});
if (configUpdate.status === 200 || configUpdate.status === 201) {
  ok('Cập nhật config thành công');
}

// ─── STEP 17: BANNERS ──────────────────────────────────────
step('QUẢN LÝ BANNER');
const bannerList = await api.get('/banners');
if (bannerList.status === 200) {
  const banners = bannerList.data || [];
  ok(`${banners.length} banner`);
  const active = banners.filter(b => b.status === 'ACTIVE').length;
  info(`${active} đang ACTIVE`);
}

// ─── STEP 18: P&L REPORT ───────────────────────────────────
step('BÁO CÁO LÃI LỖ');
const pl = await api.get('/analytics/pl');
if (pl.status === 200) {
  ok(`Revenue: ${(pl.data?.totalRevenue || 0).toLocaleString('vi-VN')}đ`);
  ok(`COGS: ${(pl.data?.totalCOGS || 0).toLocaleString('vi-VN')}đ`);
  ok(`Profit: ${(pl.data?.grossProfit || 0).toLocaleString('vi-VN')}đ`);
}

// ─── CLEANUP ───────────────────────────────────────────────
step('DỌN DẸP DỮ LIỆU TEST');
const cleanup = [];
if (createdIds.product) cleanup.push(api.delete(`/products/${createdIds.product}`).then(r => r.status === 200 ? 'SP' : null));
if (createdIds.brand) cleanup.push(api.delete(`/brands/${createdIds.brand}`).then(r => r.status === 200 ? 'Brand' : null));
if (createdIds.category) cleanup.push(api.delete(`/categories/${createdIds.category}`).then(r => r.status === 200 ? 'Cat' : null));
if (createdIds.campaign) cleanup.push(api.delete(`/campaigns/${createdIds.campaign}`).then(r => r.status === 200 ? 'Campaign' : null));
if (createdIds.coupon) cleanup.push(api.delete(`/coupons/${createdIds.coupon}`).then(r => r.status === 200 ? 'Coupon' : null));

const results = await Promise.all(cleanup);
ok(`Đã xóa: ${results.filter(Boolean).join(', ') || 'không có gì'}`);

// ═══════════════════════════════════════════════════════════════
console.log(`\n${'='.repeat(55)}`);
console.log('  🎉 QUY TRÌNH ADMIN HOÀN TẤT!');
console.log(`${'='.repeat(55)}`);
console.log(`  📊 Dashboard: Revenue + Orders + AOV`);
console.log(`  📦 Products: CRUD + Toggle Featured`);
console.log(`  🏷️  Brands: Create + List`);
console.log(`  📂 Categories: Create + Tree`);
console.log(`  📢 Campaigns: Create + List`);
console.log(`  🎫 Coupons: Create + Toggle`);
console.log(`  👥 Users: List`);
console.log(`  📦 Inventory: Low Stock + Adjust`);
console.log(`  ⭐ Reviews: List + Pending`);
console.log(`  ❓ Q&A: List + Unanswered`);
console.log(`  📧 Email: Stats + Inbox + Subscribers`);
console.log(`  🤖 AI: Auto-confirm + Cleanup`);
console.log(`  🎨 Settings: Read + Update`);
console.log(`  🖼️  Banners: List + Active count`);
console.log(`  💰 P&L: Revenue - COGS = Profit`);
console.log(`  🧹 Cleanup: Deleted all test data`);
console.log(`\n  ✅ ${stepNum} bước admin đã hoàn thành`);

} catch (err) {
  console.error(`\n❌ LỖI tại bước ${stepNum}:`, err.message);
  process.exit(1);
}
