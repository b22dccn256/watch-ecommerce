# Fix Coupon Usage (usedToday)

## Files Đã Sửa

1. `backend/models/coupon.model.js`
   - Bổ sung trường `usageHistory` để lưu chính xác Timestamp khi coupon được sử dụng.
   - Bổ sung thêm các trường quan trọng (bị thiếu trước đó ở Model) thiết yếu cho Frontend và Global Coupon: `type`, `discountValue`, `minOrderAmount`, `usedCount`, `maxUses`.

2. `backend/controllers/order.controller.js`
   - Chỉnh sửa luồng Order khi có coupon code:
     Thay vì tuỳ ý tắt (logic cũ `isActive = false`), update sử dụng `$push` đối tượng lịch sử vào `usageHistory` và tăng `usedCount`. Mã chỉ bị chuyển sang trạng thái Disable nếu ngưỡng `usedCount` đạt đỉnh `maxUses`.

3. `backend/controllers/coupon.controller.js`
   - Tạo phương thức `getAllCoupons` mới: fetch toàn bộ Coupon, lặp map qua các dòng thời gian `usedAt` theo ngày hôm nay thông qua `.getHours(0,0,0,0)` để xuất dữ liệu thuộc tính `usedToday`.

4. `backend/routes/coupon.route.js`
   - Bổ sung URL `GET /` routing `protectRoute` & `adminRoute` cho phép fetch `getAllCoupons` trên trang Admin Dashboard của Frontend.

5. `frontend/src/components/CouponsTab.jsx`
   - Bóc gỡ logic fake / giả lập: Xoá bỏ vòng lặp `Math.random()`.
   - Kết nối trực tiếp số liệu real-time từ API: `todayUses += (c.usedToday || 0)`.
   - Render `0` nếu không có lượt dùng. 

## Cách Test Thủ Công

1. Mở Admin Dashboard > Tab **Mã Giảm Giá** (CouponsTab). Check chỉ số thẻ "LƯỢT DÙNG HÔM NAY". Ghi nhớ số lượng (VD: Đang là 0).
2. Mở trình duyệt giả lập ẩn danh, đăng nhập vào cửa hàng và tạo 1 Order mới có nhập Coupon Code thoả mãn điều kiện áp dụng.  
3. Hoàn tất các bước nhấn Checkout (hoặc thanh toán COD/QR code). 
4. Về lại tab CouponsTab trên Admin Board. Số "LƯỢT DÙNG HÔM NAY" của Coupon Card sẽ tăng lên chuẩn xác cộng 1, không còn nhảy số loạn xạ (do random cũ dính re-render). Dữ liệu này sẽ làm mới về 0 hoàn toàn tự động khi bước sang ngày mới nhờ logic query Timestamp trong db.
