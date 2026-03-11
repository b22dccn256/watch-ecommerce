import Product from "../models/product.model.js";

class OrderService {
    // Kiểm tra và trừ tồn kho
    static async deductStock(products) {
        for (const item of products) {
            const product = await Product.findById(item._id || item.id);
            if (!product || product.stock < item.quantity) {
                throw new Error(`Sản phẩm "${product?.name || item._id}" chỉ còn ${product?.stock || 0} cái`);
            }
            product.stock -= item.quantity;
            await product.save();
        }
    }

    // Hoàn lại tồn kho khi giao dịch bị huỷ
    static async restoreStock(products) {
        for (const item of products) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }
    }

    // Tính tổng tiền dựa trên giá gốc từ DB
    static async calculateTotalAmount(products, coupon) {
        let totalAmount = 0;
        for (const item of products) {
            const product = await Product.findById(item._id || item.id);
            if (!product) {
                throw new Error(`Sản phẩm không tồn tại`);
            }
            totalAmount += product.price * item.quantity;
        }

        if (coupon && coupon.isActive) {
            totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
        }

        return totalAmount;
    }

    // Tạo mã đơn hàng tự động
    static generateOrderCode() {
        return "DH" + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
}

export default OrderService;
