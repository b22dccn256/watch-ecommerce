import express from "express";
import { chatWithAI, confirmOrdersAI, cleanupUsersAI } from "../controllers/ai.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/chat", chatWithAI);

// Target.md 10đ AI Automations
router.post("/automation/confirm-orders", protectRoute, adminRoute, confirmOrdersAI);
router.post("/automation/cleanup-users", protectRoute, adminRoute, cleanupUsersAI);

export default router;
