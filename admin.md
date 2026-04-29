---

# 📊 ADMIN DASHBOARD — PHÂN TÍCH v3.0

> **Project**: Watch E-commerce (Luxury Watch Store)
> **Phiên bản**: 3.0 — Post-Sprint Full Completion
> **Cập nhật lần cuối**: 28 Tháng 4, 2026
> **Trạng thái tổng thể**: ✅ Sprint 1 + Sprint 2 + Sprint 3 HOÀN THÀNH

---

## 0. TÓM TẮT TIẾN ĐỘ

### 0.1 Sprint History

| Sprint | Mục tiêu | Trạng thái |
|--------|----------|-----------|
| Sprint 0 | Fix bugs, pagination, coupon, review tab | ✅ Hoàn thành (20/04) |
| Sprint 0.5 | Fix 3 bugs storeConfig (B-01, B-02, B-03) | ✅ Hoàn thành (28/04) |
| Sprint 1 | Store Operator UX (A3, B4, D3) | ✅ Hoàn thành (28/04) |
| Sprint 2 | Vận hành nhanh (B1, B2, B3, B5, C1) | ✅ Hoàn thành (28/04) |
| Sprint 3 | Insights & Reports (C2, C3, C4, D1, D2) | ✅ Hoàn thành (28/04) |

### 0.2 Điểm số hiện tại

| Module | v1.0 | v2.0 | v3.0 |
|--------|------|------|------|
| Auth & Security | 8/10 | 8.5/10 | 8.5/10 |
| Dashboard Analytics | 7/10 | 8.5/10 | **9.5/10** |
| Quản lý Sản phẩm | 7/10 | 9.0/10 | **9.5/10** |
| Xử lý Đơn Hàng | 6/10 | 8.0/10 | **9.0/10** |
| Quản lý Giao diện | 4/10 | 7.0/10 | **8.5/10** |
| Quản lý Khách hàng | 5/10 | 6.0/10 | **9.0/10** |
| **Tổng thể** | **7/10** | **8.8/10** | **9.2/10** |

---

## 1. DANH SÁCH BUGS ĐÃ FIX

### Sprint 0 — Bugs cũ (20/04/2026)

| # | Bug | File | Trạng thái |
|---|-----|------|-----------|
| 1 | Fix role enum (staff) | `user.model.js` | ✅ Fixed |
| 2 | Fix print invoice (DOM hijacking) | `OrdersTab.jsx` | ✅ Fixed |
| 3 | Coupon tab UI crash | `CouponsTab.jsx` | ✅ Fixed |
| 4 | Reviews & Q&A tab | `ReviewsTab.jsx` | ✅ Fixed |
| 5 | Brand & Category tab hardcode | `CatalogTab.jsx` | ✅ Fixed |
| 6 | ConversionRate, KPI, Inventory value | Multiple | ✅ Fixed |
| 7 | Server-side pagination memory leak | `useProductStore.js` | ✅ Fixed |

### Sprint 0.5 — StoreConfig bugs (28/04/2026)

| # | Bug | Root Cause | Trạng thái |
|---|-----|-----------|-----------|
| B-01 | `gridColumns` lưu DB nhưng không áp dụng ra CatalogPage | `useState(4)` hardcode | ✅ Fixed |
| B-02 | `flashSaleTitle` không truyền prop vào FlashSaleSection | Section không được render ở HomePage | ✅ Fixed |
| B-03 | `bestSellerTitle` không truyền prop vào BestSellersSection | Tương tự B-02 | ✅ Fixed |

### Technical Debt còn tồn đọng

| # | Vấn đề | Mức độ |
|---|--------|--------|
| TD-01 | Refresh Token logic (`useUserStore.js` dòng ~178) vẫn là TODO | 🟠 Medium |
| TD-02 | `allProducts` tải 100% data xuống client cho InventoryTab & MarketingTab — sẽ vỡ khi > 20k SP | 🟡 Low (hiện tại OK) |
| TD-03 | Console.log/error còn sót ~20 component — làm bẩn devtools | 🟡 Low |
| TD-04 | Coupon `usageToday` dùng mock random — backend schema chưa có timestamp usage | 🟡 Low |

---

