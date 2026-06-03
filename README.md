# Nền tảng Thương mại Điện tử Bán Đồng Hồ 🛒

Một nền tảng thương mại điện tử hiện đại được xây dựng với MERN stack (MongoDB, Express, React, Node.js), tích hợp backend mạnh mẽ với Redis caching, hàng đợi BullMQ, xác thực bảo mật (JWT & OAuth) và các cổng thanh toán hiện đại (Stripe, VNPay).

## 📂 Cấu trúc Dự án

- **`backend/`**: Node.js & Express API server. Xử lý logic nghiệp vụ, giao tiếp cơ sở dữ liệu, các tác vụ chạy ngầm và tích hợp với bên thứ ba.
- **`frontend/`**: Ứng dụng React được xây dựng với Vite và Tailwind CSS.
- **`scripts/`**: Các đoạn mã tiện ích dùng để tạo dữ liệu mẫu, di chuyển dữ liệu (migrations) và hỗ trợ môi trường phát triển.
- **`UI-Design/`**: Các tệp thiết kế UI/UX và mockup.
- **`uploads/`**: Thư mục lưu trữ file người dùng tải lên (nếu không sử dụng Cloudinary).

## 🚀 Hướng dẫn Cài đặt (Môi trường Local)

Có 2 cách chính để chạy dự án này trên máy của bạn: **Dùng Docker** hoặc **Cài đặt Thủ công (Khuyên dùng khi code)**.

### Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt các phần mềm sau:

- [Node.js](https://nodejs.org/) (phiên bản v18 trở lên)
- [Git](https://git-scm.com/)
- _Tùy chọn nhưng khuyên dùng:_ [Docker Desktop](https://www.docker.com/products/docker-desktop) (để setup database nhanh chóng)
- _Nếu không dùng Docker:_ Bạn cần cài đặt MongoDB và Redis và khởi chạy sẵn trên máy.

---

### Cách 1: Cài đặt Thủ công (Dành cho việc lập trình)

Sử dụng cách này nếu bạn muốn chủ động chỉnh sửa code và xem cập nhật theo thời gian thực (Hot Reloading).

#### 1. Khởi chạy Databases

Hãy đảm bảo **MongoDB** (chạy ở cổng `localhost:27017`) và **Redis** (chạy ở cổng `localhost:6379`) đang hoạt động trên máy bạn. _(Mẹo: Bạn có thể dùng Docker chỉ để chạy Mongo và Redis cho tiện)._

#### 2. Cài đặt các gói thư viện (Dependencies)

Chạy lệnh sau từ thư mục gốc của dự án để cài đặt tất cả thư viện cho cả frontend và backend cùng lúc:

```bash
npm run install:all
```

#### 3. Cấu hình Biến môi trường

Vào thư mục `backend/` và tạo bản sao của file `.env.example`, đổi tên thành `.env`:

```bash
cp backend/.env.example backend/.env
# Trên Windows, bạn có thể copy và paste file thủ công rồi đổi tên thành .env
```

Điền các thông tin cần thiết vào file `backend/.env`:

- `MONGO_URI`: Đường dẫn kết nối MongoDB của bạn (VD: `mongodb://localhost:27017/watchstore_db`).
- `UPSTASH_REDIS_URL` hoặc `REDIS_URL`: Đường dẫn kết nối Redis của bạn (VD: `redis://localhost:6379`).
- `ACCESS_TOKEN_SECRET` & `REFRESH_TOKEN_SECRET`: Chuỗi ký tự bảo mật ngẫu nhiên.
- Các API Keys cho **Cloudinary** (Upload ảnh), **Stripe/VNPay** (Thanh toán), và **SMTP/Email** (Cấu hình gửi mail).

#### 4. Khởi chạy Server Development

Từ thư mục gốc, khởi động cả React frontend và Node backend cùng lúc:

```bash
npm run dev
```

- Frontend sẽ chạy tại: `http://localhost:5173`
- Backend sẽ chạy tại: `http://localhost:5000`

---

### Cách 2: Chạy bằng Docker (Cách nhanh nhất để Demo)

Cách này sẽ tự động khởi tạo toàn bộ hệ thống (MongoDB, Redis, Backend, và Frontend) bên trong các container Docker độc lập.

1. **Cấu hình Biến môi trường:**

   - Copy file `.env.example` trong thư mục backend thành `.env` và điền các API keys như Cloudinary và Stripe.
   - _Lưu ý: Docker sẽ tự động chèn các đường dẫn kết nối Database và Redis đúng chuẩn cho bạn._

2. **Khởi chạy các containers:**
   Từ thư mục gốc, chạy lệnh:

   ```bash
   npm run docker:up
   # Hoặc: docker-compose up --build -d
   ```

3. **Truy cập ứng dụng:**

   - Frontend: `http://localhost:80`
   - Backend API: `http://localhost:5000`

4. **Dừng các containers:**

   ```bash
   npm run docker:down
   ```

---

## 🛠️ Các Lệnh Tiện ích (Chạy từ thư mục gốc)

- `npm run dev`: Chạy cả client và server ở chế độ phát triển.
- `npm run install:all`: Cài đặt `node_modules` cho toàn bộ dự án (root, frontend, backend).
- `npm run seed:admin`: Tạo tài khoản admin mặc định.
- `npm run seed:real`: Thêm dữ liệu sản phẩm mẫu vào database.
- `npm run docker:logs`: Xem log của các Docker containers đang chạy.

## 🔑 Công nghệ Sử dụng

- **Frontend:** React.js, Vite, Tailwind CSS.
- **Backend:** Node.js, Express.js, MongoDB (Mongoose).
- **Caching & Hàng đợi:** Redis, BullMQ.
- **Bảo mật:** Passport.js (OAuth), JWT, Bcrypt, Helmet, Rate Limit.
- **Thanh toán:** Stripe, VNPay.
- **DevOps:** Docker, Docker Compose.

## 📄 Giấy phép

Dự án này được cấp phép theo MIT License.
