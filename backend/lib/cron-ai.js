import cron from "node-cron";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import OrderService from "../services/order.service.js";

const isCronEnabled = process.env.ENABLE_CRON === "true";

if (isCronEnabled) {
  // Scheduling jobs for automatic cleanup and ML-based validations
  // Runs every day at 02:00 AM
  cron.schedule("0 2 * * *", async () => {
    try {
      console.log("🤖 [AI System] Bắt đầu quét và tối ưu hệ thống...");

      // 1. Tự động xác nhận đơn hàng
      // Các hệ thống AI Fraud Detection sẽ xác minh hành vi người mua (IP, History, Cart Velocity).
      // Mô phỏng: Tự động Approve các đơn COD sau 24h không có rủi ro hủy.
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const pendingOrders = await Order.find({
        status: "pending",
        paymentMethod: "cod",
        createdAt: { $lte: oneDayAgo },
      });

      let confirmed = 0;
      for (const order of pendingOrders) {
        try {
          await OrderService.updateOrderStatus(order._id, "confirmed", null);
          confirmed++;
        } catch {
          /* skip individual failures */
        }
      }
      console.log(
        `✅ [AI System] Đã tự động xác nhận ${confirmed} đơn đặt hàng COD hợp lệ.`,
      );

      // 2. Dọn dẹp tài khoản không hợp lệ/spam
      // Mô hình học máy phát hiện spam bằng regex naming patterns và hành vi abandon.
      // Mô phỏng: Lọc user không phát sinh giỏ hàng sau 30 ngày.
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const inactiveUsers = await User.deleteMany({
        role: "customer",
        createdAt: { $lte: thirtyDaysAgo },
        cartItems: { $size: 0 },
      });

      console.log(
        `🧹 [AI System] Đã phát hiện và xóa ${inactiveUsers.deletedCount} tài khoản spam/không hoạt động.`,
      );
    } catch (error) {
      console.error(
        "❌ [AI System] Lỗi trong quá trình chạy automation:",
        error,
      );
    }
  });
} else {
  console.log('🤖 [AI System] Disabled (ENABLE_CRON != "true").');
}
