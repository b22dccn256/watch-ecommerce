// controllers/order.controller.js
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import OrderService from "../services/order.service.js";

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
            .populate("products.product", "name price");

        if (!order) return res.status(404).json({ message: "Order not found" });

        // Kiểm tra quyền: Chỉ user sở hữu hoặc admin mới xem
        if (req.user.role !== "admin" && order.user.toString() !== req.user._id.toString()) {
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
        const orders = await Order.find({ user: req.user._id }).populate("user", "name email").populate("products.product", "name price"); // Như getAll
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const createCODOrder = async (req, res) => {
    try {
        const { products, couponCode, shippingDetails } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                message: "Danh sách sản phẩm không được rỗng và phải là array"
            });
        }

        if (!shippingDetails) {
            return res.status(400).json({ message: "Thiếu thông tin giao hàng." });
        }

        await OrderService.deductStock(products);

        const coupon = couponCode ? await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true }) : null;
        let totalAmount = await OrderService.calculateTotalAmount(products, coupon);
        const orderCode = OrderService.generateOrderCode();

        const newOrder = new Order({
            user: req.user._id,
            products: products.map(p => ({
                product: p._id || p.id,
                quantity: p.quantity,
                price: p.price // Vẫn lưu giá trị ở thời điểm mua vào order
            })),
            totalAmount,
            orderCode,
            shippingDetails,
            paymentMethod: "cod",
            paymentStatus: "pending",
            status: "pending"
        });

        await newOrder.save();

        if (coupon) {
            coupon.isActive = false;
            await coupon.save();
        }

        res.status(201).json({
            success: true,
            message: "Đơn hàng COD đã tạo thành công! Bạn sẽ thanh toán khi nhận hàng.",
            orderId: newOrder._id,
            orderCode
        });
    } catch (error) {
        console.error("Error in createCODOrder:", error.message);
        res.status(400).json({ message: error.message });
    }
};

export const createQROrder = async (req, res) => {
    try {
        const { products, couponCode, shippingDetails } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Danh sách sản phẩm không được rỗng" });
        }
        if (!shippingDetails) {
            return res.status(400).json({ message: "Thiếu thông tin giao hàng." });
        }

        await OrderService.deductStock(products);

        const coupon = couponCode ? await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true }) : null;
        let totalAmount = await OrderService.calculateTotalAmount(products, coupon);
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

        await newOrder.save();

        if (coupon) {
            coupon.isActive = false;
            await coupon.save();
        }

        res.status(201).json({
            success: true,
            message: "Đơn hàng QR đã tạo thành công. Vui lòng chuyển khoản để xác nhận.",
            orderId: newOrder._id,
            orderCode,
            totalAmount
        });
    } catch (error) {
        console.error("Error in createQROrder:", error.message);
        res.status(400).json({ message: error.message });
    }
};