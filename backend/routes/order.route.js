// routes/order.route.js
import express from "express";
import { protectRoute, adminRoute, managementRoute } from "../middleware/auth.middleware.js";
import {
    getAllOrders,
    updateOrderStatus,
    updateOrderDetails,
    getOrderById,
    getMyOrders,
    createCODOrder,
    createQROrder,
    confirmQRPayment,
    getOrderTracking,
    lookupOrder
} from "../controllers/order.controller.js"; // Import controller

const router = express.Router();

// Route công khai: Tra cứu đơn hàng
router.get("/track/:trackingToken", getOrderTracking);
router.post("/lookup", lookupOrder);

// Route cho admin/staff: Lấy tất cả đơn hàng
router.get("/", protectRoute, managementRoute, getAllOrders);

// Route cho admin/staff: Cập nhật status đơn hàng
router.patch("/:id/status", protectRoute, managementRoute, updateOrderStatus);

// Route cho admin/staff: Cập nhật chi tiết đơn hàng
router.patch("/:id/details", protectRoute, managementRoute, updateOrderDetails);

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