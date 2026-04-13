import express from "express";
import { login, logout, signup, refreshToken, getProfile, getAllUsers, getAuditLogs, deleteUser, updateUserRole, updateProfile, changePassword, verifyOTP, resendOTP, verifyEmail, resendVerificationEmail } from "../controllers/auth.controller.js";
import { protectRoute, requireEmailVerified, resendVerificationLimiter, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);
router.post("/resend-verification", protectRoute, resendVerificationLimiter, resendVerificationEmail);
router.post("/verify-email", verifyEmail);
router.get("/verify-email", verifyEmail);
router.patch("/profile", protectRoute, requireEmailVerified, updateProfile);
router.patch("/change-password", protectRoute, requireEmailVerified, changePassword);
router.get("/users", protectRoute, adminRoute, getAllUsers);
router.get("/audit-logs", protectRoute, adminRoute, getAuditLogs);
router.delete("/users/:id", protectRoute, adminRoute, deleteUser);
router.patch("/users/:id/role", protectRoute, adminRoute, updateUserRole);

export default router;
