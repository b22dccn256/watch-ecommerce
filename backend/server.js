import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import campaignRoutes from "./routes/campaign.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import orderRoutes from "./routes/order.route.js";
import aiRoutes from "./routes/ai.route.js";
import wishlistRoutes from "./routes/wishlist.route.js";
import categoryRoutes from "./routes/category.route.js";
// cron job
import "./lib/cron.js";
import "./lib/cron-ai.js";

import { connectDB } from "./lib/db.js";

// Ensure Mongoose models are registered before any request handlers run
import "./models/productAudit.model.js";


dotenv.config({ path: "./backend/.env" });

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

app.use(express.json({ limit: "10mb" })); // allows you to parse the body of the request
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/categories", categoryRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

app.use((err, req, res, next) => {
	if (err.type === "entity.parse.failed") {
		return res.status(400).json({
			message: "Invalid JSON in request body. Vui lòng kiểm tra định dạng JSON."
		});
	}
	console.error("Server error:", err);
	res.status(500).json({ message: "Server error", error: err.message });
});

app.listen(PORT, () => {
	console.log("Server is running on http://localhost:" + PORT);
	connectDB();
});
