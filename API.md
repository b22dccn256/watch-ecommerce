# API Documentation Manual

All requests to mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) require the `x-csrf-token` header. Standard responses follow the `application/json` content type.

---

## 🔐 Security & Initialization

### 1. Retrieve CSRF Token
Fetches a unique double-submit cookie token value required to authorize subsequent state modifications.

- **Method**: `GET`
- **Path**: `/api/csrf-token`
- **Response Payload (`200 OK`)**:
```json
{
  "token": "a1b2c3d4e5f6g7h8..."
}
```

- **Health check**:
  - `GET /api/health` - Check if server is running. Returns: `{"status": "ok", "timestamp": "..."}`

---

## 👤 User Authentication (`/api/auth`)

### 2. Sign Up (Create Account)
- **Method**: `POST`
- **Path**: `/api/auth/signup`
- **Validation Rules**: `name` (required), `email` (required, valid email), `password` (required, minimum 8 characters, containing uppercase, lowercase, numeric, and special character).
- **Request Example**:
```json
{
  "name": "David Beckham",
  "email": "david.beckham@gmail.com",
  "password": "LuxuryWatch2026!"
}
```
- **Response Payload (`201 Created`)**:
```json
{
  "_id": "603d2e99d8b76c001f3e1a01",
  "name": "David Beckham",
  "email": "david.beckham@gmail.com",
  "role": "customer",
  "message": "User registered successfully! Verification email sent."
}
```

### 3. Log In
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Response Payload (`200 OK` - standard customer)**:
Sets secure `accessToken` and `refreshToken` in HttpOnly cookies.
```json
{
  "_id": "603d2e99d8b76c001f3e1a01",
  "name": "David Beckham",
  "email": "david.beckham@gmail.com",
  "role": "customer"
}
```
- **Response Payload (`200 OK` - admin login initiating OTP)**:
```json
{
  "requiresOTP": true
}
```

### 4. Verify Admin OTP
- **Method**: `POST`
- **Path**: `/api/auth/verify-otp`
- **Request Example**: `{"email": "admin@luxurywatch.vn", "otp": "123456"}`
- **Response Payload (`200 OK`)**: Sets HttpOnly cookies.
```json
{
  "_id": "603d2e99d8b76c001f3e1aaa",
  "name": "Admin",
  "email": "admin@luxurywatch.vn",
  "role": "admin"
}
```

---

## 📦 Product Catalog (`/api/products`)

### 5. Get Filtered Products List
- **Method**: `GET`
- **Path**: `/api/products`
- **Query Parameters**:
  - `page`: default `1`
  - `limit`: default `10`
  - `search`: search query keyword
  - `sort`: `price_asc`, `price_desc`, `sales_desc`, `newest`
  - `brand`, `category`, `type`: exact filters
  - `minPrice`, `maxPrice`: price range bounds
- **Response Payload (`200 OK`)**:
```json
{
  "products": [
    {
      "_id": "603d2e99d8b76c001f3e1a22",
      "name": "Rolex Submariner Gold",
      "brand": { "name": "Rolex" },
      "price": 380000000,
      "originalPrice": 420000000,
      "stock": 5,
      "image": "https://res.cloudinary.com/.../rolex.jpg"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalProducts": 48
  }
}
```

### 6. Create New Product (Admin / Staff)
- **Method**: `POST`
- **Path**: `/api/products`
- **Request payload (Multipart/Form-Data)**:
  - Text fields: `name`, `price`, `description`, `category`, `brand`, `stock`, `type`
  - File: `image` (Cloudinary upload)
- **Response Payload (`201 Created`)**:
```json
{
  "message": "Product created successfully",
  "product": {
    "_id": "603d2e99d8b76c001f3e1a55",
    "name": "Omega Speedmaster Moonwatch",
    "price": 185000000,
    "stock": 3
  }
}
```

---

## 🛒 Shopping Cart (`/api/cart`)

### 7. Get Cart Items
- **Method**: `GET`
- **Path**: `/api/cart`
- **Response Payload (`200 OK`)**:
```json
[
  {
    "product": {
      "_id": "603d2e99d8b76c001f3e1a22",
      "name": "Rolex Submariner Gold",
      "price": 380000000
    },
    "quantity": 1,
    "wristSize": "16cm",
    "selectedColor": "Gold"
  }
]
```

