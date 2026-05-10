import { test, expect, request as playwrightRequest } from '@playwright/test';
import { skipIfBackendUnavailable } from './helpers/backend';

const randomEmail = `e2euser+${Date.now()}@example.com`;
const randomPassword = 'E2eSecurePassw0rd!';

test.beforeEach(async () => {
  await skipIfBackendUnavailable();
});

test.describe('Customer basic flow', () => {
  test('Signup -> Login -> Add to Compare -> Add to Cart -> Place order', async ({ page }) => {
    const api = await playwrightRequest.newContext({
      baseURL: process.env.E2E_BACKEND_URL || 'http://localhost:5000',
      timeout: 10000,
    });
    const productsRes = await api.get('/api/products?limit=1');
    expect(productsRes.ok()).toBeTruthy();
    const productsPayload = await productsRes.json();
    const firstProduct = (productsPayload.products || [])[0];
    expect(firstProduct?._id).toBeTruthy();

    const signupRes = await api.post('/api/auth/signup', {
      data: {
        name: 'E2E Tester',
        email: randomEmail,
        phone: '0912345678',
        password: randomPassword,
        confirmPassword: randomPassword,
      },
    });
    expect(signupRes.ok()).toBeTruthy();
    await api.dispose();

    await page.goto('/login');
    await page.fill('#email', randomEmail);
    await page.fill('#password', randomPassword);
    await page.locator('form').first().locator('button[type="submit"]').click();
    await page.waitForURL('/', { timeout: 10000 });

    await page.goto('/catalog');
    await page.locator('article').first().getByRole('button', { name: /So/i }).click();
    await expect(page.locator('.compare-scroll')).toBeVisible();
    await page.locator('.compare-scroll img').first().click();
    await page.waitForURL(/\/product\//, { timeout: 10000 });
    const authedApi = await playwrightRequest.newContext({
      baseURL: process.env.E2E_BACKEND_URL || 'http://localhost:5000',
      storageState: await page.context().storageState(),
      timeout: 10000,
    });
    const addCartRes = await authedApi.post('/api/cart', {
      data: { productId: firstProduct._id },
    });
    expect(addCartRes.ok()).toBeTruthy();
    await authedApi.dispose();

    await page.goto('/cart');
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('button.btn-primary').first().click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
  });
});
