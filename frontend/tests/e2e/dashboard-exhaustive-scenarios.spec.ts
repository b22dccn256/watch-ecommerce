/**
 * DASHBOARD EXHAUSTIVE SCENARIOS E2E Test Suite
 * Covers financial integrity, inventory safeguards, and staff role access cascades.
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import { skipIfBackendUnavailable } from './helpers/backend';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'ha8893536@gmail.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';

test.describe.serial('🛡️ Admin & Dashboard Exhaustive Scenarios', () => {
  let adminApi;
  let staffApi;
  let customerApi;
  let brandId = '';
  let categoryId = '';
  let productId = '';
  let campaignId = '';
  let couponId = '';
  let staffUserId = '';

  const staffUserEmail = `staff.e2e.${Date.now()}@test.com`;
  const staffUserPassword = 'StaffPassword123!';

  test.beforeAll(async () => {
    await skipIfBackendUnavailable();

    // 1. Initialise Admin API Context
    adminApi = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
    const loginRes = await adminApi.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();

    // 2. Setup dependency Brand & Category
    const brandRes = await adminApi.post('/api/brands', {
      data: { name: `Exhaustive Brand ${Date.now()}`, description: 'Test Brand' },
    });
    if (brandRes.ok()) {
      const brand = await brandRes.json();
      brandId = brand._id;
    }

    const catRes = await adminApi.post('/api/categories', {
      data: { name: `Exhaustive Category ${Date.now()}`, slug: `exhaustive-cat-${Date.now()}` },
    });
    if (catRes.ok()) {
      const cat = await catRes.json();
      categoryId = cat._id;
    }

    // 3. Create a staff user to test access cascades
    const signupRes = await adminApi.post('/api/auth/signup', {
      data: {
        name: 'Nguyen Van Staff',
        email: staffUserEmail,
        phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
        password: staffUserPassword,
      },
    });
    expect(signupRes.ok()).toBeTruthy();

    // Get the created staff user ID
    const usersRes = await adminApi.get('/api/auth/users?limit=100');
    if (usersRes.ok()) {
      const usersData = await usersRes.json();
      const matched = (usersData.users || []).find((u) => u.email === staffUserEmail);
      if (matched) staffUserId = matched._id;
    }
  });

  test.afterAll(async () => {
    if (adminApi) {
      if (productId) await adminApi.delete(`/api/products/${productId}`).catch(() => {});
      if (campaignId) await adminApi.delete(`/api/campaigns/${campaignId}`).catch(() => {});
      if (couponId) await adminApi.delete(`/api/coupons/${couponId}`).catch(() => {});
      if (categoryId) await adminApi.delete(`/api/categories/${categoryId}`).catch(() => {});
      if (brandId) await adminApi.delete(`/api/brands/${brandId}`).catch(() => {});
      if (staffUserId) await adminApi.delete(`/api/auth/users/${staffUserId}`).catch(() => {});
      await adminApi.dispose();
    }
    if (staffApi) await staffApi.dispose();
    if (customerApi) await customerApi.dispose();
  });

  // ────────────────────────────────────────────────────────────────────────
  // 🛡️ NHÓM A: RÀO CHẮN TÀI CHÍNH & DÒNG TIỀN (FINANCIAL INTEGRITY)
  // ────────────────────────────────────────────────────────────────────────

  test('A.1 Chặn bán giá dưới giá vốn / giá âm', async () => {
    // Attempt to create a product with retail price lower than cost price
    const prodRes = await adminApi.post('/api/products', {
      data: {
        name: 'Violating Product Price',
        price: 50000,
        costPrice: 80000, // price < costPrice is a financial violation
        stock: 10,
        brand: brandId,
        categoryId: categoryId,
        type: 'quartz',
      },
    });

    // Mongoose validator or controller should block this
    expect(prodRes.status()).toBe(400);
    const errBody = await prodRes.json();
    expect(errBody.message).toContain('giá nhập');
  });

  test('A.2 Chặn thanh toán 0đ hoặc âm (Thanh toán thực tế tối thiểu 10,000 VND)', async () => {
    // 1. Create a valid product
    const prodRes = await adminApi.post('/api/products', {
      data: {
        name: 'Affordable Watch',
        price: 25000, // Base price 25,000 VND
        costPrice: 15000,
        stock: 50,
        brand: brandId,
        categoryId: categoryId,
        type: 'quartz',
      },
    });
    expect(prodRes.ok()).toBeTruthy();
    const product = await prodRes.json();
    productId = product._id;

    // 2. Create an extremely large discount coupon (e.g. 50,000 VND or 100% discount)
    const couponRes = await adminApi.post('/api/coupons', {
      data: {
        code: `MASSIVE${Date.now().toString().slice(-4)}`,
        discountPercentage: 100, // 100% off
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    expect(couponRes.ok()).toBeTruthy();
    const coupon = await couponRes.json();
    couponId = coupon._id;

    // 3. Test API-level order calculation or placement
    // A guest orders this product and applies the massive 100% discount coupon
    const orderRes = await adminApi.post('/api/orders/cod', {
      data: {
        items: [{ product: productId, quantity: 1, price: 25000 }],
        coupon: coupon.code,
        shippingDetails: {
          fullName: 'Exhaustive Finance Tester',
          phoneNumber: '0901234567',
          address: '123 E2E Finance St',
          city: 'Hanoi',
        },
      },
    });

    expect(orderRes.ok()).toBeTruthy();
    const order = await orderRes.json();

    // Verify order total is corrected to at least the transaction fee minimum of 10,000 VND
    expect(order.totalAmount).toBeGreaterThanOrEqual(10000);
  });

  test('A.3 Giảm giá kép (Campaign + Coupon) tính tuần tự tránh thất thoát', async () => {
    // 1. Create a product specifically for the dual discount test
    const prodRes = await adminApi.post('/api/products', {
      data: {
        name: 'Dual Discount Watch',
        price: 100000, // Base price 100k
        costPrice: 50000,
        stock: 20,
        brand: brandId,
        categoryId: categoryId,
        type: 'automatic',
      },
    });
    expect(prodRes.ok()).toBeTruthy();
    const targetProduct = await prodRes.json();

    // 2. Create a global active campaign with 20% discount
    const campRes = await adminApi.post('/api/campaigns', {
      data: {
        name: `Camp E2E ${Date.now()}`,
        group: 'Entire Catalog',
        discountPercentage: 20, // 20% discount
        startDate: new Date(Date.now() - 3600000).toISOString(), // Active
        endDate: new Date(Date.now() + 86400000).toISOString(),
        isGlobal: true,
      },
    });
    expect(campRes.ok()).toBeTruthy();
    const camp = await campRes.json();
    campaignId = camp._id;

    // 3. Create a coupon with 10% discount
    const testCouponCode = `COUP${Date.now().toString().slice(-4)}`;
    const cpRes = await adminApi.post('/api/coupons', {
      data: {
        code: testCouponCode,
        discountPercentage: 10, // 10% discount
        expirationDate: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    expect(cpRes.ok()).toBeTruthy();
    const cp = await cpRes.json();

    // 4. Create API call to place order to verify calculations
    // Base: 100,000 VND
    // Campaign 20% -> Product price becomes 80,000 VND
    // Coupon 10% on Subtotal (80,000 VND) -> Discount of 8,000 VND
    // Expected Total: 80,000 - 8,000 = 72,000 VND + Shipping fee
    const oRes = await adminApi.post('/api/orders/cod', {
      data: {
        items: [{ product: targetProduct._id, quantity: 1, price: 100000 }],
        coupon: testCouponCode,
        shippingDetails: {
          fullName: 'Campaign Coupon Tester',
          phoneNumber: '0901234567',
          address: '456 Coupon St',
          city: 'Hanoi', // free shipping limit threshold is 5M, under is 30k (Hanoi)
        },
      },
    });

    expect(oRes.ok()).toBeTruthy();
    const finalOrder = await oRes.json();

    // Subtotal (with campaign applied): 80,000 VND
    // Coupon discount (10% of subtotal): 8,000 VND
    // Shipping: 30,000 VND
    // Expected order total: 80,000 - 8,000 + 30,000 = 102,000 VND
    // Additive calculation (30% total discount on 100k) would yield: 100,000 - 30,000 + 30,000 = 100,000 VND
    // We expect the safe sequential pricing: 102,000 VND
    console.log('Final Order Body:', finalOrder);
    expect(finalOrder.totalAmount).toBe(102000);

    // Clean up campaign & product
    await adminApi.delete(`/api/campaigns/${camp._id}`).catch(() => {});
    await adminApi.delete(`/api/coupons/${cp._id}`).catch(() => {});
    await adminApi.delete(`/api/products/${targetProduct._id}`).catch(() => {});
    campaignId = '';
  });

  // ────────────────────────────────────────────────────────────────────────
  // 📦 NHÓM B: CHỐNG THẤT THOÁT & TRÔI NỔI KHO HÀNG (INVENTORY SAFEGUARDS)
  // ────────────────────────────────────────────────────────────────────────

  test('B.1 Chặn bán vượt tồn kho (Overselling)', async () => {
    // Attempt to order a quantity greater than available stock
    const badOrderRes = await adminApi.post('/api/orders/cod', {
      data: {
        items: [{ product: productId, quantity: 9999, price: 25000 }], // 9999 is way above stock
        shippingDetails: {
          fullName: 'Oversell Tester',
          phoneNumber: '0901234567',
          address: '789 Stock St',
          city: 'Hanoi',
        },
      },
    });

    // Expecting server to block the order placement
    expect(badOrderRes.status()).toBe(400);
    const errBody = await badOrderRes.json();
    expect(errBody.message).toContain('chỉ còn');
  });

  test('B.2 Tự động kích hoạt Cảnh báo tồn kho thấp (Low Stock Alert)', async () => {
    // 1. Set the product's stock below its lowStockThreshold
    // productId currently exists. Let's adjust its stock to 3 (which is <= lowStockThreshold of 5)
    const adjustRes = await adminApi.post('/api/inventory/adjust', {
      data: {
        productId: productId,
        action: 'ADJUST',
        quantity: 3,
        note: 'E2E trigger low stock alert',
      },
    });
    expect(adjustRes.ok()).toBeTruthy();

    // 2. Fetch the low stock alerts
    const alertsRes = await adminApi.get('/api/products/inventory/alerts');
    expect(alertsRes.ok()).toBeTruthy();
    const alertsData = await alertsRes.json();

    // Verify the product is now present in the alerts list
    const foundAlert = (alertsData.products || alertsData).find((p) => p._id === productId);
    expect(foundAlert).toBeTruthy();
  });

  test('B.3 Nhật ký kiểm kho (Inventory History Audit)', async () => {
    // Verify that the adjustment in B.2 created a proper audit record
    const logsRes = await adminApi.get(`/api/inventory/product/${productId}`);
    expect(logsRes.ok()).toBeTruthy();
    const logsData = await logsRes.json();

    // Check that we have at least one OUT/ADJUST/IN record
    expect(logsData.length).toBeGreaterThan(0);
    const lastLog = logsData[logsData.length - 1];
    expect(lastLog.note).toBe('E2E trigger low stock alert');
  });

  // ────────────────────────────────────────────────────────────────────────
  // 🔐 NHÓM C: PHÂN QUYỀN & GIỚI HẠN NHÂN VIÊN (ACCESS CONTROL CASCADES)
  // ────────────────────────────────────────────────────────────────────────

  test('C.1 Cấp quyền Nhân viên (Staff) & Chặn 403 đối với thao tác nhạy cảm', async () => {
    // 1. Promote staff user to "staff" role
    const promoteRes = await adminApi.patch(`/api/auth/users/${staffUserId}/role`, {
      data: { role: 'staff' },
    });
    expect(promoteRes.ok()).toBeTruthy();

    // 2. Authenticate as the Staff user
    staffApi = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
    const staffLoginRes = await staffApi.post('/api/auth/login', {
      data: { email: staffUserEmail, password: staffUserPassword },
    });
    expect(staffLoginRes.ok()).toBeTruthy();

    // 3. Verify Staff CANNOT perform high-privilege actions (Delete category)
    const deleteCatRes = await staffApi.delete(`/api/categories/${categoryId}`);
    expect(deleteCatRes.status()).toBe(403);
    const deleteCatErr = await deleteCatRes.json();
    expect(deleteCatErr.message).toContain('không có quyền');

    // 4. Verify Staff CANNOT access core audit logs
    const auditLogsRes = await staffApi.get('/api/auth/audit-logs');
    expect(auditLogsRes.status()).toBe(403);

    // 5. Verify Staff CANNOT modify roles of other users
    const changeRoleRes = await staffApi.patch(`/api/auth/users/${staffUserId}/role`, {
      data: { role: 'admin' },
    });
    expect(changeRoleRes.status()).toBe(403);

    // 6. Verify Staff CAN perform general manager tasks (View users list)
    const viewUsersRes = await staffApi.get('/api/auth/users?limit=1');
    expect(viewUsersRes.ok()).toBeTruthy();
  });

  test('C.2 Thu hồi quyền Nhân viên (Staff) -> Trở lại Customer & Chặn hoàn toàn Admin Dashboard', async () => {
    // 1. Demote user back to "customer" role
    const demoteRes = await adminApi.patch(`/api/auth/users/${staffUserId}/role`, {
      data: { role: 'customer' },
    });
    expect(demoteRes.ok()).toBeTruthy();

    // 2. Authenticate as Customer user
    customerApi = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
    const customerLoginRes = await customerApi.post('/api/auth/login', {
      data: { email: staffUserEmail, password: staffUserPassword },
    });
    expect(customerLoginRes.ok()).toBeTruthy();

    // 3. Verify Customer CANNOT perform manager tasks (View users list)
    const viewUsersRes = await customerApi.get('/api/auth/users?limit=1');
    expect(viewUsersRes.status()).toBe(403);
    const viewUsersErr = await viewUsersRes.json();
    expect(viewUsersErr.message).toContain('Access denied');
  });
});
