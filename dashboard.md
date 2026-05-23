# BÁO CÁO GAP ANALYSIS — WATCH ECOMMERCE

> **Ngày phân tích:** 2026-05-21  
> **Codebase đã quét:** `backend/` + `frontend/src/` (models, controllers, components/admin, pages)  
> **Đối chiếu với:** Bảng chốt tính năng RBAC (Giám đốc / Kế toán / Quản lý / Admin)

> **Mục tiêu nộp đồ án:** giữ mô hình All-in-One, ưu tiên CRUD / Query / DB / Audit Trail, tránh mở rộng sang các nhánh quản trị doanh nghiệp hoặc hạ tầng ngoài phạm vi chấm điểm.

---

## TỔNG QUAN KIẾN TRÚC ADMIN HIỆN TẠI

Hệ thống hiện có **1 trang admin duy nhất** (`AdminPage.jsx`) với **12 tabs** và **phân quyền 2 cấp** (`admin` / `staff`). Đây là cấu trúc phù hợp để nộp đồ án vì tập trung, dễ demo và không kéo project sang mô hình quản trị doanh nghiệp nhiều tầng.

| Tab Admin hiện có | File | Vai trò truy cập |
|---|---|---|
| Dashboard (Analytics) | `AnalyticsTab.jsx` | admin + staff |
| Đơn hàng | `OrdersTab.jsx` | admin + staff |
| Danh mục | `CatalogTab.jsx` | admin + staff |
| Sản phẩm | `ProductsList.jsx` | admin + staff |
| Kho hàng | `InventoryTab.jsx` | admin + staff |
| Marketing | `MarketingTab.jsx` | admin + staff |
| Email | `EmailTab.jsx` | admin + staff |
| Reviews & Q&A | `ReviewsTab.jsx` | admin + staff |
| Mã giảm giá | `CouponsTab.jsx` | admin only |
| Người dùng | `UsersTab.jsx` | admin only |
| AI System | `AITab.jsx` | admin only |
| Giao diện (StoreSettings) | `StoreSettingsTab.jsx` | admin only |

---

## 1. VAI TRÒ: GIÁM ĐỐC (CEO / Founder)

### ✅ ĐÃ CÓ

| Tính năng yêu cầu | Hiện trạng | File |
|---|---|---|
| Tổng doanh thu (Gross Revenue) | ✅ KPI card "Doanh thu" — aggregate toàn bộ `Order.totalAmount` | `analytics.controller.js` L15, `AnalyticsTab.jsx` L182 |
| Lợi nhuận gộp (Gross Profit) | ✅ P&L Report: Revenue - COGS, có biểu đồ bar chart theo ngày | `analytics.controller.js` L217–308, `AnalyticsTab.jsx` L349–382 |
| Biên độ lợi nhuận (Margin %) | ✅ Tính `grossProfit/revenue * 100`, fallback 60% nếu thiếu `costPrice` | `analytics.controller.js` L265–270 |
| AOV (Giá trị đơn trung bình) | ✅ KPI card "Giá trị đơn trung bình (AOV)" | `analytics.controller.js` L49, `AnalyticsTab.jsx` L183 |
| Tốc độ tăng trưởng MoM | ✅ `includePrev=true` — so sánh kỳ trước, hiển thị `DeltaBadge` | `analytics.controller.js` L161–169, `AnalyticsTab.jsx` L69–81 |
| Top sản phẩm bán chạy | ✅ "Top 8 Bán chạy" theo `salesCount`, có ảnh + brand | `AnalyticsTab.jsx` L304–323 |
| Biểu đồ doanh thu theo ngày | ✅ LineChart, filter 7/30/90 ngày + tùy chỉnh ngày bắt đầu/kết thúc | `AnalyticsTab.jsx` L199–257 |
| Phân tích theo phương thức thanh toán | ✅ PieChart phân tách VNPay, MoMo, COD, Stripe, ZaloPay, QR | `analytics.controller.js` L22–30, `AnalyticsTab.jsx` L261–275 |
| Xuất CSV | ✅ Button export CSV từ analytics data | `AnalyticsTab.jsx` L161–166 |
| Ẩn/Hiện sections trang chủ | ✅ Toggle Hero, Flash Sale, Best Seller, Newsletter | `StoreSettingsTab.jsx` L11–16, `storeConfig.model.js` L167–174 |

