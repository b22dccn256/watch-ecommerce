# 📁 Cấu trúc thư mục — Watch E-Commerce
> Cập nhật: 2026-05-14 | Bỏ qua: `node_modules/`, `.git/`, `dist/`

```
watch-ecommerce/
├── 📄 .gitignore
├── 📄 package.json                  # Root: scripts dev/build/start
├── 📄 package-lock.json
├── 📄 README.md
├── 📄 Target.md                     # Mục tiêu bài tập lớn
├── 📄 copilot-instructions.md       # Hướng dẫn AI copilot
├── 📄 update_admin.md               # Báo cáo audit & bug tracking
├── 📄 stripe-error.log
├── 📄 check-products.cjs            # Script kiểm tra sản phẩm
├── 📄 clear-cache.cjs               # Script xóa Redis cache
├── 📄 sync-images.cjs               # Script đồng bộ ảnh
├── 📄 test-db.cjs                   # Script test kết nối DB
├── 📄 theme-update.js               # Script cập nhật theme CSS
│
├── 📂 backend/                      # Express API server
│   ├── 📄 server.js                 # Entrypoint: middleware, routes, error handler
│   ├── 📄 package.json
│   ├── 📄 .env                      # Biến môi trường (gitignored)
│   ├── 📄 .env.example              # Mẫu biến môi trường
│   │
│   ├── 📂 config/
│   │   └── 📄 passport.js           # OAuth Google/Facebook/GitHub strategies
│   │
│   ├── 📂 controllers/              # Xử lý request → response
│   │   ├── 📄 ai.controller.js          # Chat AI, tự động hóa đơn hàng
│   │   ├── 📄 analytics.controller.js   # Thống kê doanh thu, P&L
│   │   ├── 📄 auth.controller.js        # Đăng ký/login/OTP/2FA/quản lý user
│   │   ├── 📄 banner.controller.js      # CRUD banner hero
│   │   ├── 📄 brand.controller.js       # CRUD thương hiệu
│   │   ├── 📄 campaign.controller.js    # CRUD chiến dịch giảm giá
│   │   ├── 📄 cart.controller.js        # Giỏ hàng, merge, stock check
│   │   ├── 📄 category.controller.js    # CRUD danh mục (phân cấp)
│   │   ├── 📄 contact.controller.js     # Form liên hệ
│   │   ├── 📄 coupon.controller.js      # CRUD mã giảm giá
│   │   ├── 📄 inventory.controller.js   # Tồn kho, điều chỉnh, log
│   │   ├── 📄 mail.controller.js        # Email: inbox, template, campaign, subscribers
│   │   ├── 📄 order.controller.js       # CRUD đơn hàng, COD/QR, tracking
│   │   ├── 📄 payment.controller.js     # Stripe, VNPay, MoMo, ZaloPay
│   │   ├── 📄 product.controller.js     # CRUD sản phẩm, import/export Excel
│   │   ├── 📄 question.controller.js    # Hỏi đáp sản phẩm
│   │   ├── 📄 review.controller.js      # Đánh giá sản phẩm
│   │   ├── 📄 storeConfig.controller.js # Cấu hình giao diện storefront
│   │   └── 📄 wishlist.controller.js    # Wishlist người dùng
│   │
│   ├── 📂 routes/                   # Ánh xạ URL → controller
│   │   ├── 📄 ai.route.js
│   │   ├── 📄 analytics.route.js
│   │   ├── 📄 auth.route.js
│   │   ├── 📄 banner.route.js
│   │   ├── 📄 brand.route.js
│   │   ├── 📄 campaign.route.js
│   │   ├── 📄 cart.route.js
│   │   ├── 📄 category.route.js
│   │   ├── 📄 contact.route.js
│   │   ├── 📄 coupon.route.js
│   │   ├── 📄 inventory.route.js
│   │   ├── 📄 mail.route.js
│   │   ├── 📄 oauth.route.js        # Google/Facebook/GitHub OAuth
│   │   ├── 📄 order.route.js
│   │   ├── 📄 payment.route.js
│   │   ├── 📄 product.route.js
│   │   ├── 📄 question.route.js
│   │   ├── 📄 review.route.js
│   │   ├── 📄 storeConfig.route.js
│   │   └── 📄 wishlist.route.js
│   │
│   ├── 📂 models/                   # Mongoose Schema → MongoDB
│   │   ├── 📄 auditLog.model.js         # Log hành động admin (TTL 365 ngày)
│   │   ├── 📄 banner.model.js           # Banner hero (ACTIVE/INACTIVE)
│   │   ├── 📄 brand.model.js            # Thương hiệu đồng hồ
│   │   ├── 📄 campaign.model.js         # Chiến dịch giảm giá theo nhóm
│   │   ├── 📄 category.model.js         # Danh mục phân cấp (ancestors)
│   │   ├── 📄 contact.model.js          # Form liên hệ khách hàng
│   │   ├── 📄 coupon.model.js           # Mã giảm giá (percent/fixed)
│   │   ├── 📄 emailLog.model.js         # Log gửi email (open/click tracking)
│   │   ├── 📄 emailTemplate.model.js    # Template HTML email
│   │   ├── 📄 inventoryLog.model.js     # Log xuất/nhập/điều chỉnh kho
│   │   ├── 📄 mailCampaign.model.js     # Chiến dịch email marketing
│   │   ├── 📄 newsletterSubscription.model.js
│   │   ├── 📄 order.model.js            # Đơn hàng (COD/Stripe/VNPay/MoMo/QR)
│   │   ├── 📄 processedIPN.model.js     # Idempotency IPN gateway
│   │   ├── 📄 product.model.js          # Sản phẩm đồng hồ (specs, variants)
│   │   ├── 📄 productAudit.model.js     # Lịch sử thay đổi sản phẩm
│   │   ├── 📄 question.model.js         # Câu hỏi sản phẩm
│   │   ├── 📄 review.model.js           # Đánh giá + ảnh
│   │   ├── 📄 storeConfig.model.js      # Cấu hình layout homepage
│   │   ├── 📄 user.model.js             # Người dùng (customer/staff/admin)
│   │   └── 📄 wishlist.model.js
│   │
│   ├── 📂 middleware/
│   │   ├── 📄 auth.middleware.js        # protectRoute, adminRoute, managementRoute
│   │   ├── 📄 csrf.middleware.js        # CSRF token protection
│   │   ├── 📄 ipWhitelist.middleware.js # Whitelist IP cho IPN payment
│   │   ├── 📄 permission.middleware.js  # Fine-grained permission check
│   │   └── 📄 sanitize.middleware.js    # Input sanitization (XSS)
│   │
│   ├── 📂 services/
│   │   ├── 📄 campaign.service.js   # Logic áp dụng campaign discount
│   │   ├── 📄 mailWorker.js         # BullMQ worker gửi email (Handlebars)
│   │   ├── 📄 order.service.js      # Trừ/hoàn kho, tạo mã đơn, tính tiền
│   │   └── 📄 payment.service.js    # VNPay/MoMo/ZaloPay HMAC helpers
│   │
│   ├── 📂 lib/                      # Tích hợp thư viện bên ngoài
│   │   ├── 📄 cloudinary.js         # Upload ảnh Cloudinary
│   │   ├── 📄 coupon.js             # Helper tính giảm giá coupon
│   │   ├── 📄 cron.js               # Cron jobs: cart cleanup, low stock alert
│   │   ├── 📄 cron-ai.js            # Cron AI: tự động xác nhận đơn
│   │   ├── 📄 db.js                 # Kết nối MongoDB
│   │   ├── 📄 email.js              # Nodemailer (Gmail/Ethereal fallback)
│   │   ├── 📄 emailTemplates.js     # HTML templates hệ thống
│   │   ├── 📄 redis.js              # ioredis/Upstash Redis client
│   │   └── 📄 stripe.js             # Stripe SDK instance
│   │
│   ├── 📂 scripts/                  # One-off migration/seed scripts
│   │   ├── 📄 seed-products.js          # Seed dữ liệu sản phẩm mẫu
│   │   ├── 📄 migrate-products.js       # Migration cấu trúc sản phẩm
│   │   ├── 📄 migrate-orders.js         # Migration trường đơn hàng
│   │   ├── 📄 migrate-currency.js       # Chuẩn hóa đơn vị tiền tệ
│   │   ├── 📄 migrate-specs-brand.js    # Migration specs & brand
│   │   ├── 📄 fix-product-data.js       # Sửa dữ liệu sản phẩm lỗi
│   │   ├── 📄 fix-images.js             # Sửa URL ảnh sản phẩm
│   │   └── 📄 clean-dummy-watches.js    # Xóa sản phẩm dummy
│   │
│   ├── 📂 test/                     # Test backend (placeholder)
│   └── 📂 uploads/                  # File upload local (Excel import)
│
├── 📂 frontend/                     # React 18 SPA (Vite)
│   ├── 📄 index.html
│   ├── 📄 vite.config.js            # Proxy /api → localhost:5000
│   ├── 📄 tailwind.config.js        # Dark mode, luxury palette
│   ├── 📄 postcss.config.js
│   ├── 📄 eslint.config.js
│   ├── 📄 playwright.config.ts
│   ├── 📄 package.json
│   ├── 📄 README.md
│   │
│   ├── 📂 public/                   # Static assets
│   │   ├── 🖼️ banner-2.jpg
│   │   ├── 🖼️ banner-luxury.jpg
│   │   ├── 🖼️ flash-sale.jpg
│   │   ├── 🖼️ sale-2.jpg ... sale-7.jpg
│   │   ├── 🖼️ CasioF-91.jpg
│   │   ├── 🖼️ CasioG-Shock-GA2100.jpg
│   │   ├── 🖼️ CitizenEco-DriveAviator.jpg
│   │   ├── 🖼️ CitizenEco-DriveAviator2.jpg
│   │   ├── 🖼️ GarminFenix-7-SapphireSolar.jpg
│   │   ├── 🖼️ Seiko-5-Quân-Đội-SNK809.jpg
│   │   ├── 🖼️ Seiko5-Quân-Đội-SNK809-2.jpg
│   │   └── 🖼️ vite.svg
│   │
│   └── 📂 src/
│       ├── 📄 main.jsx              # ReactDOM.createRoot, BrowserRouter
│       ├── 📄 App.jsx               # Routes, auth guards, global effects
│       ├── 📄 index.css             # CSS variables, design tokens, utilities
│       │
│       ├── 📂 pages/                # Màn hình chính (React Router)
│       │   ├── 📄 HomePage.jsx
│       │   ├── 📄 LoginPage.jsx          # Login + OTP admin 2FA
│       │   ├── 📄 SignUpPage.jsx
│       │   ├── 📄 VerifyEmailPage.jsx
│       │   ├── 📄 ForgotPasswordPage.jsx
│       │   ├── 📄 ResetPasswordPage.jsx
│       │   ├── 📄 AdminPage.jsx          # Dashboard admin (tab system)
│       │   ├── 📄 AccountPages.jsx       # Trang tài khoản (wrapper)
│       │   ├── 📄 ProfilePage.jsx        # Hồ sơ, lịch sử đơn, đổi mật khẩu
│       │   ├── 📄 CatalogPage.jsx        # Danh mục + filter + sort
│       │   ├── 📄 ProductDetailPage.jsx  # Chi tiết SP, reviews, Q&A
│       │   ├── 📄 CartPage.jsx
│       │   ├── 📄 CheckoutPage.jsx       # Multi-step checkout
│       │   ├── 📄 WishlistPage.jsx
│       │   ├── 📄 BrandsPage.jsx
│       │   ├── 📄 AboutPage.jsx
│       │   ├── 📄 ContactPage.jsx
│       │   ├── 📄 OrderLookupPage.jsx    # Tra cứu đơn hàng (guest)
│       │   ├── 📄 OrderTrackingPage.jsx  # Tracking đơn theo token
│       │   ├── 📄 PaymentReturnPage.jsx  # VNPay/MoMo/ZaloPay return
│       │   ├── 📄 PurchaseSuccessPage.jsx
│       │   ├── 📄 PurchaseCancelPage.jsx
│       │   ├── 📄 DeliveryPolicyPage.jsx
│       │   ├── 📄 WarrantyPage.jsx
│       │   ├── 📄 SizeGuidePage.jsx
│       │   ├── 📄 PrivacyPolicyPage.jsx
│       │   ├── 📄 TermsOfServicePage.jsx
│       │   └── 📄 NotFoundPage.jsx
│       │
│       ├── 📂 components/           # UI components tái sử dụng
│       │   ├── 📄 Navbar.jsx             # Thanh điều hướng + search + cart
│       │   ├── 📄 Footer.jsx
│       │   ├── 📄 HeroBanner.jsx         # Banner slideshow homepage
│       │   ├── 📄 ProductCard.jsx        # Card sản phẩm (wishlist, compare)
│       │   ├── 📄 FeaturedProducts.jsx   # Grid sản phẩm nổi bật
│       │   ├── 📄 BestSellerSection.jsx
│       │   ├── 📄 FlashSaleSection.jsx   # Flash sale countdown
│       │   ├── 📄 FilterSidebar.jsx      # Bộ lọc catalog
│       │   ├── 📄 SearchBarWithSuggestions.jsx
│       │   ├── 📄 CartItem.jsx
│       │   ├── 📄 OrderSummary.jsx
│       │   ├── 📄 CheckoutStepper.jsx
│       │   ├── 📄 WishlistItem.jsx
│       │   ├── 📄 CompareModal.jsx
│       │   ├── 📄 GiftCouponCard.jsx
│       │   ├── 📄 PeopleAlsoBought.jsx
│       │   ├── 📄 CategoryItem.jsx
│       │   ├── 📄 ChatBot.jsx            # AI chatbot tư vấn
│       │   ├── 📄 LoadingSpinner.jsx
│       │   ├── 📄 SkeletonLoaders.jsx
│       │   ├── 📄 GlobalErrorBoundary.jsx
│       │   ├── 📄 PolicyPageLayout.jsx
│       │   ├── 📄 LanguageCurrencySwitcher.jsx
│       │   │
│       │   ├── ── Admin Tabs ──
│       │   ├── 📄 AnalyticsTab.jsx       # Thống kê KPI, biểu đồ, P&L
│       │   ├── 📄 OrdersTab.jsx          # Quản lý đơn hàng (51KB)
│       │   ├── 📄 ProductsList.jsx       # Danh sách sản phẩm admin
│       │   ├── 📄 CreateProductForm.jsx
│       │   ├── 📄 EditProductForm.jsx
│       │   ├── 📄 CatalogTab.jsx         # Danh mục + thương hiệu admin
│       │   ├── 📄 InventoryTab.jsx       # Quản lý tồn kho
│       │   ├── 📄 UsersTab.jsx           # Quản lý người dùng, loyalty
│       │   ├── 📄 MarketingTab.jsx       # Banner + chiến dịch giảm giá
│       │   ├── 📄 EmailTab.jsx           # Email marketing: inbox/template/campaign
│       │   ├── 📄 CouponsTab.jsx         # Quản lý mã giảm giá
│       │   ├── 📄 ReviewsTab.jsx         # Duyệt đánh giá + Q&A
│       │   ├── 📄 AITab.jsx              # AI automation dashboard
│       │   └── 📄 StoreSettingsTab.jsx   # Cấu hình storefront
│       │
│       │   └── 📂 ui/               # Primitive UI components
│       │       ├── 📄 Button.jsx
│       │       ├── 📄 Button.tsx
│       │       ├── 📄 Input.jsx
│       │       └── 📄 ProductBadge.jsx
│       │
│       ├── 📂 stores/               # Zustand state management
│       │   ├── 📄 useUserStore.js        # Auth, profile, OTP flow
│       │   ├── 📄 useProductStore.js     # Sản phẩm, filter, search, brands
│       │   ├── 📄 useCartStore.js        # Giỏ hàng, coupon, totals
│       │   ├── 📄 useOrderStore.js       # Đơn hàng người dùng
│       │   ├── 📄 useWishlistStore.js    # Wishlist + sync localStorage
│       │   ├── 📄 useCompareStore.js     # So sánh sản phẩm
│       │   ├── 📄 useCampaignStore.js    # Chiến dịch giảm giá
│       │   ├── 📄 useCouponStore.js      # Mã giảm giá admin
│       │   ├── 📄 useInventoryStore.js   # Tồn kho admin
│       │   ├── 📄 useStorefrontStore.js  # Cấu hình storefront
│       │   ├── 📄 useThemeStore.js       # Dark/light mode (persist)
│       │   └── 📄 useSettingsStore.js    # Lang & currency
│       │
│       ├── 📂 lib/
│       │   ├── 📄 axios.js          # Axios instance + refresh-token interceptor
│       │   ├── 📄 cn.js             # classNames utility
│       │   └── 📄 utils.ts
│       │
│       ├── 📂 contexts/
│       │   └── 📄 I18nContext.jsx   # i18n provider (vi/en)
│       │
│       └── 📂 i18n/
│           ├── 📄 vi.json           # Tiếng Việt
│           ├── 📄 en.json           # English
│           ├── 📄 index.js
│           └── 📄 format.js         # Format tiền tệ, ngày
│
│   ├── 📂 tests/                    # Playwright E2E
│   │   ├── 📂 .auth/
│   │   │   └── 📄 admin.json        # Saved auth state
│   │   └── 📂 e2e/
│   │       ├── 📂 helpers/
│   │       │   └── 📄 backend.ts    # API helpers cho test
│   │       ├── 📄 admin-api.spec.ts
│   │       ├── 📄 admin-exhaustive.spec.ts
│   │       ├── 📄 admin-ui.spec.ts
│   │       └── 📄 auth-order.spec.ts
│   │
│   ├── 📂 playwright-report/        # HTML test report (generated)
│   └── 📂 test-results/             # Test artifacts (generated)
│
├── 📂 scripts/                      # Root-level utility scripts
│   ├── 📄 mock-e2e-server.js        # Mock server cho Playwright
│   ├── 📄 migrate-category.js       # Migration danh mục
│   └── 📄 migrate-tracking-tokens.js
│
├── 📂 db/                           # Dữ liệu mẫu (text dump)
│   ├── 📄 users.txt
│   ├── 📄 products.txt
│   ├── 📄 orders.txt
│   ├── 📄 carts.txt
│   ├── 📄 chat_sessions.txt
│   └── 📄 sale.txt
│
├── 📂 UI-Design/                    # Thiết kế giao diện tham khảo
│   ├── 📂 Admin/
│   │   ├── 🖼️ 1. Dashboard.png
│   │   ├── 🖼️ 2. Marketing.png
│   │   ├── 🖼️ 3. Quản lý đơn hàng.png
│   │   ├── 🖼️ 4. Quản lý Email.png
│   │   ├── 🖼️ 5. Quản lý sản phẩm và kho.png
│   │   └── 🖼️ 6. Quản lý người dùng và bảo mật.png
│   └── 📂 User/
│       ├── 🖼️ 1. Dashboard người dùng.png
│       ├── 🖼️ 2. Giỏ Hàng & Wishlist.png
│       ├── 🖼️ 3. Trang cá nhân & Lịch sử Đơn Hàng.png
│       ├── 🖼️ 4. Trang Chi Tiết Sản Phẩm.png
│       ├── 🖼️ 5. Trang Danh Mục & Tìm Kiếm.png
│       ├── 🖼️ 6. Trang Thanh Toán.png
│       └── 🖼️ 7. Theo Dõi Đơn Hàng.png
│
└── 📂 uploads/                      # Upload local (banner, v.v.)
    └── 🖼️ banner-luxury.jpg
```

