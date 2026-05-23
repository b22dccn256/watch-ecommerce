import Product from "../models/product.model.js";
import InventoryLog from "../models/inventoryLog.model.js";

// Lấy danh sách sản phẩm cảnh báo sắp hết hàng (stock < lowStockThreshold)
export const getLowStockProducts = async (req, res) => {
    try {
        // Mongo query where stock <= lowStockThreshold
        const products = await Product.find({ 
            $expr: { $lte: ["$stock", "$lowStockThreshold"] },
            isActive: true
        }).select("name image stock lowStockThreshold price brand _id");

        res.json(products);
    } catch (error) {
        console.error("Error in getLowStockProducts:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Admin điều chỉnh kho thủ công (Nhập / Kiểm kê)
export const adjustStock = async (req, res) => {
    try {
        const { productId, action, quantity, note } = req.body;
        const parsedQuantity = Number(quantity);

        if (!["IN", "OUT", "ADJUST"].includes(action)) {
            return res.status(400).json({ message: "Action phải là IN, OUT hoặc ADJUST" });
        }
        if (!Number.isInteger(parsedQuantity)) {
            return res.status(400).json({ message: "Số lượng phải là số nguyên" });
        }

        if ((action === "IN" || action === "OUT") && parsedQuantity <= 0) {
            return res.status(400).json({ message: "Số lượng nhập/xuất phải lớn hơn 0" });
        }

        if (action === "ADJUST" && parsedQuantity < 0) {
            return res.status(400).json({ message: "Tồn kho điều chỉnh không được âm" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        // Kiểm tra nếu trừ đi bị âm
        if (action === "OUT" && product.stock - parsedQuantity < 0) {
            return res.status(400).json({ message: "Tồn kho không đủ để xuất" });
        }

        let actualDelta = 0;
        if (action === "IN") {
            product.stock += parsedQuantity;
            actualDelta = parsedQuantity;
        } else if (action === "OUT") {
            product.stock -= parsedQuantity;
            actualDelta = -parsedQuantity;
        } else if (action === "ADJUST") {
            // quantity is the new Absolute Stock.
            // Delta is newStock - oldStock
            actualDelta = parsedQuantity - product.stock;
            product.stock = parsedQuantity;
        }

        await product.save();

        const log = await InventoryLog.create({
            productId: product._id,
            action: action,
            quantity: actualDelta,
            userId: req.user._id, // Admin thực hiện
            note: note || "Điều chỉnh thủ công từ Admin"
        });

        res.json({ message: "Cập nhật tồn kho thành công", product, log });
    } catch (error) {
        console.error("Error in adjustStock:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Xem lịch sử luân chuyển kho của 1 sản phẩm
export const getProductInventoryLogs = async (req, res) => {
    try {
        const { productId } = req.params;
        const logs = await InventoryLog.find({ productId })
            .populate("userId", "name email")
            .populate("referenceOrderId", "orderCode")
            .sort({ createdAt: -1 });

        res.json(logs);
    } catch (error) {
        console.error("Error in getProductInventoryLogs:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};
