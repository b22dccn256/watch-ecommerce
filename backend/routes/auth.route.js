import express from "express";
import rateLimit from "express-rate-limit";
import { 
	login, logout, signup, refreshToken, getProfile, getAllUsers, 
	deleteUser, updateUserRole, updateProfile, changePassword, 
	verifyOTP, resendOTP, getAuditLogs,
	verifyEmail, requestVerifyEmail, resendVerificationEmail,
} from "../controllers/auth.controller.js";
import { protectRoute, adminRoute, managementRoute } from "../middleware/auth.middleware.js";
import { checkPermission } from "../middleware/permission.middleware.js";

// ─── Rate Limiters ──────────────────────────────────────────────────────────────
// Signup: max 5 attempts per 15 minutes per IP
const signupLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Quá nhiều yêu cầu đăng ký từ IP này. Vui lòng thử lại sau 15 phút." },
});

// Keep express-level rate limiting as fallback. Thực tế đang sử dụng Redis-based limiter trong middleware.
const resendVerifyLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Vui lòng đợi 1 phút trước khi yêu cầu gửi lại email xác thực." },
});

const router = express.Router();

router.post("/signup", signupLimiter, signup);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", (req, res, next) => {
	if (!req.cookies.accessToken && !req.cookies.refreshToken) {
		return res.json(null);
	}
	protectRoute(req, res, next);
}, getProfile);

router.patch("/profile", protectRoute, updateProfile);
router.patch("/change-password", protectRoute, changePassword);

// Email verification routes
router.post("/request-verify-email", protectRoute, requestVerifyEmail);
router.post("/verify-email", verifyEmail); // POST body: { token }
router.post("/resend-verification", protectRoute, resendVerifyLimiter, resendVerificationEmail);

// User Management - Admin & Staff (Admin only for DELETE and ROLE change)
router.get("/users", protectRoute, managementRoute, getAllUsers);
router.delete("/users/:id", protectRoute, adminRoute, checkPermission(["staff", "customer"], "DELETE_USER"), deleteUser);
router.patch("/users/:id/role", protectRoute, adminRoute, checkPermission(["staff", "customer"], "UPDATE_USER_ROLE"), updateUserRole);

// Audit Logs - Admin & Staff
router.get("/audit-logs", protectRoute, managementRoute, getAuditLogs);

export default router;
