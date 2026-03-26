import express from "express";
import { 
	login, logout, signup, refreshToken, getProfile, getAllUsers, 
	deleteUser, updateUserRole, updateProfile, changePassword, 
	verifyOTP, resendOTP, getAuditLogs 
} from "../controllers/auth.controller.js";
import { protectRoute, adminRoute, managementRoute } from "../middleware/auth.middleware.js";
import { checkPermission } from "../middleware/permission.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);
router.patch("/profile", protectRoute, updateProfile);
router.patch("/change-password", protectRoute, changePassword);

// User Management - Admin & Staff (Admin only for DELETE and ROLE change)
router.get("/users", protectRoute, managementRoute, getAllUsers);
router.delete("/users/:id", protectRoute, adminRoute, checkPermission(["staff", "customer"], "DELETE_USER"), deleteUser);
router.patch("/users/:id/role", protectRoute, adminRoute, checkPermission(["staff", "customer"], "UPDATE_USER_ROLE"), updateUserRole);

// Audit Logs - Admin & Staff
router.get("/audit-logs", protectRoute, managementRoute, getAuditLogs);

export default router;