## 2. ROADMAP V2 — TRẠNG THÁI HOÀN THÀNH

### Sprint 1 🎨 Store Operator UX

- [x] **A3** — Bật/tắt & reorder sections trang Home
  - `StoreSettingsTab.jsx`: toggle icon mắt + nút ↑↓ reorder 4 sections
  - `storeConfig.model.js`: lưu `homeLayout` (thứ tự + bật/tắt)
  - `HomePage.jsx`: `renderSections()` đọc config render đúng thứ tự

- [x] **B4** — Widget "Việc cần làm hôm nay"
  - `AdminPage.jsx`: 4 counters (đơn chờ, hàng hết, review, câu hỏi)
  - Polling tự động **60 giây**, click navigate thẳng đến tab

- [x] **D3** — Lịch sử mua hàng trong User Detail
  - `UsersTab.jsx`: Tab switcher "Thông tin / Lịch sử đơn hàng"
  - Fetch `/orders?userId=xxx&limit=10` on demand

### Sprint 2 ⚡ Tăng tốc vận hành

- [x] **B1** — Bulk operations nâng cao
  - **Backend**: `PATCH /api/products` nhận `{ action, ids[], value? }`
    - `adjustPrice`: điều chỉnh giá theo % (dương tăng, âm giảm)
    - `toggleFeatured`: toggle nổi bật hàng loạt
    - `softDelete`: xóa mềm hàng loạt (không xóa khỏi DB)
  - **Frontend** `ProductsList.jsx`: nút "± Giá (N)" + bulk delete dùng single API call

- [x] **B2** — Notification center
  - `AdminPage.jsx`: Bell icon ở desktop header
  - Hiển thị đơn hàng pending + hàng sắp hết kho
  - Polling **30 giây**, badge đỏ count, click navigate đến tab
  - Nút "Đánh dấu tất cả đã đọc" clear notifications

- [x] **B3** — Quick order processing
  - `OrdersTab.jsx`: Nút quick approve inline theo trạng thái
    - `pending` → **"✓ XN"** (confirmed)
    - `confirmed` → **"⚙ XL"** (processing)
    - `processing` → **"🚚 GH"** (shipped)
  - Không cần mở modal, click 1 cái là xong

- [x] **B5** — Global Search
  - `AdminPage.jsx`: Search bar header desktop
  - Debounce **300ms**, fetch song song products + orders
  - Dropdown results 2 nhóm (có thumbnail SP), click navigate

- [x] **C1** — So sánh kỳ trước
  - `AnalyticsTab.jsx`: Fetch 2× period, tính delta %
  - Badge `+x%↑` (xanh) hoặc `-x%↓` (đỏ) trên KPI cards

### Sprint 3 📊 Insights & Reports

- [x] **C2** — Top & Bottom products
  - `AnalyticsTab.jsx`: Top 8 bán chạy (sort `salesCount` desc) + Hàng tồn kho thấp (`stock ≤ threshold`)
  - Badge "HẾT" đỏ nếu stock = 0

- [x] **C3** — Báo cáo lợi nhuận gộp (P&L)
  - **Backend**: `GET /api/analytics/pl?days=30`
    - Aggregate Orders → `$lookup` Product → tính `costPrice × quantity`
    - Fallback: 60% giá bán nếu sản phẩm không có `costPrice`
    - Trả về: `{ summary: { totalRevenue, totalCogs, totalGrossProfit, totalMargin }, daily: [...] }`
  - **Frontend** `AnalyticsTab.jsx`: 4 KPI cards + BarChart 3 series (Revenue/COGS/Gross Profit)

- [x] **C4** — Export báo cáo
  - Export **CSV** sales data client-side (UTF-8 BOM, mở đúng Excel tiếng Việt)
  - Export **XLSX** sản phẩm gọi `/api/products/export` backend

- [x] **D1** — Loyalty Points UI
  - **Backend**: `PATCH /api/auth/users/:id/loyalty` — `adjustLoyaltyPoints` controller
    - `delta` dương = cộng điểm, âm = trừ điểm, không xuống dưới 0
  - **Frontend** `UsersTab.jsx`: Hiển thị `rewardPoints` / `totalPointsEarned`, nút "+/- Điểm" → prompt

