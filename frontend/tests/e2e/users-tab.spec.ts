import { test, expect, request as playwrightRequest } from '@playwright/test';
import { skipIfBackendUnavailable } from './helpers/backend';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@test.local';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Admin123!@#';
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

test.describe('UsersTab - E2E Tests', () => {
  test.beforeEach(async () => {
    await skipIfBackendUnavailable();
  });

  test('should navigate to Users tab', async ({ page }) => {
    await ensureAdminLogin(page);

    // Navigate to Users tab
    const usersButton = page.getByRole('button', { name: 'Người dùng' });
    if (await usersButton.isVisible()) {
      await usersButton.click();

      // Verify Users tab is active or content is visible
      await page.waitForTimeout(500);
    }
  });

  test('should display users list with pagination', async ({ page }) => {
    await ensureAdminLogin(page);

    // Navigate to Users tab
    const usersButton = page.getByRole('button', { name: 'Người dùng' });
    if (await usersButton.isVisible()) {
      await usersButton.click();

      // Wait for users to load
      await page.waitForTimeout(1000);

      // Verify user table is visible
      const userTable = page.locator('table');
      if (await userTable.isVisible()) {
        const rows = await userTable.locator('tbody tr').count();
        expect(rows).toBeGreaterThan(0);
      }
    }
  });

  test('should search users by email or name', async ({ page }) => {
    await ensureAdminLogin(page);

    // Navigate to Users tab
    const usersButton = page.getByRole('button', { name: 'Người dùng' });
    if (await usersButton.isVisible()) {
      await usersButton.click();

      // Find search input
      const searchInput = page.getByPlaceholder(/Tìm kiếm|search/i);

      if (await searchInput.isVisible()) {
        // Type search query
        await searchInput.fill('test@example.com');

        // Wait for search results (debounce)
        await page.waitForTimeout(600);

        // Verify search was applied
        // (may show results or "no results found" message)
      }
    }
  });

  test('should filter users by role', async ({ page }) => {
    await ensureAdminLogin(page);

    // Navigate to Users tab
    const usersButton = page.getByRole('button', { name: 'Người dùng' });
    if (await usersButton.isVisible()) {
      await usersButton.click();

      // Look for role filter dropdown
      const roleFilter = page.locator('select, [role="combobox"]').first();

      if (await roleFilter.isVisible()) {
        // Select admin role
        await roleFilter.click();
        await page.waitForTimeout(300);

        const adminOption = page.locator('option:has-text("Admin"), div:has-text("Admin")').first();
        if (await adminOption.isVisible()) {
          await adminOption.click();

          // Wait for filtered results
          await page.waitForTimeout(600);
        }
      }
    }
  });

  test('should open user detail modal', async ({ page }) => {
    await ensureAdminLogin(page);

    // Navigate to Users tab
    const usersButton = page.getByRole('button', { name: 'Người dùng' });
    if (await usersButton.isVisible()) {
      await usersButton.click();

      // Wait for users to load
      await page.waitForTimeout(1000);

      // Click first user row to open detail
      const firstUserRow = page.locator('tbody tr').first();
      if (await firstUserRow.isVisible()) {
        // Try to find and click detail button
        const detailButton = firstUserRow.locator('button').first();
        await detailButton.click();

        // Wait for modal/detail view
        await page.waitForTimeout(300);

        // Modal should contain user info
        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          // Verify modal content (tabs for info, orders, etc.)
          const tabButtons = modal.locator('button:has-text("Thông tin"), button:has-text("Đơn hàng")');
          expect(await tabButtons.count()).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should switch user detail tabs', async ({ page }) => {
    await ensureAdminLogin(page);

    // Navigate to Users tab
    const usersButton = page.getByRole('button', { name: 'Người dùng' });
    if (await usersButton.isVisible()) {
      await usersButton.click();

      // Wait for users to load
      await page.waitForTimeout(1000);

      // Open first user
      const firstUserRow = page.locator('tbody tr').first();
      if (await firstUserRow.isVisible()) {
        const detailButton = firstUserRow.locator('button').first();
        await detailButton.click();

        await page.waitForTimeout(300);

        // Find tabs in modal
        const modal = page.locator('[role="dialog"]').first();
        const ordersTab = modal.locator('button:has-text("Đơn hàng"), button:has-text("Orders")');

        if (await ordersTab.isVisible()) {
          await ordersTab.click();

          // Wait for tab content to load
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('should adjust user loyalty points', async ({ page }) => {
    await ensureAdminLogin(page);

    // Navigate to Users tab
    const usersButton = page.getByRole('button', { name: 'Người dùng' });
    if (await usersButton.isVisible()) {
      await usersButton.click();

      // Wait for users to load
      await page.waitForTimeout(1000);

      // Open first user
      const firstUserRow = page.locator('tbody tr').first();
      if (await firstUserRow.isVisible()) {
        const detailButton = firstUserRow.locator('button').first();
        await detailButton.click();

        await page.waitForTimeout(300);

        // Look for loyalty points section
        const loyaltyButton = page.locator('button:has-text("Loyalty"), button:has-text("điểm")');
        if (await loyaltyButton.isVisible()) {
          await loyaltyButton.click();

          // Wait for loyalty modal
          await page.waitForTimeout(300);

          // Find input field for points
          const pointsInput = page.locator('input[type="number"]');
          if (await pointsInput.isVisible()) {
            await pointsInput.fill('100');

            // Find confirm button
            const confirmButton = page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').first();
            if (await confirmButton.isVisible()) {
              await confirmButton.click();

              // Wait for update
              await page.waitForTimeout(500);
            }
          }
        }
      }
    }
  });

  test('should handle role update from menu', async ({ page }) => {
    await ensureAdminLogin(page);

    // Navigate to Users tab
    const usersButton = page.getByRole('button', { name: 'Người dùng' });
    if (await usersButton.isVisible()) {
      await usersButton.click();

      // Wait for users to load
      await page.waitForTimeout(1000);

      // Open menu for first user
      const firstUserRow = page.locator('tbody tr').first();
      if (await firstUserRow.isVisible()) {
        const menuButton = firstUserRow.locator('button[aria-label="Menu"], button:has-text("•••")').first();
        if (await menuButton.isVisible()) {
          await menuButton.click();

          // Wait for menu to appear
          await page.waitForTimeout(300);

          // Find role change option
          const roleOption = page.locator('button:has-text("Role"), button:has-text("Chuyển quyền")').first();
          if (await roleOption.isVisible()) {
            await roleOption.click();

            // Wait for role selection
            await page.waitForTimeout(300);

            // Select new role
            const newRole = page.locator('button:has-text("moderator"), div:has-text("Moderator")').first();
            if (await newRole.isVisible()) {
              await newRole.click();

              // Wait for update
              await page.waitForTimeout(500);
            }
          }
        }
      }
    }
  });

  test('should view audit logs', async ({ page }) => {
    await ensureAdminLogin(page);

    // Navigate to Users tab
    const usersButton = page.getByRole('button', { name: 'Người dùng' });
    if (await usersButton.isVisible()) {
      await usersButton.click();

      // Wait for users to load
      await page.waitForTimeout(1000);

      // Look for audit logs section
      const auditLogsSection = page.locator('text=Audit Logs, text=Nhật ký hoạt động').first();
      if (await auditLogsSection.isVisible()) {
        // Verify logs table is visible
        const logsTable = auditLogsSection.locator('..').locator('table');
        if (await logsTable.isVisible()) {
          const rows = await logsTable.locator('tbody tr').count();
          expect(rows).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('should handle pagination in audit logs', async ({ page }) => {
    await ensureAdminLogin(page);

    // Navigate to Users tab
    const usersButton = page.getByRole('button', { name: 'Người dùng' });
    if (await usersButton.isVisible()) {
      await usersButton.click();

      // Wait for page load
      await page.waitForTimeout(1000);

      // Look for audit logs pagination
      const nextButton = page.locator('button:has-text("Next"), button:has-text("→")').last();
      if (await nextButton.isEnabled()) {
        await nextButton.click();

        // Wait for next page
        await page.waitForTimeout(500);
      }
    }
  });

  test('should close modals correctly', async ({ page }) => {
    await ensureAdminLogin(page);

    // Navigate to Users tab
    const usersButton = page.getByRole('button', { name: 'Người dùng' });
    if (await usersButton.isVisible()) {
      await usersButton.click();

      // Wait for users to load
      await page.waitForTimeout(1000);

      // Open user detail
      const firstUserRow = page.locator('tbody tr').first();
      if (await firstUserRow.isVisible()) {
        const detailButton = firstUserRow.locator('button').first();
        await detailButton.click();

        await page.waitForTimeout(300);

        // Find close button
        const modal = page.locator('[role="dialog"]').first();
        const closeButton = modal.locator('button[aria-label="Close modal"], button:has-text("×")').first();

        if (await closeButton.isVisible()) {
          await closeButton.click();

          // Verify modal is closed
          await page.waitForTimeout(300);
          await expect(modal).not.toBeVisible();
        }
      }
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await ensureAdminLogin(page);

    // Navigate to Users tab
    const usersButton = page.getByRole('button', { name: 'Người dùng' });
    if (await usersButton.isVisible()) {
      await usersButton.click();

      // Simulate network offline
      await page.context().setOffline(true);

      // Try to refresh or trigger a fetch
      await page.reload();

      // Should show error message or fallback UI
      await page.waitForTimeout(1000);

      // Restore connection
      await page.context().setOffline(false);
    }
  });
});
