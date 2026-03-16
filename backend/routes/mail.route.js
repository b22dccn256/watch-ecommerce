import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
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
router.get("/inbox", protectRoute, adminRoute, getInbox);
router.patch("/inbox/:id/read", protectRoute, adminRoute, markContactRead);
router.post("/inbox/:id/reply", protectRoute, adminRoute, replyToContact);

// Subscribers
router.get("/subscribers", protectRoute, adminRoute, getSubscribers);
router.get("/subscribers/export", protectRoute, adminRoute, exportSubscribers);

// Templates
router.get("/templates", protectRoute, adminRoute, getTemplates);
router.post("/templates", protectRoute, adminRoute, createTemplate);
router.put("/templates/:id", protectRoute, adminRoute, updateTemplate);

// Campaigns
router.get("/campaigns", protectRoute, adminRoute, getCampaigns);
router.post("/campaigns", protectRoute, adminRoute, createCampaign);
router.post("/campaigns/:id/send", protectRoute, adminRoute, sendCampaignNow);
router.post("/campaigns/:id/schedule", protectRoute, adminRoute, scheduleCampaign);

export default router;
