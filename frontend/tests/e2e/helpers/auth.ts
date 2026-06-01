import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { request as playwrightRequest } from '@playwright/test';

const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.PW_BASE_URL || 'http://localhost:5173';

export async function createAuthenticatedPage(page, opts = {}) {
  const { email, password, name, phone, storageStatePath, storageStateOutPath, browserLogin } = opts;

  // If a storageState path is provided, create a new context from it
  if (storageStatePath) {
    const browser = page.context().browser();
    const ctx = await browser.newContext({ storageState: storageStatePath });
    const newPage = await ctx.newPage();
    return newPage;
  }

  // If requested, perform a browser-based login using in-page fetches so cookies and CSRF are set exactly
  if (browserLogin && email && password) {
    try {
      await page.goto(FRONTEND_URL + '/');
      await page.waitForLoadState('networkidle');

      // Ensure CSRF cookie is set by probing settings endpoint
      await page.evaluate(async (backend) => {
        await fetch(backend + '/api/settings', { credentials: 'include' }).catch(() => null);
      }, BACKEND_URL);

      // Helper to read csrfToken cookie from document
      const readCsrf = await page.evaluate(() => {
        const m = document.cookie.split('; ').find((c) => c.startsWith('csrfToken='));
        return m ? m.split('=')[1] : null;
      });

      // Signup (ignore duplicate user errors)
      if (name) {
        await page.evaluate(async (backend, email, password, name, phone, csrf) => {
          try {
            await fetch(backend + '/api/auth/signup', {
              method: 'POST',
              credentials: 'include',
              headers: Object.assign({ 'content-type': 'application/json' }, csrf ? { 'x-csrf-token': csrf } : {}),
              body: JSON.stringify({ name, email, password, confirmPassword: password, ...(phone ? { phone } : {}) }),
            });
          } catch (e) {
            // ignore
          }
        }, BACKEND_URL, email, password, name, phone, readCsrf);

        // Attempt to request verification token (debug endpoint)
        await page.evaluate(async (backend, email, csrf) => {
          try {
            const r = await fetch(backend + '/api/auth/debug/verification-link', {
              method: 'POST',
              credentials: 'include',
              headers: Object.assign({ 'content-type': 'application/json' }, csrf ? { 'x-csrf-token': csrf } : {}),
              body: JSON.stringify({ email }),
            });
            if (r.ok()) {
              const j = await r.json().catch(() => null);
              const token = j?.token || (j?.verificationUrl ? new URL(j.verificationUrl).searchParams.get('token') : null);
              if (token) await fetch(backend + '/api/auth/verify-email', { method: 'POST', credentials: 'include', headers: Object.assign({ 'content-type': 'application/json' }, csrf ? { 'x-csrf-token': csrf } : {}), body: JSON.stringify({ token }) }).catch(() => null);
            }
          } catch (e) {
            // ignore
          }
        }, BACKEND_URL, email, readCsrf);
      }

      // Perform login via in-page fetch so cookies are set in the browser context
      const loginResult = await page.evaluate(async (backend, email, password, csrf) => {
        try {
          const r = await fetch(backend + '/api/auth/login', {
            method: 'POST',
            credentials: 'include',
            headers: Object.assign({ 'content-type': 'application/json' }, csrf ? { 'x-csrf-token': csrf } : {}),
            body: JSON.stringify({ email, password }),
          });
          const text = await r.text().catch(() => '');
          return { ok: r.ok(), status: r.status, body: text };
        } catch (e) {
          return { ok: false, status: 0, body: String(e && e.message) };
        }
      }, BACKEND_URL, email, password, readCsrf);

      // Debug output
      // eslint-disable-next-line no-console
      console.log('[e2e-debug] browserLogin result=', loginResult);

      if (!loginResult.ok) {
        // fall through to request-based flow below
      } else {
        // Grab storageState from the logged-in page context
        const state = await page.context().storageState();
        try {
          if (storageStateOutPath) {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const outPath = path.isAbsolute(storageStateOutPath) ? storageStateOutPath : path.resolve(__dirname, '..', storageStateOutPath);
            fs.mkdirSync(path.dirname(outPath), { recursive: true });
            fs.writeFileSync(outPath, JSON.stringify(state, null, 2), 'utf-8');
            // eslint-disable-next-line no-console
            console.log('[e2e-debug] saved storageState to', outPath);
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[e2e-debug] failed to save storageState', e && e.message);
        }

        const browser = page.context().browser();
        const ctx = await browser.newContext({ storageState: state });
        const newPage = await ctx.newPage();
        return newPage;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[e2e-debug] browserLogin failed, falling back to request-based flow', e && e.message);
    }
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
      const duplicateEmail = signupRes.status() === 400 && /đã được sử dụng|already exists|already in use|exists|duplicate/i.test(text);
      if (!duplicateEmail) {
        await api.dispose();
        throw new Error(`E2E signup failed: ${signupRes.status()} ${text}`);
      }
      // allow flow to continue when user already exists
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

  // Debug: log login response status and body for flaky CI/local runs
  try {
    const loginText = await loginRes.text().catch(() => '<no body>');
    // eslint-disable-next-line no-console
    console.log('[e2e-debug] loginRes.status=', loginRes.status(), ' body=', loginText);
  } catch (e) {
    // ignore
  }

  const state = await api.storageState();
  // Debug: log storageState cookies
  try {
    // eslint-disable-next-line no-console
    console.log('[e2e-debug] storageState.cookies=', (state && state.cookies) ? state.cookies.map(c => ({ name: c.name, domain: c.domain, path: c.path })) : state);
  } catch (e) {
    // ignore
  }

  // If an output path was provided, write the storageState to disk for other tests to reuse
  if (storageStateOutPath) {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const outPath = path.isAbsolute(storageStateOutPath) ? storageStateOutPath : path.resolve(__dirname, '..', storageStateOutPath);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(state, null, 2), 'utf-8');
      // eslint-disable-next-line no-console
      console.log('[e2e-debug] saved storageState to', outPath);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[e2e-debug] failed to save storageState', e && e.message);
    }
  }

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
