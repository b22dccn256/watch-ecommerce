# Fix Refresh Token Interceptor

## Những file đã sửa
- `frontend/src/lib/axios.js`: Refactor hoàn toàn file này, bổ sung Response Interceptor với pattern Hàng Đợi (Queue) cùng whitelist endpoint, loại bỏ triệt để khả năng race condition khi call nhiều API một lúc lúc session hết hạn.  
- `frontend/src/stores/useUserStore.js`: Xoá bỏ TODO, tháo gỡ đoạn mã interceptor rác ở cuối file giúp ngăn ngừa Circular Dependency. 

## Endpoint Refresh Token
- POST `/api/auth/refresh-token` 

## Các Token Được Lưu Thế Nào
- **Access Token:** Lưu trực tiếp tại trình duyệt thông qua **HTTP-Only Cookies** với tuỳ chọn báo mật (`maxAge: 15m`, `sameSite: strict`). 
- **Refresh Token:** Lưu cấu trúc sinh trắc JWT ở **HTTP-Only Cookies** (`maxAge: 7 ngày`), kèm theo Server lưu key whitelist tại **Redis Cache**. Điều này có nghĩa frontend không bao giờ thấy token string, mã nằm chìm trong request có flag `withCredentials: true`.

## Cách Test Thủ Công
1. Mở Chrome DevTools → sang tab **Application**.
2. Tìm Cookies cho domain `localhost` (hoặc domain đang chạy).
3. Xoá thủ công dòng cookie có chữ `accessToken`. (Lúc này giả định token hiện tại đã hết hạn / biến mất).
4. Thực hiện một hành động Admin (ví dụ: Tạo chiến dịch, Approve QA).
5. Mở tab **Network**, sẽ thấy 2 lệnh xảy ra tích tắc: 
   - Lệnh 1 bị trả lỗi `401 Unauthorized`
   - Payload tự động switch gọi POST `/api/auth/refresh-token` thành công (Status 200).
   - Lệnh 1 tự động retry `200 OK`. 
   Và browser bạn hoàn toàn mượt mà như chưa có lỗi xảy ra! Mọi requests fail cùng lúc đều được hold lại vào queue để gọi lại cho tới khi retry token thành công.
