# Phase 1: Nâng cấp Core & Quản lý Sản phẩm
## 1.1 Thuộc tính `wristSize` (Variants & Stock)
- [x] Inspect Product & Order schemas for current variant/stock support
- [x] Update Product model: support `wristSize` array with `{ size, stock }` optionally.
- [x] Update Order model: store selected `wristSize`.
- [x] Update Admin [CreateProductForm](file:///d:/TMDT-team/watch-ecommerce/frontend/src/components/CreateProductForm.jsx#20-324) & [ProductsList](file:///d:/TMDT-team/watch-ecommerce/frontend/src/components/ProductsList.jsx#22-371) to manage size stocks.
- [x] Update Frontend [ProductDetailPage](file:///d:/TMDT-team/watch-ecommerce/frontend/src/pages/ProductDetailPage.jsx#141-524) to select `wristSize` and show corresponding stock.
- [x] Update [Cart](file:///d:/TMDT-team/watch-ecommerce/frontend/src/pages/CartPage.jsx#87-174) and `useCartStore` to handle items by ID + size.
- [x] Update Checkout flow.

## 1.2 Import Sản phẩm bằng Excel
- [x] Backend route `/api/products/import` with `multer` & `xlsx`.
- [x] Admin UI "Import Excel" in [ProductsList](file:///d:/TMDT-team/watch-ecommerce/frontend/src/components/ProductsList.jsx#22-371).

## 1.3 Trải nghiệm Mua hàng (Checkout & Cart)
- [x] Auto-fill User Info (Tên, Email, SĐT) trên form Checkout.
- [x] Hiển thị Toast thông báo khi xóa Item trong Giỏ Hàng.
- [x] Tính và hiển thị rõ ràng phí giao hàng (Shipping Fee = 30k VND cho đơn < 2 triệu) trên cả Frontend và Backend.

## 1.4 Admin UX Fixes
- [x] Popup Order (nút mắt): Tách rời header và scroll layout, hiển thị đẹp trên mobile.
- [x] Nút "Kích hoạt chiến dịch": Thêm trạng thái xoay loading rõ ràng, cải thiện điều kiện báo lỗi ngày tháng.

# Phase 2: Đơn hàng & Tự động hoá (Order Automation)
## 2.1 Guest Checkout & Merge Cart
- [x] Sửa backend [auth.middleware.js](file:///d:/TMDT-team/watch-ecommerce/backend/middleware/auth.middleware.js) thành [optionalRoute](file:///d:/TMDT-team/watch-ecommerce/backend/middleware/auth.middleware.js#54-76) cho `/cod`, `/qr`, và `/create-checkout-session`.
- [x] Đổi field `user` trong Schema Order thành optional (required: false).
- [x] Frontend `useCartStore` merge guest cart (LocalStorage) lên server khi login.
- [x] Mở khoá route `/checkout` và `/cart` cho Guest trong [App.jsx](file:///d:/TMDT-team/watch-ecommerce/frontend/src/App.jsx).

## 2.2 AI Tự động xác nhận & Huỷ đơn (Ngôn ngữ Tự Nhiên & Gemini)
- [x] Cập nhật cronjob hoặc endpoint để AI tự động xác nhận đơn (hoặc hoàn tiền) sau một khoản thời gian.
- [x] Restore stock tuần tự khi đổi status sang `cancelled`/`returned`.
- [x] Lưu nội dung AI phân tích vào `internalNotes`.

# Phase 3: Marketing & Chăm sóc Khách hàng (Loyalty)
## 3.1 Cập nhật Campaign tự động (Auto Apply)
- [x] Tính năng Cronjob / Worker chạy mỗi giờ để kiểm tra trạng thái Campaign.
- [x] Tự động Apply / Gỡ Giảm Giá (Sale Price hoặc Tag) vào các Sản Phẩm liên kết với Campaign.
- [x] Frontend: Hiển thị nhãn Badge (Flash Sale) và đếm ngược trên trang chủ.

## 3.2 Tự động hoá Email (Abandoned Cart)
- [x] Scan Database xem khách hàng nào có giỏ hàng (Cart) chưa check-out sau thời gian quy định (24h).
- [x] Đẩy job gửi Email "Bạn bỏ quên giỏ hàng" qua mail service.

# Phase 4: Thống kê & Trải nghiệm AI Frontend
## 4.1 Thống kê Theo Size / Phương thức thanh toán
- [x] Aggregation Pipeline (Mongoose) nhóm revenue theo thanh toán (Stripe/COD/VNPay) và size cổ tay bán chạy nhất.

## 4.2 Bot Trợ lý AI (Customer Chatbot)
- [x] Trợ lý thông minh gemma nhúng vào site. Biết lấy context tồn kho hiện tại và giới thiệu giá tiền/khuyến mãi chính xác.

# Phase 5: OAuth Integration & Luxury UI Overhaul
## 5.1 Backend OAuth
- [x] Install Passport & OAuth strategies (Google, Facebook, GitHub).
- [x] Update User model with `googleId`, `facebookId`, `githubId`, `profilePicture`.
- [x] Create [backend/config/passport.js](file:///d:/TMDT-team/watch-ecommerce/backend/config/passport.js) configuration.
- [x] Create `/api/auth/oauth` routes for handling redirects and callbacks.
- [x] Update [.env](file:///d:/TMDT-team/watch-ecommerce/backend/.env) with OAuth client secrets.

## 5.2 Frontend Auth & Protected Routes
- [x] Refactor Login.jsx & Register.jsx with Social Login Buttons.
- [x] Create robust AuthContext / useAuthStore state management.
- [x] Update ProtectedRoute wrappers.

## 5.3 Tối ưu UI/UX (Luxury Theme)
- [x] Homepage Hero: Full-width, overlay gradient, luxury slogan, CTA.
- [x] Navbar: Refined logo, search bar, cart badge, mobile menu.
- [x] Product Card: Hover scale, Box shadow, Sale badge, Warranty tags.
- [x] Product Detail: Zoom gallery, WristSize selector, Add to Cart macro-animations.
- [x] Cart/Mini Cart: Animation fly-to-cart, Toast notifications.
- [x] Global Theme: Integrate `#1a1a1a` & `#d4af77` luxury palette.

---

# MỞ RỘNG - VIETNAM E-COMMERCE LOCALIZATION

## Phase 6: Thanh Toán VN & Xác Nhận Đơn Hàng (Ưu Tiên Cao Nhất)
- [x] Cài đặt packages: [vnpay](file:///d:/TMDT-team/watch-ecommerce/backend/controllers/payment.controller.js#324-376), `@zalopay-oss/zalopay-nodejs`.
- [x] Update Order Model: Thêm `paymentMethod` (cod, stripe, vnpay, momo, zalopay), `paymentStatus` (pending, paid, failed, refunded), `transactionId`, `paymentResponse`, `ipnVerified`.
- [x] Backend Payment Service: Tạo [backend/services/payment.service.js](file:///d:/TMDT-team/watch-ecommerce/backend/services/payment.service.js) với các logic tạo URL và xác thực IPN cho VNPay, MoMo, ZaloPay.
- [x] Backend Routes: `POST /api/payment/create`, `GET /api/payment/return`, `POST /api/payment/:method/ipn`.
- [x] Frontend Checkout: Update CheckoutPage UI để liệt kê các Radio Buttons chọn cổng thanh toán có logo tương ứng (VNPay, MoMo, ZaloPay, Stripe, COD). Handle redirect to payment URL.
- [x] Cập nhật App.jsx: Tạo trang `/payment/return` bắt callback redirect từ cổng thanh toán để hiển thị Success / Fail.
- [x] Email Order Confirmation: Viết logic SendEmail ngay lập tức sau khi tạo đơn hoặc khi thanh toán IPN thành công (Transaction Emails).

## Phase 7: Nâng Cấp Core, Phí Ship & Admin KPIs
- [x] Checkout: Tích hợp logic phí ship động (Hà Nội/HCM=30k, tỉnh khác=50k, miễn phí đơn trên 5tr) theo Tỉnh/Thành phố do user chọn.
- [x] Excel Import Nâng Cao: Thêm endpoint preview, handle rollback transaction (MongoDB Session) nếu có lỗi.
- [x] Admin Dashboard KPIs: Bổ sung AOV (Average Order Value), Conversion Rate, và biểu đồ Doanh thu theo giờ.
- [x] Quản lý Sản phẩm Admin: Thêm Bulk Actions (Xóa nhiều, Áp dụng Campaign hàng loạt).

## Phase 8: Trải Nghiệm Khách Hàng, Đổi Trả & Loyalty
- [x] Return & Refund Flow: Thêm status `returned`/`refunded` vào Order. Nút hoàn tiền trong Admin. Tự động Restore Stock.
- [x] Hệ thống Loyalty (Tích điểm): Thêm field `rewardPoints` vào User. Cộng điểm 1% giá trị đơn hàng sau khi Order Delivered.
- [x] Giỏ hàng vãng lai hết hạn tự xóa sau 7 ngày.
- [x] AI Recommendation: Cập nhật Catalog hoặc ProductDetail hiển thị "Sản phẩm thường được mua cùng" hoặc "Bạn có thể thích".
- [x] Xem Linked Accounts trong Profile.

## Phase 9: Đánh Bóng & Bảo Mật (Polish & Security)
- [x] Cấu hình Helmet, CORS chặt, Rate Limiting bảo vệ API.
- [x] Cấu hình Logging (Winston) hoặc Error tracking cơ bản cho API payment.
- [x] Wishlist: Xây dựng trang danh sách yêu thích chuyên dụng.
- [x] So sánh Sản Phẩm (Compare): Giao diện so sánh thông số kĩ thuật tối đa 4 đồng hồ.
- [x] Multi-language / Currency hỗ trợ cơ bản nếu có thời gian dư.
