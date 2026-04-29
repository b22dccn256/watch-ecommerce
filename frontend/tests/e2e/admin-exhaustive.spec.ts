import { test, expect, request as playwrightRequest } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

  const openTab = async (page, label) => {
    await page.getByRole('button', { name: label }).click();
  };

  test.beforeAll(async () => {
    const hasAuthState = fs.existsSync(AUTH_STATE_PATH);
    api = await playwrightRequest.newContext({
      baseURL: BACKEND_URL,
      timeout: 20000,
      storageState: hasAuthState ? AUTH_STATE_PATH : undefined,
    });

    if (hasAuthState) {
      const savedState = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8'));
      authCookies = savedState.cookies.map((cookie) => ({
        ...cookie,
        domain: 'localhost',
      }));
    } else {
      await loginAdmin();
      fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });
      await api.storageState({ path: AUTH_STATE_PATH });
    }

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
    await openTab(page, 'Dashboard');
    await expect(page.getByText('Tổng quan hiệu suất')).toBeVisible();
    await expect(page.getByRole('button', { name: /CSV báo cáo/i })).toBeVisible();
  });

  test('Orders', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'Đơn hàng');
    await expect(page.getByText('Quản lý Đơn hàng')).toBeVisible();

    const detailButtons = page.getByRole('button', { name: 'Xem chi tiết' });
    if (await detailButtons.count()) {
      await detailButtons.first().click();
      await page.getByPlaceholder('VD: Khách yêu cầu cắt dây 2 mắt, gọi ra ngoài giờ...').fill('E2E note');
      await page.getByRole('button', { name: /Lưu Thay Đổi Backend/i }).click();
      await expect(page.getByText('Lưu thành công')).toBeVisible();
    }
  });

  test('Products CRUD + Bulk', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'Sản phẩm');

    await page.waitForTimeout(800);
    const firstRowCheckbox = page.locator('table tbody tr').first().locator('button').first();
    await firstRowCheckbox.click();

    page.once('dialog', (dialog) => dialog.accept('0'));
    await page.getByRole('button', { name: /± Giá/i }).click();
  });

  test('Catalog: Brands + Categories', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'Danh mục & Thương hiệu');

    const imagePath = path.resolve(__dirname, '../../public/banner-2.jpg');
    await page.getByRole('button', { name: /THÊM THƯƠNG HIỆU/i }).click();
    await page.getByPlaceholder('VD: Rolex').fill(`E2E Brand UI ${Date.now()}`);
    await page.locator('input[type="file"]').first().setInputFiles(imagePath);
    await page.getByRole('button', { name: /Lưu thương hiệu/i }).click();
    await expect(page.getByRole('heading', { name: /Tạo Thương Hiệu/i })).toBeHidden({ timeout: 10000 });

    await openTab(page, 'Danh mục & Thương hiệu');
    await page.getByRole('button', { name: /Cấu Trúc Danh Mục/i }).click();
    await page.getByRole('button', { name: /THÊM DANH MỤC/i }).click();
    await page.getByPlaceholder('VD: Dress Watches').fill(`E2E Cat UI ${Date.now()}`);
    await page.locator('input[type="file"]').nth(1).setInputFiles(imagePath);
    await page.getByRole('button', { name: /Lưu danh mục/i }).click();
    await expect(page.getByRole('heading', { name: /Tạo Danh Mục/i })).toBeHidden({ timeout: 10000 });
  });

  test('Inventory', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'Kho hàng');

    await page.getByRole('button', { name: /Khởi tạo Kiểm kê/i }).click();
    await page.locator('select').first().selectOption(temp.productId);
    await page.locator('select').nth(1).selectOption('ADJUST');
    await page.locator('input[type="number"]').first().fill('2');
    await page.getByPlaceholder('Vd: Nhập lô hàng mới tháng 4...').fill('E2E adjust');
    await page.getByRole('button', { name: /Xác nhận cập nhật/i }).click();
  });

  test('Marketing + Campaigns + Banners', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'Marketing');

    const start = new Date(Date.now() + 2 * 60 * 1000);
    const end = new Date(Date.now() + 26 * 60 * 60 * 1000);

    await page.getByPlaceholder('VD: Flash Sale 8/3').fill(`E2E Campaign UI ${Date.now()}`);
    await page.getByPlaceholder('15').fill('12');
    await page.locator('input[type="datetime-local"]').nth(0).fill(formatDateInput(start));
    await page.locator('input[type="datetime-local"]').nth(1).fill(formatDateInput(end));
    await page.getByRole('button', { name: /Kích hoạt chiến dịch/i }).click();
  });

  test('Email module', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'Email');

    await page.getByRole('button', { name: /Hộp thư đến/i }).click();
    await page.getByRole('button', { name: /Người đăng ký/i }).click();
    await page.getByRole('button', { name: /Chiến dịch/i }).click();
    await page.getByRole('button', { name: /Mẫu Email/i }).click();
    await page.getByRole('button', { name: /Tự động hóa/i }).click();
  });

  test('Reviews & Q&A', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'Reviews & Q&A');

    await page.getByRole('button', { name: /Đánh Giá/i }).click();
    await page.getByRole('button', { name: /Hỏi Đáp/i }).click();

    const replyButtons = page.getByRole('button', { name: /Trả lời|Phản hồi/i });
    if (await replyButtons.count()) {
      await replyButtons.first().click();
      await page.getByPlaceholder('Nhập phản hồi...').fill('E2E reply');
      await page.getByRole('button', { name: /Gửi phản hồi/i }).click();
    }
  });

  test('Coupons', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'Mã giảm giá');

    await page.getByRole('button', { name: /TẠO MÃ MỚI/i }).click();
    temp.couponCode = `E2E${Date.now().toString().slice(-6)}`;
    await page.getByPlaceholder('VD: SUMMER2024').fill(temp.couponCode);
    await page.getByPlaceholder('VD: 10').fill('10');
    await page.locator('input[type="datetime-local"]').first().fill(formatDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
    await page.getByRole('button', { name: /Tạo Mã$/i }).click();
  });

  test('Users (loyalty + notes)', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'Người dùng');

    const actionMenu = page.locator('table tbody tr').first().locator('button').first();
    await actionMenu.click();
    await page.getByRole('button', { name: /Xem chi tiết/i }).click();

    page.once('dialog', (dialog) => dialog.accept('5'));
    await page.getByRole('button', { name: /\+\/- Diem/i }).click();

    await page.getByRole('button', { name: 'VIP' }).click();
    await page.getByPlaceholder('Ghi chu noi bo...').fill('E2E notes');
  });

  test('AI System', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'AI System');

    await page.getByRole('button', { name: /Kích hoạt AI Phê Duyệt/i }).click();
    await page.getByRole('button', { name: /Quét & Dọn Dẹp Spam/i }).click();
  });

  test('Store Settings', async ({ page }) => {
    await gotoAdmin(page);
    await openTab(page, 'Giao diện');

    await page.locator('textarea[name="heroSlogan"]').fill('E2E slogan');
    await page.getByRole('button', { name: /LƯU & XUẤT BẢN NGAY/i }).click();
  });
});
