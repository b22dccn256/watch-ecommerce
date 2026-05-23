import { test, expect, request as playwrightRequest } from '@playwright/test';
import { skipIfBackendUnavailable } from './helpers/backend';

const FRONTEND_URL = process.env.PW_BASE_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';

test.beforeEach(async () => {
  await skipIfBackendUnavailable();
});

test('Select product attributes, add to cart and go to checkout', async ({ page }) => {
  // Visit catalog and open first product
  await page.goto(FRONTEND_URL + '/catalog');
  await page.waitForTimeout(1500);

  const firstProduct = page.locator('article, [class*="product-card"]').first();
  expect(await firstProduct.isVisible()).toBeTruthy();

  // Click into product detail
  try {
    const link = firstProduct.locator('a').first();
    if (await link.isVisible()) await link.click();
    else await firstProduct.click();
  } catch (e) {
    await firstProduct.click();
  }

  await page.waitForURL(/\/product\//, { timeout: 10000 });
  await page.waitForTimeout(800);

  // Try to choose attribute selects (if any)
  const selects = page.locator('select');
  const selectCount = await selects.count();
  for (let i = 0; i < selectCount; i++) {
    const sel = selects.nth(i);
    try {
      const options = await sel.locator('option').all();
      let chosen = null;
      for (const opt of options) {
        const val = await opt.getAttribute('value');
        if (val && val !== '' && val !== '0') {
          chosen = val;
          break;
        }
      }
      if (chosen) await sel.selectOption(chosen);
    } catch (e) {
      // ignore
    }
  }

  // Try to select radio groups (color/size swatches)
  const radios = page.locator('input[type="radio"]');
  const radioCount = await radios.count();
  if (radioCount > 0) {
    // choose first visible radio per name
    const seenNames = new Set();
    for (let i = 0; i < radioCount; i++) {
      const r = radios.nth(i);
      const name = await r.getAttribute('name');
      if (!name || seenNames.has(name)) continue;
      try {
        if (await r.isVisible()) {
          await r.check();
          seenNames.add(name);
        }
      } catch {}
    }
  }

  // Click Add to Cart (handle localized text)
  const addBtn = page.locator('button:has-text("Thêm vào giỏ"), button:has-text("Add to Cart"), button.btn-primary').first();
  await expect(addBtn).toBeVisible({ timeout: 5000 });
  await addBtn.click({ force: true });
  await page.waitForTimeout(800);

  // If login required, skip placing order but confirm item added to cart
  // Go to cart and attempt to checkout
  await page.goto(FRONTEND_URL + '/cart');
  await page.waitForTimeout(1200);

  // Select first cart checkbox and click checkout
  const checkbox = page.locator('input[type="checkbox"]').first();
  if (await checkbox.isVisible()) await checkbox.check();

  const checkoutBtn = page.locator('button:has-text("Thanh toán"), button:has-text("Checkout"), button.btn-primary').first();
  if (await checkoutBtn.isVisible()) {
    await checkoutBtn.click();
    await page.waitForTimeout(1200);

    // If redirected to login, create a temporary user and continue as authenticated
    const current = page.url();
    if (current.includes('/login')) {
      const randomEmail = `e2e.user.${Date.now()}@testmail.com`;
      const randomPassword = 'TestPassw0rd!';

      const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL, timeout: 10000 });
      // Try signup (may 409 if exists) then login
      await api.post('/api/auth/signup', {
        data: { name: 'E2E User', email: randomEmail, phone: '0912345678', password: randomPassword, confirmPassword: randomPassword },
      }).catch(() => {});
      const loginRes = await api.post('/api/auth/login', { data: { email: randomEmail, password: randomPassword } });
      if (loginRes.ok()) {
        const state = await api.storageState();
        await api.dispose();

        const browser = page.context().browser()!;
        const ctx = await browser.newContext({ storageState: state });
        const authPage = await ctx.newPage();
        try {
          // In authenticated context add the same/first product to cart again, selecting attributes
          await authPage.goto(FRONTEND_URL + '/catalog');
          await authPage.waitForTimeout(800);
          const fp = authPage.locator('article, [class*="product-card"]').first();
          if (await fp.isVisible()) {
            try {
              const link = fp.locator('a').first();
              if (await link.isVisible()) await link.click();
              else await fp.click();
            } catch {
              await fp.click();
            }
            await authPage.waitForURL(/\/product\//, { timeout: 10000 }).catch(() => {});
            await authPage.waitForTimeout(600);

            // choose selects if present
            const authSelects = authPage.locator('select');
            const authSelectCount = await authSelects.count();
            for (let j = 0; j < authSelectCount; j++) {
              const s = authSelects.nth(j);
              try {
                const opts = await s.locator('option').all();
                let chosen = null;
                for (const o of opts) {
                  const v = await o.getAttribute('value');
                  if (v && v !== '' && v !== '0') { chosen = v; break; }
                }
                if (chosen) await s.selectOption(chosen);
              } catch {}
            }
            // choose radios
            const authRadios = authPage.locator('input[type="radio"]');
            const authRadioCount = await authRadios.count();
            const seen = new Set();
            for (let r = 0; r < authRadioCount; r++) {
              const ir = authRadios.nth(r);
              const n = await ir.getAttribute('name');
              if (!n || seen.has(n)) continue;
              try { if (await ir.isVisible()) { await ir.check(); seen.add(n); } } catch {}
            }

            const add = authPage.locator('button:has-text("Thêm vào giỏ"), button:has-text("Add to Cart"), button.btn-primary').first();
            if (await add.isVisible()) { await add.click({ force: true }); await authPage.waitForTimeout(700); }
          }

          await authPage.goto(FRONTEND_URL + '/cart');
          await authPage.waitForTimeout(800);
          const cb = authPage.locator('button:has-text("Thanh toán"), button:has-text("Checkout"), button.btn-primary').first();
          if (await cb.isVisible()) {
            await cb.click();
            await authPage.waitForTimeout(1000);
            await expect(authPage).toHaveURL(/\/checkout/);
            const nameField = authPage.locator('input[name="fullName"], input[placeholder*="họ tên" i]').first();
            await expect(nameField).toBeVisible({ timeout: 4000 });
          }
        } finally {
          await ctx.close();
        }
      } else {
        // API login failed — try UI signup/login in current unauthenticated page, then capture storage state
        await api.dispose();
        const pageSignup = page;
        await pageSignup.goto(FRONTEND_URL + '/signup');
        await pageSignup.waitForTimeout(500);
        await pageSignup.locator('#name').fill('E2E UI User');
        await pageSignup.locator('#email').fill(randomEmail);
        await pageSignup.locator('#phone').fill('0912345678');
        await pageSignup.locator('#password').fill(randomPassword);
        await pageSignup.locator('#confirmPassword').fill(randomPassword);
        await pageSignup.locator('form button[type="submit"]').first().click();
        // Wait a bit for signup/login to complete
        await pageSignup.waitForTimeout(2500);
        const state = await pageSignup.context().storageState();
        const browser = page.context().browser()!;
        const ctx = await browser.newContext({ storageState: state });
        const authPage = await ctx.newPage();
        try {
          // After UI signup, add product in the authenticated session then checkout
          await authPage.goto(FRONTEND_URL + '/catalog');
          await authPage.waitForTimeout(800);
          const fp = authPage.locator('article, [class*="product-card"]').first();
          if (await fp.isVisible()) {
            try {
              const link = fp.locator('a').first();
              if (await link.isVisible()) await link.click();
              else await fp.click();
            } catch {
              await fp.click();
            }
            await authPage.waitForURL(/\/product\//, { timeout: 10000 }).catch(() => {});
            await authPage.waitForTimeout(600);

            const authSelects = authPage.locator('select');
            const authSelectCount = await authSelects.count();
            for (let j = 0; j < authSelectCount; j++) {
              const s = authSelects.nth(j);
              try {
                const opts = await s.locator('option').all();
                let chosen = null;
                for (const o of opts) {
                  const v = await o.getAttribute('value');
                  if (v && v !== '' && v !== '0') { chosen = v; break; }
                }
                if (chosen) await s.selectOption(chosen);
              } catch {}
            }
            const authRadios = authPage.locator('input[type="radio"]');
            const authRadioCount = await authRadios.count();
            const seen = new Set();
            for (let r = 0; r < authRadioCount; r++) {
              const ir = authRadios.nth(r);
              const n = await ir.getAttribute('name');
              if (!n || seen.has(n)) continue;
              try { if (await ir.isVisible()) { await ir.check(); seen.add(n); } } catch {}
            }

            const add = authPage.locator('button:has-text("Thêm vào giỏ"), button:has-text("Add to Cart"), button.btn-primary').first();
            if (await add.isVisible()) { await add.click({ force: true }); await authPage.waitForTimeout(700); }
          }

          await authPage.goto(FRONTEND_URL + '/cart');
          await authPage.waitForTimeout(800);
          const cb = authPage.locator('button:has-text("Thanh toán"), button:has-text("Checkout"), button.btn-primary').first();
          if (await cb.isVisible()) {
            await cb.click();
            await authPage.waitForTimeout(1000);
            await expect(authPage).toHaveURL(/\/checkout/);
            const nameField = authPage.locator('input[name="fullName"], input[placeholder*="họ tên" i]').first();
            await expect(nameField).toBeVisible({ timeout: 4000 });
          }
        } finally {
          await ctx.close();
        }
      }
    } else {
      await expect(page).toHaveURL(/\/checkout/);
      // Verify presence of checkout form fields
      const nameField = page.locator('input[name="fullName"], input[placeholder*="họ tên" i]').first();
      await expect(nameField).toBeVisible({ timeout: 4000 });
    }
  } else {
    // If no checkout button, ensure cart has at least one item
    const cartItems = page.locator('article, [class*="cart-item"]').first();
    await expect(cartItems).toBeVisible();
  }
});
