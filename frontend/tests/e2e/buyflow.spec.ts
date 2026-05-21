import { test, expect } from '@playwright/test';

// Note: Ensure dev server is running at http://localhost:5173
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const PRODUCT_ID = '6a0d8905d38ea5fe36d786ad';

test.describe('Product detail CTAs', () => {
  test('Add to cart stores product in localStorage (guest) and Buy Now navigates to checkout', async ({ page }) => {
    await page.goto(`${BASE}/product/${PRODUCT_ID}`);

    // Wait for Add to cart button
    const addBtn = page.getByRole('button', { name: /Thêm vào giỏ/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });

    // Click Add to cart
    await addBtn.click();

    // Verify localStorage 'watch_cart' contains our product id
    const cartJson = await page.evaluate(() => localStorage.getItem('watch_cart'));
    expect(cartJson).not.toBeNull();
    const cart = JSON.parse(cartJson || '[]');
    expect(cart.length).toBeGreaterThan(0);
    const found = cart.find((i: any) => (i._id || i.productId || i.product) === PRODUCT_ID);
    expect(found).toBeTruthy();

    // Click Buy Now and expect navigation to /checkout
    const buyBtn = page.getByRole('button', { name: /Mua ngay/i });
    await expect(buyBtn).toBeVisible();
    await buyBtn.click();

    await expect(page).toHaveURL(/\/checkout/);
  });
});
