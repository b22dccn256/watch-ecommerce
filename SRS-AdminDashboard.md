# SRS - Dashboard Admin Watch Ecommerce

> Phạm vi: chỉ mô tả những gì đang có trong code hiện tại của backend Spring Boot/NodeJS và frontend ReactJS cho trang Admin.  
> Nguyên tắc: không thêm role/phân hệ ngoài code, không suy diễn tính năng chưa thấy trong file nguồn.

## 0. Mục tiêu và phạm vi

Trang Admin hiện tại là một không gian quản trị tập trung kiểu All-in-One. Điểm chính của hệ thống là một sidebar duy nhất điều hướng tới nhiều module quản trị, trong đó quyền truy cập được filter theo `admin` hoặc `staff` ở `frontend/src/pages/AdminPage.jsx`.

Tài liệu này đặc tả:
- Cấu trúc điều hướng và số lượng tab quản lý.
- Các màn hình con, bảng, modal, biểu đồ và KPI đang hiển thị.
- Các bộ lọc thời gian, đơn vị tiền tệ và các biến thể dòng tiền.
- Các thao tác CRUD và API mà giao diện đang gọi.
- Các cấu hình CMS động ở trang chủ người dùng.
- Các logic đặc thù ngành đồng hồ và audit log.

## 1. Tổng quan giao diện chính: Sidebar và điều hướng

### 1.1. Số lượng tab/menu quản lý

File [frontend/src/pages/AdminPage.jsx](frontend/src/pages/AdminPage.jsx) khai báo đúng **12 tab quản lý**:

| # | Tab | ID | Vai trò truy cập | Chức năng tổng quan |
|---|---|---|---|---|
| 1 | Dashboard | `analytics` | `admin`, `staff` | Thống kê KPI, biểu đồ doanh thu, P&L, top sản phẩm, cảnh báo kho |
| 2 | Đơn hàng | `orders` | `admin`, `staff` | Danh sách đơn, tìm kiếm, lọc trạng thái, xem/sửa chi tiết đơn |
| 3 | Danh mục | `catalog` | `admin`, `staff` | Quản lý master data: thương hiệu và cây danh mục |
| 4 | Sản phẩm | `products` | `admin`, `staff` | CRUD sản phẩm, bulk actions, import/export Excel, ghim nổi bật |
| 5 | Kho hàng | `inventory` | `admin`, `staff` | Kiểm kê, điều chỉnh tồn kho, cảnh báo thiếu hụt, xem log kho |
| 6 | Marketing | `marketing` | `admin`, `staff` | Banner giữa trang chủ và chiến dịch khuyến mãi |
| 7 | Email | `email` | `admin`, `staff` | Dashboard email, inbox, subscribers, campaigns, templates, automation |
| 8 | Reviews & Q&A | `reviews` | `admin`, `staff` | Duyệt/ẩn review, trả lời câu hỏi sản phẩm |
| 9 | Mã giảm giá | `coupons` | `admin` | Tạo, bật/tắt, xóa coupon |
| 10 | Người dùng | `users` | `admin` | Tìm kiếm user, đổi role, xóa tài khoản, xem audit log |
| 11 | AI System | `ai` | `admin` | 2 tác vụ AI automation: xác nhận đơn và dọn tài khoản rác |
| 12 | Giao diện | `settings` | `admin` | CMS cấu hình trang chủ và store config |

### 1.2. Điều hướng và thành phần chung của AdminPage

File [frontend/src/pages/AdminPage.jsx](frontend/src/pages/AdminPage.jsx) còn có các phần chung sau:
- Sidebar desktop và sidebar mobile overlay.
- Link về trang chủ ở đầu sidebar.
- Badge số lượng cho `orders` khi có `pendingOrders`, và `inventory` khi có `lowStock`.
- Thanh tìm kiếm toàn cục ở topbar desktop, gọi đồng thời:
  - `GET /products?search=...&limit=5`
  - `GET /orders?search=...&limit=5`
- Nút thông báo dashboard từ `useDashboardAlerts`.
- Chọn tab bằng query param `?tab=...`.

### 1.3. Ghi chú về phân quyền

Code hiện tại vẫn filter tab theo role `admin/staff`. Với bản nộp đồ án, có thể coi `admin` là vai trò super admin. Tuy nhiên tài liệu này vẫn bám đúng code: không giả định role phức tạp hơn.

## 2. Chi tiết từng phần không gian quản lý

### 2.1. Tab Dashboard / Analytics

Nguồn chính:
- [frontend/src/components/admin/AnalyticsTab.jsx](frontend/src/components/admin/AnalyticsTab.jsx)
- [frontend/src/hooks/useAnalyticsData.js](frontend/src/hooks/useAnalyticsData.js)
- [backend/routes/analytics.route.js](backend/routes/analytics.route.js)
- [backend/controllers/analytics.controller.js](backend/controllers/analytics.controller.js)

#### a) Giao diện muốn thấy những gì?

**KPI cards**:
- Đơn hàng.
- Doanh thu thực tế.
- Dòng tiền dự kiến.
- Giá trị đơn trung bình (AOV).
- Tỷ lệ chuyển đổi.
- Tổng người dùng.
- Tổng sản phẩm.
- Hàng sắp hết.
- Đơn đã thanh toán.

