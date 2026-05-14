# ADMIN Detailed Audit (Deep Review)

Audit date: 2026-05-14
Scope: Admin area deep-dive (code + UX + operations)

## Severity Legend
- S0: Critical blocker
- S1: High impact
- S2: Medium impact
- S3: Low impact / polish

---

## Findings

### S0-01: Vietnamese text encoding is corrupted across Admin
- File: frontend/src/pages/AdminPage.jsx:29
- File: frontend/src/components/OrdersTab.jsx:22
- File: frontend/src/components/ProductsList.jsx:22
- File: frontend/src/components/UsersTab.jsx:72
- File: frontend/src/components/EmailTab.jsx:20
- File: frontend/src/components/MarketingTab.jsx:42
- File: frontend/src/components/AnalyticsTab.jsx:7
- Issue: UI strings are mojibake (`Ä`, `KhĂ´ng`, `Tá»•ng...`) instead of proper Vietnamese.
- Impact: severe UX quality drop, unprofessional demo, harder QA/content checks.
- Fix:
- Normalize all files to UTF-8.
- Replace corrupted literals with proper Vietnamese.
- Add repo/editor encoding rule (UTF-8 only).

### S0-02: Prompt-based admin actions (unsafe UX)
- File: frontend/src/components/ProductsList.jsx:159-167
- Issue: bulk price adjust workflow still accepts generic free text input path and weak numeric validation semantics.
- Impact: high risk of wrong batch edits (especially large selection).
- Fix:
- Force dedicated modal with strict schema validation (`number`, range, decimal precision).
- Add impact preview (`N products affected`, sample before/after).
- Add second confirm for |delta| > threshold.

### S0-03: Notification read-state is local only
- File: frontend/src/pages/AdminPage.jsx:399-404
- Issue: "mark all read" only clears client state; no server persistence.
- Impact: inconsistent notification behavior after refresh/device switch.
- Fix:
- Add server-side notification entity/read status.
- Persist `readAt`, support per-user read cursor.

### S0-04: Admin search does not navigate to concrete entity
- File: frontend/src/pages/AdminPage.jsx:329, 344
- Issue: selecting search results only switches tab; it does not open/highlight selected order/product.
- Impact: slow operations in large datasets; search utility is partial.
- Fix:
- Implement deep-link (`?tab=orders&focus=<id>`) + row highlight/auto-open detail.

---

### S1-01: OrdersTab is oversized monolith
- File: frontend/src/components/OrdersTab.jsx:1-877
- Issue: one component mixes listing, filters, bulk actions, modal detail, print template, CSV export, transition logic.
- Impact: high regression risk, difficult maintainability, slow onboarding.
- Fix:
- Split into:
- `OrdersListTable`
- `OrdersBulkActions`
- `OrderDetailModal`
- `OrderInvoicePrintTemplate`
- `useOrdersAdmin` hook for data/actions.

### S1-02: Transition logic only protected on frontend
- File: frontend/src/components/OrdersTab.jsx:34-49, 144-171
- Issue: FE enforces transition matrix, but FE alone is not source of truth.
- Impact: bypass risk via direct API clients.
- Fix:
- Keep matrix on backend as authoritative.
- FE consumes allowed transitions from API response.

### S1-03: CSV export implementation not robust for commas/quotes/newlines
- File: frontend/src/components/OrdersTab.jsx:233-250
- Issue: values are joined by comma without full RFC-safe escaping.
- Impact: broken CSV for real-world addresses/notes.
- Fix:
- Escape `"` and wrap every text field in quotes.
- Prefer library-based CSV serializer.

### S1-04: Print flow relies on popup and inline HTML string
- File: frontend/src/components/OrdersTab.jsx:271-350
- Issue: popup can be blocked; template is hardcoded inside JS string.
- Impact: unreliable printing + poor maintainability.
- Fix:
- Extract printable component/template.
- Provide fallback in-app print route.

### S1-05: UsersTab mixes many privileged actions inside one modal
- File: frontend/src/components/UsersTab.jsx:537-590
- Issue: role changes, loyalty update, tags, notes handled tightly coupled in single modal flow.
- Impact: accidental actions, weak auditability in UX.
- Fix:
- Separate sections with explicit save state and permission gates.
- Add per-action loading and success/error indicators.

