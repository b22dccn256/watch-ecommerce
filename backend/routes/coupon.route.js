import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
  getCoupon,
  validateCoupon,
  getAllCoupons,
  createCoupon,
  deleteCoupon,
  toggleCoupon,
} from "../controllers/coupon.controller.js";
import {
  validateBody,
  couponSchemas,
} from "../middleware/validation.middleware.js";

const router = express.Router();

// Admin routes
router.get("/", protectRoute, adminRoute, getAllCoupons);
router.post(
  "/",
  protectRoute,
  adminRoute,
  validateBody(couponSchemas.create),
  createCoupon,
);
router.delete("/:id", protectRoute, adminRoute, deleteCoupon);
router.patch("/:id/toggle", protectRoute, adminRoute, toggleCoupon);

// User routes
router.get("/user", protectRoute, getCoupon);
router.post("/validate", protectRoute, validateCoupon);

export default router;
