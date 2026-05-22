import cron from "node-cron";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Campaign from "../models/campaign.model.js";
import Product from "../models/product.model.js";
import OrderService from "../services/order.service.js";
import { sendEmail } from "./email.js";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const isCronEnabled = process.env.ENABLE_CRON === "true";

// Auto-delete guest carts after 7 days of inactivity (runs daily at 3:00 AM)
if (isCronEnabled) {
    cron.schedule("0 3 * * *", async () => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const filter = {
            cartItems: { $ne: [] },
            cartUpdatedAt: { $lte: sevenDaysAgo },
            password: { $exists: false },
            googleId: { $exists: false },
            facebookId: { $exists: false },
            githubId: { $exists: false }
        };
        const result = await User.updateMany(filter, { $set: { cartItems: [] } });
        if (result.modifiedCount > 0) {
            console.log(`[Cron] Cleared carts for ${result.modifiedCount} guest users inactive >7 days.`);
        }
    });
}

// Provide a safe stub queue if Redis is not available or cron is disabled
let emailQueue = {
    add: async (name, payload) => {
        console.log(`[Cron Stub] queued ${name}`, payload && payload.email ? payload.email : "(no email)");
        return Promise.resolve();
    }
};

if (isCronEnabled) {
    try {
        const redisConnection = new IORedis(process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || "redis://localhost:6379", {
            maxRetriesPerRequest: null,
            tls: process.env.UPSTASH_REDIS_URL ? { rejectUnauthorized: false } : undefined
        });
        emailQueue = new Queue("email-campaigns", { connection: redisConnection });
    } catch (err) {
        console.error("[Cron] Redis connection failed, using stub queue:", err.message);
    }
} else {
    console.log('[Cron] Disabled (ENABLE_CRON != "true"). Using stub queue.');
}

// Abandoned Cart Check (Every day at midnight)
if (isCronEnabled) {
    cron.schedule("0 0 * * *", async () => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const users = await User.find({
            cartItems: { $ne: [] },
            cartUpdatedAt: { $gte: fortyEightHoursAgo, $lte: twentyFourHoursAgo }
        }).populate("cartItems.product");

        for (const user of users) {
            const cartItemsData = user.cartItems
                .filter(item => item.product) // Safety filter
                .map(item => ({
                    name: item.product.name,
                    price: item.product.price.toLocaleString("vi-VN"),
                    image: item.product.image
                }));

            if (cartItemsData.length > 0) {
                await emailQueue.add("abandoned-cart", {
                    email: user.email,
                    fullName: user.name,
                    subject: "Bạn đang bỏ lỡ tuyệt tác này? – Luxury Watch",
                    cartItems: cartItemsData,
                    cartUrl: (process.env.CLIENT_URL || "http://localhost:5173") + "/cart",
                    unsubscribeLink: (process.env.BACKEND_URL || "http://localhost:5000") + "/api/mail/unsubscribe/" + user.email
                });
                console.log("[Cron] Queued abandoned cart email for " + user.email);
            }
        }
    });

// Cancel Abandoned Stripe Orders (Every hour)
    cron.schedule("0 * * * *", async () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const abandonedOrders = await Order.find({
            paymentMethod: "stripe",
            paymentStatus: "pending",
            createdAt: { $lte: yesterday }
        });

        for (const order of abandonedOrders) {
            try {
                // Gọi qua hàm dịch vụ tập trung để chạy đầy đủ nghiệp vụ đồng bộ và lưu lịch sử kiểm toán
                await OrderService.updateOrderStatus(order._id, "cancelled", null);

                // Cập nhật bổ sung trạng thái tiền và ghi chú hệ thống
                const updatedOrder = await Order.findById(order._id);
                if (updatedOrder) {
                    updatedOrder.paymentStatus = "cancelled";
                    if (updatedOrder.trackingEvents.length > 0) {
                        const lastEvent = updatedOrder.trackingEvents[updatedOrder.trackingEvents.length - 1];
                        if (lastEvent.status === "cancelled") {
                            lastEvent.message = "Hệ thống tự động hủy đơn Stripe hết hạn thanh toán.";
                        }
                    }
                    updatedOrder.internalNotes = (updatedOrder.internalNotes || "") + "\n[SYSTEM] Hệ thống tự động hủy đơn Stripe hết hạn thanh toán (Cron).";
                    await updatedOrder.save();
                }
                console.log("[Cron] Cancelled abandoned Stripe order " + order._id + " and restored stock via OrderService.");
            } catch (err) {
                console.error('[Cron] Failed to cancel order', order._id, err.message);
            }
        }
    });
    

// Update Campaign Status (Every minute)
    cron.schedule("* * * * *", async () => {
    try {
        const now = new Date();
        const toActive = await Campaign.updateMany(
            { isActive: true, status: "Scheduled", startDate: { $lte: now }, endDate: { $gt: now } },
            { $set: { status: "Active" } }
        );
        const toEnded = await Campaign.updateMany(
            { isActive: true, status: "Active", endDate: { $lte: now } },
            { $set: { status: "Ended" } }
        );
    } catch (error) {
        console.error("[Cron Error] Campaign status update failed:", error);
    }
    });

