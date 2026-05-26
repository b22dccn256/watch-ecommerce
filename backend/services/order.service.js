import Product from "../models/product.model.js";
import InventoryLog from "../models/inventoryLog.model.js";
import CampaignService from "./campaign.service.js";
import { getCouponDiscountAmount } from "../lib/coupon.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Coupon from "../models/coupon.model.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { emailQueue } from "../controllers/mail.controller.js";

// --- State transitions ---
export const ORDER_STATUS_TRANSITIONS = {
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

export const canTransitionOrderStatus = (fromStatus, toStatus) => {
    if (fromStatus === toStatus) return true;
    const allowedTargets = ORDER_STATUS_TRANSITIONS[fromStatus] || [];
    return allowedTargets.includes(toStatus);
};

class OrderService {
    // Cập nhật chi tiêu, số đơn hàng và phân khúc của người dùng
    static async updateUserStatsAndSegment(userId, amountDelta, countDelta, pointsDelta = 0, earnedPointsDelta = 0) {
        if (!userId) return;
        const user = await User.findById(userId);
        if (!user) return;

        if (amountDelta !== 0) user.totalSpend = Math.max(0, (user.totalSpend || 0) + amountDelta);
        if (countDelta !== 0) user.orderCount = Math.max(0, (user.orderCount || 0) + countDelta);
        if (pointsDelta !== 0) user.rewardPoints = Math.max(0, (user.rewardPoints || 0) + pointsDelta);
        if (earnedPointsDelta !== 0) user.totalPointsEarned = Math.max(0, (user.totalPointsEarned || 0) + earnedPointsDelta);

        // Tự động cập nhật phân khúc (segment)
        if (user.totalSpend >= 10000000) {
            user.segment = "VIP";
        } else if (user.totalSpend >= 3000000 || user.orderCount >= 3) {
            user.segment = "Potential";
        } else if (user.totalSpend > 0) {
            user.segment = "Regular";
        } else {
            user.segment = "NEW";
        }

        await user.save();
    }

    // Kiểm tra và trừ tồn kho (Có hỗ trợ Transaction Session)
    static async deductStock(products, session = null, orderId = null, userId = null, note = "Thanh toán đơn hàng") {
        for (const item of products) {
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                throw new Error(`Số lượng sản phẩm không hợp lệ: ${item.quantity}`);
            }

            const product = await Product.findById(item._id || item.id).session(session);
            
            let availableStock = product ? product.stock : 0;
            let sizeOption = null;
            if (product && item.wristSize && product.wristSizeOptions?.length > 0) {
                sizeOption = product.wristSizeOptions.find(o => o.size === item.wristSize);
                if (sizeOption) availableStock = sizeOption.stock;
            }

            if (!product || availableStock < item.quantity) {
                throw new Error(`Sản phẩm "${product?.name || item._id}" (size ${item.wristSize || 'mặc định'}) chỉ còn ${availableStock} cái`);
            }
            product.stock -= item.quantity;
            if (sizeOption) sizeOption.stock -= item.quantity;

            product.salesCount = (product.salesCount || 0) + item.quantity;

            await product.save({ session });

            await InventoryLog.create([{
                productId: product._id,
                action: "OUT",
                quantity: -item.quantity,
                referenceOrderId: orderId,
                userId: userId,
                note: note
            }], { session });
        }
    }

    // Hoàn lại tồn kho khi giao dịch bị huỷ
    static async restoreStock(products, session = null, orderId = null, note = "Hủy đơn hàng / Hoàn kho") {
        for (const item of products) {
            const product = await Product.findById(item.product ? item.product : (item._id || item.id)).session(session);
            if (product) {
                product.stock += item.quantity;
                
                if (item.wristSize && product.wristSizeOptions?.length > 0) {
                    const sizeOption = product.wristSizeOptions.find(o => o.size === item.wristSize);
                    if (sizeOption) sizeOption.stock += item.quantity;
                }
                
                await product.save({ session });

                await InventoryLog.create([{
                    productId: product._id,
                    action: "IN",
                    quantity: item.quantity,
                    referenceOrderId: orderId,
                    userId: null,
                    note: note
                }], { session });
            }
        }
    }

    // Tính tổng tiền chi tiết (đã bao gồm khuyến mãi/campaign và phí ship)
    static async calculateTotals(products, coupon, city = "", session = null) {
        let subtotal = 0;
        for (const item of products) {
            let product = await Product.findById(item._id || item.id).session(session);
            if (!product) {
                throw new Error(`Sản phẩm không tồn tại`);
            }
            product = await CampaignService.applyCampaignToProducts(product);

            subtotal += product.price * item.quantity;
        }

        let discount = 0;
        if (coupon) {
            if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
                throw new Error("Đơn hàng tối thiểu để áp dụng coupon này là " + coupon.minOrderAmount.toLocaleString('vi-VN') + " VNĐ");
            }
            discount = getCouponDiscountAmount(coupon, subtotal);
        }

        const totalAfterDiscount = Math.max(0, subtotal - discount);

        // --- Phí vận chuyển động theo Tỉnh / Thành phố ---
        const FREE_SHIP_THRESHOLD = 5000000; // Miễn phí ship nếu đơn > 5tr
        const BIG_CITY_FEE = 30000; // Hà Nội và TP.HCM
        const OTHER_PROVINCE_FEE = 50000; // Tỉnh khác

        const BIG_CITIES = [
            "hà nội", "ha noi", "hn",
            "hồ chí minh", "ho chi minh", "hcm", "tp.hcm", "tp hcm", "sài gòn", "sai gon"
        ];

        let shippingFee = 0;
        if (products.length > 0) {
            if (totalAfterDiscount >= FREE_SHIP_THRESHOLD) {
                shippingFee = 0;
            } else if (!city || BIG_CITIES.includes(city.toLowerCase().trim())) {
                shippingFee = BIG_CITY_FEE;
            } else {
                shippingFee = OTHER_PROVINCE_FEE;
            }
        }

        const total = totalAfterDiscount + shippingFee;

        // Đảm bảo đơn hàng luôn có giá trị thanh toán thực tế tối thiểu (ít nhất 10,000đ nếu đơn hàng có sản phẩm)
        const finalTotal = subtotal > 0 ? Math.max(10000, total) : 0;

        return { subtotal, discount, shippingFee, total: finalTotal };
    }

    // Giữ lại hàm cũ để không break các chỗ khác, gọi sang calculateTotals
    static async calculateTotalAmount(products, coupon, session = null, city = "") {
        const { total } = await this.calculateTotals(products, coupon, city, session);
        return total;
    }


    // Tạo mã đơn hàng
    static generateOrderCode() {
        const ts = Date.now().toString(36).toUpperCase().slice(-4);
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return "DH" + ts + rand;
    }

    // Extracted from controller: Create COD order
    static async createNonStripeOrder(req, res, paymentMethod) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { products, couponCode, shippingDetails } = req.body;
            const normalizedShippingDetails = {
                ...shippingDetails,
                email: req.user?.email || shippingDetails?.email || "",
            };

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
            if (!normalizedShippingDetails?.fullName?.trim() || !normalizedShippingDetails?.address?.trim() ||
                !normalizedShippingDetails?.city?.trim() || !normalizedShippingDetails?.phoneNumber?.trim()) {
                await session.abortTransaction(); session.endSession();
                return res.status(400).json({ message: "Thiếu thông tin giao hàng bắt buộc." });
            }

            const newOrderId = new mongoose.Types.ObjectId();
            const deductNote = paymentMethod === 'cod' ? 'Đặt hàng COD' : 'Đặt hàng';
            await this.deductStock(products, session, newOrderId, req.user?._id, deductNote);

            const coupon = couponCode
                ? await Coupon.findOne({ code: couponCode.trim().toUpperCase(), isActive: true }).session(session)
                : null;

            if (coupon && coupon.userId && (!req.user || String(coupon.userId) !== String(req.user._id))) {
                await session.abortTransaction(); session.endSession();
                return res.status(403).json({ message: "Coupon này không dành cho bạn" });
            }

            const totalAmount = await this.calculateTotalAmount(products, coupon, session, normalizedShippingDetails.city);
            const { subtotal, discount, shippingFee } = await this.calculateTotals(products, coupon, normalizedShippingDetails.city, session);
            const orderCode = this.generateOrderCode();
            const trackingToken = crypto.randomUUID();

            const label = paymentMethod === "cod" ? "Thanh toán COD" : "Thanh toán VNPay / Stripe";

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
                subtotal,
                discountAmount: discount,
                shippingFee,
                couponCode: couponCode || '',
                orderCode,
                trackingToken,
                shippingDetails: normalizedShippingDetails,
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
                coupon.usedCount = (coupon.usedCount || 0) + 1;
                coupon.usageHistory.push({
                    usedAt: new Date(),
                    orderId: newOrderId,
                    userId: req.user?._id
                });
                if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
                    coupon.isActive = false;
                }
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

            await emailQueue.add("order-confirmation", {
                email: req.user?.email || normalizedShippingDetails.email,
                subject: `Xác nhận đơn hàng #${orderCode} - Luxury Watch`,
                order: { orderCode, totalAmount, shippingDetails: normalizedShippingDetails, paymentMethod }
            });

            const message = paymentMethod === "cod"
                ? "Đơn hàng COD đã tạo thành công! Bạn sẽ thanh toán khi nhận hàng."
                : "Đơn hàng thanh toán đã tạo thành công.";

            return res.status(201).json({
                success: true,
                message,
                orderId: newOrder._id,
                orderCode,
                ...(paymentMethod === "vnpay" && { totalAmount })
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error(`Error in create${paymentMethod.toUpperCase()}Order:`, error.message);
            return res.status(400).json({ message: error.message });
        }
    }

    // Extracted from controller: Update Order Status
    static async updateOrderStatus(orderId, status, reqUser) {
        const order = await Order.findById(orderId);

        if (!order) throw new Error("Order not found");

        if (!status) {
            throw new Error("Thiếu trạng thái cần cập nhật");
        }

        const validStatuses = Object.keys(ORDER_STATUS_TRANSITIONS);
        if (!validStatuses.includes(status)) {
            throw new Error("Trạng thái đơn hàng không hợp lệ");
        }

        const oldStatus = order.status;

        if (!canTransitionOrderStatus(oldStatus, status)) {
            throw new Error(`Không thể chuyển trạng thái từ ${oldStatus} sang ${status}`);
        }

        order.status = status;

        order.trackingEvents.push({
            status,
            message: "Trạng thái đơn hàng đã được cập nhật thành: " + status,
            timestamp: new Date(),
            updatedBy: reqUser?._id || "system"
        });

        if (status === "cancelled" && oldStatus !== "cancelled") {
            await this.restoreStock(order.products, null, order._id, "Hủy đơn hàng");
        } else if (status === "returned" && oldStatus !== "returned") {
            try {
                await this.restoreStock(order.products, null, order._id, "Trả hàng: " + (order.returnReason || "Không rõ lý do"));
                if (order.loyaltyPointsGranted > 0 && !order.loyaltyPointsReversedAt) {
                    order.loyaltyPointsReversedAt = new Date();
                    await this.updateUserStatsAndSegment(order.user, -order.totalAmount, -1, -order.loyaltyPointsGranted, 0);
                    order.internalNotes = (order.internalNotes || "") + `\n[SYSTEM] Đã trừ ${order.loyaltyPointsGranted.toLocaleString()} điểm thưởng, hoàn chi tiêu và số đơn hàng do đơn bị trả.`;
                }
            } catch (restoreError) {
                console.error("Error restoring stock for returned order:", restoreError.message);
                order.internalNotes = (order.internalNotes || "") + "\n[SYSTEM] Lỗi khi hoàn cộng tồn kho: " + restoreError.message;
            }
        }

        if (status === "delivered" && oldStatus !== "delivered") {
            if (order.paymentStatus !== "paid") {
                order.paymentStatus = "paid";
                order.paidAt = new Date();
            }
            if (order.user) {
                const pointsToAdd = Math.max(1, Math.floor(order.totalAmount / 100));
                await this.updateUserStatsAndSegment(order.user, order.totalAmount, 1, pointsToAdd, pointsToAdd);
                order.loyaltyPointsGranted = pointsToAdd;
                order.loyaltyPointsReversedAt = null;
                order.internalNotes = (order.internalNotes || "") + `\n[SYSTEM] Cộng ${pointsToAdd.toLocaleString()} điểm thưởng, cập nhật chi tiêu và số đơn hàng thành công cho khách.`;
            }
        } else if (status === "refunded" && order.user && order.loyaltyPointsGranted > 0 && !order.loyaltyPointsReversedAt) {
            order.loyaltyPointsReversedAt = new Date();
            await this.updateUserStatsAndSegment(order.user, -order.totalAmount, -1, -order.loyaltyPointsGranted, 0);
            order.internalNotes = (order.internalNotes || "") + `\n[SYSTEM] Trừ ${order.loyaltyPointsGranted.toLocaleString()} điểm thưởng, hoàn chi tiêu và số đơn hàng do đơn ${status}.`;
        }

        await order.save();

        await emailQueue.add("order-status-update", {
            email: order.shippingDetails?.email || (await mongoose.model('User').findById(order.user))?.email,
            subject: "Cập nhật trạng thái đơn hàng #" + order.orderCode,
            order: {
                orderCode: order.orderCode,
                status: status,
                trackingToken: order.trackingToken
            }
        });

        return order;
    }
}

export default OrderService;
