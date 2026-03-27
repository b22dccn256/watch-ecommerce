import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createReview, getProductReviews } from "../controllers/review.controller.js";

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.post("/product/:productId", protectRoute, createReview);

export default router;
