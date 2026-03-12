// controllers/order.controller.js
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import OrderService from "../services/order.service.js";
import mongoose from "mongoose";

export const getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query; // Lọc theo status (paid/pending), ngày
        const filter = {};
        if (status) filter.status = status;
        if (startDate) filter.createdAt = { $gte: new Date(startDate) };
        if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };

        const orders = await Order.find(filter)
            .populate("user", "name email") // Populate info khách hàng
            .populate("products.product", "name price"); // Populate sản phẩm

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

        order.status = status;
        await order.save();

        res.json({ message: "Order status updated", order });
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

        // Kiểm tra quyền: Chỉ user sở hữu hoặc admin mới xem
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

export const createCODOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { products, couponCode, shippingDetails } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Danh sách sản phẩm không được rỗng và phải là array"
            });
        }

        if (!shippingDetails) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Thiếu thông tin giao hàng." });
        }

        await OrderService.deductStock(products, session);

        const coupon = couponCode ? await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true }).session(session) : null;
        let totalAmount = await OrderService.calculateTotalAmount(products, coupon, session);
        const orderCode = OrderService.generateOrderCode();

        const newOrder = new Order({
            user: req.user._id,
            products: products.map(p => ({
                product: p._id || p.id,
                quantity: p.quantity,
                price: p.price
            })),
            totalAmount,
            orderCode,
            shippingDetails,
            paymentMethod: "cod",
            paymentStatus: "pending",
            status: "pending"
        });

        await newOrder.save({ session });

        if (coupon) {
            coupon.isActive = false;
            await coupon.save({ session });
        }

        // Clear user cart
        req.user.cartItems = [];
        await req.user.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Đơn hàng COD đã tạo thành công! Bạn sẽ thanh toán khi nhận hàng.",
            orderId: newOrder._id,
            orderCode
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error in createCODOrder:", error.message);
        res.status(400).json({ message: error.message });
    }
};

export const createQROrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { products, couponCode, shippingDetails } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Danh sách sản phẩm không được rỗng" });
        }
        if (!shippingDetails) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Thiếu thông tin giao hàng." });
        }

        await OrderService.deductStock(products, session);

        const coupon = couponCode ? await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true }).session(session) : null;
        let totalAmount = await OrderService.calculateTotalAmount(products, coupon, session);
        const orderCode = OrderService.generateOrderCode();

        const newOrder = new Order({
            user: req.user._id,
            products: products.map(p => ({
                product: p._id || p.id,
                quantity: p.quantity,
                price: p.price
            })),
            totalAmount,
            orderCode,
            shippingDetails,
            paymentMethod: "qr",
            paymentStatus: "pending",
            status: "pending"
        });

        await newOrder.save({ session });

        if (coupon) {
            coupon.isActive = false;
            await coupon.save({ session });
        }

        // Clear user cart
        req.user.cartItems = [];
        await req.user.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Đơn hàng QR đã tạo thành công. Vui lòng chuyển khoản để xác nhận.",
            orderId: newOrder._id,
            orderCode,
            totalAmount
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error in createQROrder:", error.message);
        res.status(400).json({ message: error.message });
    }
};

// User tự xác nhận đã chuyển khoản QR
export const confirmQRPayment = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        // Kiểm tra quyền sở hữu — chỉ user tạo đơn mới được xác nhận
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
        }

        // Chỉ áp dụng cho đơn QR
        if (order.paymentMethod !== "qr") {
            return res.status(400).json({ message: "Chỉ áp dụng cho đơn hàng thanh toán QR" });
        }

        // Idempotency: tránh cập nhật nhiều lần
        if (order.paymentStatus === "paid") {
            return res.status(400).json({ message: "Đơn hàng này đã được thanh toán trước đó" });
        }

        // Cập nhật trạng thái thanh toán + ghi nhận thời gian
        order.paymentStatus = "paid";
        order.status = "confirmed";
        order.paidAt = new Date();
        await order.save();

        console.log(`[QR Payment] Order ${order.orderCode} confirmed by user ${req.user._id} at ${order.paidAt}`);

        res.json({
            success: true,
            message: "Xác nhận thanh toán thành công!",
            orderId: order._id,
        });
    } catch (error) {
        console.error("Error in confirmQRPayment:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};