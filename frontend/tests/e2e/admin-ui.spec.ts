import { test, expect, request as playwrightRequest } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'ha8893536@gmail.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123';
const ADMIN_OTP = process.env.E2E_ADMIN_OTP || '';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';

const ensureAdminLogin = async (page) => {
  const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
  const loginRes = await api.post('/api/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(loginRes.ok()).toBeTruthy();
  const loginJson = await loginRes.json();

  if (loginJson?.message === 'OTP_REQUIRED') {
    if (!ADMIN_OTP) {
      throw new Error('E2E_ADMIN_OTP is required when OTP is enabled.');
    }
    const otpRes = await api.post('/api/auth/verify-otp', {
      data: { email: ADMIN_EMAIL, otp: ADMIN_OTP },
    });
    expect(otpRes.ok()).toBeTruthy();
  }

  const state = await api.storageState();
  await page.context().addCookies(state.cookies);
  await api.dispose();

  await page.goto('/secret-dashboard');
  await expect(page.getByText('Watch Admin')).toBeVisible();
};

test.describe('Admin UI', () => {
  test('can switch tabs and open Products', async ({ page }) => {
    await ensureAdminLogin(page);

    await page.getByRole('button', { name: 'Đơn hàng' }).click();
    await expect(page).toHaveURL(/tab=orders/);

    await page.getByRole('button', { name: 'Sản phẩm' }).click();
    await expect(page).toHaveURL(/tab=products/);
    await expect(page.getByRole('button', { name: 'Thêm mới' })).toBeVisible();
  });

  test('global search shows empty state for random query', async ({ page }) => {
    await ensureAdminLogin(page);

    const searchInput = page.getByPlaceholder('Tìm sản phẩm, đơn hàng...');
    await searchInput.fill('zzzz-e2e-no-result');
    await expect(page.getByText('Không tìm thấy kết quả')).toBeVisible();
  });
});
