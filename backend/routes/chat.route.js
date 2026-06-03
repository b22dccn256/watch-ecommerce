import express from "express";
import { getRooms, getRoomMessages, aiSuggest } from "../controllers/chat.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/rooms", protectRoute, adminRoute, getRooms);
router.get("/rooms/:sessionToken/messages", protectRoute, adminRoute, getRoomMessages);
router.post("/ai-suggest", protectRoute, adminRoute, aiSuggest);

export default router;
