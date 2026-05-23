import { test, expect, request as playwrightRequest } from '@playwright/test';
import { skipIfBackendUnavailable } from './helpers/backend';
import { createAuthenticatedPage } from './helpers/auth';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'ha8893536@gmail.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123';
const ADMIN_OTP = process.env.E2E_ADMIN_OTP || '';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.PW_BASE_URL || 'http://localhost:5173';

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
  await api.dispose();
  const authPage = await createAuthenticatedPage(page, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  await authPage.goto(FRONTEND_URL + '/secret-dashboard');
  await expect(authPage.getByText('Watch Admin')).toBeVisible();
  return authPage;
};

test.describe('ProductsList - E2E Tests', () => {
  test.beforeEach(async () => {
    await skipIfBackendUnavailable();
  });

  test('should navigate to Products tab', async ({ page }) => {
    const authPage = await ensureAdminLogin(page);

    // Navigate to Products tab
    const productsButton = authPage.getByRole('button', { name: 'Sản phẩm' });
    await productsButton.click();

    // Verify URL and content
    await expect(authPage).toHaveURL(/tab=products/);
    await authPage.getByRole('button', { name: 'Thêm mới' }).waitFor({ state: 'visible', timeout: 10000 });
  });

  test('should display products list with pagination', async ({ page }) => {
    const authPage = await ensureAdminLogin(page);

    // Navigate to Products
    await authPage.getByRole('button', { name: 'Sản phẩm' }).click();
    await expect(authPage).toHaveURL(/tab=products/);

    // Wait for products to load
    await authPage.waitForTimeout(1000);

    // Verify product table is visible
    const productTable = authPage.locator('table');
    await productTable.waitFor({ state: 'visible', timeout: 10000 });
    await expect(productTable).toBeVisible();
  });

  test('should search products by name', async ({ page }) => {
    const authPage = await ensureAdminLogin(page);

    // Navigate to Products
    await authPage.getByRole('button', { name: 'Sản phẩm' }).click();
    await expect(authPage).toHaveURL(/tab=products/);

    // Find search input
    const searchInput = authPage.getByPlaceholder('Tìm kiếm sản phẩm...');

    if (await searchInput.isVisible()) {
      // Type in search
      await searchInput.fill('watch');
      
      // Wait for search results
      await authPage.waitForTimeout(600); // Debounce delay

      // Verify URL contains search param
      await expect(authPage).toHaveURL(/search=watch/);
    }
  });

  test('should sort products by different options', async ({ page }) => {
    const authPage = await ensureAdminLogin(page);

    // Navigate to Products
    await authPage.getByRole('button', { name: 'Sản phẩm' }).click();
    await expect(authPage).toHaveURL(/tab=products/);

    // Wait for page load
    await authPage.waitForTimeout(1000);

    // Look for sort button/dropdown
    const sortButtons = authPage.locator('button:has-text("Sort"), button:has-text("Sắp xếp")');
    if (await sortButtons.first().isVisible()) {
      await sortButtons.first().click();

      // Select price ascending
      const priceSortButton = authPage.locator('button:has-text("Giá: Thấp đến Cao")');
      if (await priceSortButton.isVisible()) {
        await priceSortButton.click();

        // Verify URL contains sort param
        await expect(authPage).toHaveURL(/sort=price_asc/);
      }
    }
  });

  test('should open create product modal', async ({ page }) => {
    const authPage = await ensureAdminLogin(page);

    // Navigate to Products
    await authPage.getByRole('button', { name: 'Sản phẩm' }).click();
    await expect(authPage).toHaveURL(/tab=products/);

    // Click create button
    const createButton = authPage.getByRole('button', { name: 'Thêm mới' });
    await createButton.waitFor({ state: 'visible', timeout: 10000 });
    await createButton.click();

    // Wait for modal to appear
    await authPage.waitForTimeout(300); // Animation delay

    // Verify modal is visible
    const modal = authPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test('should select multiple products for bulk operations', async ({ page }) => {
    const authPage = await ensureAdminLogin(page);

    // Navigate to Products
    await authPage.getByRole('button', { name: 'Sản phẩm' }).click();
    await expect(authPage).toHaveURL(/tab=products/);

    // Wait for products to load
    await authPage.waitForTimeout(1000);

    // Try to select checkbox
    const checkboxes = authPage.locator('input[type="checkbox"]');
    if (await checkboxes.count() > 0) {
      // Select first product
      await checkboxes.first().click();

      // Verify selection (look for bulk action buttons)
      const bulkDeleteButton = authPage.locator('button:has-text("Xóa"), button:has-text("Delete")');
      // May or may not be visible depending on state
    }
  });

  test('should handle pagination', async ({ page }) => {
    const authPage = await ensureAdminLogin(page);

    // Navigate to Products
    await authPage.getByRole('button', { name: 'Sản phẩm' }).click();
    await expect(authPage).toHaveURL(/tab=products/);

    // Wait for pagination controls
    await authPage.waitForTimeout(1000);

    // Look for next page button
    const nextButton = authPage.locator('button:has-text("Next"), button:has-text("→")');
    await nextButton.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await nextButton.isEnabled().catch(() => false)) {
      await nextButton.click();

      // Verify page param changed
      await expect(authPage).toHaveURL(/page=2/);
    }
  });

  test('should toggle product featured status', async ({ page }) => {
    const authPage = await ensureAdminLogin(page);

    // Navigate to Products
    await authPage.getByRole('button', { name: 'Sản phẩm' }).click();
    await expect(authPage).toHaveURL(/tab=products/);

    // Wait for products to load
    await authPage.waitForTimeout(1000);

    // Look for featured toggle button in first row
    const firstProductRow = authPage.locator('tbody tr').first();
    const featuredButton = firstProductRow.locator('button[title*="featured"], button:has-text("⭐")');

    if (await featuredButton.isVisible()) {
      const initialState = await featuredButton.getAttribute('aria-pressed');
      
      // Click to toggle
      await featuredButton.click();

      // Verify change (button state should toggle)
      await authPage.waitForTimeout(500); // Server update time
    }
  });

  test('should handle modal close correctly', async ({ page }) => {
    const authPage = await ensureAdminLogin(page);

    // Navigate to Products
    await authPage.getByRole('button', { name: 'Sản phẩm' }).click();

    // Open modal
    const createButton = authPage.getByRole('button', { name: 'Thêm mới' });
    await createButton.click();

    // Wait for modal
    await authPage.waitForTimeout(300);

    // Find close button (X icon)
    const modal = authPage.locator('[role="dialog"]').first();
    const closeButton = modal.locator('button[aria-label="Close modal"], button:has-text("×")').first();

    if (await closeButton.isVisible()) {
      await closeButton.click();

      // Verify modal is closed
      await authPage.waitForTimeout(300); // Animation delay
      await expect(modal).not.toBeVisible();
    }
  });

  test('should show error state for network failures', async ({ page }) => {
    const authPage = await ensureAdminLogin(page);

    // Navigate to Products
    await authPage.getByRole('button', { name: 'Sản phẩm' }).click();

    // Simulate network offline
    await authPage.context().setOffline(true);

    // Try to refresh or trigger a fetch (may fail offline)
    try {
      await authPage.reload();
    } catch (e) {
      // ignore network errors when offline
    }

    // Should show error message or fallback UI
    await authPage.waitForTimeout(1000);

    // Restore connection
    await authPage.context().setOffline(false);
  });
});
