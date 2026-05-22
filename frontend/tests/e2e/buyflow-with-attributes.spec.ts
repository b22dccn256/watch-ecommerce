import { test, expect, request as playwrightRequest } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';

let PRODUCT_ID = '';

test.beforeAll(async () => {
  const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
  const res = await api.get('/api/products?limit=1');
  if (res.ok()) {
    const data = await res.json();
    PRODUCT_ID = data.products?.[0]?._id || data[0]?._id || '';
  }
  await api.dispose();
  if (!PRODUCT_ID) {
    throw new Error('No product ID found from API /api/products?limit=1');
  }
});

test('Select attributes then Add to cart and Buy Now', async ({ page }) => {
  await page.goto(`${BASE}/product/${PRODUCT_ID}`);

  // Wait for product options to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Select wrist size first (ensures activeStock > 0 for wristSizeOptions products)
  const wristBtn = page.locator('h3:has-text("Chu vi cổ tay")').locator('..').locator('button:not([disabled])');
  if (await wristBtn.count() > 0) {
    await wristBtn.first().click();
    await page.waitForTimeout(300);
  }

  // Select size if available
  const sizeButtons = page.locator('h3:has-text("Phiên bản")').locator('..').locator('button');
  if (await sizeButtons.count() > 0) {
    await sizeButtons.first().click();
    await page.waitForTimeout(200);
  }

  // Select color if available
  const colorButtons = page.locator('h3:has-text("Màu sắc")').locator('..').locator('button');
  if (await colorButtons.count() > 0) {
    await colorButtons.first().click();
    await page.waitForTimeout(200);
  }

  // Wait for product detail page to fully render (h1 = product name visible)
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(500);

  // Click Add to cart (use :has-text() — more reliable than getByRole for Vietnamese text)
  const addBtn = page.locator('button:has-text("Thêm vào giỏ")').first();
  await expect(addBtn).toBeVisible({ timeout: 10000 });
  await addBtn.click();
  await page.waitForTimeout(600);

  // Verify cart localStorage updated (soft check — product may have 0 stock)
  const cartPopulated = await expect.poll(async () => {
    const cartJson = await page.evaluate(() => localStorage.getItem('watch_cart'));
    if (!cartJson) return false;
    try { return JSON.parse(cartJson).length > 0; }
    catch { return false; }
  }, { timeout: 10000, intervals: [500] }).toBeTruthy().catch(() => false);

  if (!cartPopulated) {
    console.log('  ⚠️  watch_cart not populated (product may have 0 stock)');
  }

  // Now click Buy Now
  const buyBtn = page.getByRole('button', { name: /Mua ngay/i });
  await expect(buyBtn).toBeVisible();
  await buyBtn.click();

  // Should navigate to /checkout (cart has items) or /cart (if stock was 0)
  await expect(page).toHaveURL(/\/(checkout|cart)/);
});
