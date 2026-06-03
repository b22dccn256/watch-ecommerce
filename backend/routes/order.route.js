// routes/order.route.js
import express from "express";
import {
  protectRoute,
  managementRoute,
  optionalRoute,
} from "../middleware/auth.middleware.js";
import {
  getAllOrders,
  exportOrders,
  updateOrderStatus,
  updateOrderDetails,
  getOrderById,
  getMyOrders,
  cancelOrder,
  createCODOrder,
  getOrderTracking,
  lookupOrder,
} from "../controllers/order.controller.js"; // Import controller
import { requestReturnOrder } from "../controllers/order.controller.js";
import {
  validateBody,
  orderSchemas,
} from "../middleware/validation.middleware.js";

const router = express.Router();

// Route công khai: Tra cứu đơn hàng
router.get("/track/:trackingToken", getOrderTracking);
router.post("/lookup", lookupOrder);

// Route cho admin: Lấy tất cả đơn hàng (thống kê doanh thu, lọc theo status)
router.get("/", protectRoute, managementRoute, getAllOrders);

// Admin export orders (CSV)
router.get("/export", protectRoute, managementRoute, exportOrders);

// Route cho admin: Cập nhật status đơn hàng (ví dụ: từ paid → shipped)
router.patch("/:id/status", protectRoute, managementRoute, updateOrderStatus);

// Route cho admin: Cập nhật chi tiết đơn hàng (ghi chú, carrier, refund, etc.)
router.patch("/:id/details", protectRoute, managementRoute, updateOrderDetails);

// Route cho user: Xem đơn hàng của mình (phải đặt TRƯỚC /:id)
router.get("/my-orders", protectRoute, getMyOrders);

// User yêu cầu trả hàng (sau khi đã giao)
router.patch("/:id/request-return", protectRoute, requestReturnOrder);

// User hủy đơn hàng khi còn hợp lệ
router.patch("/:id/cancel", protectRoute, cancelOrder);

// Route cho user/admin: Xem chi tiết 1 đơn hàng (kiểm tra thanh toán)
router.get("/:id", protectRoute, getOrderById);

// COD route with validation
router.post(
  "/cod",
  optionalRoute,
  validateBody(orderSchemas.nonStripeOrder),
  createCODOrder,
);

export default router;
