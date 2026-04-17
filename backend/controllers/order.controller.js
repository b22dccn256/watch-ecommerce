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
        // Email notify
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
// controllers/order.controller.js
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import User from "../models/user.model.js";
import OrderService from "../services/order.service.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { emailQueue } from "./mail.controller.js";

const ORDER_STATUS_TRANSITIONS = {
    pending: ["awaiting_verification", "confirmed", "cancelled"],
    awaiting_verification: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: ["return_requested"],
    return_requested: ["returned", "delivered"],
    returned: [],
    cancelled: [],
};

const canTransitionOrderStatus = (fromStatus, toStatus) => {
    if (fromStatus === toStatus) return true;
    const allowedTargets = ORDER_STATUS_TRANSITIONS[fromStatus] || [];
    return allowedTargets.includes(toStatus);
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
            .populate("products.product", "name price image")
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

export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: "Order not found" });

        if (!status) {
            return res.status(400).json({ message: "Thiếu trạng thái cần cập nhật" });
        }

        const validStatuses = Object.keys(ORDER_STATUS_TRANSITIONS);
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ" });
        }

        const oldStatus = order.status;

        if (!canTransitionOrderStatus(oldStatus, status)) {
            return res.status(400).json({
                message: `Không thể chuyển trạng thái từ ${oldStatus} sang ${status}`,
            });
        }

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

        // === Loyalty Points Accrual (1% of order when Delivered) ===
        if (status === "delivered" && oldStatus !== "delivered" && order.user) {
            const pointsToAdd = Math.max(1, Math.floor(order.totalAmount / 100)); // 1% giá trị đơn
            await User.findByIdAndUpdate(order.user, {
                $inc: { rewardPoints: pointsToAdd, totalPointsEarned: pointsToAdd }
            });
            // Log in order notes
            order.internalNotes = (order.internalNotes || "") + `\n[SYSTEM] Cộng ${pointsToAdd.toLocaleString()} điểm thưởng cho khách.`;
            await order.save();
        }

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
        let order = await Order.findById(req.params.id)
            .populate("user", "name email")
            .populate("products.product", "name price image");

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
            .populate("products.product", "name price image");

        const orders = await Promise.all(ordersFetched.map(ensureOrderProductsPopulated));
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

        // Validation
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

        // Deduct stock with a generated order id (avoid race conditions)
        const newOrderId = new mongoose.Types.ObjectId();
        const deductNote = paymentMethod === 'cod' ? 'Đặt hàng COD' : (paymentMethod === 'qr' ? 'Đặt hàng VietQR' : 'Đặt hàng');
        await OrderService.deductStock(products, session, newOrderId, req.user?._id, deductNote);

        const coupon = (couponCode && req.user)
            ? await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true }).session(session)
            : null;

        const totalAmount = await OrderService.calculateTotalAmount(products, coupon, session);
        const orderCode = OrderService.generateOrderCode();
        const trackingToken = crypto.randomUUID();

        const label = paymentMethod === "cod" ? "Thanh toán COD" : "Thanh toán QR";

        const newOrder = new Order({
            _id: newOrderId,
            ...(req.user && { user: req.user._id }),
            products: products.map(p => ({
                product: p._id || p.id,
                quantity: p.quantity,
                price: p.price,
                wristSize: p.wristSize || null,
                selectedColor: p.selectedColor || null,
                selectedSize: p.selectedSize || null,
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

        if (req.user) {
            const orderedVariants = products.map(p => ({
                productId: (p._id || p.id).toString(),
                wristSize: p.wristSize || null,
                selectedColor: p.selectedColor || null,
                selectedSize: p.selectedSize || null,
            }));
            req.user.cartItems = req.user.cartItems.filter(item => {
                if (!item.product) return true;
                const matchesOrderedVariant = orderedVariants.some(v =>
                    item.product.toString() === v.productId
                    && (item.wristSize || null) === v.wristSize
                    && (item.selectedColor || null) === v.selectedColor
                    && (item.selectedSize || null) === v.selectedSize
                );
                return !matchesOrderedVariant;
            });
            await req.user.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        // Queue email xác nhận (ngoài transaction — không critical nếu fail)
        await emailQueue.add("order-confirmation", {
            email: req.user?.email || shippingDetails.email,
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
