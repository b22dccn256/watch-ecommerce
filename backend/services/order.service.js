import Product from "../models/product.model.js";
import InventoryLog from "../models/inventoryLog.model.js";

class OrderService {
    // Kiểm tra và trừ tồn kho (Có hỗ trợ Transaction Session)
    static async deductStock(products, session = null, orderId = null, userId = null, note = "Thanh toán đơn hàng") {
        for (const item of products) {
            const product = await Product.findById(item._id || item.id).session(session);
            if (!product || product.stock < item.quantity) {
                throw new Error(`Sản phẩm "${product?.name || item._id}" chỉ còn ${product?.stock || 0} cái`);
            }
            product.stock -= item.quantity;

            // Tăng biến salesCount khi mua hàng thành công
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

    // Tạo mã đơn hàng tự động
    static generateOrderCode() {
        return "DH" + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
}

export default OrderService;
