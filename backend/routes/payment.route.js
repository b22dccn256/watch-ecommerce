import express from "express";
import { protectRoute, optionalRoute } from "../middleware/auth.middleware.js";
import { ipWhitelist } from "../middleware/ipWhitelist.middleware.js";
import {
  checkoutSuccess,
  createCheckoutSession,
  stripeWebhook,
  vnpayIpn,
  verifyPaymentReturn,
  recreateVNPayUrl,
  changePaymentMethod,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", optionalRoute, createCheckoutSession);
router.post("/checkout-success", optionalRoute, checkoutSuccess);
router.post("/verify-return", optionalRoute, verifyPaymentReturn);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

router.post("/recreate-vnpay-url", optionalRoute, recreateVNPayUrl);
router.post("/change-payment-method", optionalRoute, changePaymentMethod);

router.get("/vnpay/ipn", ipWhitelist("vnpay"), vnpayIpn);
router.get("/vnpay-ipn", ipWhitelist("vnpay"), vnpayIpn);

export default router;
