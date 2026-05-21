import { test, expect } from '@playwright/test';

test('guest checkout selects attributes and completes COD order', async ({ page }) => {
  await page.goto('http://localhost:5174');

  // Wait for product grid and click first product
  await page.waitForSelector('[data-test=product-card]');
  const product = page.locator('[data-test=product-card]').first();
  await product.click();

  // Choose attributes if present
  const color = page.locator('select[data-test=color-select]');
  if (await color.count() > 0) {
    await color.selectOption({ index: 1 });
  }
  const size = page.locator('select[data-test=size-select]');
  if (await size.count() > 0) {
    await size.selectOption({ index: 1 });
  }

  // Add to cart
  await page.click('[data-test=add-to-cart]');
  await page.click('[data-test=view-cart]');

  // Proceed to checkout
  await page.click('[data-test=checkout-button]');

  // Fill shipping form (guest)
  await page.fill('input[name=fullName]', 'E2E Tester');
  await page.fill('input[name=phoneNumber]', '0901234567');
  await page.fill('input[name=address]', '123 Test Street');
  await page.fill('input[name=city]', 'Hanoi');

  // Choose COD payment and place order
  await page.click('[data-test=payment-cod]');
  await page.click('[data-test=place-order]');

  // Expect confirmation
  await expect(page.locator('[data-test=order-confirmation]')).toBeVisible({ timeout: 10000 });
});
