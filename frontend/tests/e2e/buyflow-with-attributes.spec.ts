import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const PRODUCT_ID = '6a0d8905d38ea5fe36d786ad';

test('Select attributes then Add to cart and Buy Now', async ({ page }) => {
  await page.goto(`${BASE}/product/${PRODUCT_ID}`);

  // Wait for product options
  await page.waitForLoadState('networkidle');

  // Select size if available (first button under "Phiên bản / Kích cỡ mặt")
  const sizeButtons = page.locator('h3:has-text("Phiên bản")').locator('..').locator('button');
  if (await sizeButtons.count() > 0) {
    await sizeButtons.first().click();
  }

  // Select color if available (first color button)
  const colorButtons = page.locator('h3:has-text("Màu sắc")').locator('..').locator('button');
  if (await colorButtons.count() > 0) {
    await colorButtons.first().click();
  }

  // Click Add to cart
  const addBtn = page.getByRole('button', { name: /Thêm vào giỏ/i });
  await expect(addBtn).toBeVisible();
  await addBtn.click();

  // Verify cart localStorage updated
  const cartJson = await page.evaluate(() => localStorage.getItem('watch_cart'));
  expect(cartJson).not.toBeNull();
  const cart = JSON.parse(cartJson || '[]');
  expect(cart.length).toBeGreaterThan(0);

  // Now click Buy Now
  const buyBtn = page.getByRole('button', { name: /Mua ngay/i });
  await expect(buyBtn).toBeVisible();
  await buyBtn.click();

  await expect(page).toHaveURL(/\/checkout/);
});
