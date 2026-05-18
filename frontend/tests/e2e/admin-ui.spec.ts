import { test, expect } from '@playwright/test';
import { skipIfBackendUnavailable } from './helpers/backend';
import { createAuthenticatedPage } from './helpers/auth';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@test.local';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Admin123!@#';

test.describe('Admin UI', () => {
  test.beforeEach(async () => {
    await skipIfBackendUnavailable();
  });

  test('can switch tabs and open Products', async ({ page }) => {
    const authPage = await createAuthenticatedPage(page, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

      await authPage.getByRole('button', { name: 'Đơn hàng' }).click();
      await expect(authPage).toHaveURL(/tab=orders/);
        await authPage.getByRole('button', { name: 'Sản phẩm' }).click();
        await expect(authPage).toHaveURL(/tab=products/);
      await authPage.getByRole('button', { name: 'Thêm mới' }).waitFor({ state: 'visible', timeout: 10000 });
  });

  test('global search shows empty state for random query', async ({ page }) => {
      const authPage = await createAuthenticatedPage(page, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

      const searchInput = authPage.getByPlaceholder('Tìm sản phẩm, đơn hàng...');
      await searchInput.fill('zzzz-e2e-no-result');
      await expect(authPage.getByText('Không tìm thấy kết quả')).toBeVisible();
  });
});
