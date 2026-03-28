import express from "express";
import { getConfig, updateConfig } from "../controllers/storeConfig.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getConfig); // Guest users need this for layout rendering
router.put("/", protectRoute, adminRoute, updateConfig); // Only admin updates

export default router;