### ❌ CHƯA CÓ (KHÔNG ƯU TIÊN CHO BẢN NỘP)

| Tính năng yêu cầu | Lý do thiếu |
|---|---|
| **LTV (Life-Time Value khách hàng)** | Không có trường LTV. User model có `totalSpend`, `orderCount` nhưng không tính LTV theo thời gian |
| **CAC (Customer Acquisition Cost)** | Hoàn toàn vắng mặt — không track chi phí marketing |
| **Top 5 thương hiệu lợi nhuận cao nhất** | P&L chỉ tổng hợp theo ngày, không breakdown theo brand |
| **YoY growth** | Chỉ có MoM (prevDailySales), không có year-over-year |
| **Phân tích hành vi: mua đồng hồ kèm phụ kiện** | Không có tracking sản phẩm mua kèm (cross-sell analytics) |
| **Báo cáo theo Quý / Năm / Chu kỳ chiến dịch** | Chỉ hỗ trợ range ngày (max 90 ngày preset). Không có preset "Quý", "Năm", "Black Friday" |
| **Đa tiền tệ (USD/VND) trong dashboard** | Order model có `currency` field nhưng Analytics chỉ tính VND |
| **Bật/Tắt phân khúc "Luxury" theo mùa** | StoreSettings chỉ có sections chung, không có phân khúc sản phẩm theo mùa |

### ⚠️ CẦN CẢI THIỆN

| Điểm yếu | Đề xuất |
|---|---|
| P&L dùng fallback 60% khi thiếu `costPrice` | Cần bắt buộc nhập `costPrice` khi tạo sản phẩm hoặc hiển thị cảnh báo dữ liệu không chính xác |
| Tỷ lệ chuyển đổi (Conversion Rate) không có dữ liệu tracking | Cần tích hợp với Google Analytics ID (đã có field `googleAnalyticsId` trong StoreConfig) |
| Export chỉ có CSV | CEO cần PDF với biểu đồ — thêm export PDF |

---

## 2. VAI TRÒ: KẾ TOÁN (Accountant)

### ✅ ĐÃ CÓ

| Tính năng yêu cầu | Hiện trạng | File |
|---|---|---|
| Dòng tiền theo phương thức thanh toán | ✅ `paymentStats` phân tách VNPay, MoMo, COD, Stripe, QR | `analytics.controller.js` L22–30 |
| Doanh thu thực tế vs dòng tiền dự kiến | ✅ Tách riêng `totalRevenue` và `pendingRevenue/pendingCount` theo trạng thái đơn | `analytics.controller.js` L70–118, `AnalyticsTab.jsx` |
| Chi tiết đơn hàng: giá bán, phí ship, mã giảm giá | ✅ Order model có đủ: `subtotal`, `discountAmount`, `shippingFee`, `couponCode`, `totalAmount` | `order.model.js` L41–64 |
| Trạng thái thanh toán | ✅ `paymentStatus`: pending/paid/failed/refunded/cancelled | `order.model.js` L93–97 |
| Doanh thu thực tế (đã hoàn thành) | ✅ Filter `paymentStatus: "paid"` | `analytics.controller.js` L46 |
| Tỷ lệ hủy đơn / hoàn hàng | ✅ KPI `cancellationRate` hiển thị trực tiếp trên dashboard | `analytics.controller.js` L96–108, `AnalyticsTab.jsx` |
| Thời gian thanh toán (`paidAt`) | ✅ Field `paidAt` trong Order | `order.model.js` L125–128 |
| Hoàn hàng / returnReason | ✅ `returnReason`, `refundAmount`, status `returned`/`return_requested` | `order.model.js` L145–153 |
| Công nợ đơn vị vận chuyển | ✅ `carrier` field (GHTK, Viettel Post, J&T, DHL, VNPost) | `order.model.js` L136–140 |
| Xuất dữ liệu Excel | ✅ Button "Excel" trỏ `/api/products/export` | `AnalyticsTab.jsx` L167–172 |