---

## 📊 Thống kê nhanh

| Thành phần | Số lượng |
|------------|----------|
| Backend controllers | 19 files |
| Backend routes | 20 files |
| Backend models (Mongoose) | 21 schemas |
| Backend middleware | 5 files |
| Backend services | 4 files |
| Backend lib (tích hợp) | 9 files |
| Frontend pages | 28 màn hình |
| Frontend components | 37 + 4 UI |
| Frontend Zustand stores | 12 stores |
| E2E test specs | 4 files |

---

## 🗺️ Sơ đồ luồng dữ liệu

```
React SPA (Vite :5173)
    └─► Axios /api (proxy → :5000)
            └─► Express server.js
                    ├─► routes/ → controllers/ → models/ → MongoDB
                    ├─► services/mailWorker.js → BullMQ → Redis → Nodemailer
                    ├─► lib/redis.js → OTP, refresh token, cache
                    ├─► lib/cloudinary.js → ảnh sản phẩm/banner
                    └─► services/payment.service.js → VNPay / MoMo / ZaloPay / Stripe
```

---

## 🔑 Biến môi trường quan trọng (`backend/.env`)

| Nhóm | Biến |
|------|------|
| **Database** | `MONGO_URI` |
| **Auth** | `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` |
| **Redis** | `UPSTASH_REDIS_URL` hoặc `REDIS_URL` |
| **Email** | `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL` |
| **Cloudinary** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **VNPay** | `VNP_TMN_CODE`, `VNP_SECRET`, `VNPAY_HASH_SECRET` |
| **MoMo** | `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` |
| **ZaloPay** | `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2` |
| **OAuth** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **App** | `PORT`, `NODE_ENV`, `CLIENT_URL`, `ENABLE_CRON` |
