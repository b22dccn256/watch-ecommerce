import express from "express";
import { protectRoute, managementRoute } from "../middleware/auth.middleware.js";
import { 
	// Admin routes
	getInbox, markContactRead, replyToContact,
	getSubscribers, exportSubscribers,
	getTemplates, createTemplate, updateTemplate,
	getCampaigns, createCampaign, sendCampaignNow, scheduleCampaign,
	// Public/Tracking routes
	subscribeNewsletter, trackOpen, trackClick, unsubscribe
} from "../controllers/mail.controller.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiting for public tracking to prevent abuse
const trackingLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 100, // 100 requests per IP
	message: "Too many tracking requests."
});

// --- Public / Tracking Routes ---
router.post("/subscribe", trackingLimiter, subscribeNewsletter);
router.get("/track/open/:logId", trackingLimiter, trackOpen);
router.get("/track/click/:logId", trackingLimiter, trackClick);
router.get("/unsubscribe/:email", trackingLimiter, unsubscribe);

// --- Admin Protected Routes ---
// Inbox
router.get("/inbox", protectRoute, managementRoute, getInbox);
router.patch("/inbox/:id/read", protectRoute, managementRoute, markContactRead);
router.post("/inbox/:id/reply", protectRoute, managementRoute, replyToContact);

// Subscribers
router.get("/subscribers", protectRoute, managementRoute, getSubscribers);
router.get("/subscribers/export", protectRoute, managementRoute, exportSubscribers);

// Templates
router.get("/templates", protectRoute, managementRoute, getTemplates);
router.post("/templates", protectRoute, managementRoute, createTemplate);
router.put("/templates/:id", protectRoute, managementRoute, updateTemplate);

// Campaigns
router.get("/campaigns", protectRoute, managementRoute, getCampaigns);
router.post("/campaigns", protectRoute, managementRoute, createCampaign);
router.post("/campaigns/:id/send", protectRoute, managementRoute, sendCampaignNow);
router.post("/campaigns/:id/schedule", protectRoute, managementRoute, scheduleCampaign);

export default router;
