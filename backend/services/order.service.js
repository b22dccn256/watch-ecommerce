import Product from "../models/product.model.js";

class OrderService {
    // Kiểm tra và trừ tồn kho (Có hỗ trợ Transaction Session)
    static async deductStock(products, session = null) {
        for (const item of products) {
            // Validate quantity: phải là số nguyên dương — tránh âm kho hoặc float bypass
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                throw new Error(`Số lượng sản phẩm không hợp lệ: ${item.quantity}`);
            }

            const product = await Product.findById(item._id || item.id).session(session);
            if (!product || product.stock < item.quantity) {
                throw new Error(`Sản phẩm "${product?.name || item._id}" chỉ còn ${product?.stock || 0} cái`);
            }
            product.stock -= item.quantity;

            // Tăng biến salesCount khi mua hàng thành công
            product.salesCount = (product.salesCount || 0) + item.quantity;

            await product.save({ session });
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
    static async calculateTotalAmount(products, coupon, session = null) {
        let totalAmount = 0;
        for (const item of products) {
            const product = await Product.findById(item._id || item.id).session(session);
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

    // Tạo mã đơn hàng: DH + timestamp(base36) + random suffix → độ unique cao hơn
    static generateOrderCode() {
        const ts = Date.now().toString(36).toUpperCase().slice(-4); // 4 ký tự cuối của timestamp
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 ký tự random
        return "DH" + ts + rand;
    }
}

export default OrderService;
