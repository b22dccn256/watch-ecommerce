import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import Order from "../models/order.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
    try {
        const _conn = await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for Migration");
        return _conn;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
};

const migrateOrders = async () => {
    try {
        await connectDB();
        
        console.log("Tìm kiếm các đơn hàng cần cập nhật...");
        const orders = await Order.find({});
        console.log(`Tìm thấy ${orders.length} đơn hàng. Đang tiến hành migrate...`);
        
        let count = 0;
        
        for (const order of orders) {
            let modified = false;
            
            // Xử lý internalNotes
            if (typeof order.internalNotes === "undefined") {
                order.internalNotes = "";
                modified = true;
            }
            
            // Xử lý returnReason
            if (typeof order.returnReason === "undefined") {
                order.returnReason = "";
                modified = true;
            }
            
            // Xử lý refundAmount
            if (typeof order.refundAmount === "undefined") {
                order.refundAmount = 0;
                modified = true;
            }

            // Xử lý carrier hợp lệ (vì thêm enum nên carrier cũ có thể không hơp lệ nếu chưa có list)
            // Trong order.model.js, enum cho phép "Other"
            if (!["DHL Express", "GHTK", "Viettel Post", "J&T Express", "VNPost", "Other"].includes(order.carrier)) {
                order.carrier = "Other";
                modified = true;
            }
            
            if (modified) {
                await order.save();
                count++;
            }
        }
        
        console.log(`Migration hoàn tất. Đã cập nhật ${count} đơn hàng.`);
        process.exit(0);
    } catch (error) {
        console.error("Lỗi trong quá trình migration:", error);
        process.exit(1);
    }
};

migrateOrders();
