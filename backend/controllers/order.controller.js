// controllers/order.controller.js
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import OrderService from "../services/order.service.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { emailQueue } from "./mail.controller.js";

export const getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (startDate) filter.createdAt = { $gte: new Date(startDate) };
        if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };

        const orders = await Order.find(filter)
            .populate("user", "name email")
            .populate("products.product", "name price");

        res.json(orders);
    } catch (error) {
        console.error("Error in getAllOrders:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: "Order not found" });

        const oldStatus = order.status;
        order.status = status;

        order.trackingEvents.push({
            status,
            message: "Trạng thái đơn hàng đã được cập nhật thành: " + status,
            timestamp: new Date()
        });

        if (status === "cancelled" && oldStatus !== "cancelled") {
            await OrderService.restoreStock(order.products);
        }

        await order.save();

        res.json({ message: "Order status updated to " + status, order });
    } catch (error) {
        console.error("Error in updateOrderStatus:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "name email")
            .populate("products.product", "name price image");

        if (!order) return res.status(404).json({ message: "Order not found" });

        const isOwner = order.user && req.user && order.user._id.toString() === req.user._id.toString();
        if (req.user.role !== "admin" && !isOwner) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json(order);
    } catch (error) {
        console.error("Error in getOrderById:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate("user", "name email")
            .populate("products.product", "name price image");
        res.json(orders);
    } catch (error) {
        console.error("Error in getMyOrders:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// ── Hàm lõi chung cho COD và QR (tránh duplicate ~80 dòng code) ──────────────
const createNonStripeOrder = async (req, res, paymentMethod) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { products, couponCode, shippingDetails } = req.body;

        // ── Validation body ────────────────────────────────────────────────────
        if (!products || !Array.isArray(products) || products.length === 0) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ message: "Danh sách sản phẩm không được rỗng" });
        }
        for (const p of products) {
            if (!Number.isInteger(p.quantity) || p.quantity < 1) {
                await session.abortTransaction(); session.endSession();
                return res.status(400).json({ message: `Số lượng sản phẩm không hợp lệ: ${p.quantity}` });
            }
        }
        if (!shippingDetails?.fullName?.trim() || !shippingDetails?.address?.trim() ||
            !shippingDetails?.city?.trim() || !shippingDetails?.phoneNumber?.trim()) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ message: "Thiếu thông tin giao hàng bắt buộc." });
        }

        // ── Core logic ────────────────────────────────────────────────────────
        await OrderService.deductStock(products, session);

        const coupon = couponCode
            ? await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true }).session(session)
            : null;
        const totalAmount = await OrderService.calculateTotalAmount(products, coupon, session);
        const orderCode = OrderService.generateOrderCode();
        const trackingToken = crypto.randomUUID();

        const label = paymentMethod === "cod" ? "Thanh toán COD" : "Thanh toán QR";

        const newOrder = new Order({
            user: req.user._id,
            products: products.map(p => ({
                product: p._id || p.id,
                quantity: p.quantity,
                price: p.price
            })),
            totalAmount,
            orderCode,
            trackingToken,
            shippingDetails,
            paymentMethod,
            paymentStatus: "pending",
            status: "pending",
            trackingEvents: [{
                status: "pending",
                message: `Đơn hàng đã được khởi tạo (${label}).`,
                timestamp: new Date()
            }]
        });

        await newOrder.save({ session });

        if (coupon) {
            coupon.isActive = false;
            await coupon.save({ session });
        }

        req.user.cartItems = [];
        await req.user.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Queue email xác nhận (ngoài transaction — không critical nếu fail)
        await emailQueue.add("order-confirmation", {
            email: req.user.email,
            subject: `Xác nhận đơn hàng #${orderCode} - Luxury Watch`,
            order: { orderCode, totalAmount, shippingDetails, paymentMethod }
        });

        const message = paymentMethod === "cod"
            ? "Đơn hàng COD đã tạo thành công! Bạn sẽ thanh toán khi nhận hàng."
            : "Đơn hàng QR đã tạo thành công. Vui lòng chuyển khoản để xác nhận.";

        return res.status(201).json({
            success: true,
            message,
            orderId: newOrder._id,
            orderCode,
            ...(paymentMethod === "qr" && { totalAmount })
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(`Error in create${paymentMethod.toUpperCase()}Order:`, error.message);
        return res.status(400).json({ message: error.message });
    }
};

// ── Exported route handlers (thin wrappers) ───────────────────────────────────
export const createCODOrder = (req, res) => createNonStripeOrder(req, res, "cod");
export const createQROrder  = (req, res) => createNonStripeOrder(req, res, "qr");


export const confirmQRPayment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
        }

        if (order.paymentMethod !== "qr") {
            return res.status(400).json({ message: "Chỉ áp dụng cho đơn hàng thanh toán QR" });
        }

        if (order.paymentStatus === "paid") {
            return res.status(400).json({ message: "Đơn hàng này đã được thanh toán trước đó" });
        }

        if (order.status === "awaiting_verification") {
            return res.status(400).json({ message: "Đơn hàng đã được gửi xác nhận, vui lòng đợi admin kiểm tra" });
        }

        // Chỉ chuyển sang chờ xác minh — admin sẽ xác nhận thủ công
        order.status = "awaiting_verification";
        order.trackingEvents.push({
            status: "awaiting_verification",
            message: "Khách hàng xác nhận đã chuyển khoản. Đang chờ nhân viên kiểm tra.",
            timestamp: new Date()
        });
        await order.save();

        res.json({
            success: true,
            message: "Xác nhận thành công! Đơn hàng đang chờ kiểm tra thanh toán từ phía chúng tôi.",
            orderId: order._id,
        });
    } catch (error) {
        console.error("Error in confirmQRPayment:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getOrderTracking = async (req, res) => {
    try {
        const { trackingToken } = req.params;
        const order = await Order.findOne({ trackingToken })
            .select("orderCode status estimatedDelivery carrier carrierTrackingNumber trackingEvents shippingDetails products createdAt")
            .populate("products.product", "name image price");

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy thông tin đơn hàng" });
        }

        const safeOrder = order.toObject();
        if (safeOrder.shippingDetails) {
            if (safeOrder.shippingDetails.email) {
                const parts = safeOrder.shippingDetails.email.split("@");
                safeOrder.shippingDetails.email = parts[0].substring(0, 2) + "***@" + parts[1];
            }
            if (safeOrder.shippingDetails.phoneNumber) {
                safeOrder.shippingDetails.phoneNumber = safeOrder.shippingDetails.phoneNumber.substring(0, 3) + "****" + safeOrder.shippingDetails.phoneNumber.slice(-3);
            }
        }

        res.json(safeOrder);
    } catch (error) {
        console.error("Error in getOrderTracking:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const lookupOrder = async (req, res) => {
    try {
        const { orderNumber, email } = req.body;

        if (!orderNumber || !email) {
            return res.status(400).json({ message: "Vui lòng nhập mã đơn hàng và email." });
        }

        const order = await Order.findOne({
            orderCode: orderNumber.toUpperCase()
        }).populate("user", "email");

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng khớp với mã cung cấp." });
        }

        const isEmailMatch =
            (order.shippingDetails?.email === email) ||
            (order.user?.email === email);

        if (!isEmailMatch) {
            return res.status(404).json({ message: "Thông tin email hoặc mã đơn hàng chưa chính xác." });
        }

        res.json({ trackingToken: order.trackingToken });
    } catch (error) {
        console.error("Error in lookupOrder:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
