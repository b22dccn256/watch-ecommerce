// routes/order.route.js
import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
    getAllOrders,
    updateOrderStatus,
    getOrderById,
    getMyOrders,
    createCODOrder
} from "../controllers/order.controller.js"; // Import controller

const router = express.Router();

// Route cho admin: Lấy tất cả đơn hàng (thống kê doanh thu, lọc theo status)
router.get("/", protectRoute, adminRoute, getAllOrders);

// Route cho admin: Cập nhật status đơn hàng (ví dụ: từ paid → shipped)
router.patch("/:id/status", protectRoute, adminRoute, updateOrderStatus);

// Route cho user/admin: Xem chi tiết 1 đơn hàng (kiểm tra thanh toán)
router.get("/:id", protectRoute, getOrderById); // Thêm để user xem đơn của mình

// Route cho user: Xem đơn hàng của mình
router.get("/my-orders", protectRoute, getMyOrders);

// COD route
router.post("/cod", protectRoute, createCODOrder);

export default router;