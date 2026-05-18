# Quality Assurance & Testing Manual

This document outlines the testing strategy, framework configurations, and executing guides for maintaining high-quality code across both frontend and backend modules.

---

## 🧪 Testing Architecture

Our quality assurance pipeline spans three tiers of validation:
1. **Unit Testing (Frontend)**: Powered by **Vitest** + **React Testing Library** for fast, concurrent testing of individual components, Zustand stores, and custom hooks.
2. **Integration Testing**: Testing communication between frontend states, custom hooks, and simulated API endpoints.
3. **End-to-End (E2E) Testing**: Orchestrated by **Playwright** to execute user journey flows (signup, cart modification, checkout, tracking) in headless or headed Chromium, Firefox, and WebKit engines.

---

## 🏃 Executing Unit & Integration Tests (Vitest)

Unit tests are located in the `__tests__` or test subdirectories near the components or hooks they test (e.g., `frontend/src/hooks/__tests__/`).

### 1. Install Dependencies
Make sure node packages are fully installed inside `/frontend`:
```bash
cd frontend
npm install
```

### 2. Run Test Suites
- **Execute all tests once**:
  ```bash
  npm run test
  ```
- **Run in interactive watch mode**:
  ```bash
  npm run test:watch
  ```
- **Execute tests with the Vitest UI dashboard**:
  ```bash
  npm run test:ui
  ```
- **Generate test coverage reports**:
  ```bash
  npm run test:coverage
  ```

---

## 🤖 Executing End-to-End Tests (Playwright)

Playwright E2E suites simulate authentic user browsers and validate complete database, API, and UI flows.

### 1. Install Browsers
Initialize the Playwright binary engines:
```bash
cd frontend
npx playwright install
```

### 2. Execute E2E Tests
- **Run headless tests across all browsers**:
  ```bash
  npm run test:e2e
  ```
- **Run tests in headed mode (visible browser window)**:
  ```bash
  npm run test:e2e:headed
  ```
- **Display test results HTML report**:
  ```bash
  npm run test:e2e:report
  ```

---

## 🛠️ Custom Hook Testing Examples

We validate state hooks in isolation by mocking stores and API clients. For example, testing `useOrderStatus`:

```javascript
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import useOrderStatus from "../useOrderStatus";

describe("useOrderStatus Hook", () => {
  it("calculates next valid status transitions correctly", () => {
    const initialOrder = { status: "pending", trackingEvents: [] };
    const { result } = renderHook(() => useOrderStatus(initialOrder));
    
    // Confirmed, cancelled, and awaiting_verification are allowed from pending
    expect(result.current.nextOptions).toContain("confirmed");
    expect(result.current.nextOptions).toContain("cancelled");
  });
});
```

---

## 📡 Webhook Payment Simulation

To test ZaloPay, MoMo, or VNPay IPN callbacks locally without contacting sandbox servers:
1. Start the backend API locally.
2. Send a simulated POST payload to `/api/payments/vnpay/ipn` (or momo/zalopay) using tools like Postman, curl, or automated scripts:
   ```bash
   curl -X POST http://localhost:5000/api/payments/vnpay/ipn \
     -H "Content-Type: application/json" \
     -d '{"vnp_TxnRef": "DH12345", "vnp_ResponseCode": "00", "vnp_SecureHash": "..."}'
   ```
3. Check the backend logs to confirm atomic double-submit IPN locks are validated and the order successfully transitions to `confirmed`.
