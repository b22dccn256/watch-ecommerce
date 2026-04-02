// routes/order.route.js
import express from "express";
import { protectRoute, adminRoute, optionalRoute } from "../middleware/auth.middleware.js";
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
    lookupOrder,
    getPublicOrderById
} from "../controllers/order.controller.js"; // Import controller
import { requestReturnOrder } from "../controllers/order.controller.js";

const router = express.Router();

// Route công khai: Tra cứu đơn hàng
router.get("/track/:trackingToken", getOrderTracking);
router.post("/lookup", lookupOrder);
router.get("/public/:id", getPublicOrderById);

// Route cho admin: Lấy tất cả đơn hàng (thống kê doanh thu, lọc theo status)
router.get("/", protectRoute, adminRoute, getAllOrders);

// Route cho admin: Cập nhật status đơn hàng (ví dụ: từ paid → shipped)
router.patch("/:id/status", protectRoute, adminRoute, updateOrderStatus);

// Route cho admin: Cập nhật chi tiết đơn hàng (ghi chú, carrier, refund, etc.)
router.patch("/:id/details", protectRoute, adminRoute, updateOrderDetails);

// Route cho user: Xem đơn hàng của mình (phải đặt TRƯỚC /:id)
router.get("/my-orders", (req, res, next) => {
    if (!req.cookies.accessToken && !req.cookies.refreshToken) {
        return res.json([]);
    }
    protectRoute(req, res, next);
}, getMyOrders);


// User yêu cầu trả hàng (sau khi đã giao)
router.patch("/:id/request-return", protectRoute, requestReturnOrder);

// Route cho user/admin: Xem chi tiết 1 đơn hàng (kiểm tra thanh toán)
router.get("/:id", protectRoute, getOrderById);

// COD route
router.post("/cod", optionalRoute, createCODOrder);

// QR Route
router.post("/qr", optionalRoute, createQROrder);

// User tự xác nhận đã chuyển khoản QR
router.post("/:id/confirm-qr-payment", protectRoute, confirmQRPayment);

export default router;