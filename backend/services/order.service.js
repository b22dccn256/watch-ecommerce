import Product from "../models/product.model.js";
import InventoryLog from "../models/inventoryLog.model.js";
import CampaignService from "./campaign.service.js";

class OrderService {
    // Kiểm tra và trừ tồn kho (Có hỗ trợ Transaction Session)
    static async deductStock(products, session = null, orderId = null, userId = null, note = "Thanh toán đơn hàng") {
        for (const item of products) {
            // Validate quantity: phải là số nguyên dương — tránh âm kho hoặc float bypass
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

    // Tính tổng tiền dựa trên giá (đã bao gồm khuyến mãi/campaign)
    static async calculateTotalAmount(products, coupon, session = null) {
        let totalAmount = 0;
        for (const item of products) {
            let product = await Product.findById(item._id || item.id).session(session);
            if (!product) {
                throw new Error(`Sản phẩm không tồn tại`);
            }
            // Apply any active campaigns explicitly here to compute the ACTUAL live price!
            product = await CampaignService.applyCampaignToProducts(product);

            totalAmount += product.price * item.quantity;
        }

        if (coupon && coupon.isActive) {
            totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
        }

        if (totalAmount > 0 && totalAmount < 2000000) {
            totalAmount += 30000;
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
