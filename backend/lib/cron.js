import cron from "node-cron";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Campaign from "../models/campaign.model.js";
import Product from "../models/product.model.js";
import OrderService from "../services/order.service.js";
import { sendEmail } from "./email.js";

cron.schedule("0 0 * * *", async () => { // Mỗi ngày lúc nửa đêm
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Tìm user có giỏ hàng được cập nhật trong khoảng 24h-48h trước
    const users = await User.find({
        cartItems: { $ne: [] },
        cartUpdatedAt: { $gte: fortyEightHoursAgo, $lte: twentyFourHoursAgo }
    });

    for (const user of users) {
        const subject = "[WatchStore] Vẫn còn sản phẩm trong giỏ hàng của bạn!";
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #000; padding: 20px; text-align: center; color: #d4af37;">
                    <h1 style="margin: 0;">WATCH STORE</h1>
                </div>
                <div style="padding: 30px;">
                    <h2>Bạn để quên thứ gì đó?</h2>
                    <p>Chào ${user.name}, chúng tôi thấy bạn vẫn còn sản phẩm tuyệt vời trong giỏ hàng. Đừng bỏ lỡ!</p>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.CLIENT_URL}/cart" style="background-color: #d4af37; color: #000; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 8px;">Hoàn tất đơn hàng ngay</a>
                    </div>
                </div>
            </div>
        `;
        sendEmail(user.email, subject, html);
        console.log(`[Cron] Sent abandoned cart email to ${user.email}`);
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

// Chạy mỗi phút: Cập nhật trạng thái chiến dịch Marketing (Campaigns)
cron.schedule("* * * * *", async () => {
    try {
        const now = new Date();

        // 1. Scheduled -> Active (Đến giờ chạy)
        const toActive = await Campaign.updateMany(
            { isActive: true, status: "Scheduled", startDate: { $lte: now }, endDate: { $gt: now } },
            { $set: { status: "Active" } }
        );
        if (toActive.modifiedCount > 0) console.log(`[Cron] Activated ${toActive.modifiedCount} scheduled campaigns.`);

        // 2. Active -> Ended (Hết giờ)
        const toEnded = await Campaign.updateMany(
            { isActive: true, status: "Active", endDate: { $lte: now } },
            { $set: { status: "Ended" } }
        );
        if (toEnded.modifiedCount > 0) console.log(`[Cron] Ended ${toEnded.modifiedCount} expired campaigns.`);

    } catch (error) {
        console.error("[Cron Error] Campaign status update failed:", error);
    }
});

// Chạy mỗi ngày lúc 8h sáng: Báo cáo tồn kho thấp
cron.schedule("0 8 * * *", async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
        const products = await Product.find({
            deletedAt: null,
            $expr: { $lte: ["$stock", "$lowStockThreshold"] }
        });

        if (products.length > 0) {
            let htmlContent = "<h3>Cảnh báo tồn kho thấp</h3>";
            htmlContent += "<p>Các sản phẩm sau đây đang có số lượng tồn kho dưới mức an toàn. Vui lòng kiểm tra và nhập thêm hàng:</p>";
            htmlContent += "<ul>";
            products.forEach(p => {
                htmlContent += `<li><strong>${p.name}</strong> - Còn lại: ${p.stock} (Ngưỡng: ${p.lowStockThreshold})</li>`;
            });
            htmlContent += "</ul>";
            htmlContent += `<p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/secret-dashboard">Đến Dashboard xem chi tiết quản lý</a></p>`;

            sendEmail(adminEmail, "[WatchStore] Cảnh báo tồn kho", htmlContent);
            console.log(`[Cron] Sent low stock alert email to Admin for ${products.length} products.`);
        }
    } catch (error) {
        console.error("[Cron Error] Low stock alert failed:", error);
    }
});