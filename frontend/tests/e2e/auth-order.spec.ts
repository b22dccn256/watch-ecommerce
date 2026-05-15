import { test, expect, request as playwrightRequest } from '@playwright/test';
import { skipIfBackendUnavailable } from './helpers/backend';

test.beforeEach(async () => {
  await skipIfBackendUnavailable();
});

test.describe('Customer basic flow', () => {
  test('Signup -> Login -> Add to Compare -> Add to Cart -> Place order', async ({ page }) => {
    const randomEmail = `e2euser+${Date.now()}+${Math.floor(Math.random() * 1000)}@example.com`;
    const randomPassword = 'E2eSecurePassw0rd!';
    const randomPhone = `09${Math.floor(10000000 + Math.random() * 89999999)}`; // Generates a random valid VN phone number

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
        name: 'Etest User',
        email: randomEmail,
        phone: randomPhone,
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
    await page.locator('article').first().getByRole('button', { name: /So/i }).click({ force: true });
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
