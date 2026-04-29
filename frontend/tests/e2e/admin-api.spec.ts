import { test, expect, request as playwrightRequest } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'ha8893536@gmail.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123';
const ADMIN_OTP = process.env.E2E_ADMIN_OTP || '';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';

const loginAsAdmin = async (api) => {
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
};

test.describe('Admin API', () => {
  test('protected route rejects without auth', async () => {
    const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
    const res = await api.get('/api/analytics/pl?days=7');
    expect(res.status()).toBe(401);
  });

  test('admin can access analytics and users', async () => {
    const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
    await loginAsAdmin(api);

    const plRes = await api.get('/api/analytics/pl?days=7');
    expect(plRes.ok()).toBeTruthy();
    const plJson = await plRes.json();
    expect(plJson.summary).toBeTruthy();

    const usersRes = await api.get('/api/auth/users?limit=1');
    expect(usersRes.ok()).toBeTruthy();

    const bulkRes = await api.patch('/api/products', {
      data: { action: 'adjustPrice', ids: ['invalid'], value: 10 },
    });
    expect(bulkRes.status()).toBe(400);
  });
});
