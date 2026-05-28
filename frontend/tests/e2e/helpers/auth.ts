import { request as playwrightRequest } from '@playwright/test';

const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.PW_BASE_URL || 'http://localhost:5173';

export async function createAuthenticatedPage(page, opts = {}) {
  const { email, password, name, phone, storageStatePath } = opts;

  // If a storageState path is provided, create a new context from it
  if (storageStatePath) {
    const browser = page.context().browser();
    const ctx = await browser.newContext({ storageState: storageStatePath });
    const newPage = await ctx.newPage();
    return newPage;
  }

  // Otherwise perform login via request and use the storageState object
  const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL });

  if (email && password && name) {
    const signupRes = await api.post('/api/auth/signup', {
      data: {
        name,
        email,
        ...(phone ? { phone } : {}),
        password,
        confirmPassword: password,
      },
    });

    if (!signupRes.ok()) {
      const text = await signupRes.text().catch(() => '<no body>');
      const duplicateEmail = signupRes.status() === 400 && text.includes('đã được sử dụng');
      if (!duplicateEmail) {
        await api.dispose();
        throw new Error(`E2E signup failed: ${signupRes.status()} ${text}`);
      }
    }

    const csrfProbe = await api.get('/api/settings');
    const csrfState = await api.storageState();
    const csrfToken = csrfState.cookies.find((cookie) => cookie.name === 'csrfToken')?.value;

    const verificationRes = await api.post('/api/auth/debug/verification-link', {
      data: { email },
      headers: csrfProbe.ok() && csrfToken ? { 'x-csrf-token': csrfToken } : {},
    });

    if (verificationRes.ok()) {
      const verificationData = await verificationRes.json().catch(() => null);
      const token = verificationData?.token || new URL(verificationData?.verificationUrl || '').searchParams.get('token');
      if (token) {
        await api.post('/api/auth/verify-email', {
          data: { token },
        }).catch(() => {});
      }
    }
  }

  const loginRes = await api.post('/api/auth/login', { data: { email, password } });
  if (!loginRes.ok()) {
    const text = await loginRes.text().catch(() => '<no body>');
    await api.dispose();
    throw new Error(`E2E login failed: ${loginRes.status()} ${text}`);
  }

  const state = await api.storageState();
  await api.dispose();

  const browser = page.context().browser();
  const ctx = await browser.newContext({ storageState: state });
  const newPage = await ctx.newPage();
  // Navigate to the app root so the SPA initializes with auth state available
  try {
    await newPage.goto(FRONTEND_URL + '/');
    await newPage.waitForLoadState('networkidle');
    // Try navigating to admin dashboard so client-side auth initialization completes
    try {
      await newPage.goto(FRONTEND_URL + '/secret-dashboard');
      await newPage.waitForSelector('text=Watch Admin', { timeout: 3000 });
    } catch (err) {
      // ignore if admin UI not immediately present; tests will handle assertions
    }
  } catch (e) {
    // ignore navigation errors; tests may navigate explicitly
  }
  return newPage;
}
