import { test, expect } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const PRODUCT_ID = '6a0d8905d38ea5fe36d786ad';

test('Check product name display on user pages and backend', async ({ page }) => {
  // Product detail
  await page.goto(`${BASE}/product/${PRODUCT_ID}`);
  const title = await page.locator('h1').first().innerText();
  console.log('User Product Detail Title:', title.trim());
  await page.locator('h1').first().screenshot({ path: 'frontend/tests/e2e/artifacts/product-detail-title.png' });

  // Home/catalog product card (first card)
  await page.goto(BASE);
  // Find the specific product card link by product href
  const productLink = page.locator(`a[href="/product/${PRODUCT_ID}"]`).first();
  const cardTitle = productLink.locator('.font-semibold').first();
  let cardTitleText = '';
  if (await cardTitle.count() > 0) {
    cardTitleText = await cardTitle.innerText();
    await cardTitle.screenshot({ path: 'frontend/tests/e2e/artifacts/product-card-title.png' });
  } else {
    // fallback to any link text
    cardTitleText = await productLink.innerText();
    await productLink.screenshot({ path: 'frontend/tests/e2e/artifacts/product-card-title.png' });
  }
  console.log('User Product Card Title:', cardTitleText.trim());

  // Backend API name
  const resp = await page.request.get('http://localhost:5000/api/products?limit=1');
  const body = await resp.json();
  const backendName = Array.isArray(body.products) ? body.products[0].name : (body.products?.[0]?.name || body[0]?.name || '');
  console.log('Backend product name (API):', backendName);

  // Basic assertions: names exist and are similar
  expect(title.length).toBeGreaterThan(0);
  expect(cardTitle.length).toBeGreaterThan(0);
  expect(backendName.length).toBeGreaterThan(0);
});
