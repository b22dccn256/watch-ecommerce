# Admin Dashboard Audit

## 1. Scope & High-Level Architecture
This document audits the real implementation state of the Admin Dashboard module across Frontend and Backend.

### In-Scope
- Frontend routing and guards:
  - `frontend/src/App.jsx`
  - `frontend/src/components/Navbar.jsx`
- Admin shell and tabs:
  - `frontend/src/pages/AdminPage.jsx`
  - `frontend/src/components/AnalyticsTab.jsx`
  - `frontend/src/components/OrdersTab.jsx`
  - `frontend/src/components/ProductsList.jsx`
  - `frontend/src/components/InventoryTab.jsx`
  - `frontend/src/components/MarketingTab.jsx`
  - `frontend/src/components/EmailTab.jsx`
  - `frontend/src/components/UsersTab.jsx`
  - `frontend/src/components/AITab.jsx`
  - `frontend/src/components/StoreSettingsTab.jsx`
- Related FE stores:
  - `frontend/src/stores/useUserStore.js`
  - `frontend/src/stores/useProductStore.js`
  - `frontend/src/stores/useCampaignStore.js`
  - `frontend/src/stores/useInventoryStore.js`
  - `frontend/src/stores/useStorefrontStore.js`
- Backend entry/middleware/routes/controllers:
  - `backend/server.js`
  - `backend/middleware/auth.middleware.js`
  - `backend/middleware/permission.middleware.js`
  - `backend/routes/{analytics,order,product,inventory,campaign,banner,mail,auth,storeConfig,ai}.route.js`
  - `backend/controllers/{analytics,order,campaign,banner,mail,auth,inventory,storeConfig,ai}.controller.js`

### High-Level FE Architecture
- React SPA with route-level guard and role checks.
- One admin shell (`AdminPage`) renders all modules as tabs.
- Each tab calls backend APIs directly via shared Axios client.
- Zustand stores encapsulate data fetch/mutations for several domains.

### High-Level BE Architecture
- Express app with `/api/*` route mounting in `backend/server.js`.
- Authentication and role checks done in middleware:
  - `protectRoute`: token and user loading
  - `adminRoute`: admin only
  - `managementRoute`: admin or staff
  - `checkPermission`: action-level denylist with audit log
- Controllers perform business logic and DB mutation using Mongoose models.

## 2. Frontend Admin (Entry Guards, Shell State, Tab-by-Tab breakdown with exact API calls)

### 2.1 Entry Guards and Navigation
- Admin route: `/secret-dashboard` in `frontend/src/App.jsx`.
- Guard logic currently allows:
  - `admin`
  - `staff`
- Navbar admin link in `frontend/src/components/Navbar.jsx` is visible only for `admin` role.
- Result: staff can access the route directly, but has no direct menu link from navbar.

### 2.2 Admin Shell State
- File: `frontend/src/pages/AdminPage.jsx`
- Local states:
  - `activeTab` (default: `analytics`)
  - `sidebarOpen` (mobile drawer)
- Tabs rendered from static config:
  - analytics, orders, products, inventory, marketing, email, users, ai, settings
- Shared behavior:
  - Tab content rendered by `switch(activeTab)`.
  - No deep-linking (`/secret-dashboard?tab=...`) and no persistence of selected tab on refresh.

### 2.3 Tab-by-Tab (with exact API calls)

#### A) AnalyticsTab
- File: `frontend/src/components/AnalyticsTab.jsx`
- Main features:
  - KPI cards (users/products/orders/revenue)
  - AOV and paid order count
  - Daily revenue/orders line chart by period selector (7/30/90)
  - Payment method pie chart
- API calls:
  - `GET /api/analytics?days={7|30|90}`

#### B) OrdersTab
- File: `frontend/src/components/OrdersTab.jsx`
- Main features:
  - Filter by status + search + pagination
  - Inline status update dropdown
  - Detail modal with editable fields (carrier, tracking, internal notes, return reason, refund)
  - CSV export and invoice print
- API calls:
  - `GET /api/orders?page=&limit=&search=&status=`
  - `PATCH /api/orders/:id/status`
  - `PATCH /api/orders/:id/details`
- Additional behavior:
  - Exports all filtered orders using `limit=all`.

#### C) ProductsList
- File: `frontend/src/components/ProductsList.jsx`
- Main features:
  - Product list search/sort/pagination
  - Create product modal
  - Toggle featured
  - Bulk select + bulk delete
  - Excel preview import + import + export
  - Campaign picker modal for selected products
