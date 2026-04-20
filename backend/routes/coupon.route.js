import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { getCoupon, validateCoupon, getAllCoupons } from "../controllers/coupon.controller.js";

const router = express.Router();

// Admin routes
router.get("/", protectRoute, adminRoute, getAllCoupons);

// User routes
router.get("/user", protectRoute, getCoupon);
router.post("/validate", protectRoute, validateCoupon);

export default router;
