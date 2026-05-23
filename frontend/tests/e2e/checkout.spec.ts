import { test, expect, request as playwrightRequest } from '@playwright/test';
import { createAuthenticatedPage } from './helpers/auth';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';
const TEST_USER = {
  name: 'E2E Checkout User',
  email: `checkout.e2e.${Date.now()}@testmail.com`,
  phone: '0901234567',
  password: 'TestPassw0rd!',
};

let PRODUCT_ID = '';

test.beforeAll(async () => {
  const signupApi = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
  await signupApi.post('/api/auth/signup', {
    data: {
      name: TEST_USER.name,
      email: TEST_USER.email,
      phone: TEST_USER.phone,
      password: TEST_USER.password,
      confirmPassword: TEST_USER.password,
    },
  }).catch(() => {});
  await signupApi.dispose();

  // Find a product with stock > 0 for a reliable checkout test
  const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
  const res = await api.get('/api/products?limit=20');
  if (res.ok()) {
    const data = await res.json();
    const products = data.products || data || [];
    // Prefer a product with stock > 0 and no wristSizeOptions (simpler flow)
    const simple = products.find((p: any) => p.stock > 0 && (!p.wristSizeOptions || p.wristSizeOptions.length === 0));
    const any = products.find((p: any) => p.stock > 0);
    PRODUCT_ID = (simple || any)?._id || products[0]?._id || '';
  }
  await api.dispose();
  if (!PRODUCT_ID) throw new Error('No product ID found — cannot run checkout test');
});

test('authenticated checkout selects attributes and completes COD order', async ({ page }) => {
  const authPage = await createAuthenticatedPage(page, TEST_USER);

  const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL, timeout: 10000 });
  const loginRes = await api.post('/api/auth/login', {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  expect(loginRes.ok()).toBeTruthy();
  const cartRes = await api.post('/api/cart', { data: { productId: PRODUCT_ID } });
  expect(cartRes.ok()).toBeTruthy();
  await api.dispose();

  await authPage.goto(`${BASE}/cart`);
  // Ensure the server-seeded cart item is selected in the client store
  // The store's getUniqueId format: <productId>_wrist_default_selectedColor_default_selectedSize_default
  await authPage.evaluate((pid) => {
    const uid = `${pid}_default_default_default`;
    localStorage.setItem('watch_selected_items', JSON.stringify([uid]));
  }, PRODUCT_ID);
  await authPage.waitForTimeout(200);
  const selectAllCheckbox = authPage.locator('input[type="checkbox"]').first();
  if (await selectAllCheckbox.count() > 0 && !(await selectAllCheckbox.isChecked())) {
    await selectAllCheckbox.check();
    await authPage.waitForTimeout(300);
  }

  const checkoutBtn = authPage.locator('button:has-text("Tiến hành thanh toán"), button:has-text("Checkout")').first();
  await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
  await checkoutBtn.click();

  // Expect navigation to /checkout
  await expect(authPage).toHaveURL(/\/checkout/, { timeout: 10000 });
  await authPage.waitForLoadState('networkidle');
  await authPage.waitForTimeout(800);

  // Fill shipping form (guest) — using actual field names from ShippingForm.jsx
  await expect(authPage.locator('input[name="fullName"]')).toBeVisible({ timeout: 8000 });
  await authPage.fill('input[name="fullName"]', 'E2E Tester');
  await authPage.fill('input[name="phoneNumber"]', '0901234567');
  await authPage.fill('input[name="email"]', 'e2e@example.com');
  await authPage.fill('input[name="address"]', '123 Test Street');
  await authPage.fill('input[name="city"]', 'hanoi');

  // Proceed to review/payment step 2
  await authPage.getByRole('button', { name: /Tiếp tục đến thanh toán/i }).click();
  await authPage.waitForTimeout(500);

  // Select COD payment method
  await authPage.locator('label:has-text("COD")').first().click();

  // Place order
  await authPage.getByRole('button', { name: /Xác nhận và thanh toán/i }).click();

  // Expect confirmation message on the purchase success page
  await expect(authPage).toHaveURL(/\/purchase-success/, { timeout: 15000 });
});
