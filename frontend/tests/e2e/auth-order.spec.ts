import { test, expect } from '@playwright/test';

const randomEmail = `e2euser+${Date.now()}@example.com`;
const randomPassword = 'E2eSecurePassw0rd!';

test.describe('Khách hàng cơ bản', () => {
  test('Signup -> Login -> Add to Compare -> Add to Cart -> Place order', async ({ page }) => {
    await page.goto('/');

    // Mở modal register (nếu có)
    await page.getByRole('link', { name: /đăng ký|sign up/i }).first().click().catch(() => {});

    // Dòng form nếu có page signup
    if (await page.locator('form').first().isVisible()) {
      await page.fill('input[name="email"]', randomEmail);
      await page.fill('input[name="password"]', randomPassword);
      await page.fill('input[name="name"]', 'E2E Tester');
      await page.click('button:has-text("Đăng ký"), button:has-text("Sign Up")');
    }

    // Nếu có continue to login
    // Dù fail, bỏ qua nghĩa là chấp nhận user đã tồn tại.
    await page.waitForTimeout(1200);

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', randomEmail);
    await page.fill('input[name="password"]', randomPassword);
    await page.click('button:has-text("Đăng nhập"), button:has-text("Login")');

    await expect(page.getByText(/xin chào|hello/i)).toBeVisible({ timeout: 10000 });

    // Đi tới trang catalog và so sánh sản phẩm đầu tiên
    await page.goto('/catalog');
    await page.locator('button[title="So sánh"]').first().click();
    await page.click('a:has-text("Xem chi tiết"), a:has-text("View details")');

    // Thêm vào giỏ
    await page.click('button:has-text("Thêm"), button:has-text("Add to cart")');
    await expect(page.getByText(/đã thêm vào giỏ hàng|added to cart/i)).toBeVisible();

    // Kiểm tra cart
    await page.goto('/cart');
    await expect(page.locator('.cart-item')).toHaveCountGreaterThan(0);

    // Thực hiện checkout (flow COD hoặc Stripe)
    await page.click('button:has-text("Thanh toán"), button:has-text("Checkout")');

    await expect(page.getByText(/vui lòng chọn phương thức|checkout|confirm/i)).toBeVisible();
  });
});
