// controllers/order.controller.js
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";

// Hàm kiểm tra stock chung (dùng cho cả COD và sau này Stripe)
const validateStock = async (products) => {
    for (const item of products) {
        const product = await Product.findById(item._id || item.id);
        if (!product || product.stock < item.quantity) {
            throw new Error(`Sản phẩm "${product?.name || item._id}" chỉ còn ${product?.stock || 0} cái`);
        }
    }
};

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
        console.log("📥 [COD] Request body:", req.body); // ← debug

        const { products, couponCode } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                message: "Danh sách sản phẩm không được rỗng và phải là array"
            });
        }

        await validateStock(products);   // ← kiểm tra tồn kho trước

        let totalAmount = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

        // Xử lý coupon (nếu có)
        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode,
                userId: req.user._id,
                isActive: true
            });
            if (coupon) {
                totalAmount -= Math.round(totalAmount * coupon.discountPercentage / 100);
            }
        }

        const newOrder = new Order({
            user: req.user._id,
            products: products.map(p => ({
                product: p._id || p.id,
                quantity: p.quantity,
                price: p.price
            })),
            totalAmount,
            paymentMethod: "cod",
            status: "pending"
        });

        await newOrder.save();

        // Cập nhật stock
        for (const item of newOrder.products) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock -= item.quantity;
                await product.save();
            }
        }

        // Vô hiệu coupon nếu dùng
        if (couponCode) {
            await Coupon.findOneAndUpdate({ code: couponCode }, { isActive: false });
        }

        res.status(201).json({
            success: true,
            message: "Đơn hàng COD đã tạo thành công! Bạn sẽ thanh toán khi nhận hàng.",
            orderId: newOrder._id
        });
    } catch (error) {
        console.error("Error in createCODOrder:", error.message);
        res.status(400).json({ message: error.message });
    }
};