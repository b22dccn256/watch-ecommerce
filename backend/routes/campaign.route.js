import express from "express";
import { protectRoute, adminRoute, managementRoute } from "../middleware/auth.middleware.js";
import { checkPermission } from "../middleware/permission.middleware.js";
import { createCampaign, getAllCampaigns, toggleCampaignStatus, deleteCampaign, getActiveCampaigns } from "../controllers/campaign.controller.js";

const router = express.Router();

router.get("/active", getActiveCampaigns); // Public route
router.get("/", protectRoute, managementRoute, getAllCampaigns);
router.post("/", protectRoute, managementRoute, createCampaign);
router.patch("/:id", protectRoute, managementRoute, toggleCampaignStatus);
router.delete("/:id", protectRoute, adminRoute, checkPermission(["staff"], "DELETE_CAMPAIGN"), deleteCampaign);

export default router;
