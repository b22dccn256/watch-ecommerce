import express from "express";
import { protectRoute, managementRoute } from "../middleware/auth.middleware.js";
import { createReview, getProductReviews, listAllReviews, updateReviewStatus, deleteReview } from "../controllers/review.controller.js";

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.post("/product/:productId", protectRoute, createReview);
router.get("/", protectRoute, managementRoute, listAllReviews);
router.patch("/:id/status", protectRoute, managementRoute, updateReviewStatus);
router.delete("/:id", protectRoute, managementRoute, deleteReview);

export default router;
