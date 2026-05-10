import { request as playwrightRequest, test } from '@playwright/test';

const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5000';

async function probeBackend() {
  const api = await playwrightRequest.newContext({
    baseURL: BACKEND_URL,
    timeout: 5000,
  });

  try {
    const response = await api.get('/api/settings');
    return {
      available: response.ok() || response.status() < 500,
      reason: response.ok()
        ? null
        : `backend responded with HTTP ${response.status()} from ${BACKEND_URL}`,
    };
  } catch (error) {
    return {
      available: false,
      reason: `backend is unavailable at ${BACKEND_URL}: ${error.message}`,
    };
  } finally {
    await api.dispose();
  }
}

export async function skipIfBackendUnavailable() {
  const probe = await probeBackend();
  test.skip(!probe.available, probe.reason || `backend is unavailable at ${BACKEND_URL}`);
}
