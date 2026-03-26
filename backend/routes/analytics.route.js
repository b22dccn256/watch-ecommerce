import express from "express";
import { adminRoute, protectRoute, managementRoute } from "../middleware/auth.middleware.js";
import { getAnalytics, sendTestEmail } from "../controllers/analytics.controller.js";

const router = express.Router();

// GET /api/analytics?days=7 (default 7, also accepts 30, 90)
router.get("/", protectRoute, managementRoute, getAnalytics);
router.post("/send-test-email", protectRoute, adminRoute, sendTestEmail);

export default router;
