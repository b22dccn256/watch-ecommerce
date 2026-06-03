import express from "express";
import {
  protectRoute,
  managementRoute,
} from "../middleware/auth.middleware.js";
import {
  // Admin routes
  getMailStats,
  getInbox,
  deleteMessage,
  markContactRead,
  replyToContact,
  getSubscribers,
  exportSubscribers,
  deleteSubscriber,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCampaigns,
  createCampaign,
  sendCampaignNow,
  scheduleCampaign,
  // Public/Tracking routes
  subscribeNewsletter,
  trackOpen,
  trackClick,
  unsubscribe,
  unsubscribeByToken,
} from "../controllers/mail.controller.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiting for public tracking to prevent abuse
const trackingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per IP
  message: "Too many tracking requests.",
});

// --- Public / Tracking Routes ---
router.post("/subscribe", trackingLimiter, subscribeNewsletter);
router.get("/track/open/:logId", trackingLimiter, trackOpen);
router.get("/track/click/:logId", trackingLimiter, trackClick);
// C.4: Token-based unsubscribe (secure, no PII in URL)
router.get("/unsubscribe/by-token/:token", trackingLimiter, unsubscribeByToken);
// Legacy email-based unsubscribe kept for backward compatibility
router.get("/unsubscribe/:email", trackingLimiter, unsubscribe);

// --- Admin Protected Routes ---
router.get("/stats", protectRoute, managementRoute, getMailStats);
// Inbox
router.get("/inbox", protectRoute, managementRoute, getInbox);
router.delete("/inbox/:id", protectRoute, managementRoute, deleteMessage);
router.patch("/inbox/:id/read", protectRoute, managementRoute, markContactRead);
router.post("/inbox/:id/reply", protectRoute, managementRoute, replyToContact);

// Subscribers
router.get("/subscribers", protectRoute, managementRoute, getSubscribers);
router.get(
  "/subscribers/export",
  protectRoute,
  managementRoute,
  exportSubscribers,
);
router.delete(
  "/subscribers/:id",
  protectRoute,
  managementRoute,
  deleteSubscriber,
);

// Templates
router.get("/templates", protectRoute, managementRoute, getTemplates);
router.post("/templates", protectRoute, managementRoute, createTemplate);
router.put("/templates/:id", protectRoute, managementRoute, updateTemplate);
router.delete("/templates/:id", protectRoute, managementRoute, deleteTemplate);

// Campaigns
router.get("/campaigns", protectRoute, managementRoute, getCampaigns);
router.post("/campaigns", protectRoute, managementRoute, createCampaign);
router.post(
  "/campaigns/:id/send",
  protectRoute,
  managementRoute,
  sendCampaignNow,
);
router.post(
  "/campaigns/:id/schedule",
  protectRoute,
  managementRoute,
  scheduleCampaign,
);

export default router;