- API calls:
  - `GET /api/products`
  - `POST /api/products`
  - `PUT /api/products/:id`
  - `PATCH /api/products/:id` (featured toggle)
  - `DELETE /api/products/:id`
  - `POST /api/products/import/preview`
  - `POST /api/products/import`
  - `GET /api/products/export`
- Notable status:
  - Campaign picker modal text states feature is not completed.

#### D) InventoryTab
- File: `frontend/src/components/InventoryTab.jsx`
- Main features:
  - Low-stock alert section
  - Manual stock adjustment (IN/OUT/ADJUST)
  - Product inventory logs modal
  - Search + pagination for product list
- API calls:
  - `GET /api/inventory/low-stock`
  - `POST /api/inventory/adjust`
  - `GET /api/inventory/product/:productId`

#### E) MarketingTab
- File: `frontend/src/components/MarketingTab.jsx`
- Main features:
  - Campaign creation, activation toggling, deletion
  - Homepage banner upload, activation toggling, deletion
- API calls:
  - Campaign:
    - `GET /api/campaigns`
    - `POST /api/campaigns`
    - `PATCH /api/campaigns/:id`
    - `DELETE /api/campaigns/:id`
  - Banner:
    - `GET /api/banners`
    - `POST /api/banners`
    - `PATCH /api/banners/:id/toggle`
    - `DELETE /api/banners/:id`

#### F) EmailTab
- File: `frontend/src/components/EmailTab.jsx`
- Sub-tabs:
  - dashboard, inbox, subscribers, campaigns, templates, automation
- API fetch behavior currently implemented only for:
  - `GET /api/mail/inbox`
  - `GET /api/mail/subscribers`
  - `GET /api/mail/campaigns`
  - `GET /api/mail/templates`
- Main findings:
  - Dashboard uses hardcoded/mock chart and metric cards.
  - Several actions are UI-only placeholders (example: `Feature coming soon`).

#### G) UsersTab
- File: `frontend/src/components/UsersTab.jsx`
- Main features:
  - User directory with search/role filter/pagination
  - Role updates and delete user
  - Audit logs timeline and detail modal
- API calls:
  - `GET /api/auth/users?page=&limit=&search=&role=`
  - `PATCH /api/auth/users/:id/role`
  - `DELETE /api/auth/users/:id`
  - `GET /api/auth/audit-logs?page=&limit=`
- Important FE behavior:
  - UI offers role conversion to `staff`.

#### H) AITab
- File: `frontend/src/components/AITab.jsx`
- Main features:
  - Trigger AI order confirmation automation
  - Trigger AI spam-user cleanup automation
  - Local in-tab operation logs
- API calls:
  - `POST /api/ai/automation/confirm-orders`
  - `POST /api/ai/automation/cleanup-users`

#### I) StoreSettingsTab
- File: `frontend/src/components/StoreSettingsTab.jsx`
- Main features:
  - Edit storefront config values (hero, flash sale title, best seller title, grid columns, chatbot toggle)
- API calls:
  - `GET /api/settings`
  - `PUT /api/settings`

## 3. Backend Admin (Middleware logic, Route/Controller Mapping)

### 3.1 Server Mounting
- File: `backend/server.js`
- Relevant mounts:
  - `/api/auth`
  - `/api/products`
  - `/api/orders`
  - `/api/analytics`
  - `/api/inventory`
  - `/api/campaigns`
  - `/api/banners`
  - `/api/mail`
  - `/api/settings`
  - `/api/ai`

### 3.2 Middleware Logic (RBAC and Access)

#### `protectRoute`
- Verifies access token from cookies.
- Loads user from DB and attaches to `req.user`.
- Returns 401 with hints (`needRefresh` / `needLogin`) on token failures.

#### `adminRoute`
- Allows only `req.user.role === "admin"`.

#### `managementRoute`
- Allows `admin` and `staff`.

#### `checkPermission(excludedRoles, actionName)`
- Deny by role list and log denied action to audit logs.

### 3.3 Route/Controller Mapping by domain

#### Analytics
- Route: `backend/routes/analytics.route.js`
  - `GET /api/analytics` -> `protectRoute + managementRoute` -> `getAnalytics`
  - `POST /api/analytics/send-test-email` -> `protectRoute + adminRoute` -> `sendTestEmail`
- Controller: `backend/controllers/analytics.controller.js`

#### Orders
- Route: `backend/routes/order.route.js`
  - `GET /api/orders` -> `protectRoute + adminRoute` -> `getAllOrders`
  - `PATCH /api/orders/:id/status` -> `protectRoute + adminRoute` -> `updateOrderStatus`
  - `PATCH /api/orders/:id/details` -> `protectRoute + adminRoute` -> `updateOrderDetails`
