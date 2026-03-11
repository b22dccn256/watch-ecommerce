// routes/order.route.js
import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
    getAllOrders,
    updateOrderStatus,
    getOrderById,
    getMyOrders,
    createCODOrder,
    createQROrder,
    confirmQRPayment
} from "../controllers/order.controller.js"; // Import controller

const router = express.Router();

// Route cho admin: Lấy tất cả đơn hàng (thống kê doanh thu, lọc theo status)
router.get("/", protectRoute, adminRoute, getAllOrders);

// Route cho admin: Cập nhật status đơn hàng (ví dụ: từ paid → shipped)
router.patch("/:id/status", protectRoute, adminRoute, updateOrderStatus);

// Route cho user: Xem đơn hàng của mình (phải đặt TRƯỚC /:id)
router.get("/my-orders", protectRoute, getMyOrders);

// Route cho user/admin: Xem chi tiết 1 đơn hàng (kiểm tra thanh toán)
router.get("/:id", protectRoute, getOrderById);

// COD route
router.post("/cod", protectRoute, createCODOrder);

// QR Route
router.post("/qr", protectRoute, createQROrder);

// User tự xác nhận đã chuyển khoản QR
router.post("/:id/confirm-qr-payment", protectRoute, confirmQRPayment);

export default router;