**Biểu đồ và khối dữ liệu**:
- LineChart doanh thu & đơn hàng theo ngày.
- PieChart doanh thu theo phương thức thanh toán.
- PieChart thống kê máy đồng hồ theo `type`.
- PieChart thống kê màu mặt số theo `specs.dial.color`.
- BarChart top size cổ tay.
- BarChart P&L: doanh thu, giá vốn, lợi nhuận gộp.
- Danh sách Top 8 bán chạy.
- Danh sách tồn kho thấp.

**Nút thao tác**:
- CSV export từ dữ liệu analytics hiện tại.
- Nút mở file Excel sản phẩm từ `/api/products/export`.
- Nút chọn khoảng ngày 7/30/90 ngày.
- Chế độ custom date range với `input type=date`.

#### b) Muốn xem chi tiết những gì?

Dashboard không có modal drill-down riêng. Chi tiết chủ yếu thể hiện qua:
- Tooltip trên chart.
- Danh sách Top sản phẩm với tên, brand, số lượng bán, tồn kho.
- P&L card hiển thị tổng doanh thu, giá vốn, lợi nhuận gộp, biên lợi nhuận.

Không thấy flow click từ chart sang trang con hay modal chuyên sâu trong code đã đọc.

#### c) Trong khoảng gì? & Tiền gì?

- Biểu đồ chính dùng `days = 7/30/90` hoặc custom range tính từ 2 ngày người dùng chọn.
- Backend `GET /analytics?days=...&includePrev=true` sinh `dailySales` và `prevDailySales` theo đúng range.
- P&L dùng `GET /analytics/pl?days=...`.
- Dòng tiền và doanh thu hiển thị theo **VND**.
- `paymentStats`, `watchTypeStats`, `dialColorStats`, `wristSizeStats` đều được lọc theo cùng range ngày của analytics.
- `pendingRevenue` là dòng tiền dự kiến của các đơn `confirmed/processing/shipped` nhưng `paymentStatus=pending`.
- `totalRevenue` là doanh thu thực tế của đơn `paymentStatus=paid`.

#### d) Quyền chỉnh sửa và thao tác CRUD

Dashboard không phải màn hình CRUD trực tiếp. Các API thật sự được dùng:
- `GET /analytics`
- `GET /analytics/pl`
- `GET /products?sort=best_selling&limit=8`
- `GET /products/inventory/alerts?limit=8`

Xuất CSV được dựng ngay trên frontend từ `dailySalesData`, không gọi API export analytics riêng.

---

### 2.2. Tab Đơn hàng

Nguồn chính:
- [frontend/src/components/admin/OrdersTab.jsx](frontend/src/components/admin/OrdersTab.jsx)
- [frontend/src/components/OrderList.jsx](frontend/src/components/OrderList.jsx)
- [frontend/src/components/OrderDetailModal.jsx](frontend/src/components/OrderDetailModal.jsx)
- [frontend/src/hooks/useOrdersList.js](frontend/src/hooks/useOrdersList.js)
- [backend/routes/order.route.js](backend/routes/order.route.js)

#### a) Giao diện muốn thấy những gì?

**Bộ lọc và tổng quan**:
- Tìm kiếm đơn.
- Lọc theo trạng thái đơn.
- Badge thống kê `pendingCount` và `returnedCount` ngay tiêu đề.
- Nút export CSV.

**Bảng danh sách**:
- Mã đơn.
- Khách hàng.
- Tổng tiền.
- Phương thức thanh toán.
- Trạng thái.
- Ngày đặt.
- Nút xem chi tiết.

**Modal chi tiết đơn**:
- Thông tin khách hàng.
- Danh sách sản phẩm trong đơn.
- Tổng cộng.
- Khối thanh toán.
- Khối thay đổi trạng thái.
- Khối logistics.
- Lịch sử tracking events.
- Nút in đơn.
- Nút lưu thay đổi.

#### b) Muốn xem chi tiết những gì?

Khi click `Xem`, `OrderDetailModal` hiển thị:
- Tên, email, điện thoại, địa chỉ khách.
- Các sản phẩm trong đơn, số lượng, đơn giá.
- `paymentMethod` và `paymentStatus`.
- `coupon` nếu có.
- `carrier`, `carrierTrackingNumber`, `internalNotes`.
- Timeline trạng thái chuẩn: pending → confirmed → processing → shipped → delivered.
- Nhánh trạng thái đặc biệt: cancelled / return_requested / returned / awaiting_verification.
- `trackingEvents` nếu đơn có lịch sử theo dõi.

#### c) Trong khoảng gì? & Tiền gì?

- Tab này không có date range filter riêng. Nó có search, filter status và pagination.
- Mỗi trang 15 đơn.
- Tiền hiển thị theo **VND**.
- `stats` ở hook gồm `pendingCount` và `returnedCount`.
- Dòng tiền thực tế/dự kiến không tách trong tab Orders, mà đã tách ở Dashboard Analytics.

#### d) Quyền chỉnh sửa và thao tác CRUD

Các API được dùng:
- `GET /orders`
- `GET /orders/export`
- `GET /orders/:id`
- `PATCH /orders/:id/status`
- `PATCH /orders/:id/details`

