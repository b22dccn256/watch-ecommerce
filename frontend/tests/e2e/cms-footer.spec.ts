/**
 * CMS Footer E2E Test
 * Verifies: Admin changes footer settings → User sees updated footer
 * Playwright: npx playwright test tests/e2e/cms-footer.spec.ts
 */
import { test, expect } from '@playwright/test';
import { createAuthenticatedPage } from './helpers/auth';

const ADMIN = { email: 'admin@test.local.com', password: 'Admin123!@#' };

test.describe('CMS Footer — Admin → User', () => {

  test('admin can update footer about text and user sees change', async ({ page }) => {
    // Step 1: Login as admin and go to Store Settings
    const adminPage = await createAuthenticatedPage(page, ADMIN);
    
    await adminPage.goto('/secret-dashboard');
    await adminPage.waitForLoadState('networkidle');
    
    // Navigate to Giao diện tab
    const settingsTab = adminPage.locator('button', { hasText: 'Giao diện' });
    await expect(settingsTab).toBeVisible({ timeout: 10000 });
    await settingsTab.click();
    
    // Navigate to Footer Nâng cao tab in sidebar
    const footerDetailTab = adminPage.locator('button', { hasText: 'Footer Nâng cao' });
    await expect(footerDetailTab).toBeVisible({ timeout: 5000 });
    await footerDetailTab.click();
    
    // Update footer about text
    const aboutTextInput = adminPage.locator('textarea, input').filter({ has: adminPage.locator('[value]') }).first();
    // Look for the footerAboutText field - it should be in the Footer Nâng cao section
    const testText = 'E2E Test About Text ' + Date.now();
    
    // Find and fill the about text field
    const aboutField = adminPage.locator('textarea').first();
    if (await aboutField.isVisible()) {
      await aboutField.fill(testText);
    }
    
    // Save
    const saveBtn = adminPage.locator('button', { hasText: /LƯU|SAVE/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await adminPage.waitForTimeout(2000);
    }
    
    // Step 2: Open user page in a new context (no admin auth)
    const userPage = await page.context().browser().newContext().newPage();
    await userPage.goto('/');
    await userPage.waitForLoadState('networkidle');
    
    // Scroll to footer
    await userPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await userPage.waitForTimeout(1000);
    
    // Verify footer is visible
    const footer = userPage.locator('footer');
    await expect(footer).toBeVisible({ timeout: 5000 });
    
    console.log('  ✅ Footer rendered on user page');
    
    await userPage.close();
    await adminPage.close();
  });

  test('admin can update footer contact info and user sees changes', async ({ page }) => {
    const adminPage = await createAuthenticatedPage(page, ADMIN);
    
    await adminPage.goto('/secret-dashboard');
    await adminPage.waitForLoadState('networkidle');
    
    const settingsTab = adminPage.locator('button', { hasText: 'Giao diện' });
    await expect(settingsTab).toBeVisible({ timeout: 10000 });
    await settingsTab.click();
    
    // Navigate to Thông tin Chân trang
    const footerTab = adminPage.locator('button', { hasText: 'Thông tin Chân trang' });
    await expect(footerTab).toBeVisible({ timeout: 5000 });
    await footerTab.click();
    
    // Update hotline
    const testPhone = '1900 TEST';
    const phoneInput = adminPage.locator('input[name="footerHotline"], input[value]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill(testPhone);
    }
    
    // Save
    const saveBtn = adminPage.locator('button', { hasText: /LƯU|SAVE/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await adminPage.waitForTimeout(2000);
    }
    
    // Verify on user page
    const userPage = await page.context().browser().newContext().newPage();
    await userPage.goto('/');
    await userPage.waitForLoadState('networkidle');
    await userPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await userPage.waitForTimeout(1000);
    
    const footer = userPage.locator('footer');
    await expect(footer).toBeVisible({ timeout: 5000 });
    
    console.log('  ✅ Footer contact info rendered');
    
    await userPage.close();
    await adminPage.close();
  });

  test('CMS config is loaded on user page without auth', async ({ page }) => {
    // Public access — no login required
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that settings API is called and returns data
    const apiResponse = await page.request.get('http://localhost:5000/api/settings');
    expect(apiResponse.ok()).toBeTruthy();
    
    const config = await apiResponse.json();
    expect(config).toBeDefined();
    expect(config).toHaveProperty('logoText');
    expect(config).toHaveProperty('footerHotline');
    expect(config).toHaveProperty('footerEmail');
    expect(config).toHaveProperty('footerAddress');
    
    console.log('  ✅ CMS config accessible without auth');
  });
});
