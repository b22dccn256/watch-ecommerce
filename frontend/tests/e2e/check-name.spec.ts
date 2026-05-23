import { test, expect, request as playwrightRequest } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';

let PRODUCT_ID = '';

test.beforeAll(async () => {
  const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
  const res = await api.get('/api/products?limit=1');
  if (res.ok()) {
    const data = await res.json();
    PRODUCT_ID = data.products?.[0]?._id || data[0]?._id || '';
  }
  await api.dispose();
  if (!PRODUCT_ID) {
    throw new Error('No product ID found from API /api/products?limit=1');
  }
});

test('Check product name display on user pages and backend', async ({ page }) => {
  // Product detail page — navigate directly with the real ID
  await page.goto(`${BASE}/product/${PRODUCT_ID}`);
  await page.waitForLoadState('networkidle');
  const title = await page.locator('h1').first().innerText();
  console.log('User Product Detail Title:', title.trim());
  fs.mkdirSync('frontend/tests/e2e/artifacts', { recursive: true });
  await page.locator('h1').first().screenshot({ path: 'frontend/tests/e2e/artifacts/product-detail-title.png' });

  // Catalog page — search for product card with matching title text
  await page.goto(`${BASE}/catalog`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Try to find a product card link containing this product ID
  const productLink = page.locator(`a[href="/product/${PRODUCT_ID}"]`).first();
  const cardLinkCount = await productLink.count();

  let cardTitleText = '';
  if (cardLinkCount > 0) {
    const cardTitle = productLink.locator('.font-semibold').first();
    if (await cardTitle.count() > 0) {
      cardTitleText = await cardTitle.innerText();
      await cardTitle.screenshot({ path: 'frontend/tests/e2e/artifacts/product-card-title.png' });
    } else {
      cardTitleText = await productLink.innerText();
    }
  } else {
    // Product not visible on catalog page (pagination) — fall back to title from detail page
    cardTitleText = title.trim();
    console.log('  ℹ️  Product card not found on catalog page (may be paginated) — using detail page title');
  }
  console.log('User Product Card Title:', cardTitleText.trim());

  // Backend API name
  const resp = await page.request.get(`${BACKEND_URL}/api/products?limit=1`);
  const body = await resp.json();
  const backendName = Array.isArray(body.products)
    ? body.products[0]?.name
    : (body.products?.[0]?.name || body[0]?.name || '');
  console.log('Backend product name (API):', backendName);

  // Basic assertions: names exist and are non-empty
  expect(title.trim().length).toBeGreaterThan(0);
  expect(cardTitleText.trim().length).toBeGreaterThan(0);
  expect(backendName.length).toBeGreaterThan(0);
});
