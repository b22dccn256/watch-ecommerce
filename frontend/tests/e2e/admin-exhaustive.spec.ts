import { test, expect, request as playwrightRequest } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { skipIfBackendUnavailable } from './helpers/backend';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'ha8893536@gmail.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123';
const ADMIN_OTP = process.env.E2E_ADMIN_OTP || '';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';

const TEST_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_STATE_PATH = path.resolve(__dirname, '..', '.auth', 'admin.json');

const formatDateInput = (date) => {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const ensureOk = async (res, label) => {
  if (res.ok()) return;
  const body = await res.text();
  throw new Error(`${label} failed: ${res.status()} ${body}`);
};

test.describe.serial('Admin exhaustive', () => {
  let api;
  let authCookies = [];
  const temp = {
    brandId: null,
    categoryId: null,
    productId: null,
    productName: null,
    bannerId: null,
    campaignId: null,
    couponId: null,
    couponCode: null,
    userId: null,
    userRewardPoints: 0,
    userTags: [],
    userAdminNotes: '',
    productStock: 0,
    storeConfig: null,
  };

  const loginAdmin = async () => {
    const loginRes = await api.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    await ensureOk(loginRes, 'Login');
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
    authCookies = state.cookies.map((cookie) => ({
      ...cookie,
      domain: 'localhost',
    }));
  };

  const gotoAdmin = async (page) => {
    await page.context().addCookies(authCookies);
    await page.goto('/secret-dashboard');
    await expect(page.getByText('Watch Admin')).toBeVisible();
  };

  const openTab = async (page, tabId) => {
    await page.goto(`/secret-dashboard?tab=${tabId}`);
  };

  const clickEmailSubtab = async (page, name) => {
    await page.getByRole('button', { name }).click({ force: true });
    await page.waitForTimeout(200);
  };

  test.beforeAll(async () => {
    await skipIfBackendUnavailable();

    api = await playwrightRequest.newContext({
      baseURL: BACKEND_URL,
      timeout: 20000,
    });

    await loginAdmin();
    fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });
    await api.storageState({ path: AUTH_STATE_PATH });

    const configRes = await api.get('/api/settings');
    temp.storeConfig = configRes.ok() ? await configRes.json() : null;

    const brandsRes = await api.get('/api/brands');
    const brands = brandsRes.ok() ? await brandsRes.json() : [];
    if (brands.length > 0) {
      temp.brandId = brands[0]._id;
    } else {
      const brandRes = await api.post('/api/brands', {
        data: { name: `E2E Brand ${Date.now()}`, description: 'E2E brand', logo: '' },
      });
      expect(brandRes.ok()).toBeTruthy();
      const brand = await brandRes.json();
      temp.brandId = brand._id;
    }

    const categoriesRes = await api.get('/api/categories?tree=false');
    const categories = categoriesRes.ok() ? await categoriesRes.json() : [];
    if (categories.length > 0) {
      temp.categoryId = categories[0]._id;
    } else {
      const slug = `e2e-cat-${Date.now()}`;
      const catRes = await api.post('/api/categories', {
        data: { name: 'E2E Category', slug, image: '' },
      });
      expect(catRes.ok()).toBeTruthy();
      const cat = await catRes.json();
      temp.categoryId = cat._id;
    }

    temp.productName = `E2E Admin Product ${Date.now()}`;
    const productRes = await api.post('/api/products', {
      data: {
        name: temp.productName,
        description: 'E2E product description',
        price: 123456,
        image: TEST_IMAGE,
        stock: 3,
        brand: temp.brandId,
        categoryId: temp.categoryId,
        type: 'automatic',
        lowStockThreshold: 5,
      },
    });
    expect(productRes.ok()).toBeTruthy();
    const product = await productRes.json();
    temp.productId = product._id;
    temp.productStock = product.stock || 0;

    const bannerRes = await api.post('/api/banners', {
      data: { title: `E2E Banner ${Date.now()}`, image: TEST_IMAGE },
    });
    expect(bannerRes.ok()).toBeTruthy();
    temp.bannerId = (await bannerRes.json())._id;

    const start = new Date(Date.now() + 60 * 1000);
    const end = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const campaignRes = await api.post('/api/campaigns', {
      data: {
        name: `E2E Campaign ${Date.now()}`,
        group: 'Entire Catalog',
        discountPercentage: 10,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        isGlobal: true,
      },
    });
    await ensureOk(campaignRes, 'Create campaign');
    temp.campaignId = (await campaignRes.json())._id;

    const usersRes = await api.get('/api/auth/users?limit=1');
    if (usersRes.ok()) {
      const usersPayload = await usersRes.json();
      const user = (usersPayload.users || [])[0];
      if (user) {
        temp.userId = user._id;
        temp.userRewardPoints = user.rewardPoints || 0;
        temp.userTags = user.tags || [];
        temp.userAdminNotes = user.adminNotes || '';
      }
    }
  });

  test.afterAll(async () => {
    if (!api) return;

    if (temp.userId) {
      await api.patch(`/api/auth/users/${temp.userId}/admin-notes`, {
        data: { tags: temp.userTags, adminNotes: temp.userAdminNotes },
      });
    }

    if (temp.productId) {
      await api.post('/api/inventory/adjust', {
        data: { productId: temp.productId, action: 'ADJUST', quantity: temp.productStock, note: 'E2E restore stock' },
      });
      await api.delete(`/api/products/${temp.productId}`);
    }

    if (temp.campaignId) await api.delete(`/api/campaigns/${temp.campaignId}`);
    if (temp.bannerId) await api.delete(`/api/banners/${temp.bannerId}`, { timeout: 20000 });
    if (temp.couponId) {
      await api.delete(`/api/coupons/${temp.couponId}`);
    } else if (temp.couponCode) {
      const couponsRes = await api.get('/api/coupons');
      if (couponsRes.ok()) {
        const coupons = await couponsRes.json();
        const match = coupons.find((coupon) => coupon.code === temp.couponCode);
        if (match?._id) {
          await api.delete(`/api/coupons/${match._id}`);
        }
      }
    }

    if (temp.categoryId) await api.delete(`/api/categories/${temp.categoryId}`);
    if (temp.brandId) await api.delete(`/api/brands/${temp.brandId}`);

    if (temp.storeConfig) {
      await api.put('/api/settings', { data: temp.storeConfig });
    }

    await api.dispose();
  });

  test('Dashboard + Analytics', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'analytics');
    await expect(page).toHaveURL(/tab=analytics/);
  });

  test('Orders', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'orders');
    await expect(page).toHaveURL(/tab=orders/);

    const detailButtons = page.getByRole('button', { name: 'Xem chi tiáº¿t' });
    if (await detailButtons.count()) {
      await detailButtons.first().click();
      await page.getByPlaceholder('VD: KhĂ¡ch yĂªu cáº§u cáº¯t dĂ¢y 2 máº¯t, gá»i ra ngoĂ i giá»...').fill('E2E note');
      await page.getByRole('button', { name: /LÆ°u Thay .* Backend/i }).click();
      await expect(page.getByText('LÆ°u thĂ nh cĂ´ng')).toBeVisible();
    }
  });

  test('Products CRUD + Bulk', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'products');
    await expect(page).toHaveURL(/tab=products/);

    await page.waitForTimeout(800);
    const firstRowCheckbox = page.locator('table tbody tr').first().locator('button').first();
    await firstRowCheckbox.click();
  });

  test('Catalog: Brands + Categories', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'catalog');

    const imagePath = path.resolve(__dirname, '../../public/banner-2.jpg');
    await page.locator('button:has(svg.lucide-circle-plus)').nth(1).click();
    await page.getByPlaceholder('VD: Rolex').fill(`E2E Brand UI ${Date.now()}`);
    await page.locator('input[type="file"]').first().setInputFiles(imagePath);
    await page.locator('form').first().locator('button[type="submit"]').click();
    await expect(page.getByPlaceholder('VD: Rolex')).toBeHidden({ timeout: 10000 });

    await openTab(page, 'catalog');
    await page.locator('div.flex.gap-2.border-b button').nth(1).click();
    await page.locator('button:has(svg.lucide-circle-plus)').nth(1).click();
    await page.getByPlaceholder('VD: Dress Watches').fill(`E2E Cat UI ${Date.now()}`);
    await page.locator('input[type="file"]').first().setInputFiles(imagePath);
    await page.locator('form').first().locator('button[type="submit"]').click();
    await expect(page.getByPlaceholder('VD: Dress Watches')).toBeHidden({ timeout: 10000 });
  });

  test('Inventory', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'inventory');

    await page.getByRole('button', { name: /Kh.*i t.*o Ki.*m k.*/i }).click();
    await page.locator('select').first().selectOption(temp.productId);
    await page.locator('select').nth(1).selectOption('ADJUST');
    await page.locator('input[type="number"]').first().fill('2');
    await page.locator('textarea').first().fill('E2E adjust');
    await page.locator('button[type="submit"]').first().click();
  });

  test('Marketing + Campaigns + Banners', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'marketing');

    const start = new Date(Date.now() + 2 * 60 * 1000);
    const end = new Date(Date.now() + 26 * 60 * 60 * 1000);

    await page.getByPlaceholder('VD: Flash Sale 8/3').fill(`E2E Campaign UI ${Date.now()}`);
    await page.getByPlaceholder('15').fill('12');
    await page.locator('input[type="datetime-local"]').nth(0).fill(formatDateInput(start));
    await page.locator('input[type="datetime-local"]').nth(1).fill(formatDateInput(end));
    await page.getByRole('button', { name: /K.*ch ho.*t chi.*n d.*ch/i }).click();
  });

  test('Email module', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'email');
    await expect(page).toHaveURL(/tab=email/);
    await expect(page.getByRole('button', { name: /T.*O M.*I/i })).toBeVisible();
  });

  test('Reviews & Q&A', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'reviews');
    await expect(page).toHaveURL(/tab=reviews/);
  });

  test('Coupons', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'coupons');

    await page.getByRole('button', { name: /T.*O M.* M.*I/i }).click();
    temp.couponCode = `E2E${Date.now().toString().slice(-6)}`;
    await page.getByPlaceholder('VD: SUMMER2024').fill(temp.couponCode);
    await page.locator('input[type="number"]').first().fill('10');
    await page.locator('input[type="datetime-local"]').first().fill(formatDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
    await page.locator('button[type="submit"]').first().click();
  });

  test('Users (loyalty + notes)', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'users');
    await expect(page).toHaveURL(/tab=users/);
  });

  test('AI System', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'ai');

    await page.getByRole('button', { name: /K.*ch ho.*t AI Ph.* Duy.*t/i }).click();
    await page.getByRole('button', { name: /Qu.*t & D.*n D.*p Spam/i }).click();
  });

  test('Store Settings', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'settings');

    await page.locator('textarea[name="heroSlogan"]').fill('E2E slogan');
    await page.getByRole('button', { name: /L.*U & XU.*T B.*N NGAY/i }).click();
  });
});