### ❌ CHƯA CÓ (KHÔNG ƯU TIÊN CHO BẢN NỘP)

| Tính năng yêu cầu | Lý do thiếu |
|---|---|
| **Thuế VAT** | Order model không có trường VAT, không có form xuất hóa đơn VAT |
| **Phí cổng thanh toán (1% VNPay...)** | Không có trường phí gateway — không trừ hoa hồng cổng TT |
| **Kỳ kế toán tùy chỉnh (VD: 25/M → 25/M+1)** | Range chỉ tính theo "N ngày gần nhất". Không có kỳ kế toán cố định |
| **Năm tài chính** | Không có preset "năm tài chính" |
| **Chi phí phạt ship** | Không có trường penalty shipping |
| **Báo cáo xuất PDF để nộp thuế** | Chỉ có CSV + Excel sản phẩm, không có báo cáo tài chính PDF |
| **Bật/Tắt form VAT tại Checkout** | StoreConfig không có toggle cho form VAT |
| **Đối soát IPN** | Có model `processedIPN.model.js` nhưng không có UI dashboard kế toán |

### ⚠️ CẦN CẢI THIỆN

| Điểm yếu | Đề xuất |
|---|---|
| Export Excel chỉ export Products, không phải Financial Report | Cần tạo endpoint `/api/analytics/export-finance` trả Excel có sheet: Đơn hàng, Doanh thu, Hoàn hàng |
| `discountAmount` hiển thị dưới dạng số, không rõ từ coupon nào | Nên join `couponCode` với Coupon table để hiển thị tên chiến dịch |

---

## 3. VAI TRÒ: QUẢN LÝ CỬA HÀNG (Store Manager / Operations)

### ✅ ĐÃ CÓ

| Tính năng yêu cầu | Hiện trạng | File |
|---|---|---|
| Trạng thái đơn hàng real-time | ✅ OrdersTab với filter status, badge pending orders ở sidebar | `AdminPage.jsx` L135–139 |
| Cảnh báo tồn kho dưới ngưỡng | ✅ "Cảnh báo Tồn kho Thiếu Hụt", badge đỏ ở sidebar Inventory | `InventoryTab.jsx` L49–96, `AdminPage.jsx` L140–143 |
| Tồn kho chi tiết theo SKU | ✅ Inventory table có SKU, Brand, stock count + low-stock badge | `InventoryTab.jsx` L129–154 |
| Lịch sử thao tác tồn kho (Log) | ✅ InventoryLog modal: action IN/OUT/ADJUST, note, userId, orderRef | `InventoryTab.jsx` L307–356 |
| Ai sửa tồn kho | ✅ `userId.email` hiển thị trong log | `InventoryTab.jsx` L345–347 |
| Audit log sản phẩm (ai sửa giá) | ✅ `ProductAudit` model + middleware auto-log mọi thay đổi | `product.model.js` L207–235, `productAudit.model.js` |
| Thay đổi Banner/Slider trang chủ | ✅ Hero Slides editor (ảnh, title, subtitle, link, active toggle) | `StoreSettingsTab.jsx` L188–214 |
| Ghim sản phẩm lên đầu | ✅ `isFeatured` toggle trong ProductsList | `product.model.js` L54–57 |
| Quản lý Recommendation blocks | ✅ StoreSettings: toggle Best Seller, Flash Sale sections | `StoreSettingsTab.jsx` L11–16 |
| Coupon/Voucher management | ✅ CouponsTab đầy đủ với stats | `CouponsTab.jsx` |
| Thống kê số lượng bán theo SKU | ✅ `salesCount` field trên Product, hiển thị ở Top 8 | `product.model.js` L114–117 |

### ❌ CHƯA CÓ (KHÔNG ƯU TIÊN CHO BẢN NỘP)

