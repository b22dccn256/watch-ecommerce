import cron from "node-cron";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Campaign from "../models/campaign.model.js";
import Product from "../models/product.model.js";
import OrderService from "../services/order.service.js";
import { sendEmail } from "./email.js";

import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisConnection = new IORedis(process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || "redis://localhost:6379", {
	maxRetriesPerRequest: null,
	tls: process.env.UPSTASH_REDIS_URL ? { rejectUnauthorized: false } : undefined
});
const emailQueue = new Queue("email-campaigns", { connection: redisConnection });

// Abandoned Cart Check (Every day at midnight)
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
        order.status = "cancelled";
        order.paymentStatus = "cancelled";
        await order.save();
        await OrderService.restoreStock(order.products);
        console.log("[Cron] Cancelled abandoned Stripe order " + order._id + " and restored stock.");
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