### S1-06: Email automation toggle depends on possibly missing backend endpoint
- File: frontend/src/components/EmailTab.jsx:98-100
- Issue: optimistic toggle calls endpoint that may not exist in all envs.
- Impact: silent product mismatch between UI and backend capabilities.
- Fix:
- Feature-flag by backend capability discovery.
- Disable controls when endpoint unavailable.

### S1-07: MarketingTab combines Banner + Campaign domains
- File: frontend/src/components/MarketingTab.jsx:141-400
- Issue: two large domains in one screen/component.
- Impact: cognitive overload + slower iteration.
- Fix:
- Split into child tabs/routes: `Banners`, `Campaigns`.

---

### S2-01: Repeated console errors in UI runtime paths
- File: frontend/src/components/OrdersTab.jsx:105, 259
- File: frontend/src/components/UsersTab.jsx:71, 109
- File: frontend/src/components/EmailTab.jsx:66
- File: frontend/src/components/AnalyticsTab.jsx:129
- Issue: runtime paths still emit raw `console.error`.
- Impact: noisy logs, weak observability standard.
- Fix:
- Replace with centralized logger + user-safe error handling.

### S2-02: Unused imports and dead code hints
- File: frontend/src/pages/AdminPage.jsx:4,10,24 (`ChevronDown`, `Settings`, `toast`, `useProductStore` not used)
- File: frontend/src/components/ProductsList.jsx:65 (`storeCurrentPage` unused)
- File: frontend/src/components/MarketingTab.jsx:11 (`fetchAllProducts` unused)
- Impact: code hygiene decline.
- Fix:
- remove unused imports/vars and enable lint rule in CI.

### S2-03: Pagination/filter state coupling is fragile
- File: frontend/src/components/ProductsList.jsx:100-115
- Issue: effect mutates URL params and fetches in same effect, dependent on `searchParams` object.
- Impact: potential redundant fetch loops and harder reasoning.
- Fix:
- isolate URL sync effect from data-fetch effect.

### S2-04: Accessibility gaps in icon-only controls
- File: frontend/src/pages/AdminPage.jsx:277-283, 368-376
- File: frontend/src/components/ProductsList.jsx:427-433, 444-450
- Issue: many icon buttons rely only on `title`, no `aria-label`/keyboard behavior audits.
- Impact: weak keyboard/screen-reader support.
- Fix:
- add `aria-label`, focus-visible styles, keyboard QA checklist.

### S2-05: Heavy visual styling density in admin cards/tables
- File: frontend/src/components/OrdersTab.jsx:390-393
- File: frontend/src/components/UsersTab.jsx:262-277
- File: frontend/src/components/MarketingTab.jsx:231-336
- Impact: “rác” feeling you described: too many visual accents compete for attention.
- Fix:
- define visual hierarchy rules and reduce decoration density.

---

### S3-01: Mixed copy language and inconsistent terminology
- File: multiple admin components
- Issue: English + Vietnamese mixed inconsistently (`Dashboard`, `AI System`, `Status`, `Toàn bộ`).
- Fix:
- choose one admin locale strategy and standard glossary.

### S3-02: Placeholder/beta actions still shown as production controls
- File: frontend/src/components/EmailTab.jsx:130, 345
- Issue: actions show toast “đang phát triển”.
- Fix:
- hide behind feature flags or mark as `Beta` clearly.

---

## Structural Risks (Admin-specific)

- Component size risk:
- `OrdersTab` ~877 lines
- `UsersTab` ~727 lines
- `AdminPage` ~453 lines
- `AnalyticsTab` ~361 lines
- Risk: every change becomes risky due to large blast radius.

- State orchestration risk:
- Many local states and side-effects in single components.
- Missing shared admin data layer patterns.

---

## Prioritized Implementation Plan

### Phase 1 (Immediate)
- Fix encoding globally (all admin strings).
- Stabilize critical admin flows: search deep-link, notifications read-state model.
- Harden batch operations (modal validation + second confirm + operation report).

### Phase 2
- Refactor `OrdersTab` and `UsersTab` into modular architecture.
- Introduce shared admin action patterns (confirm, loading, error, rollback).

### Phase 3
- UX polish pass for admin density reduction and accessibility.
- Add E2E tests for admin core workflows.

---

## Done Criteria for Admin Quality Gate

- No mojibake text in Admin.
- No placeholder flows in production paths.
- All destructive/bulk actions audited and guarded.
- Search and notifications are operationally useful (entity-level navigation + persisted state).
- Core admin modules split and test-covered.
