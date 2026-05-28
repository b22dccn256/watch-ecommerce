import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

// C.8: Fail-fast validation for critical environment variables
const REQUIRED_ENV_VARS = [
	"MONGO_URI",
	"ACCESS_TOKEN_SECRET",
	"REFRESH_TOKEN_SECRET",
];
const missingEnvVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missingEnvVars.length > 0) {
	console.error(
		`[FATAL] Missing required environment variables: ${missingEnvVars.join(", ")}`
	);
	console.error("Please check backend/.env.example for reference.");
	process.exit(1);
}

import express from "express";
import cookieParser from "cookie-parser";
import fs from "fs";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.route.js";
import oauthRoutes from "./routes/oauth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import campaignRoutes from "./routes/campaign.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import orderRoutes from "./routes/order.route.js";
import aiRoutes from "./routes/ai.route.js";
import wishlistRoutes from "./routes/wishlist.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import categoryRoutes from "./routes/category.route.js";
import brandRoutes from "./routes/brand.route.js";
import bannerRoutes from "./routes/banner.route.js";
import contactRoutes from "./routes/contact.route.js";
import mailRoutes from "./routes/mail.route.js";
import reviewRoutes from "./routes/review.route.js";
import questionRoutes from "./routes/question.route.js";
import storeConfigRoutes from "./routes/storeConfig.route.js";
import adminIpnRoutes from "./routes/admin.ipn.route.js";
import sitemapRoutes from "./routes/sitemap.route.js";
import { sanitizeInput } from "./middleware/sanitize.middleware.js";
import { csrfProtection, issueCsrfToken } from "./middleware/csrf.middleware.js";
import { responseSanitizationMiddleware } from "./middleware/response-sanitization.middleware.js";
import { forceHttps } from "./middleware/https.middleware.js";
import { attachSafeRequestLog } from "./middleware/log-redaction.middleware.js";
import { sanitizeErrorResponse } from "./lib/sanitize-response.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import "./services/mailWorker.js";
// cron job
import "./lib/cron.js";
import "./lib/cron-ai.js";

import "./config/passport.js";
import passport from "passport";

import { connectDB } from "./lib/db.js";

// Ensure Mongoose models are registered before any request handlers run
import "./models/productAudit.model.js";




const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(
	helmet({
		contentSecurityPolicy: false,
		hsts:
			process.env.NODE_ENV === "production"
				? { maxAge: 31536000, includeSubDomains: true, preload: true }
				: false,
	})
);
app.use(forceHttps);

// ── Phục vụ file Static (Frontend) TRƯỚC khi check CORS ───────────────────
const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
	app.use(express.static(frontendDistPath));
}

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOrigins = [
	process.env.CLIENT_URL,
	"http://localhost:5173",
	"http://localhost:5174",
	"http://127.0.0.1:5173",
].filter(Boolean);

app.use(
	cors({
		origin(origin, callback) {
			// Luôn cho phép nếu không có origin (cùng domain) hoặc origin có trong danh sách
			if (!origin || corsOrigins.includes(origin)) {
				return callback(null, true);
			}
			// Mở rộng: Cho phép tất cả các domain có chứa 'onrender.com' để tránh lỗi khi deploy
			if (origin.includes('onrender.com')) {
				return callback(null, true);
			}
			return callback(new Error("Not allowed by CORS"));
		},
		credentials: true,
	})
);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Auth rate limiter - Bypass for resend-verification in dev
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 phút
	max: process.env.NODE_ENV === "production" ? 30 : 10000,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút." },
	// Skip rate limit check for resend-verification in dev mode
	skip: (req) => req.path === "/resend-verification" && process.env.NODE_ENV !== "production"
});

app.use("/api/auth", authLimiter);

// General API rate limiter
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: process.env.NODE_ENV === "production" ? 300 : 10000, // Tăng lên 10000 trong dev
	standardHeaders: true,
	legacyHeaders: false,
});

app.use("/api", apiLimiter);

// ── Body Parsing ──────────────────────────────────────────────────────────────
// Stripe webhook cần raw body — phải đặt TRƯỚC express.json()
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// ── CSRF Protection ───────────────────────────────────────────────────────────
app.use(csrfProtection);

// C.1: Input sanitization - strip null bytes and trim strings from body/query/params
app.use(sanitizeInput);

// Strip sensitive fields from all JSON API responses
app.use(responseSanitizationMiddleware);

// Safe request snapshot for error logs (passwords/tokens redacted)
app.use(attachSafeRequestLog);

// ── CSRF Token Endpoint ───────────────────────────────────────────────────────
// Must be before route mounting to ensure it's processed first
app.get("/api/csrf-token", (req, res) => {
	const token = issueCsrfToken(req, res);
	res.json({ token });
});

// Test endpoint to verify routing works
app.get("/api/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// Dev-only helper: create a session cookie for a user (test mode only)
if (process.env.NODE_ENV === "test") {
	app.post("/api/__dev/set-session", async (req, res) => {
		try {
			const { default: User } = await import("./models/user.model.js");
			const AuthService = await import("./services/auth.service.js");
			const email = (req.body && req.body.email) || req.query.email;
			if (!email) return res.status(400).json({ message: "Email required" });
			const user = await User.findOne({ email });
			if (!user) return res.status(404).json({ message: "User not found" });
			const { accessToken, refreshToken } = AuthService.generateTokens(user._id);
			await AuthService.storeRefreshToken(user._id, refreshToken);
			AuthService.setCookies(res, accessToken, refreshToken);
			return res.json({ message: "Session set", email: user.email });
		} catch (err) {
			console.error("Dev set-session failed", err.message);
			return res.status(500).json({ message: "Dev helper failed" });
		}
	});
}

app.use("/api/auth/oauth", oauthRoutes); // FIX D7: removed duplicate mount at /api/auth

// Alias for Google callback to handle wrong redirect URL
app.get("/api/auth/google/callback", (req, res) => {
  const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  res.redirect("/api/auth/oauth/google/callback" + query);
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/settings", storeConfigRoutes);
// Backwards-compat: some tests and older callers expect /api/store-config
app.use("/api/store-config", storeConfigRoutes);
app.use("/api/admin/ipns", adminIpnRoutes);
app.use("/api/ai", aiRoutes);
app.use("/", sitemapRoutes);

if (fs.existsSync(frontendDistPath)) {
	app.get(/.*/, (req, res) => {
		res.sendFile(path.join(frontendDistPath, "index.html"));
	});
}

app.use(notFoundHandler);

app.use((err, req, res, next) => {
	if (err.type === "entity.parse.failed") {
		return res.status(400).json({
			message: "Invalid JSON in request body. Vui lòng kiểm tra định dạng JSON."
		});
	}
	if (err.message === "Not allowed by CORS") {
		return res.status(403).json({ message: "Origin not allowed" });
	}
	console.error("Server error:", {
		message: err.message,
		request: req.safeLog,
	});
	return errorHandler(err, req, res, next);
});

const server = app.listen(PORT, () => {
	console.log("Server is running on http://localhost:" + PORT);
	connectDB();
});

server.on('error', (err) => {
	if (err.code === 'EADDRINUSE') {
		console.error(`Port ${PORT} is already in use. Stop the existing process and start the backend again.`);
		process.exit(1);
	} else {
		console.error('Server error:', err);
		process.exit(1);
	}
});
