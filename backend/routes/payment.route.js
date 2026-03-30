import express from "express";
import { protectRoute, optionalRoute } from "../middleware/auth.middleware.js";
import { ipWhitelist } from "../middleware/ipWhitelist.middleware.js";
import { checkoutSuccess, createCheckoutSession, stripeWebhook, vnpayIpn, momoIpn, zalopayIpn } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", optionalRoute, createCheckoutSession);
router.post("/checkout-success", protectRoute, checkoutSuccess);
router.post("/webhook", express.raw({ type: 'application/json' }), stripeWebhook);

router.get("/vnpay/ipn", ipWhitelist("vnpay"), vnpayIpn);
router.post("/momo/ipn", ipWhitelist("momo"), momoIpn);
router.post("/zalopay/ipn", ipWhitelist("zalopay"), zalopayIpn);

export default router;