### 8. Add Item to Cart
- **Method**: `POST`
- **Path**: `/api/cart`
- **Request Example**:
```json
{
  "productId": "603d2e99d8b76c001f3e1a22",
  "quantity": 1,
  "wristSize": "16cm",
  "selectedColor": "Gold"
}
```
- **Response Payload (`200 OK`)**: Returns the full updated list of cart items.

---

## 🎫 Coupon & Campaign (`/api/coupons`)

### 9. Validate Coupon Code
- **Method**: `POST`
- **Path**: `/api/coupons/validate`
- **Request Example**: `{"code": "SUMMER10"}`
- **Response Payload (`200 OK`)**:
```json
{
  "code": "SUMMER10",
  "type": "percent",
  "discountValue": 10,
  "message": "Coupon applied successfully"
}
```

---

## 📝 Order Management (`/api/orders`)

### 10. Create Order & Process Payment Checkout
- **Method**: `POST`
- **Path**: `/api/payments/create-checkout-session`
- **Request Example**:
```json
{
  "products": [
    {
      "id": "603d2e99d8b76c001f3e1a22",
      "quantity": 1,
      "price": 380000000,
      "wristSize": "16cm"
    }
  ],
  "couponCode": "SUMMER10",
  "shippingDetails": {
    "fullName": "Johnny Depp",
    "email": "johnny.depp@gmail.com",
    "phoneNumber": "0908888888",
    "address": "123 Paris Square",
    "city": "Hồ Chí Minh"
  },
  "paymentMethod": "vnpay" 
}
```
- **Response Payload (`200 OK` for VNPay/MoMo/ZaloPay/Stripe)**:
```json
{
  "url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=342000000...",
  "totalAmount": 342000000
}
```
- **Response Payload (`201 Created` for COD)**:
```json
{
  "success": true,
  "message": "Đơn hàng COD đã tạo thành công! Bạn sẽ thanh toán khi nhận hàng.",
  "orderId": "603d2e99d8b76c001f3e1c99",
  "orderCode": "DHABC123"
}
```

### 11. Fetch Order Tracking
- **Method**: `GET`
- **Path**: `/api/orders/tracking/:trackingToken`
- **Response Payload (`200 OK`)**: Returns masked email/phone to protect privacy.
```json
{
  "orderCode": "DHABC123",
  "status": "confirmed",
  "paymentMethod": "cod",
  "paymentStatus": "pending",
  "totalAmount": 342000000,
  "shippingDetails": {
    "fullName": "Johnny Depp",
    "email": "jo***@gmail.com",
    "phoneNumber": "090****888"
  },
  "trackingEvents": [
    {
      "status": "pending",
      "message": "Đơn hàng đã được khởi tạo.",
      "timestamp": "2026-05-17T12:00:00.000Z"
    },
    {
      "status": "confirmed",
      "message": "Đơn hàng đã được xác nhận tự động bởi hệ thống.",
      "timestamp": "2026-05-17T12:01:00.000Z"
    }
  ]
}
```

---

## 🤖 AI chatbot & Automation (`/api/ai`)

### 12. Consult ChatBot Assistant
- **Method**: `POST`
- **Path**: `/api/ai/chat`
- **Request Example**: `{"message": "Tìm đồng hồ Rolex dưới 100 triệu"}`
- **Response Payload (`200 OK`)**:
```json
{
  "response": "Luxury Watch hiện có mẫu Rolex Classic cơ tự động giá 95.000.000đ (còn 2 cái). Bạn có muốn đặt lịch hẹn xem hàng không?"
}
```

### 13. Auto-Confirm Pending COD Orders (Admin Automated Task)
- **Method**: `POST`
- **Path**: `/api/ai/confirm-orders`
- **Response Payload (`200 OK`)**:
```json
{
  "success": true,
  "message": "AI đã xử lý 5 đơn. Xác nhận: 4, Hủy: 1.",
  "confirmedCount": 4,
  "cancelledCount": 1
}
```