| Tính năng yêu cầu | Lý do thiếu |
|---|---|
| **Hiệu suất chốt đơn của từng nhân viên** | Không track `confirmedBy`/`processedBy` trên Order. Không có staff performance analytics |
| **Chia ca làm việc (Shift analytics)** | Hoàn toàn không có khái niệm ca làm việc |
| **Giá khuyến mãi theo từng sản phẩm cụ thể trong kỳ** | Có `originalPrice` + `price` nhưng không có lịch sử giá theo thời gian |
| **Audit log ai xác nhận đơn hàng** | Order model không lưu `confirmedByUserId` |
| **Tồn kho chi tiết theo thuộc tính** (màu + dây = 1 SKU riêng) | `wristSizeOptions` có stock riêng nhưng màu sắc (`colors`) không có stock riêng — không hỗ trợ SKU matrix |

### ⚠️ CẦN CẢI THIỆN

| Điểm yếu | Đề xuất |
|---|---|
| Inventory tab chỉ hiển thị tổng stock, không breakdown theo wristSize | Mở rộng InventoryTab hiển thị `wristSizeOptions` dạng sub-row |
| Không có trạng thái "đang đóng gói" real-time | Thêm notification WebSocket khi đơn chuyển trạng thái |
| Flash Sale chỉ có 1 ngày kết thúc global | Cần flash sale per-product với giá riêng và thời gian riêng |

---

## 4. VAI TRÒ: ADMIN HỆ THỐNG (System IT / Super Admin)

### ✅ ĐÃ CÓ

| Tính năng yêu cầu | Hiện trạng | File |
|---|---|---|
| Quản lý Menu/Navigation | ✅ Dynamic Navigation Items editor (thêm/xóa/di chuyển menu) | `StoreSettingsTab.jsx` L520–597 |
| Cấu hình Layout modules | ✅ Bật/tắt Hero, Flash Sale, Best Seller, Newsletter; sắp xếp thứ tự | `StoreSettingsTab.jsx` L338–384 |
| Bật/tắt Chatbot | ✅ `showChatBot` toggle trong StoreConfig | `storeConfig.model.js` L197–202 |
| Cổng thanh toán (config) | ✅ Env-based (Stripe, VNPay, MoMo, ZaloPay key trong .env) | `.env.example` |
| Phân quyền người dùng (RBAC) | ✅ UsersTab có gán role `admin`/`staff`/`customer` | `UsersTab.jsx`, `user.model.js` L58–62 |
| Cookie Consent config | ✅ Toggle + title + text trong StoreSettings | `StoreSettingsTab.jsx`, `storeConfig.model.js` L43–45 |
| Custom CSS | ⚪ Có field trong model, nhưng UI editor đã lược bỏ để giữ scope gọn | `storeConfig.model.js` L47–48 |
| Tích hợp tracking (GA, FB Pixel, TikTok) | ✅ Fields `googleAnalyticsId`, `facebookPixelId`, `tiktokPixelId` | `storeConfig.model.js` L38–40 |
| SEO config | ✅ `seoTitle`, `seoMetaDesc` trong StoreSettings | `storeConfig.model.js` L231–238 |
| AuditLog model | ✅ `auditLog.model.js` tồn tại | `auditLog.model.js` |

### ❌ CHƯA CÓ (KHÔNG ƯU TIÊN CHO BẢN NỘP)

| Tính năng yêu cầu | Lý do thiếu |
|---|---|
| **Sức khỏe hệ thống (API response time, DB size)** | Không có endpoint health check, không có tab system monitoring |
| **Số người dùng đang online (Active Users)** | Không có session tracking / WebSocket user count |
| **System Log (IP, DDoS alert)** | Không có rate-limiting log UI. Server có `logs/` folder nhưng không expose trong dashboard |
| **Log đăng nhập sai quá số lần quy định** | Không có brute-force tracking UI (backend có thể đã có nhưng không hiển thị) |
| **Biểu đồ tải server (CPU/RAM)** | Không có server metrics integration |
| **Tỷ lệ lỗi API (4xx, 5xx)** | Không có API error rate dashboard |
| **Cấu hình API đơn vị vận chuyển (dynamic)** | Carrier enum hardcode trong schema, không có UI config webhook/API key vận chuyển |
| **RBAC granular (xem tài khoản giữ Role nào)** | UsersTab chỉ gán role, không hiển thị audit history "ai đã gán role X cho user Y" |

### ⚠️ CẦN CẢI THIỆN

