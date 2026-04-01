import express from "express";
import { login, logout, signup, refreshToken, getProfile, getAllUsers, deleteUser, updateUserRole, updateProfile, changePassword, verifyOTP, resendOTP } from "../controllers/auth.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

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
router.get("/users", protectRoute, adminRoute, getAllUsers);
router.delete("/users/:id", protectRoute, adminRoute, deleteUser);
router.patch("/users/:id/role", protectRoute, adminRoute, updateUserRole);

export default router;
