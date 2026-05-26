import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect, request as playwrightRequest } from '@playwright/test';

const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://127.0.0.1:5000';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_STATE_PATH = path.resolve(__dirname, '..', '.auth', 'checkout-user-real.json');

let PRODUCT_ID = '';
let PRODUCT_PRICE = 0;

test.beforeAll(async () => {
  const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL, timeout: 10000 });
  const res = await api.get('/api/products?limit=20');

  if (res.ok()) {
    const data = await res.json();
    const products = data.products || data || [];
    const product = products.find((item) => item.stock > 1) || products.find((item) => item.stock > 0) || products[0];
    PRODUCT_ID = product?._id || '';
    PRODUCT_PRICE = product?.price || 0;
  }

  await api.dispose();

  if (!PRODUCT_ID) {
    throw new Error('No product ID found - cannot run checkout API test');
  }
});

test('COD checkout API accepts authenticated payload', async () => {
  const authState = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8'));
  const csrfToken = authState.cookies.find((cookie) => cookie.name === 'csrfToken')?.value;

  expect(csrfToken, 'CSRF token missing from saved auth state').toBeTruthy();

  const api = await playwrightRequest.newContext({
    baseURL: BACKEND_URL,
    timeout: 10000,
    storageState: AUTH_STATE_PATH,
    extraHTTPHeaders: csrfToken ? { 'x-csrf-token': csrfToken } : {},
  });

  const profileRes = await api.get('/api/auth/profile');
  expect(profileRes.ok()).toBeTruthy();
  const profile = await profileRes.json();

  const checkoutPayload = {
    products: [
      {
        _id: PRODUCT_ID,
        quantity: 1,
        price: PRODUCT_PRICE,
        wristSize: null,
        selectedColor: null,
        selectedSize: null,
      },
    ],
    shippingDetails: {
      fullName: profile.name || 'E2E Tester',
      address: '123 Test Street',
      city: 'Hà Nội',
      phoneNumber: profile.phone || '0901234567',
      email: profile.email,
    },
    paymentMethod: 'cod',
  };

  const checkoutRes = await api.post('/api/payments/create-checkout-session', {
    data: checkoutPayload,
  });

  const checkoutStatus = checkoutRes.status();
  if (checkoutStatus !== 201) {
    throw new Error(`Checkout request failed: ${checkoutStatus} ${await checkoutRes.text()}`);
  }
  const checkoutJson = await checkoutRes.json();

  expect(checkoutJson.success).toBe(true);
  expect(checkoutJson.orderCode).toMatch(/^DH/);
  expect(checkoutJson.orderId).toBeTruthy();

  const lookupRes = await api.post('/api/orders/lookup', {
    data: { orderNumber: checkoutJson.orderCode, email: profile.email },
  });

  if (!lookupRes.ok()) {
    throw new Error(`Lookup request failed: ${lookupRes.status()} ${await lookupRes.text()}`);
  }
  const lookupJson = await lookupRes.json();
  expect(lookupJson.trackingToken).toBeTruthy();

  const trackingRes = await api.get(`/api/orders/track/${lookupJson.trackingToken}`);
  if (!trackingRes.ok()) {
    throw new Error(`Tracking request failed: ${trackingRes.status()} ${await trackingRes.text()}`);
  }
  const trackingJson = await trackingRes.json();

  expect(trackingJson.orderCode).toBe(checkoutJson.orderCode);
  expect(trackingJson.paymentMethod).toBe('cod');
  expect(trackingJson.status).toBe('pending');
  expect(trackingJson.shippingDetails.fullName).toBe(checkoutPayload.shippingDetails.fullName);

  await api.dispose();
});

test('COD checkout UI completes purchase from cart to success page', async ({ page }) => {
  const browser = page.context().browser();
  if (!browser) {
    throw new Error('Browser instance is unavailable');
  }

  const authState = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8'));
  const csrfToken = authState.cookies.find((cookie) => cookie.name === 'csrfToken')?.value;

  const uiContext = await browser.newContext({ storageState: AUTH_STATE_PATH });
  const uiPage = await uiContext.newPage();

  try {
    const api = await playwrightRequest.newContext({
      baseURL: BACKEND_URL,
      timeout: 10000,
      storageState: AUTH_STATE_PATH,
      extraHTTPHeaders: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    });

    const cartSeedRes = await api.post('/api/cart', {
      data: { productId: PRODUCT_ID },
    });
    expect(cartSeedRes.ok()).toBeTruthy();
    await api.dispose();

    await uiPage.goto('http://127.0.0.1:5173/cart');
    await uiPage.waitForLoadState('networkidle');
    await expect(uiPage.getByText('Giỏ hàng của bạn')).toBeVisible({ timeout: 15000 });

    const selectAll = uiPage.locator('input[type="checkbox"]').first();
    if (!(await selectAll.isChecked())) {
      await selectAll.check();
      await uiPage.waitForTimeout(300);
    }

    const checkoutButton = uiPage.getByRole('button', { name: 'Tiến hành thanh toán' });
    await expect(checkoutButton).toBeVisible({ timeout: 15000 });
    await checkoutButton.click({ force: true });

    await expect(uiPage).toHaveURL(/\/checkout$/, { timeout: 15000 });
    await uiPage.waitForLoadState('networkidle');

    await expect(uiPage.getByText('Hoàn tất đơn hàng')).toBeVisible({ timeout: 10000 });
    await uiPage.fill('input[name="fullName"]', 'E2E Tester');
    await uiPage.fill('input[name="phoneNumber"]', '0901234567');
    await uiPage.fill('input[name="address"]', '123 Test Street');
    await uiPage.fill('input[name="city"]', 'Hà Nội');

    await uiPage.getByRole('button', { name: 'Tiếp tục đến thanh toán' }).click();
    await uiPage.waitForTimeout(400);

    const codRadio = uiPage.locator('label:has-text("COD") input[type="radio"]');
    await codRadio.check();
    await expect(codRadio).toBeChecked();

    await uiPage.getByRole('button', { name: 'Xác nhận và thanh toán' }).click();

    await expect(uiPage).toHaveURL(/\/purchase-success/, { timeout: 20000 });
    await expect(uiPage.getByRole('heading', { name: 'Cảm ơn bạn đã đặt hàng!' })).toBeVisible({ timeout: 20000 });
  } finally {
    await uiContext.close();
  }
});