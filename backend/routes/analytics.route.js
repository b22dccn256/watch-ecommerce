import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { getAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

// GET /api/analytics?days=7 (default 7, also accepts 30, 90)
router.get("/", protectRoute, adminRoute, getAnalytics);

export default router;
