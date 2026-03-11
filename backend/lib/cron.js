import cron from "node-cron";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import OrderService from "../services/order.service.js";
import { sendEmail } from "./email.js";

cron.schedule("0 0 * * *", async () => { // Mỗi ngày
    const users = await User.find({ cartItems: { $ne: [] } }); // Có cart nhưng chưa order
    for (const user of users) {
        sendEmail(user.email, "Don't Forget Your Cart!", "<p>Complete your purchase!</p>");
    }
});

// Chạy mỗi giờ: Dọn dẹp các đơn hàng Stripe bị "bỏ quên" (pending) quá 24h để hoàn lại kho
cron.schedule("0 * * * *", async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const abandonedOrders = await Order.find({
        paymentMethod: "stripe",
        paymentStatus: "pending",
        createdAt: { $lte: yesterday }
    });

    for (const order of abandonedOrders) {
        order.status = "cancelled";
        order.paymentStatus = "cancelled";
        await order.save();

        // Hoàn lại kho
        await OrderService.restoreStock(order.products);
        console.log(`[Cron] Cancelled abandoned Stripe order ${order._id} and restored stock.`);
    }
});