| Điểm yếu | Đề xuất |
|---|---|
| Role system chỉ 2 cấp (admin/staff) thay vì 4 vai trò | Cần thêm `role`: `"ceo"`, `"accountant"`, `"manager"`, `"admin"` và tạo dashboard view riêng |
| Không có tab "System Health" | Thêm tab hoặc widget tích hợp với `pm2`, `mongoose.connection.db.stats()` |
| PaymentGateway config chỉ qua .env | Cần UI dynamic config trong StoreSettings (ít nhất toggle bật/tắt từng gateway) |

---

## 5. ĐẶC THÙ NGÀNH ĐỒNG HỒ

### ✅ ĐÃ CÓ (ĐIỂM MẠNH NỔI BẬT)

| Tính năng chuyên biệt | Hiện trạng | File |
|---|---|---|
| Phân loại máy: Automatic/Quartz/Mechanical/Solar/Digital/Smartwatch | ✅ `type` enum đầy đủ trên Product | `product.model.js` L143–149 |
| Thống kê Automatic vs Quartz | ✅ Aggregate `watchTypeStats` theo `type` từ đơn hàng đã thanh toán | `analytics.controller.js` L42–93, `AnalyticsTab.jsx` |
| Thống kê màu mặt số | ✅ Aggregate `dialColorStats` theo `specs.dial.color` | `analytics.controller.js` L66–93, `AnalyticsTab.jsx` |
| Thống kê size cổ tay bán chạy | ✅ `wristSizeStats` aggregate + BarChart "Top Size Cổ Tay" | `analytics.controller.js` L32–43, `AnalyticsTab.jsx` L277–291 |
| Thông số kỹ thuật đồng hồ đầy đủ | ✅ `specs` object: movement, case, strap, waterResistance, glass, dial, functions, year, warranty | `product.model.js` L163–194 |
| Màu mặt số (Dial color) | ✅ `specs.dial.color` | `product.model.js` L188 |
| Kích thước mặt số (Diameter) | ✅ `specs.case.diameter` | `product.model.js` L172 |
| Vật liệu dây (Strap material) | ✅ `specs.strap.material` | `product.model.js` L180 |
| SKU riêng cho từng sản phẩm | ✅ `sku` field trên Product | `product.model.js` L138–142 |
| Inventory log khi xuất kho theo đơn hàng | ✅ `referenceOrderId` trong InventoryLog | `inventoryLog.model.js` |
| Trang Bảo hành (static page) | ✅ WarrantyPage.jsx tồn tại | `WarrantyPage.jsx` |
| Chatbot AI hỗ trợ khách hàng | ✅ ChatBot component + AITab quản lý | `ChatBot.jsx`, `AITab.jsx` |

### ❌ CHƯA CÓ

| Tính năng chuyên biệt | Lý do thiếu |
|---|---|
| **Quản lý Số Serial đồng hồ** | Product model không có trường `serialNumber`. Không thể gán serial cho từng chiếc khi bán |
| **Gắn serial vào đơn hàng** | Order model không có `serialNumbers` array |
| **Dashboard bảo hành theo serial** | Không có Warranty model, không track số máy đang bảo hành |
| **Lịch sử sửa chữa (thay kính, lau dầu)** | Không có Service/Repair model |
| **Tự động nhắc lịch bảo dưỡng VIP** | EmailTab có automation nhưng không có trigger "X năm sau khi mua" |
| **Thống kê diameter ưa chuộng** | `specs.case.diameter` không được aggregate trong analytics |
| **Hiệu suất Recommendation System** | `PeopleAlsoBought` component tồn tại nhưng không đo CTR/conversion |

### ⚠️ CẦN CẢI THIỆN

| Điểm yếu | Đề xuất |
|---|---|
| `wristSizeStats` aggregate từ orders nhưng tên "size" dùng chung với size quần áo | Rename thành "Kích thước cổ tay (mm)" + filter bỏ giá trị không phải số |
| Specs không mandatory khi tạo sản phẩm | Cần validation bắt buộc nhập `specs.movement.type` và `specs.case.diameter` |
| `type` enum có "mechanical" và "automatic" tách biệt nhưng nghĩa gần nhau | Cân nhắc merge hoặc thêm tooltip giải thích sự khác biệt |

