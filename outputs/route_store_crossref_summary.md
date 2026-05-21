# Route ↔ Store Cross-reference — Summary

This file summarizes the results of the automated cross-reference between frontend axios usages and backend route definitions (see `outputs/route_store_crossref.json` for full data and CSV export).

**Quick findings:**
- Report: see `outputs/route_store_crossref.json` (detailed rows linking frontend usage → matched backend route).
- Many frontend usages correctly map to backend routes (auth, ai, mail public tracking, products list, cart, payments). Several usages remain unmatched or ambiguous.

**High-priority unmatched / missing endpoints (examples observed):**
- `/mail/automations/:param/toggle` — no corresponding backend route (frontend calls toggle; backend has no `automations` endpoints in `mail.route.js`).
- `/csrf-token` — frontend requests a CSRF token route but no top-level route was found in scanned mounts.
- Admin user operations: `/auth/users/:param` delete/patch variants called from frontend but some admin user endpoints in `auth.route.js` exist with slightly different param names or placement; validate exact parameter names and methods.
- Product CRUD and param routes: multiple frontend calls to `/products/:id` (PUT/PATCH/DELETE/GET) were flagged as unmatched due to parameter naming or ambiguous matches — backend implements `/api/products/:id` but some frontend usages were recorded as unmatched by the static script.
- Orders tracking/confirm QR: `/orders/track/:param`, `/orders/:param/confirm-qr-payment` — some calls reported unmatched (verify frontend uses `/api/orders/...` prefix and param names match `trackingToken` vs `:id`).
- Banners / Campaigns / Brands / Categories admin CRUD (PUT/DELETE/PATCH toggle) — several admin-store calls were recorded unmatched; many of these routes exist under `/api/<resource>` but the script produced ambiguous matches or method mismatches.

**Root causes (observed):**
- Prefix differences: backend routes are mounted under `/api/...` (e.g., `/api/mail/inbox/:id/read`) while frontend code calls `/mail/...` — script needs to normalize / combine app.use prefixes when matching (improved but some cases remain).
- Parameter naming / template literal patterns: frontend template literals like `/products/${id}` were normalized to `:param` by the script; differences between `:id`, `:productId`, `:trackingToken` cause some misses.
- Method mismatches: in several cases the script matched a route file but with a different HTTP verb (frontend `GET` vs backend `POST`), producing ambiguous mappings.
- Missing backend endpoints: some frontend features (mail automations) appear implemented only client-side and lack server endpoints.
- Data model gaps: product model has `colors` and `wristSizeOptions` but no color×size stock matrix — front-end treats color/size combos as separate items in cart; risk of oversell if stock granularity not aligned.

**Actionable checklist (prioritized)**
1. Fix or remove client call `/mail/automations/:id/toggle` (or implement server endpoint):
   - Owner: backend
   - Risk: admin UI shows toggle but backend missing → silent failures or UI errors.
2. Normalize and re-run crossref script improvements:
   - Normalize route prefixes by stripping `/api` from backend candidates and/or prepending it to frontend raw routes before matching.
   - Normalize parameter names (`:id`, `:productId`, `:trackingToken`) to a canonical `:param` for matching, but also record original names for developer review.
   - Improve verb-awareness: prefer matches where method matches; flag method mismatches for manual review.
3. Audit admin-sensitive endpoints for RBAC middleware:
   - Scan `backend/routes/*.js` for usage of `protectRoute` and `managementRoute` on endpoints referenced by the frontend admin dashboard.
   - Priority: any route that changes order/product/coupon/user data.
4. Resolve product inventory model vs UI expectations:
   - Decide whether to implement a color+size stock matrix (recommended) or enforce a single-dimension stock approach across UI and API.
   - Add tests for add-to-cart / merge / update that simulate color/size/wristSize combos to ensure stock checks are correct.
5. Fix method mismatches and parameter names:
   - For each unmatched usage in `outputs/route_store_crossref.json`, pick the top 20 by frequency and reconcile frontend call (method + path) with backend route (or change the frontend to use the correct endpoint).
6. Add audit fields for orders (recommended): `confirmedBy`, `statusHistory` to improve admin audit trail.
7. Make coupon validation atomic server-side (already partially implemented in `calculateCartTotals` — ensure usage during checkout is server-enforced and race conditions prevented).

**Suggested next automated checks (I can run these if you approve):**
- Extend `scripts/route_store_crossref.cjs` to: check each matched backend route file for presence of controller function, and flag missing controller exports.
- Check for `protectRoute` / `managementRoute` usage on all admin-designated routes called by admin frontend.
- Compute frequency histogram of unmatched frontend usages so we can prioritize fixes by impact.

Where I saved results
- Full machine-readable report: `outputs/route_store_crossref.json`
- CSV export: `outputs/route_store_crossref.csv`
- This summary: `outputs/route_store_crossref_summary.md` (this file)

Would you like me to (choose one):
- A) Automatically extend the crossref script to validate controllers and RBAC usage and re-run it now
- B) Produce a prioritized CSV of unmatched endpoints (frequency-sorted)
- C) Begin creating PR patches for the highest-priority backend fixes (e.g., add `/mail/automations/:id/toggle` stub and add RBAC where missing)