Hành vi CRUD trên UI:
- Xem chi tiết đơn.
- Đổi trạng thái đơn qua các nút trạng thái tiếp theo.
- Chỉnh `carrier`.
- Chỉnh `carrierTrackingNumber`.
- Chỉnh `internalNotes`.
- In hóa đơn.
- Export CSV.

Routes backend còn có các luồng user/public khác như track/lookup/cancel/request-return/confirm QR, nhưng trong Admin UI trọng tâm là các thao tác trên.

---

### 2.3. Tab Danh mục & Thương hiệu

Nguồn chính:
- [frontend/src/components/admin/CatalogTab.jsx](frontend/src/components/admin/CatalogTab.jsx)
- [frontend/src/hooks/useCatalogData.js](frontend/src/hooks/useCatalogData.js)
- [backend/routes/brand.route.js](backend/routes/brand.route.js)
- [backend/routes/category.route.js](backend/routes/category.route.js)

#### a) Giao diện muốn thấy những gì?

Tab này chia làm 2 section:
- Thương hiệu.
- Cấu trúc danh mục.

**Thương hiệu**:
- Grid card theo brand.
- Logo / chữ cái viết tắt nếu không có logo.
- Tên thương hiệu.
- Mô tả ngắn.
- Icon đánh dấu nhà phân phối chính hãng nếu có `isAuthorizedDealer`.
- Nút sửa và xóa trên card.

**Danh mục**:
- Cây danh mục cha - con.
- Với mỗi danh mục: tên, slug, ảnh.
- Danh sách children lồng dưới parent.
- Nút sửa và xóa cho cả parent và child.

#### b) Muốn xem chi tiết những gì?

Không có modal chi tiết riêng kiểu read-only. Thay vào đó, click:
- `Sửa thương hiệu` mở `BrandFormModal`.
- `Sửa danh mục` mở `CategoryFormModal`.
- `Xóa` gọi confirm action rồi xóa dữ liệu.

#### c) Trong khoảng gì? & Tiền gì?

- Không có bộ lọc thời gian.
- Không có tiền tệ.
- Đây là master data, hiển thị toàn bộ thương hiệu và danh mục hiện có.

#### d) Quyền chỉnh sửa và thao tác CRUD