---

## 6. BẢNG TÓM TẮT TỔNG HỢP

| Hạng mục | Đã có | Chưa có | Tỷ lệ hoàn thành |
|---|---|---|---|
| CEO / Giám đốc | 10 / 18 tính năng | 8 | ~56% |
| Kế toán | 10 / 18 tính năng | 8 | ~56% |
| Quản lý Vận hành | 11 / 16 tính năng | 5 | ~69% |
| Admin IT | 10 / 18 tính năng | 8 | ~56% |
| Đặc thù Đồng hồ | 12 / 19 tính năng | 7 | ~63% |
| **Tổng** | **53 / 89** | **36** | **~60%** |

---

## 7. NÊN CẮT GIẢM / KHÔNG ƯU TIÊN CHO BẢN NỘP

| Tính năng | Lý do nên giảm/gác lại |
|---|---|
| **Custom CSS Editor** trong StoreSettings | Đã lược bỏ khỏi UI để giữ scope gọn; chỉ nên quay lại nếu thật sự cần cho demo |
| **Chatbot AI System tab** (AITab) | Feature thú vị nhưng không phục vụ trực tiếp 4 vai trò dashboard. Nên là tính năng phụ |
| **Wrist Size analytics** theo size cổ tay | Dữ liệu ít ý nghĩa kinh doanh hơn so với thống kê theo `type` (Automatic/Quartz). Nên hạ ưu tiên |
| **StoreSettings > Typography Scale slider** | Đã lược bỏ; giữ theme preset và bảng màu để tránh loãng UI |
| **Multiple theme presets (Midnight/Platinum/Emerald)** | Dư thừa với dự án đồng hồ cao cấp — nên lock 1 theme; dùng Custom Colors thay thế |

---

## 8. ROADMAP ƯU TIÊN (Gợi ý theo mức độ impact)

### 🔴 CRITICAL — Nên làm ngay (ảnh hưởng trực tiếp đến điểm số và khả năng demo)

1. **Thêm role `accountant` và `manager`** — tách dashboard view theo vai trò
2. **Trường VAT + form xuất hóa đơn VAT** — yêu cầu pháp lý
3. **`confirmedByUserId` trên Order** — audit trail cho Quản lý
4. **KPI: Tỷ lệ hủy đơn/hoàn hàng** — đã triển khai
5. **Tách Doanh thu dự kiến vs Thực tế** — đã triển khai

### 🟡 HIGH — Nên làm trong sprint tới

6. **Aggregate analytics theo `type` (Automatic/Quartz)** — đã triển khai
7. **Aggregate theo `diameter`** — còn lại nếu muốn tăng độ đặc thù ngành
8. **Serial Number management** — Model + UI nhập kho theo serial
9. **Financial export PDF** — Kế toán nộp thuế
10. **Warranty/Repair model** — Theo dõi bảo hành theo serial

### 🟢 MEDIUM — Backlog sprint 2–3

11. **LTV calculation** — từ `totalSpend`/`orderCount` có sẵn
12. **Staff performance (chốt đơn per user)** — cần thêm `processedBy` field
13. **Preset kỳ kế toán** — Quý / Năm tài chính
14. **System Health tab** — ping `/health`, DB stats
15. **Recommendation system analytics** — CTR tracking

### ⚪ LOW — Nice-to-have

16. YoY growth comparison
17. CAC tracking
18. DDoS / brute-force log UI
19. Shift analytics
20. Periodic maintenance reminder email (cần trigger engine)

---

> **Ghi chú kỹ thuật:**  
> - File quan trọng nhất để mở rộng: [analytics.controller.js](backend/controllers/analytics.controller.js), [AnalyticsTab.jsx](frontend/src/components/admin/AnalyticsTab.jsx), [order.model.js](backend/models/order.model.js), [user.model.js](backend/models/user.model.js)  
> - Role system cần refactor: [AdminPage.jsx](frontend/src/pages/AdminPage.jsx) L28–41 (tabs array) và [user.model.js](backend/models/user.model.js) L58–62 (role enum)