- Controller: `backend/controllers/order.controller.js`

#### Products
- Route: `backend/routes/product.route.js`
  - Admin-only import/export/CRUD endpoints protected with `protectRoute + adminRoute`
- Controller: `backend/controllers/product.controller.js`

#### Inventory
- Route: `backend/routes/inventory.route.js`
  - Global middleware: `router.use(protectRoute, adminRoute)`
  - `GET /low-stock`, `POST /adjust`, `GET /product/:productId`
- Controller: `backend/controllers/inventory.controller.js`

#### Campaign
- Route: `backend/routes/campaign.route.js`
  - `GET/POST/PATCH` use `managementRoute`
  - `DELETE` uses `adminRoute + checkPermission(["staff"], "DELETE_CAMPAIGN")`
- Controller: `backend/controllers/campaign.controller.js`

#### Banner
- Route: `backend/routes/banner.route.js`
  - `POST/DELETE/PATCH` are admin-only
  - `GET` is public
- Controller: `backend/controllers/banner.controller.js`

#### Mail
- Route: `backend/routes/mail.route.js`
  - Inbox/subscribers/templates/campaign admin operations are all admin-only
  - Tracking/subscription endpoints are public + rate limited
- Controller: `backend/controllers/mail.controller.js`

#### Auth User Management
- Route: `backend/routes/auth.route.js`
  - `GET /users`, `GET /audit-logs`, `DELETE /users/:id`, `PATCH /users/:id/role` are admin-only
- Controller: `backend/controllers/auth.controller.js`

#### Store Settings
- Route: `backend/routes/storeConfig.route.js`
  - `GET /api/settings` public
  - `PUT /api/settings` admin-only
- Controller: `backend/controllers/storeConfig.controller.js`

#### AI Automation
- Route: `backend/routes/ai.route.js`
  - `POST /api/ai/chat` public
  - Automation endpoints are admin-only
- Controller: `backend/controllers/ai.controller.js`

## 4. Business Operational Flow (Step-by-step real-world usage)
1. Admin/staff signs in and obtains auth cookies.
2. Frontend guard allows navigation to `/secret-dashboard`.
3. Admin shell loads with default `analytics` tab and prefetches product list for downstream tabs.
4. Daily operation starts with Dashboard KPI review:
   - Revenue, order trend, payment mix, AOV.
5. Order Desk:
   - Filter/search queue, inspect details, update order status, update carrier/tracking/notes.
   - Export CSV for reporting.
6. Product Operations:
   - Create/update/delete products.
   - Import Excel in batches with preview.
   - Toggle featured placements.
7. Inventory Control:
   - Monitor low-stock alerts.
   - Execute IN/OUT/ADJUST actions and verify inventory logs.
8. Marketing Operations:
   - Create/toggle campaigns.
   - Upload/toggle/delete homepage banners.
9. CRM and Email:
   - Process inbox.
   - Manage subscriber list and campaign/template records.
10. User Governance:
   - Review users, audit logs, adjust roles, remove abusive users.
11. Optional AI Automation:
   - Auto-confirm COD candidates.
   - Cleanup suspected spam users.
12. Storefront Settings:
   - Adjust live storefront text/layout options.

## 5. Current Strengths
1. Clear modular separation of admin domains by tabs.
2. Broad feature coverage for a mid-sized e-commerce admin panel.
3. Good server-side auth middleware baseline with role gates.
4. Operationally useful import/export functions for products and orders.
5. Audit log system exists and is wired into permission denial middleware.
6. Inventory module includes both low-stock detection and per-product movement logs.
7. Campaign module includes overlap checks and status computation (`Scheduled`, `Active`, `Ended`).
8. Order flow includes tracking events and side-effects (email queue, stock restoration on selected statuses).

## 6. Critical Gaps & Illogical Flows (List all bugs, RBAC mismatches, and missing validations found in Step 2)

### 6.1 RBAC mismatches and role inconsistencies
1. FE route grants `staff` access to admin shell, but many backend endpoints are admin-only.
   - Effect: staff can open dashboard but hits frequent 403 in multiple tabs.
2. UsersTab allows assigning role `staff` from FE, but backend `updateUserRole` only accepts `customer` and `admin`.
   - This is a direct FE/BE contract mismatch.
3. Navbar only shows admin link for `admin`, not `staff`, while route allows staff.
   - UX and policy inconsistency.