API đã thấy:
- `GET /brands`
- `POST /brands`
- `PUT /brands/:id`
- `DELETE /brands/:id`
- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`

CRUD trên UI:
- Tạo brand / category qua modal.
- Sửa brand / category qua modal.
- Xóa brand / category từ card.

---

### 2.4. Tab Sản phẩm

Nguồn chính:
- [frontend/src/components/admin/ProductsList.jsx](frontend/src/components/admin/ProductsList.jsx)
- [frontend/src/components/products/ProductsTable.jsx](frontend/src/components/products/ProductsTable.jsx)
- [frontend/src/components/CreateProductForm.jsx](frontend/src/components/CreateProductForm.jsx)
- [frontend/src/components/EditProductForm.jsx](frontend/src/components/EditProductForm.jsx)
- [frontend/src/hooks/useProductsList.js](frontend/src/hooks/useProductsList.js)
- [backend/routes/product.route.js](backend/routes/product.route.js)

#### a) Giao diện muốn thấy những gì?

**Toolbar**:
- Search sản phẩm.
- Sort.
- Bulk delete.
- Bulk price adjust.
- Apply campaign.
- Export.
- Import preview.
- Import file.
- Add new product.

**Bảng danh sách**:
- Checkbox chọn dòng.
- Sản phẩm: ảnh, tên, category.
- Thương hiệu.
- Giá.
- Bộ máy (`type`).
- Tồn kho.
- Danh mục.
- Nổi bật (`isFeatured`).
- Cột thao tác.

**Form tạo/sửa**:
- Tên sản phẩm.
- Thương hiệu.
- Giá bán.
- Giá gốc.
- Tồn kho tổng.
- Kích cỡ cổ tay dạng lặp options.
- Danh mục.
- Loại bộ máy.
- Ảnh đại diện / nhiều ảnh.
- Màu sắc.
- Kích thước mặt.
- Chất liệu dây.
- Chất liệu vỏ.
- Đường kính mặt.
- Chống nước.
- Mô tả sản phẩm.

#### b) Muốn xem chi tiết những gì?

Tab sản phẩm không có modal chi tiết riêng; thay vào đó có:
- CreateProductForm để thêm mới.
- EditProductForm để sửa theo `product` hiện tại.
- CampaignPickerModal được mở từ toolbar để áp dụng chiến dịch.
- Import preview để kiểm tra file Excel trước khi import.

#### c) Trong khoảng gì? & Tiền gì?

- Có search, sort, pagination.
- Không có date range.
- Giá hiển thị và nhập theo **VND**.
- `originalPrice` được dùng để preview % giảm.
- `stock` có thể là tổng hoặc tính từ `wristSizeOptions`.

#### d) Quyền chỉnh sửa và thao tác CRUD

API thật trong route:
- `GET /products`
- `POST /products`
- `PUT /products/:id`
- `PATCH /products/:id` để toggle featured.
- `DELETE /products/:id`
- `PATCH /products` để bulk update.
- `POST /products/import/preview`
- `POST /products/import`
- `GET /products/export`
- `GET /products/inventory/alerts`

CRUD trên UI:
- Tạo sản phẩm.
- Sửa sản phẩm.
- Xóa 1 sản phẩm.
- Xóa hàng loạt.
- Điều chỉnh giá hàng loạt.
- Ghim / bỏ ghim nổi bật.
- Import preview.
- Import Excel.
- Export Excel.
- Áp chiến dịch cho nhóm sản phẩm.

---

### 2.5. Tab Kho hàng

Nguồn chính:
- [frontend/src/components/admin/InventoryTab.jsx](frontend/src/components/admin/InventoryTab.jsx)
- [frontend/src/hooks/useInventoryManagement.js](frontend/src/hooks/useInventoryManagement.js)
- [backend/routes/inventory.route.js](backend/routes/inventory.route.js)

#### a) Giao diện muốn thấy những gì?

**Thống kê tổng quan**:
- Tổng giá trị kho.

**Cảnh báo tồn kho thiếu hụt**:
- Danh sách sản phẩm thấp hơn ngưỡng.
- Cột: sản phẩm, tồn kho hiện tại, hạn mức đề xuất, thao tác nhập kho ngay.

**Bảng kiểm kê**:
- Sản phẩm.
- SKU / Brand.
- Tồn kho.
- Thao tác điều chỉnh.
- Nút xem lịch sử.
- Tìm kiếm.
- Phân trang.

**Modal điều chỉnh tồn kho**:
- Chọn sản phẩm.
- Chọn action `IN` hoặc `ADJUST`.
- Số lượng.
- Note.

**Modal lịch sử kho**:
- Hiển thị log theo sản phẩm.

#### b) Muốn xem chi tiết những gì?

Log kho thể hiện các biến động `IN/OUT/ADJUST` và thông tin đi kèm. Theo code hiện tại, chi tiết log được dùng để xem lịch sử thao tác; từ tài liệu phân tích code trước đó, log có thể chứa action, note, userId và orderRef/referenceOrderId.

#### c) Trong khoảng gì? & Tiền gì?

- Không có date range filter trên UI.
- Kho được hiển thị theo trang 8 sản phẩm.
- Giá trị kho tính bằng **VND** và được tính từ `stock * costPrice`.
- Low stock phụ thuộc `lowStockThreshold`.

#### d) Quyền chỉnh sửa và thao tác CRUD

API đã thấy:
- `GET /inventory/low-stock`
- `POST /inventory/adjust`
- `GET /inventory/product/:productId`

Thao tác UI:
- Điều chỉnh tồn kho.
- Nhập kho ngay từ cảnh báo thiếu hụt.
- Xem lịch sử kho.

---

### 2.6. Tab Marketing

Nguồn chính:
- [frontend/src/components/admin/MarketingTab.jsx](frontend/src/components/admin/MarketingTab.jsx)
- [frontend/src/hooks/useMarketingManagement.js](frontend/src/hooks/useMarketingManagement.js)
- [backend/routes/banner.route.js](backend/routes/banner.route.js)
- [backend/routes/campaign.route.js](backend/routes/campaign.route.js)

#### a) Giao diện muốn thấy những gì?

**Tổng quan**:
- Số campaign đang hoạt động.

**Khu banner giữa trang chủ**:
- Ô upload banner mới.
- Grid banner hiện có.
- Trạng thái ACTIVE/khác.
- Nút di chuyển lên/xuống.
- Nút bật/tắt.
- Nút xóa.

**Khu tạo campaign**:
- Tên chiến dịch.
- Nhóm áp dụng.
- % giảm giá.
- Bắt đầu / kết thúc.
- Preview giá sản phẩm theo group.

**Danh sách campaign**:
- Tên.
- Nhóm.
- Discount.
- Thời gian.
- Status.
- Hành động bật/tắt và xóa.

#### b) Muốn xem chi tiết những gì?

- Banner card chỉ hiển thị title và ngày upload.
- Campaign card có nút `Thống kê` mở modal chi tiết stats: sent, opened, clicked, tỉ lệ mở, tỉ lệ nhấp, tương tác, thời gian tạo, ID.
- Preview giá dùng sản phẩm đầu tiên khớp group trong `useMarketingManagement`.

#### c) Trong khoảng gì? & Tiền gì?

- Campaign có `startDate` và `endDate` kiểu `datetime-local`.
- Discount là phần trăm.
- Không có filter tiền tệ riêng ở tab này.
- Banner giữa trang chủ là khối nội dung marketing, không phải tiền.

#### d) Quyền chỉnh sửa và thao tác CRUD

API đã thấy:
- `GET /banners`
- `POST /banners`
- `PATCH /banners/reorder`
- `PATCH /banners/:id/toggle`
- `DELETE /banners/:id`
- `GET /campaigns`
- `POST /campaigns`
- `PATCH /campaigns/:id`
- `DELETE /campaigns/:id`
- `GET /campaigns/active`

Thao tác UI:
- Upload banner.
- Reorder banner.
- Toggle banner.
- Delete banner.
- Create campaign.
- Toggle campaign.
- Delete campaign.

---

### 2.7. Tab Email

Nguồn chính:
- [frontend/src/components/admin/EmailTab.jsx](frontend/src/components/admin/EmailTab.jsx)
- [frontend/src/components/admin/email/EmailDashboardView.jsx](frontend/src/components/admin/email/EmailDashboardView.jsx)
- [frontend/src/components/admin/email/EmailInboxView.jsx](frontend/src/components/admin/email/EmailInboxView.jsx)
- [frontend/src/components/admin/email/EmailSubscribersView.jsx](frontend/src/components/admin/email/EmailSubscribersView.jsx)
- [frontend/src/components/admin/email/EmailCampaignsView.jsx](frontend/src/components/admin/email/EmailCampaignsView.jsx)
- [frontend/src/components/admin/email/EmailTemplatesView.jsx](frontend/src/components/admin/email/EmailTemplatesView.jsx)
- [frontend/src/components/admin/email/EmailAutomationView.jsx](frontend/src/components/admin/email/EmailAutomationView.jsx)
- [frontend/src/hooks/useEmailTabData.js](frontend/src/hooks/useEmailTabData.js)
- [backend/routes/mail.route.js](backend/routes/mail.route.js)

#### a) Giao diện muốn thấy những gì?

Tab Email có 6 sub-tab:
- Dashboard.
- Hộp thư đến.
- Người đăng ký.
- Chiến dịch.
- Mẫu Email.
- Tự động hóa.

**Dashboard**:
- 3 stat cards: open rate, số chiến dịch, tổng gửi.
- AreaChart hiệu quả chiến dịch 7 ngày: sent, opened, clicked.

**Inbox**:
- Bảng: khách hàng, chủ đề, ngày, trạng thái, hành động.
- Nút đánh dấu đã đọc.

**Subscribers**:
- Danh sách email đăng ký.
- Nguồn đăng ký.
- Ngày tạo.
- Nút xóa.
- Nút export CSV.

**Campaigns**:
- Card chiến dịch.
- Stats nhỏ: sent/opened/clicked.
- Nút thống kê.
- Nút sao chép ID.
- Modal thống kê chi tiết tỷ lệ mở, tỷ lệ nhấp, tương tác.

**Templates**:
- Grid card preview HTML email.
- Tên và category template.

**Automation**:
- Cards automation: Abandoned Cart, Welcome Email, Birthday Email.
- Toggle bật/tắt.
- Ghi chú xử lý bởi BullMQ Worker & Redis mỗi 1 giờ.

#### b) Muốn xem chi tiết những gì?

- Inbox: click nút mắt để mark read, không có modal chi tiết trong view đã đọc.
- Subscribers: chỉ thấy email, source, createdAt.
- Campaigns: click `Thống kê` mở modal với sent/opened/clicked/rate và createdAt, ID.
- Templates: preview HTML ở dạng thu nhỏ, chưa thấy form sửa trong component đã đọc.
- Automation: chỉ bật/tắt và mô tả.

#### c) Trong khoảng gì? & Tiền gì?

- Dashboard email đang cố định 7 ngày qua qua `GET /mail/stats?days=7`.
- Các sub-tab khác không có time range riêng trong wrapper.
- Không có tiền tệ.

#### d) Quyền chỉnh sửa và thao tác CRUD

API nhìn thấy trong frontend và route:
- `GET /mail/stats?days=7`
- `GET /mail/inbox`
- `PATCH /mail/inbox/:id/read`
- `DELETE /mail/inbox/:id`
- `POST /mail/inbox/:id/reply`
- `GET /mail/subscribers`
- `GET /mail/subscribers/export`
- `DELETE /mail/subscribers/:id`
- `GET /mail/templates`
- `POST /mail/templates`
- `PUT /mail/templates/:id`
- `GET /mail/campaigns`
- `POST /mail/campaigns`
- `POST /mail/campaigns/:id/send`
- `POST /mail/campaigns/:id/schedule`

Lưu ý minh bạch theo code:
- `useEmailTabData.js` còn gọi `PATCH /mail/automations/:automationId/toggle` cho automation toggle.
- Endpoint này được frontend tham chiếu nhưng không xuất hiện trong đoạn route `mail.route.js` đã đọc; cần xác minh ở backend nếu muốn đặc tả chốt cuối cùng.

---

### 2.8. Tab Reviews & Q&A

Nguồn chính:
- [frontend/src/components/admin/ReviewsTab.jsx](frontend/src/components/admin/ReviewsTab.jsx)
- [frontend/src/hooks/useReviewsManagement.js](frontend/src/hooks/useReviewsManagement.js)
- [backend/routes/review.route.js](backend/routes/review.route.js)
- [backend/routes/question.route.js](backend/routes/question.route.js)

#### a) Giao diện muốn thấy những gì?

Tab này có 2 sub-tab:
- Reviews.
- Q&A.

**Reviews**:
- 4 stat cards: tổng reviews, rating trung bình, chờ duyệt, đã ẩn.
- Filter trạng thái.
- Filter rating.
- Bảng: khách hàng, sản phẩm, đánh giá, nội dung, ngày, trạng thái, hành động.

**Q&A**:
- Filter all / unanswered / answered.
- Card câu hỏi với người hỏi, ngày, trạng thái cần trả lời, sản phẩm.
- Nút trả lời ngay / sửa câu trả lời.
- Modal phản hồi câu hỏi.

#### b) Muốn xem chi tiết những gì?

- Review detail modal hiển thị user, rating, comment, images.
- Có nút duyệt hiển thị hoặc ẩn đánh giá.
- Q&A reply modal hiển thị câu hỏi và form trả lời cửa hàng.

#### c) Trong khoảng gì? & Tiền gì?

- Không có time range chủ động; dữ liệu dùng filter trạng thái và rating.
- Không có tiền tệ.

#### d) Quyền chỉnh sửa và thao tác CRUD

API đã thấy:
- `GET /reviews`
- `PATCH /reviews/:id/status`
- `DELETE /reviews/:id`
- `GET /questions`
- `PATCH /questions/:id/answer`

Thao tác UI:
- Duyệt / ẩn review.
- Xóa review.
- Trả lời / sửa câu trả lời câu hỏi.

---

### 2.9. Tab Mã giảm giá

Nguồn chính:
- [frontend/src/components/admin/CouponsTab.jsx](frontend/src/components/admin/CouponsTab.jsx)
- Backend route: [backend/routes/coupon.route.js](backend/routes/coupon.route.js)

#### a) Giao diện muốn thấy những gì?

- Header mô tả quản lý mã khuyến mãi.
- Nút tạo mã mới.
- 4 stat cards.
- Bảng danh sách coupon với cột:
  - Mã.
  - Loại giảm.
  - Đơn tối thiểu.
  - Đã dùng.
  - Hết hạn.
  - Trạng thái.
  - Hành động.

#### b) Muốn xem chi tiết những gì?

- Không có modal chi tiết riêng trong file đã đọc.
- Click sao chép mã.
- Click xóa có confirmToast.
- Toggle bật/tắt mã.
- CreateCouponModal cho tạo coupon mới.

#### c) Trong khoảng gì? & Tiền gì?

- Không có date range filter, nhưng bảng hiển thị ngày hết hạn.
- Coupon có loại `percent` hoặc tiền cố định.
- `minOrderAmount` hiển thị theo **VND**.

#### d) Quyền chỉnh sửa và thao tác CRUD

API:
- `GET /coupons`
- `POST /coupons`
- `DELETE /coupons/:id`
- `PATCH /coupons/:id/toggle`
- `GET /coupons/user`
- `POST /coupons/validate`

UI CRUD:
- Tạo coupon.
- Bật/tắt coupon.
- Xóa coupon.
- Copy mã coupon.

---

### 2.10. Tab Người dùng

Nguồn chính:
- [frontend/src/components/admin/UsersTab.jsx](frontend/src/components/admin/UsersTab.jsx)
- [frontend/src/components/users/UsersTable.jsx](frontend/src/components/users/UsersTable.jsx)
- [frontend/src/components/users/UserDetailModal.jsx](frontend/src/components/users/UserDetailModal.jsx)
- [frontend/src/components/users/AuditLogsList.jsx](frontend/src/components/users/AuditLogsList.jsx)
- [frontend/src/components/users/LogDetailModal.jsx](frontend/src/components/users/LogDetailModal.jsx)
- [frontend/src/hooks/useUsersData.js](frontend/src/hooks/useUsersData.js)
- [frontend/src/hooks/useAuditLogs.js](frontend/src/hooks/useAuditLogs.js)
- [backend/routes/auth.route.js](backend/routes/auth.route.js)

#### a) Giao diện muốn thấy những gì?

**Header**:
- Tổng số tài khoản.
- Số quản trị viên.
- Search và filter role.

**Stats**:
- UsersStats.

**Bảng người dùng**:
- Người dùng.
- Nhóm/segment.
- Chi tiêu.
- Đơn hàng.
- Hành động.

**Menu thao tác từng user**:
- Xem chi tiết.
- Đổi vai trò thành customer/staff/admin.
- Xóa tài khoản.

**Audit log bên phải**:
- Danh sách nhật ký hệ thống.
- Phân trang log.
- Khối bảo mật hệ thống.

#### b) Muốn xem chi tiết những gì?

`UserDetailModal` có 2 tab:
- Thông tin.
- Lịch sử đơn hàng.

Trong tab thông tin có:
- Avatar chữ cái.
- Name, email.
- Role, segment.
- Tổng chi tiêu.
- Số đơn thành công.
- Ngày tham gia.
- Trạng thái 2FA.
- Mã định danh.
- Reward points.
- Tags nội bộ.
- Ghi chú nội bộ.
- Nút xóa tài khoản nếu là admin.

Trong tab lịch sử đơn hàng có:
- Danh sách các order.
- Mã đơn.
- Ngày tạo.
- Tổng tiền.
- Trạng thái đơn.

Log detail modal hiển thị:
- Action.
- Người thực hiện.
- Chi tiết thay đổi old/new theo field.
- IP.
- Model đích.
- User-Agent.

#### c) Trong khoảng gì? & Tiền gì?

- User list có search, role filter, pagination.
- Mỗi trang 10 users.
- Chi tiêu và đơn thành công hiển thị theo **VND**.
- Audit logs có pagination riêng 10 logs/trang.

#### d) Quyền chỉnh sửa và thao tác CRUD

API:
- `GET /auth/users`
- `DELETE /auth/users/:id`
- `PATCH /auth/users/:id/role`
- `PATCH /auth/users/:id/loyalty`
- `PATCH /auth/users/:id/admin-notes`
- `GET /auth/audit-logs`

UI CRUD:
- Xem danh sách user.
- Mở detail modal.
- Đổi role.
- Xóa user.
- Chỉnh loyalty points.
- Sửa internal tags.
- Sửa admin notes.
- Xem audit log và log detail.

---

### 2.11. Tab AI System

Nguồn chính:
- [frontend/src/components/admin/AITab.jsx](frontend/src/components/admin/AITab.jsx)
- [backend/routes/ai.route.js](backend/routes/ai.route.js)

#### a) Giao diện muốn thấy những gì?

- 2 card hành động lớn:
  - Xác nhận đơn thông minh.
  - Dọn dẹp tài khoản rác.
- Khối nhật ký AI System ở dưới.
- Badge trạng thái hệ thống đang hoạt động.

#### b) Muốn xem chi tiết những gì?

Không có modal detail riêng. Phản hồi được thể hiện qua log text ở panel dưới.

#### c) Trong khoảng gì? & Tiền gì?

- Không có date range.
- Không có tiền tệ.
- Đây là màn hình tác vụ tự động.

#### d) Quyền chỉnh sửa và thao tác CRUD

API:
- `POST /ai/automation/confirm-orders`
- `POST /ai/automation/cleanup-users`
- `POST /ai/chat` (route công khai trong `ai.route.js`)

UI:
- Chỉ có 2 nút automation.
- Log hiển thị tiến trình, thành công và lỗi.

Lưu ý: `chatWithAI` có route backend nhưng không được UI admin này gọi trực tiếp trong file đã đọc.

---

### 2.12. Tab Giao diện / StoreSettings

Nguồn chính:
- [frontend/src/components/admin/StoreSettingsTab.jsx](frontend/src/components/admin/StoreSettingsTab.jsx)
- [backend/routes/storeConfig.route.js](backend/routes/storeConfig.route.js)
- [backend/controllers/storeConfig.controller.js](backend/controllers/storeConfig.controller.js)

#### a) Giao diện muốn thấy những gì?

Các sub-tab thực tế trong file:
- Sections trang chủ.
- Bản sắc & Menu.
- Chủ đề & Màu sắc.
- Bảng màu tuỳ chỉnh.
- Kiểu chữ & Phông.
- Slide Hero.
- Văn bản & Tiêu đề.
- Pop-up.
- Footer.
- Footer nâng cao.
- Tích hợp & Theo dõi.
- Cấu hình Catalog.
- CSS & Nâng cao.
- SEO & Giờ mở cửa.
- Bố cục & AI Assistant.

**Các tính năng đang hiển thị rõ trong code**:
- Bật/tắt và sắp xếp sections: Hero, Flash Sale, Best Seller, Newsletter.
- Chỉnh thứ tự sections bằng mũi tên lên/xuống.
- Bật/tắt section bằng eye icon.
- Chỉnh logo text, logo subtext, logo image.
- Chỉnh announcement bar.
- Chỉnh navigation items.
- Chọn theme preset.
- Chỉnh custom colors.
- Chỉnh font heading/body.
- UI hiện tại đã lược bỏ slider scale chữ khỏi giao diện, nhưng các field `headingScale` và `bodyScale` vẫn còn trong form data.
- Quản lý hero slides đầu trang chủ.
- Chỉnh popup marketing.
- Chỉnh footer, footer columns, social links.
- Chỉnh GA/FB Pixel/TikTok Pixel.
- Chỉnh products per page, default sort, show out of stock, flash sale end date.
- Chỉnh SEO title/meta description.
- Chỉnh giờ mở cửa và logo mobile.
- UI `Custom CSS` editor đã được lược bỏ khỏi form, nhưng field `customCSS` vẫn còn tồn tại ở cấu hình.

#### b) Muốn xem chi tiết những gì?

- Hero slides có image, mobileImage, title, subtitle, link, active.
- Navigation items có label và link.
- Announcement bar có text, background, link.
- Popup có title, text, image, delay, enabled.
- Footer có hotline, email, address, about text, copyright, columns, socials.
- Catalog có products per page, sort mặc định, hiển thị hàng hết, flash sale end date.
- Layout sections cho phép bật/tắt và đổi thứ tự.

#### c) Trong khoảng gì? & Tiền gì?

- Không có lọc thời gian.
- Không có tiền tệ riêng, nhưng có cấu hình hiển thị storefront.
- `flashSaleEndDate` là mốc thời gian cấu hình cho phần sale.

#### d) Quyền chỉnh sửa và thao tác CRUD

API:
- `GET /store-config`
- `PUT /store-config` (admin only)

Lưu ý rõ từ code:
- UI đang giữ các field cấu hình ở frontend và submit về config.
- `homeLayout` được ghi từ mảng `sectionLayout` enabled.
- Các module storefront được bật/tắt ở cấp config, không phải role riêng.

## 3. Quyền can thiệp giao diện user: CMS Dynamic Config

Các quyền CMS hiện có trong `StoreSettingsTab` và `storeConfig` bao gồm:

- Bật/tắt sections trang chủ: Hero, Flash Sale, Best Seller, Newsletter.
- Sắp xếp thứ tự các sections bằng `homeLayout`.
- Quản lý banner/slide hero đầu trang chủ.
- Quản lý banner khuyến mãi giữa trang chủ ở tab Marketing.
- Chỉnh logo, navigation items, announcement bar.
- Chỉnh theme preset và custom colors.
- Chỉnh font hiển thị.
- Cấu hình popup marketing.
- Cấu hình footer, social links, footer columns.
- Cấu hình SEO và giờ mở cửa.
- Cấu hình catalog: số sản phẩm/trang, sort mặc định, ẩn/hiện out-of-stock, flash sale end date.
- Cấu hình tracking tích hợp: Google Analytics, Facebook Pixel, TikTok Pixel.

Các module đã thấy trong code storefront:
- Hero Banner.
- Flash Sale.
- Best Seller.
- Newsletter.
- Pop-up VIP.
- Announcement bar.
- Navigation items.
- Footer nâng cao.

Điểm cần ghi chú:
- Tab Custom CSS editor đã bị lược bỏ khỏi UI trong trạng thái hiện tại, dù field cấu hình vẫn tồn tại.
- Slider scale chữ cũng đã bị lược bỏ khỏi UI.

## 4. Logic xử lý đặc thù ngành đồng hồ và Audit log

### 4.1. Dữ liệu đặc thù ngành đồng hồ đang được thống kê

#### a) Loại máy / movement

Dữ liệu `type` của product chứa:
- mechanical
- quartz
- automatic
- solar
- digital
- smartwatch

Backend analytics dùng aggregation để nhóm `watchTypeStats` theo `type` trên các đơn đã `paid`.

#### b) Màu mặt số

`specs.dial.color` được aggregate thành `dialColorStats` trên đơn đã thanh toán.

#### c) Kích thước cổ tay

`wristSizeStats` được aggregate từ `Order.products.wristSize`.

#### d) Giá trị kho, giá vốn và lợi nhuận gộp

- Inventory value = `stock * costPrice`.
- P&L = doanh thu - giá vốn.
- `costPrice` thiếu thì backend P&L fallback 60% giá bán.

#### e) Các field đồng hồ được nhập ở form sản phẩm

Từ create/edit form:
- `type`
- `wristSizeOptions`
- `colors`
- `sizes`
- `specs.case.material`
- `specs.case.diameter`
- `specs.strap.material`
- `specs.waterResistance`
- `image` / `images`
- `price`
- `originalPrice`
- `stock`
- `description`

### 4.2. Logic aggregation backend đang chạy như thế nào?

Trong `backend/controllers/analytics.controller.js`:
- `GET /analytics` lấy `startDate` / `endDate` từ `days` và build range theo timezone Việt Nam.
- `dailySales` chỉ tính đơn `paymentStatus=paid`.
- `paymentStats` group theo `paymentMethod`.
- `wristSizeStats` group theo `products.wristSize`.
- `watchTypeStats` lookup sang collection `products`, group theo `productInfo.type`.
- `dialColorStats` lookup sang collection `products`, group theo `productInfo.specs.dial.color`.
- `pendingRevenue` group đơn `confirmed/processing/shipped` với `paymentStatus=pending`.
- `cancellationRate` = số đơn cancelled/returned chia tổng số đơn trong range.
- `GET /analytics/pl` lookup product costPrice để tính revenue, cogs, grossProfit, margin.

### 4.3. Audit log và inventory log đang ghi gì?

#### Audit log người dùng / hệ thống

Tab Người dùng đọc từ `GET /auth/audit-logs` và hiển thị:
- `action`
- `userId.name`
- `userId.role`
- `createdAt`

Modal log chi tiết hiển thị thêm:
- `changes[]` với `field`, `old`, `new`
- `ip`
- `targetModel`
- `userAgent`

#### Inventory log

Tab Kho hàng mở log theo sản phẩm qua `GET /inventory/product/:productId`.

Theo code/đặc tả đang dùng trong dashboard:
- Log thể hiện `IN`, `OUT`, `ADJUST`.
- Có note.
- Có user thực hiện.
- Có thể gắn với đơn hàng qua orderRef/referenceOrderId nếu phát sinh từ xuất kho theo đơn.

#### Product audit

Tab Sản phẩm có `ProductAudit` và middleware auto-log khi giá hoặc thuộc tính sản phẩm thay đổi. Dữ liệu audit này được dùng làm bằng chứng chỉnh sửa trong hệ thống, tuy không hiển thị như một tab riêng.

## 5. Kết luận đặc tả

- Hệ thống Admin hiện có **12 tab** quản trị.
- Mô hình phù hợp với chiến lược All-in-One: một Admin tối cao, tất cả module trên một trang.
- Các phân hệ nổi bật và đáng giữ lại cho đồ án:
  - Analytics có P&L, pie chart thanh toán, line chart doanh thu, watch-specific stats.
  - Orders có filter/search, modal chi tiết, update trạng thái và logistics.
  - Products có CRUD đầy đủ, bulk actions, import/export.
  - Inventory có low-stock alert, adjust stock, logs.
  - Marketing có banner và campaign management.
  - StoreSettings có CMS layout/config storefront.
  - Users có audit log và user detail modal.
  - Reviews/Q&A có moderation và reply workflow.

Nếu cần, có thể tiếp tục chuyển tài liệu này thành:
- bản SRS chuẩn IEEE ngắn gọn hơn,
- hoặc bản đề cương thuyết trình 1-2 trang để nộp đồ án.