// Low Stock Alert (Every day at 8 AM)
    cron.schedule("0 8 * * *", async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
        const products = await Product.find({
            deletedAt: null,
            $expr: { $lte: ["$stock", "$lowStockThreshold"] }
        });

        if (products.length > 0) {
            let htmlContent = "<h3>Cảnh báo tồn kho thấp</h3>";
            products.forEach(p => {
                htmlContent += "<li><strong>" + p.name + "</strong> - Còn lại: " + p.stock + "</li>";
            });
            sendEmail(adminEmail, "[WatchStore] Cảnh báo tồn kho", htmlContent);
        }
    } catch (error) {
        console.error("[Cron Error] Low stock alert failed:", error);
    }
    });
} // end isCronEnabled

// AI Automation Cron Jobs
if (isCronEnabled) {
    // AI tự động xác nhận đơn COD (mỗi 30 phút)
    cron.schedule("*/30 * * * *", async () => {
        try {
            // Check for AI keys: Gemini preferred, Groq fallback
            const geminiKey = process.env.GEMINI_API_KEY;
            const groqKey = process.env.GROQ_API_KEY;

            if (!geminiKey && !groqKey) {
                console.log("[Cron AI] Chưa cấu hình GEMINI_API_KEY hoặc GROQ_API_KEY, bỏ qua auto-confirm.");
                return;
            }

            const pendingOrders = await Order.find({
                status: "pending",
                paymentMethod: "cod",
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }).limit(20);

            if (pendingOrders.length === 0) return;

            let model, providerName;

            if (geminiKey) {
                const { GoogleGenerativeAI } = await import("@google/generative-ai");
                const genAI = new GoogleGenerativeAI(geminiKey);
                const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                providerName = "Gemini";
                model = async (prompt) => {
                    const result = await geminiModel.generateContent(prompt);
                    return result.response.text().replace(/```json|```/g, "").trim();
                };
            } else {
                const { default: Groq } = await import("groq-sdk");
                const groq = new Groq({ apiKey: groqKey });
                providerName = "Groq";
                model = async (prompt) => {
                    const completion = await groq.chat.completions.create({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: "Trả về JSON: {\"isSpam\":bool,\"reason\":\"string\"}" },
                            { role: "user", content: prompt },
                        ],
                        temperature: 0.2,
                        max_tokens: 150,
                        response_format: { type: "json_object" },
                    });
                    return completion.choices[0]?.message?.content || "";
                };
            }

            let confirmed = 0, cancelled = 0;

            for (const order of pendingOrders) {
                const prompt = `Phân tích đơn hàng sau có phải spam không. Tên: ${order.shippingDetails?.fullName || "?"}, SĐT: ${order.shippingDetails?.phoneNumber || "?"}, Địa chỉ: ${order.shippingDetails?.address || "?"}. Trả JSON: {"isSpam":bool,"reason":"string"}`;
                try {
                    const text = await model(prompt);
                    const analysis = JSON.parse(text);
                    if (analysis.isSpam) {
                        // Use OrderService.updateOrderStatus for proper trackingEvents, inventory restore
                        try {
                            await OrderService.updateOrderStatus(order._id, "cancelled", null);
                        } catch { /* fallback */ }
                        cancelled++;
                    } else {
                        // Use OrderService.updateOrderStatus for proper trackingEvents, paymentStatus, paidAt, loyalty points
                        try {
                            await OrderService.updateOrderStatus(order._id, "confirmed", null);
                        } catch { /* fallback */ }
                        confirmed++;
                    }
                } catch { /* skip individual failures */ }
            }

            if (confirmed > 0 || cancelled > 0) {
                console.log(`[Cron AI ${providerName}] Auto-processed ${pendingOrders.length} COD orders: ${confirmed} confirmed, ${cancelled} cancelled.`);
            }
        } catch (err) {
            console.error("[Cron AI] Error:", err.message);
        }
    });

    // AI dọn dẹp tài khoản spam hàng ngày lúc 2h sáng
    cron.schedule("0 2 * * *", async () => {
        try {
            const users = await User.find({ role: "customer" });
            let deleted = 0;
            for (const user of users) {
                const isSpam = /test|bot|demo|spam|fake|123/i.test(user.name) || /test|bot|fake/i.test(user.email);
                if (isSpam) {
                    const orders = await Order.countDocuments({ user: user._id });
                    if (orders === 0) {
                        await User.findByIdAndDelete(user._id);
                        deleted++;
                    }
                }
            }
            if (deleted > 0) console.log(`[Cron AI] Cleaned ${deleted} spam accounts.`);
        } catch (err) {
            console.error("[Cron AI Cleanup] Error:", err.message);
        }
    });
}
