// controllers/order.controller.js
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import User from "../models/user.model.js";
import OrderService, { canTransitionOrderStatus } from "../services/order.service.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { emailQueue } from "./mail.controller.js";

// User request return (after delivered)
export const requestReturnOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (!order.user || order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền yêu cầu trả hàng cho đơn này" });
        }
        if (order.status !== "delivered") {
            return res.status(400).json({ message: "Chỉ có thể trả hàng khi đơn đã giao thành công" });
        }
        order.status = "return_requested";
        order.trackingEvents.push({
            status: "return_requested",
            message: "Khách hàng đã yêu cầu trả hàng.",
            timestamp: new Date(),
            updatedBy: req.user._id
        });
        await order.save();
        
        await emailQueue.add("order-status-update", {
            email: order.shippingDetails?.email || (await User.findById(order.user))?.email,
            subject: `Yêu cầu trả hàng cho đơn #${order.orderCode}`,
            order: {
                orderCode: order.orderCode,
                status: "return_requested",
                trackingToken: order.trackingToken
            }
        });
        res.json({ message: "Đã gửi yêu cầu trả hàng!" });
    } catch (error) {
        console.error("Error in requestReturnOrder:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (!order.user || order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền hủy đơn này" });
        }
        if (!["pending", "awaiting_verification", "confirmed"].includes(order.status)) {
            return res.status(400).json({ message: "Chỉ có thể hủy đơn khi chưa được xử lý" });
        }

        await OrderService.restoreStock(order.products, null, order._id, "Khách hàng hủy đơn");
        order.status = "cancelled";
        order.paymentStatus = order.paymentStatus === "paid" ? "refunded" : "cancelled";
        order.trackingEvents = order.trackingEvents || [];
        order.trackingEvents.push({
            status: "cancelled",
            message: "Khách hàng đã hủy đơn hàng.",
            timestamp: new Date(),
            updatedBy: req.user._id,
        });
        await order.save();

        res.json({ message: "Đã hủy đơn hàng" });
    } catch (error) {
        console.error("Error in cancelOrder:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Ensure order products are always returned with product details (name/image etc.)
const ensureOrderProductsPopulated = async (order) => {
    if (!order) return order;
    const orderObj = order.toObject ? order.toObject() : { ...order };

    orderObj.products = await Promise.all(orderObj.products.map(async (item) => {
        if (item.product && item.product.name) {
            return item;
        }
        try {
            const productData = await Product.findById(item.product).select("name price image category");
            return {
                ...item,
                product: productData ? productData.toObject() : {
                    _id: item.product,
                    name: "Sản phẩm đã bị xóa",
                    price: item.price,
                    image: "",
                }
            };
        } catch (err) {
            return {
                ...item,
                product: {
                    _id: item.product,
                    name: "Sản phẩm không xác định",
                    price: item.price,
                    image: ""
                }
            };
        }
    }));

    return orderObj;
};

export const getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate, search, page = 1, limit = 10, userId } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const filter = {};
        if (status && status !== "Tất cả") filter.status = status;
        if (startDate) filter.createdAt = { $gte: new Date(startDate) };
        if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };

        if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.user = userId;

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
        const pendingCount = await Order.countDocuments({ status: "pending" });
        const returnedCount = await Order.countDocuments({ status: "returned" });

        let ordersQuery = Order.find(filter)
            .populate("user", "name email")
            .populate("products.product", "name price image")
            .populate("coupon")
            .sort({ createdAt: -1 });

        if (limit !== "all") {
            ordersQuery = ordersQuery.skip(skip).limit(parseInt(limit));
        }

        const orders = await ordersQuery;
        const ordersWithProductData = await Promise.all(orders.map(ensureOrderProductsPopulated));

        res.json({
            orders: ordersWithProductData,
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

export const exportOrders = async (req, res) => {
    try {
        const { format = 'csv', status } = req.query;
        const filter = {};
        if (status && status !== 'Tất cả') filter.status = status;

        const orders = await Order.find(filter)
            .populate('user', 'name email')
            .populate('products.product', 'name price')
            .sort({ createdAt: -1 });

        if (format === 'csv') {
            const headers = ['orderCode', 'userEmail', 'status', 'paymentStatus', 'totalAmount', 'createdAt', 'shippingName', 'shippingPhone', 'products'];
            const rows = orders.map(o => {
                const userEmail = o.user?.email || '';
                const shippingName = o.shippingDetails?.fullName || '';
                const shippingPhone = o.shippingDetails?.phoneNumber || '';
                const products = (o.products || []).map(p => `${p.product?.name || p.product}_${p.quantity}@${p.price}`).join('; ');
                return [o.orderCode, userEmail, o.status, o.paymentStatus, o.totalAmount, o.createdAt.toISOString(), shippingName, shippingPhone, `"${products}"`].join(',');
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
            return res.send(headers.join(',') + '\n' + rows.join('\n'));
        }

        res.json(orders);
    } catch (error) {
        console.error('Error in exportOrders:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Refactored: Call OrderService
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;
        
        const order = await OrderService.updateOrderStatus(orderId, status, req.user);
        res.json({ message: "Order status updated to " + status, order });
    } catch (error) {
        console.error("Error in updateOrderStatus:", error.message);
        res.status(400).json({ message: error.message });
    }
};

export const updateOrderDetails = async (req, res) => {
    try {
        const { internalNotes, returnReason, refundAmount, carrier, carrierTrackingNumber } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: "Order not found" });

        if (internalNotes !== undefined) order.internalNotes = internalNotes;
        if (returnReason !== undefined) order.returnReason = returnReason;
        if (refundAmount !== undefined) {
             if (refundAmount < 0 || refundAmount > order.totalAmount) {
                  return res.status(400).json({ message: "Số tiền hoàn không hợp lệ (phải từ 0 đến tổng giá trị đơn hàng)" });
             }
             order.refundAmount = refundAmount;
        }

        const VALID_CARRIERS = ["DHL Express", "GHTK", "Viettel Post", "J&T Express", "VNPost", "Other"];
        if (carrier !== undefined) {
            if (!VALID_CARRIERS.includes(carrier)) {
                return res.status(400).json({ message: `Đơn vị vận chuyển không hợp lệ. Hợp lệ: ${VALID_CARRIERS.join(", ")}` });
            }
            order.carrier = carrier;
        }
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
        let order = await Order.findById(req.params.id)
            .populate("user", "name email")
            .populate("products.product", "name price image")
            .populate("coupon");

        if (!order) return res.status(404).json({ message: "Order not found" });

        const isOwner = order.user && req.user && order.user._id.toString() === req.user._id.toString();
        const isManager = ["admin", "staff"].includes(req.user.role);
        if (!isManager && !isOwner) {
            return res.status(403).json({ message: "Access denied" });
        }

        order = await ensureOrderProductsPopulated(order);

        res.json(order);
    } catch (error) {
        console.error("Error in getOrderById:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const ordersFetched = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate("user", "name email")
            .populate("products.product", "name price image")
            .populate("coupon");

        const orders = await Promise.all(ordersFetched.map(ensureOrderProductsPopulated));
        res.json(orders);
    } catch (error) {
        console.error("Error in getMyOrders:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Refactored: Call OrderService
export const createCODOrder = (req, res) => OrderService.createNonStripeOrder(req, res, "cod");
export const createQROrder  = (req, res) => OrderService.createNonStripeOrder(req, res, "qr");

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

        if (!order.user) {
            return res.status(403).json({ message: "Không thể xác nhận thanh toán cho đơn hàng khách vãng lai" });
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
            .select("trackingToken orderCode status paymentMethod paymentStatus totalAmount estimatedDelivery carrier carrierTrackingNumber trackingEvents shippingDetails products createdAt")
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
        const normalizedOrderNumber = typeof orderNumber === "string" ? orderNumber.trim().toUpperCase() : "";
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        if (!normalizedOrderNumber || !normalizedEmail) {
            return res.status(400).json({ message: "Vui lòng nhập mã đơn hàng và email." });
        }

        const order = await Order.findOne({
            orderCode: normalizedOrderNumber
        }).populate("user", "email");

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng khớp với mã cung cấp." });
        }

        const isEmailMatch =
            (order.shippingDetails?.email || "").trim().toLowerCase() === normalizedEmail ||
            (order.user?.email || "").trim().toLowerCase() === normalizedEmail;

        if (!isEmailMatch) {
            return res.status(404).json({ message: "Thông tin email hoặc mã đơn hàng chưa chính xác." });
        }

        res.json({ trackingToken: order.trackingToken });
    } catch (error) {
        console.error("Error in lookupOrder:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
