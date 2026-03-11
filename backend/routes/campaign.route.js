import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createCampaign, getAllCampaigns, toggleCampaignStatus, deleteCampaign, getActiveCampaigns } from "../controllers/campaign.controller.js";

const router = express.Router();

router.get("/active", getActiveCampaigns); // Public route
router.get("/", protectRoute, adminRoute, getAllCampaigns);
router.post("/", protectRoute, adminRoute, createCampaign);
router.patch("/:id", protectRoute, adminRoute, toggleCampaignStatus);
router.delete("/:id", protectRoute, adminRoute, deleteCampaign);

export default router;
