// controllers/order.controller.js
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import OrderService from "../services/order.service.js";
import mongoose from "mongoose";
import crypto from "crypto";

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

        const oldStatus = order.status;
        order.status = status;
        
        // Ghi lại lịch sử tracking
        order.trackingEvents.push({
            status,
            message: `Trạng thái đơn hàng đã được cập nhật thành: ${status}`,
            timestamp: new Date()
        });

        // If changing to cancelled, restore stock
        if (status === "cancelled" && oldStatus !== "cancelled") {
            await OrderService.restoreStock(order.products);
        }
        
        await order.save();

        res.json({ message: `Order status updated to ${status}`, order });
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
        const trackingToken = crypto.randomUUID();

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
            paymentMethod: "cod",
            paymentStatus: "pending",
            status: "pending",
            trackingEvents: [{
                status: "pending",
                message: "Đơn hàng đã được khởi tạo.",
                timestamp: new Date()
            }]
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
        const trackingToken = crypto.randomUUID();

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
            paymentMethod: "qr",
            paymentStatus: "pending",
            status: "pending",
            trackingEvents: [{
                status: "pending",
                message: "Đơn hàng đã được khởi tạo (Thanh toán QR).",
                timestamp: new Date()
            }]
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

// Tra cứu công khai qua trackingToken
export const getOrderTracking = async (req, res) => {
    try {
        const { trackingToken } = req.params;
        const order = await Order.findOne({ trackingToken })
            .select("orderCode status estimatedDelivery carrier carrierTrackingNumber trackingEvents shippingDetails products createdAt")
            .populate("products.product", "name image price");

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy thông tin đơn hàng" });
        }

        // Ẩn thông tin nhạy cảm của khách hàng trong shippingDetails
        const safeOrder = order.toObject();
        if (safeOrder.shippingDetails) {
            if (safeOrder.shippingDetails.email) {
                const parts = safeOrder.shippingDetails.email.split("@");
                safeOrder.shippingDetails.email = `${parts[0].substring(0, 2)}***@${parts[1]}`;
            }
            if (safeOrder.shippingDetails.phoneNumber) {
                safeOrder.shippingDetails.phoneNumber = `${safeOrder.shippingDetails.phoneNumber.substring(0, 3)}****${safeOrder.shippingDetails.phoneNumber.slice(-3)}`;
            }
        }

        res.json(safeOrder);
    } catch (error) {
        console.error("Error in getOrderTracking:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Tra c?u m� don h�ng d? l?y trackingToken
export const lookupOrder = async (req, res) => {
	try {
		const { orderNumber, email } = req.body;

		if (!orderNumber || !email) {
			return res.status(400).json({ message: "Vui l�ng nh?p m� don h�ng v� email." });
		}

		// T�m don h�ng kh?p m� v� email (t? shippingDetails ho?c user)
		const order = await Order.findOne({ 
			orderCode: orderNumber.toUpperCase() 
		}).populate("user", "email");

		if (!order) {
			return res.status(404).json({ message: "Kh�ng t�m th?y don h�ng kh?p v?i m� cung c?p." });
		}

		const isEmailMatch = 
			(order.shippingDetails?.email === email) || 
			(order.user?.email === email);

		if (!isEmailMatch) {
			return res.status(404).json({ message: "Th�ng tin email ho?c m� don h�ng chua ch�nh x�c." });
		}

		res.json({ trackingToken: order.trackingToken });
	} catch (error) {
		console.error("Error in lookupOrder:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