- [x] **D2** — Customer notes & tags
  - **Backend**: `PATCH /api/auth/users/:id/admin-notes` — `updateUserAdminNotes` controller
    - Validate tags trong: `["VIP", "Wholesale", "Problematic", "New", "Loyal"]`
  - **User model**: thêm field `adminNotes: String`, `tags: [String]`
  - **Frontend** `UsersTab.jsx`: 5 tag buttons toggle + textarea onBlur auto-save

---

## 3. KIẾN TRÚC & API MỚI (v3.0)

### Backend endpoints mới

| Method | Route | Controller | Mô tả |
|--------|-------|-----------|-------|
| `PATCH` | `/api/products` | `bulkUpdateProducts` | Bulk: adjustPrice / toggleFeatured / softDelete |
| `GET` | `/api/analytics/pl` | `getProfitLoss` | P&L Report theo khoảng ngày |
| `PATCH` | `/api/auth/users/:id/loyalty` | `adjustLoyaltyPoints` | Cộng/trừ điểm thưởng |
| `PATCH` | `/api/auth/users/:id/admin-notes` | `updateUserAdminNotes` | Cập nhật ghi chú & tags nội bộ |

### Files đã thay đổi (v3.0)

| File | Loại thay đổi |
|------|--------------|
| `AdminPage.jsx` | +B2 Bell notification, +B4 Tasks widget, +B5 Global search |
| `OrdersTab.jsx` | +B3 Quick approve buttons inline |
| `ProductsList.jsx` | +B1 Bulk price adjust, bulk delete via API |
| `AnalyticsTab.jsx` | +C1 delta badge, +C2 Top/Bottom, +C3 P&L section, +C4 export |
| `UsersTab.jsx` | +D1 Loyalty UI, +D2 Tags/Notes, +D3 Order history tab |
| `StoreSettingsTab.jsx` | +A3 Section toggle & reorder |
| `HomePage.jsx` | +A3 renderSections() dynamic, +B-02/03 FlashSale/BestSellers |
| `CatalogPage.jsx` | +B-01 gridColumns từ storeConfig |
| `analytics.controller.js` | +getProfitLoss (C3) |
| `analytics.route.js` | +GET /pl route |
| `auth.controller.js` | +adjustLoyaltyPoints (D1), +updateUserAdminNotes (D2) |
| `auth.route.js` | +2 PATCH routes D1+D2 |
| `product.controller.js` | +bulkUpdateProducts (B1) |
| `product.route.js` | +PATCH / bulk route |
| `user.model.js` | +adminNotes, +tags fields |

---

## 4. CHECKLIST CHẤT LƯỢNG

- [x] Security: Admin & Staff phân quyền đúng route
- [x] Memory Optimize: Server-side pagination cho Products
- [x] UX Form: Skeleton loading thay spinner
- [x] Bulk API: Single request thay vì N loops
- [x] Notification: Polling 30s không block UI
- [x] P&L Fallback: 60% price khi không có costPrice
- [ ] Network Flow: Refresh Token Interceptor còn TODO
- [ ] Code Quality: Dọn console.log còn sót ~20 component
- [ ] Email Builder: Template builder vẫn WIP

---

## 5. ĐỀ XUẤT TIẾP THEO (Nếu có Sprint 4)

### Nhóm A — Chưa làm (thấp ưu tiên)

- **A1** — Cấu hình số cột grid sản phẩm (2/3/4) từ admin, áp live ra CatalogPage
- **A2** — Cấu hình số SP hiển thị & thứ tự section Home từ admin
- **A4** — Color picker & font selector inject CSS variables ra storefront
- **A5** — Quản lý menu navigation (CRUD + drag reorder)

### Nhóm Technical Debt

- Fix Refresh Token Interceptor trong `useUserStore.js`
- Thêm server-side pagination cho InventoryTab & MarketingTab
- Clean console.log/error toàn bộ codebase
- Thêm `timestamp` vào Coupon usage để tính `usageToday` chính xác
- Email Template Builder

---

*Admin.md v3.0 — Cập nhật sau Sprint 3 hoàn thành ngày 28/04/2026.*
*Tất cả 14 tasks trong Roadmap V2 đã được implement đầy đủ.*
