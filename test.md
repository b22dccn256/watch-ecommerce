# Test Plan: Watch E-commerce Platform

## 1. Frontend (FE)
### 1.1. Authentication
- Đăng nhập admin (đúng, sai, bị khóa, rate-limit)
- Đăng xuất
- Quên mật khẩu, đổi mật khẩu

### 1.2. Dashboard
- Hiển thị tổng quan doanh số, đơn hàng, người dùng
- Biểu đồ, số liệu cập nhật đúng

### 1.3. Orders (Đơn hàng)
- Xem danh sách, chi tiết đơn hàng
- Lọc, tìm kiếm, phân trang
- Cập nhật trạng thái đơn hàng
- Xuất file, in hóa đơn

### 1.4. Products (Sản phẩm)
- Xem, thêm, sửa, xóa sản phẩm
- Upload ảnh, thay đổi ảnh
- Quản lý tồn kho, giá, thuộc tính
- Lọc, tìm kiếm, phân trang

### 1.5. Catalog (Danh mục, thương hiệu, chiến dịch, banner)
- CRUD danh mục, thương hiệu, chiến dịch, banner
- Ẩn/hiện, sắp xếp

### 1.6. Marketing (Coupon, Email, Review)
- CRUD coupon, gửi email, quản lý đánh giá
- Lọc, tìm kiếm, phân trang

### 1.7. Users
- Xem, tìm kiếm, phân quyền, khóa/mở khóa tài khoản

### 1.8. Store Settings
- Cập nhật cấu hình cửa hàng, logo, thông tin liên hệ

### 1.9. UI/UX
- Kiểm tra responsive, lỗi giao diện, thông báo, xác nhận
- Modal, toast, loading, error state

---

## 2. Backend (BE)
### 2.1. API Auth
- Đăng nhập, đăng xuất, xác thực OTP
- Rate-limit, brute-force, bảo mật token

### 2.2. API Orders
- CRUD đơn hàng, cập nhật trạng thái
- Kiểm tra phân quyền, validate dữ liệu

### 2.3. API Products
- CRUD sản phẩm, upload ảnh
- Validate dữ liệu, kiểm tra tồn kho

### 2.4. API Catalog
- CRUD danh mục, thương hiệu, chiến dịch, banner
- Kiểm tra liên kết dữ liệu (sản phẩm, danh mục...)

### 2.5. API Marketing
- CRUD coupon, gửi email, quản lý đánh giá
- Kiểm tra logic áp dụng coupon, gửi email hàng loạt

### 2.6. API Users
- CRUD user, phân quyền, khóa/mở khóa
- Kiểm tra bảo mật, validate dữ liệu

### 2.7. Store Config
- Cập nhật, lấy cấu hình cửa hàng

### 2.8. Logging & Auditing
- Ghi log thao tác, kiểm tra audit log

### 2.9. Error & Exception
- Xử lý lỗi, trả về mã lỗi đúng chuẩn

---

## 3. Tích hợp & Khác
- Kết nối Redis, Upstash, MongoDB
- Gửi email, upload file cloudinary
- Test hiệu năng, bảo mật (rate-limit, XSS, CSRF...)
- Test E2E: FE-BE, các luồng chính (đặt hàng, thanh toán, quản lý...)

---

## 4. Test Cases Đặc Thù Admin (v3.0)

### 4.1. Dashboard & Analytics
- **KPI Cards & Delta**: Hiển thị 4 thẻ KPI, tính toán và hiển thị đúng % tăng/giảm so với kỳ trước (badge xanh/đỏ).
- **Widgets Tự Động**: Kiểm tra widget "Việc cần làm hôm nay" (polling 60s) và chuông thông báo Notification (polling 30s) chạy ngầm không gián đoạn UI. Click vào item phải điều hướng đúng tab.
- **Top & Bottom Products**: Hiển thị đúng Top 8 bán chạy nhất và cảnh báo đỏ các sản phẩm tồn kho thấp (Stock ≤ threshold hoặc = 0).
- **Báo Cáo P&L (Profit & Loss)**: Kiểm tra biểu đồ BarChart 3 series, đảm bảo fallback giá vốn bằng 60% giá bán nếu sản phẩm không có `costPrice`.
- **Export Báo Cáo**: Xuất file CSV (dữ liệu Sales) và XLSX (danh sách Products), mở bằng MS Excel kiểm tra đúng chuẩn UTF-8 BOM, không lỗi font tiếng Việt.
- **Global Search**: Gõ từ khóa vào thanh tìm kiếm Header, kiểm tra trả về song song Products + Orders sau 300ms debounce, click kết quả navigate tới đúng trang chi tiết.

### 4.2. Vận Hành Nhanh (Store Operator)
- **Quản lý Section Trang Chủ**: Bật/tắt và thay đổi thứ tự (mũi tên ↑↓) các khối Hero, Flash Sale, Best Sellers trong Store Settings. F5 trang chủ FE kiểm tra cấu hình áp dụng thành công.
- **Thao Tác Nhanh Đơn Hàng**: Click các nút trạng thái nhanh (✓ XN, ⚙ XL, 🚚 GH) trực tiếp trên dòng của bảng đơn hàng, kiểm tra trạng thái cập nhật liền không cần mở modal chi tiết.
- **Bulk Operations (Sản phẩm)**: Chọn checkbox nhiều sản phẩm cùng lúc, kiểm tra tính năng: tăng/giảm giá theo %, đổi trạng thái nổi bật hàng loạt, xóa mềm hàng loạt (gọi single API).

### 4.3. Quản Lý Khách Hàng Nâng Cao
- **Lịch Sử Mua Hàng**: Mở chi tiết User, chuyển tab "Lịch sử mua hàng", kiểm tra load đúng đơn của User đó.
- **Loyalty Points**: Cộng/trừ điểm thưởng cho User, nhập số để test, kiểm tra giới hạn không cho phép điểm hiện tại bị rơi xuống âm.
- **Tags & Notes**: Toggle các nhãn (VIP, Wholesale, Problematic...) và nhập ghi chú nội bộ, blur chuột ra ngoài để test Auto-save.

---

*Lưu ý: Các test case này ưu tiên chạy kiểm tra thủ công hoặc E2E Cypress/Playwright cho các luồng quản trị hệ thống quan trọng.*