4. Tabs are not role-aware in FE (all tabs shown), but BE permissions vary by tab endpoint.

### 6.2 Business state machine flaws (Orders)
1. `updateOrderStatus` sets `order.status = status` directly without transition rules.
   - Possible illogical jumps (example: pending -> returned, cancelled -> shipped).
2. Return flow is overly aggressive:
   - `requestReturnOrder` changes status to `returned` immediately and restores stock immediately.
   - Missing approval/review gate for return claims.

### 6.3 Validation loopholes
1. Inventory adjust validation does not sufficiently enforce non-negative stock for `ADJUST`.
   - Controller accepts quantity and can set stock directly to that value.
   - No explicit guard against negative target stock in ADJUST path.
2. Inventory quantity type handling is weakly enforced.
   - Validation checks for zero but not strict integer/non-negative semantics across all actions.

### 6.4 Placeholder and mock implementation gaps
1. Email dashboard is mostly mock data and not fed from backend analytics endpoints.
2. `Feature coming soon` action exists in Email tab.
3. Product bulk campaign assignment flow has UI modal but explicitly marked unfinished.

### 6.5 Architectural/usability gaps
1. Admin tab selection is local-state only and not deep-linkable.
   - Refresh loses context.
2. Some high-risk actions rely only on `window.confirm` and lack stronger safeguards/approval workflow.

## 7. Actionable Recommendations (Categorized by P0 - Urgent, P1 - Important, P2 - Nice to have)

### P0 - Urgent
1. Define and implement a single RBAC matrix for `admin` and `staff` across FE and BE.
2. Align role update contract:
   - Either support `staff` in backend `updateUserRole`, or remove staff assignment option in FE.
3. Add FE role-aware tab visibility to prevent guaranteed 403 paths.
4. Implement order status transition matrix on backend to block invalid transitions.
5. Add strict validation in inventory adjust:
   - Disallow negative target stock.
   - Enforce integer quantities and action-specific constraints.

### P1 - Important
1. Refactor return lifecycle into explicit states:
   - `return_requested` -> `return_approved/rejected` -> `returned` -> `refunded`.
2. Split `staff` permissions from `admin` with capability-level checks.
3. Add audit logging for all high-impact actions (status changes, inventory adjust, role changes, deletes, imports).
4. Replace placeholder campaign picker with actual backend mapping endpoint.

### P2 - Nice to have
1. Add deep-linking for admin tabs (`/secret-dashboard?tab=orders`).
2. Replace EmailTab mock dashboard with real API-driven KPIs.
3. Add advanced observability:
   - dashboard health widget, automation run history, failure traces.
4. Add soft-delete/undo patterns for selected admin operations.

## 8. Complete File Inventory (FE and BE files related to Admin)

### Frontend
- `frontend/src/App.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/pages/AdminPage.jsx`
- `frontend/src/components/AnalyticsTab.jsx`
- `frontend/src/components/OrdersTab.jsx`
- `frontend/src/components/ProductsList.jsx`
- `frontend/src/components/InventoryTab.jsx`
- `frontend/src/components/MarketingTab.jsx`
- `frontend/src/components/EmailTab.jsx`
- `frontend/src/components/UsersTab.jsx`
- `frontend/src/components/AITab.jsx`
- `frontend/src/components/StoreSettingsTab.jsx`
- `frontend/src/stores/useUserStore.js`
- `frontend/src/stores/useProductStore.js`
- `frontend/src/stores/useCampaignStore.js`
- `frontend/src/stores/useInventoryStore.js`
- `frontend/src/stores/useStorefrontStore.js`

### Backend
- `backend/server.js`
- `backend/middleware/auth.middleware.js`
- `backend/middleware/permission.middleware.js`
- `backend/routes/auth.route.js`
- `backend/routes/analytics.route.js`
- `backend/routes/order.route.js`
- `backend/routes/product.route.js`
- `backend/routes/inventory.route.js`
- `backend/routes/campaign.route.js`
- `backend/routes/banner.route.js`
- `backend/routes/mail.route.js`
- `backend/routes/storeConfig.route.js`
- `backend/routes/ai.route.js`
- `backend/controllers/auth.controller.js`
- `backend/controllers/analytics.controller.js`
- `backend/controllers/order.controller.js`
- `backend/controllers/product.controller.js`
- `backend/controllers/inventory.controller.js`
- `backend/controllers/campaign.controller.js`
- `backend/controllers/banner.controller.js`
- `backend/controllers/mail.controller.js`
- `backend/controllers/storeConfig.controller.js`
- `backend/controllers/ai.controller.js`
