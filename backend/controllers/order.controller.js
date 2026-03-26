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
        const { status, startDate, endDate, search, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const filter = {};
        if (status && status !== "Tất cả") filter.status = status;
        if (startDate) filter.createdAt = { $gte: new Date(startDate) };
        if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };

        if (search) {
            const searchRegex = new RegExp(search, "i");
            filter.$or = [
                { orderCode: searchRegex },
                { "shippingDetails.phoneNumber": searchRegex },
                { "shippingDetails.fullName": searchRegex },
                { "shippingDetails.email": searchRegex }
            ];
            if (mongoose.Types.ObjectId.isValid(search)) {
                filter.$or.push({ user: search });
            }
        }

        const totalOrders = await Order.countDocuments(filter);
        
        // Tính toán stats cho toàn bộ database (theo filter hiện tại hoặc toàn bộ)
        // User muốn "đơn cần xử lý" (pending) và "trả hàng" (returned) của toàn bộ database
        const pendingCount = await Order.countDocuments({ status: "pending" });
        const returnedCount = await Order.countDocuments({ status: "returned" });

        let ordersQuery = Order.find(filter)
            .populate("user", "name email")
            .populate("products.product", "name price")
            .sort({ createdAt: -1 });

        if (limit !== "all") {
            ordersQuery = ordersQuery.skip(skip).limit(parseInt(limit));
        }

        const orders = await ordersQuery;

        res.json({
            orders,
            stats: {
                pendingCount,
                returnedCount,
                totalOrders
            },
            pagination: {
                totalOrders,
                totalPages: limit === "all" ? 1 : Math.ceil(totalOrders / limit),
                currentPage: parseInt(page),
                limit: limit === "all" ? totalOrders : parseInt(limit)
            }
        });
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
            timestamp: new Date(),
            updatedBy: req.user?._id || "system"
        });

        if (status === "cancelled" && oldStatus !== "cancelled") {
            await OrderService.restoreStock(order.products, null, order._id, "Hủy đơn hàng");
        } else if (status === "returned" && oldStatus !== "returned") {
            try {
                await OrderService.restoreStock(order.products, null, order._id, "Trả hàng: " + (order.returnReason || "Không rõ lý do"));
            } catch (restoreError) {
                console.error("Error restoring stock for returned order:", restoreError.message);
                // Ghi log vào order thay vì failed hoàn toàn
                order.internalNotes = (order.internalNotes || "") + "\n[SYSTEM] Lỗi khi hoàn cộng tồn kho: " + restoreError.message;
            }
        }

        await order.save();

        // Queue Email Notification
        await emailQueue.add("order-status-update", {
            email: order.shippingDetails?.email || (await mongoose.model('User').findById(order.user))?.email,
            subject: "Cập nhật trạng thái đơn hàng #" + order.orderCode,
            order: {
                orderCode: order.orderCode,
                status: status,
                trackingToken: order.trackingToken
            }
        });

        res.json({ message: "Order status updated to " + status, order });
    } catch (error) {
        console.error("Error in updateOrderStatus:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateOrderDetails = async (req, res) => {
    try {
        const { internalNotes, returnReason, refundAmount, carrier, carrierTrackingNumber } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: "Order not found" });

        // Update fields if provided
        if (internalNotes !== undefined) order.internalNotes = internalNotes;
        if (returnReason !== undefined) order.returnReason = returnReason;
        if (refundAmount !== undefined) {
             // Validation for refundAmount
             if (refundAmount < 0 || refundAmount > order.totalAmount) {
                 return res.status(400).json({ message: "Số tiền hoàn không hợp lệ (phải từ 0 đến tổng giá trị đơn hàng)" });
             }
             order.refundAmount = refundAmount;
        }

        // Only admins can change carrier and tracking safely, but this route is adminRoute anyway
        if (carrier !== undefined) order.carrier = carrier;
        if (carrierTrackingNumber !== undefined) order.carrierTrackingNumber = carrierTrackingNumber;

        await order.save();

        res.json({ message: "Order details updated successfully", order });
    } catch (error) {
        console.error("Error in updateOrderDetails:", error.message);
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

export const createCODOrder = async (req, res) => {
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

        const newOrderId = new mongoose.Types.ObjectId();
        await OrderService.deductStock(products, session, newOrderId, req.user._id, "Đặt hàng COD");

        const coupon = couponCode ? await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true }).session(session) : null;
        let totalAmount = await OrderService.calculateTotalAmount(products, coupon, session);
        const orderCode = OrderService.generateOrderCode();
        const trackingToken = crypto.randomUUID();

        const newOrder = new Order({
            _id: newOrderId,
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
                message: "Đơn hàng đã được khởi tạo (Thanh toán COD).",
                timestamp: new Date()
            }]
        });

        await newOrder.save({ session });

        if (coupon) {
            coupon.isActive = false;
            await coupon.save({ session });
        }

        const orderedProductIds = products.map(p => (p._id || p.id).toString());
        req.user.cartItems = req.user.cartItems.filter(item => 
            item.product && !orderedProductIds.includes(item.product.toString())
        );
        await req.user.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Queue Order Confirmation Email
        await emailQueue.add("order-confirmation", {
            email: req.user.email,
            subject: "Xác nhận đơn hàng #" + orderCode + " - Luxury Watch",
            order: {
                orderCode,
                totalAmount,
                shippingDetails,
                paymentMethod: "cod"
            }
        });

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

        const newOrderId = new mongoose.Types.ObjectId();
        await OrderService.deductStock(products, session, newOrderId, req.user._id, "Đặt hàng VietQR");

        const coupon = couponCode ? await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true }).session(session) : null;
        let totalAmount = await OrderService.calculateTotalAmount(products, coupon, session);
        const orderCode = OrderService.generateOrderCode();
        const trackingToken = crypto.randomUUID();

        const newOrder = new Order({
            _id: newOrderId,
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

        const orderedProductIds = products.map(p => (p._id || p.id).toString());
        req.user.cartItems = req.user.cartItems.filter(item => 
            item.product && !orderedProductIds.includes(item.product.toString())
        );
        await req.user.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Queue Order Confirmation Email
        await emailQueue.add("order-confirmation", {
            email: req.user.email,
            subject: "Xác nhận đơn hàng #" + orderCode + " - Luxury Watch",
            order: {
                orderCode,
                totalAmount,
                shippingDetails,
                paymentMethod: "qr"
            }
        });

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

        order.paymentStatus = "paid";
        order.status = "confirmed";
        order.paidAt = new Date();
        await order.save();

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
