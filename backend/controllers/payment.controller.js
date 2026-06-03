import fs from "fs";
import crypto from "crypto";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import ProcessedIPN from "../models/processedIPN.model.js";
import { stripe } from "../lib/stripe.js";
import {
  handlePaymentSuccess,
  handlePaymentExpired,
  createStripeCoupon,
  createNewCoupon,
} from "../services/payment.service.js";
import OrderService from "../services/order.service.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { emailQueue } from "./mail.controller.js";
import {
  createVNPayPayment,
  verifyVNPayReturn,
  verifyVNPayIPN,
} from "../services/payment.service.js";
import { alertPaymentIssue } from "../lib/payment-alerts.js";
import { createCODOrder } from "./order.controller.js";
import { getCouponDiscountAmount } from "../lib/coupon.js";
import { processIPN } from "../services/ipn.service.js";

// Helper: lấy IP client (x-forwarded-for > req.ip > remote address)
const getClientIp = (req) => {
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    return xff.split(",")[0].trim();
  }
  if (req.ip) {
    return req.ip.replace(/^::ffff:/, "");
  }
  return req.connection?.remoteAddress
    ? req.connection.remoteAddress.replace(/^::ffff:/, "")
    : null;
};

export const createCheckoutSession = async (req, res) => {
  let sessionOpts = null;
  try {
    const {
      products,
      couponCode,
      shippingDetails,
      paymentMethod = "stripe",
    } = req.body;
    const normalizedShippingDetails = {
      ...shippingDetails,
      email: req.user?.email || shippingDetails?.email || "",
    };

    if (paymentMethod === "cod") {
      return createCODOrder(req, res);
    }

    sessionOpts = await mongoose.startSession();
    sessionOpts.startTransaction();

    if (!products || !Array.isArray(products) || products.length === 0) {
      await sessionOpts.abortTransaction();
      sessionOpts.endSession();
      return res.status(400).json({ error: "Invalid or empty products array" });
    }
    if (
      !normalizedShippingDetails?.fullName?.trim() ||
      !normalizedShippingDetails?.address?.trim() ||
      !normalizedShippingDetails?.city?.trim() ||
      !normalizedShippingDetails?.phoneNumber?.trim()
    ) {
      await sessionOpts.abortTransaction();
      sessionOpts.endSession();
      return res.status(400).json({ message: "Thiếu thông tin giao hàng." });
    }

    const orderCode = OrderService.generateOrderCode();
    const newOrderId = new mongoose.Types.ObjectId();

    await OrderService.deductStock(
      products,
      sessionOpts,
      newOrderId,
      req.user?._id,
      "Thanh toán Stripe",
    );

    let coupon = null;
    if (couponCode) {
      const code = couponCode.trim().toUpperCase();
      coupon = await Coupon.findOne({ code, isActive: true }).session(
        sessionOpts,
      );
      if (
        coupon &&
        coupon.userId &&
        (!req.user || String(coupon.userId) !== String(req.user._id))
      ) {
        // coupon reserved for another user
        coupon = null;
      }
    }
    const { subtotal, discount, shippingFee } =
      await OrderService.calculateTotals(
        products,
        coupon,
        normalizedShippingDetails?.city,
        sessionOpts,
      );
    let dbTotalAmount = subtotal - discount + shippingFee;

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price); // VND has no decimal cents
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "vnd",
          product_data: {
            name: product.name,
            // images: [product.image], // Bỏ images để tránh lỗi URL relative (Stripe bắt buộc https)
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    totalAmount -= getCouponDiscountAmount(coupon, totalAmount);

    if (totalAmount > 0 && totalAmount < 2000000) {
      totalAmount += 30000;
      lineItems.push({
        price_data: {
          currency: "vnd",
          product_data: {
            name: "Phí vận chuyển",
          },
          unit_amount: 30000,
        },
        quantity: 1,
      });
    }

    const newOrder = new Order({
      _id: newOrderId,
      ...(req.user && { user: req.user._id }),
      products: products.map((p) => ({
        product: p._id || p.id,
        quantity: p.quantity,
        price: p.price,
        wristSize: p.wristSize || null,
        selectedColor: p.selectedColor || null,
        selectedSize: p.selectedSize || null,
      })),
      totalAmount: dbTotalAmount,
      subtotal,
      discountAmount: discount,
      shippingFee,
      couponCode: couponCode || "",
      orderCode,
      trackingToken: crypto.randomUUID(),
      shippingDetails: normalizedShippingDetails,
      paymentMethod: paymentMethod,
      paymentStatus: "pending",
      status: "pending",
    });

    let sessionResponse = {};

    if (paymentMethod === "stripe") {
      if (totalAmount < 10000) {
        await sessionOpts.abortTransaction();
        sessionOpts.endSession();
        return res
          .status(400)
          .json({
            message: "Giá trị đơn hàng tối thiểu qua Stripe là 10.000 VNĐ",
          });
      }

      if (totalAmount > 99999999) {
        await sessionOpts.abortTransaction();
        sessionOpts.endSession();
        return res
          .status(400)
          .json({
            message:
              "Tổng đơn hàng vượt quá giới hạn 99.999.999 VNĐ của cổng thanh toán Stripe. Vui lòng chọn VNPay hoặc COD.",
          });
      }

      if (!stripe) {
        await sessionOpts.abortTransaction();
        sessionOpts.endSession();
        return res
          .status(500)
          .json({
            message: "Stripe chưa cấu hình (STRIPE_SECRET_KEY missing).",
          });
      }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
        expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
        discounts: coupon ? [{ coupon: await createStripeCoupon(coupon) }] : [],
        metadata: {
          userId: req.user ? req.user._id.toString() : "guest",
          userEmail: req.user
            ? req.user.email
            : normalizedShippingDetails.email,
          couponCode: couponCode || "",
          orderId: newOrder._id.toString(),
        },
      });
      newOrder.stripeSessionId = session.id;
      sessionResponse = {
        id: session.id,
        url: session.url,
        totalAmount: totalAmount,
      };
    } else if (paymentMethod === "vnpay") {
      const url = createVNPayPayment(newOrder, req);
      sessionResponse = { url, totalAmount: totalAmount };
    } else if (paymentMethod === "cod") {
      newOrder.status = "confirmed"; // COD được confirm luôn (có thể chờ phone verification sau tuỳ quy trình)
      sessionResponse = {
        url: `${process.env.CLIENT_URL}/purchase-success?order_id=${newOrder._id}&tracking_token=${newOrder.trackingToken}`,
        totalAmount: totalAmount,
        isCod: true,
      };
    }

    await newOrder.save({ session: sessionOpts });

    // Clear user cart
    if (req.user) {
      const orderedVariants = products.map((p) => ({
        productId: (p._id || p.id).toString(),
        wristSize: p.wristSize || null,
        selectedColor: p.selectedColor || null,
        selectedSize: p.selectedSize || null,
      }));
      req.user.cartItems = req.user.cartItems.filter((item) => {
        if (!item.product) return true;
        const matchesOrderedVariant = orderedVariants.some(
          (v) =>
            item.product.toString() === v.productId &&
            (item.wristSize || null) === v.wristSize &&
            (item.selectedColor || null) === v.selectedColor &&
            (item.selectedSize || null) === v.selectedSize,
        );
        return !matchesOrderedVariant;
      });
      await req.user.save({ session: sessionOpts });
    }

    await sessionOpts.commitTransaction();
    sessionOpts.endSession();

    // Nếu là COD, gửi email luôn vì không có IPN callback chờ thanh toán online
    if (paymentMethod === "cod") {
      const emailTarget = req.user ? req.user.email : shippingDetails.email;
      if (emailTarget) {
        await emailQueue.add("order-confirmation", {
          email: emailTarget,
          subject: `Xác nhận đơn hàng #${newOrder.orderCode} - Luxury Watch (COD)`,
          order: {
            orderCode: newOrder.orderCode,
            totalAmount: newOrder.totalAmount,
            shippingDetails: newOrder.shippingDetails,
            paymentMethod: "Thanh toán khi nhận hàng (COD)",
          },
        });
      }
    }

    if (req.user && totalAmount >= 5000000) {
      await createNewCoupon(req.user._id);
    }
    // Return trackingToken and orderCode so frontend can poll order status
    res
      .status(200)
      .json({
        ...sessionResponse,
        trackingToken: newOrder.trackingToken,
        orderCode: newOrder.orderCode,
        orderId: newOrder._id,
      });
  } catch (error) {
    if (sessionOpts) {
      await sessionOpts.abortTransaction();
      sessionOpts.endSession();
    }
    console.error("Error processing checkout:", error);
    try {
      fs.appendFileSync(
        "stripe-error.log",
        new Date().toISOString() +
          " - " +
          (error.stack || error.message) +
          "\n",
      );
    } catch (e) {}
    res
      .status(500)
      .json({ message: "Error processing checkout", error: error.message });
  }
};

export const checkoutSuccess = async (req, res) => {
  if (!stripe) {
    return res
      .status(500)
      .json({ message: "Stripe chưa cấu hình (STRIPE_SECRET_KEY missing)." });
  }
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const orderId = session.metadata.orderId;
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });

      res.status(200).json({
        success: true,
        message:
          "Trạng thái được tự động xử lý bởi webhook, chỉ trả về để frontend tiếp tục.",
        orderId: order._id,
        trackingToken: order.trackingToken,
      });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Payment not completed" });
    }
  } catch (error) {
    console.error("Error processing successful checkout:", error);
    res
      .status(500)
      .json({
        message: "Error processing successful checkout",
        error: error.message,
      });
  }
};

export const verifyPaymentReturn = async (req, res) => {
  try {
    const { method, query = {} } = req.body || {};

    if (!method || method !== "vnpay") {
      return res
        .status(400)
        .json({
          verified: false,
          status: "failed",
          message: "Phương thức thanh toán không hợp lệ",
        });
    }

    const orderCode = query.vnp_TxnRef || "";
    if (!verifyVNPayReturn(query)) {
      return res
        .status(400)
        .json({
          verified: false,
          status: "failed",
          message: "Chữ ký VNPay không hợp lệ",
        });
    }

    if (!orderCode) {
      return res
        .status(400)
        .json({
          verified: false,
          status: "failed",
          message: "Không tìm thấy mã đơn hàng từ cổng thanh toán",
        });
    }

    const order = await Order.findOne({ orderCode }).select(
      "orderCode paymentStatus status trackingToken",
    );
    if (!order) {
      return res
        .status(404)
        .json({
          verified: false,
          status: "failed",
          message: "Không tìm thấy đơn hàng",
        });
    }

    const isSuccess = query.vnp_ResponseCode === "00";
    if (isSuccess) {
      try {
        await processIPN({
          provider: "vnpay",
          transactionId: query.vnp_TransactionNo || query.vnp_TxnRef,
          orderCode,
          isSuccess: true,
          payload: query,
        });
      } catch (ipnError) {
        console.warn(
          "Non-critical IPN processing error in verifyPaymentReturn:",
          ipnError.message,
        );
      }
      const refreshedOrder = await Order.findOne({ orderCode }).select(
        "orderCode paymentStatus status trackingToken",
      );
      if (refreshedOrder?.paymentStatus === "paid") {
        return res.json({
          verified: true,
          status: "success",
          message: "Thanh toán đã được xác nhận",
          orderCode: refreshedOrder.orderCode,
          trackingToken: refreshedOrder.trackingToken,
        });
      }
    }

    const refreshedOrder = isSuccess
      ? await Order.findOne({ orderCode }).select(
          "orderCode paymentStatus status trackingToken",
        )
      : order;
    if (refreshedOrder?.paymentStatus === "paid") {
      return res.json({
        verified: true,
        status: "success",
        message: "Thanh toán đã được xác nhận từ hệ thống",
        orderCode: refreshedOrder.orderCode,
        trackingToken: refreshedOrder.trackingToken,
      });
    }

    if (
      !isSuccess ||
      refreshedOrder?.paymentStatus === "failed" ||
      refreshedOrder?.paymentStatus === "cancelled"
    ) {
      return res.json({
        verified: true,
        status: "failed",
        message: "Giao dịch không thành công",
        orderCode: refreshedOrder.orderCode,
      });
    }

    return res.json({
      verified: true,
      status: "success",
      message: "Thanh toán đã được xác nhận",
      orderCode: refreshedOrder.orderCode,
      trackingToken: refreshedOrder.trackingToken,
    });
  } catch (error) {
    console.error("Error in verifyPaymentReturn:", error.message);
    res
      .status(500)
      .json({ verified: false, status: "failed", message: "Server error" });
  }
};

// --- STRIPE WEBHOOK ---
export const stripeWebhook = async (req, res) => {
  if (!stripe) {
    return res
      .status(500)
      .json({
        message:
          "Stripe webhook không thể xử lý vì STRIPE_SECRET_KEY chưa được cấu hình.",
      });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } else {
      // In development/test, allow processing without webhook secret by parsing payload.
      if (process.env.NODE_ENV === "production") {
        console.error("STRIPE_WEBHOOK_SECRET missing in production");
        return res.status(500).send("Stripe webhook not configured");
      }
      console.warn(
        "STRIPE_WEBHOOK_SECRET not set — skipping signature verification (dev only)",
      );
      try {
        const body =
          req.body &&
          typeof req.body === "object" &&
          !(req.body instanceof Buffer)
            ? req.body
            : JSON.parse(req.body.toString());
        event = body;
      } catch (parseErr) {
        console.error(
          "Failed to parse webhook payload without signature:",
          parseErr.message,
        );
        return res.status(400).send("Invalid webhook payload");
      }
    }
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await handlePaymentSuccess(session);
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await handlePaymentExpired(session);
    }

    res.status(200).end();
  } catch (error) {
    console.error("Error handling webhook event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ======================= WEBHOOK IPN NỘI ĐỊA =======================

export const vnpayIpn = async (req, res) => {
  const provider = "vnpay";
  const clientIp = getClientIp(req);
  const body = req.query;
  const transactionId = body.vnp_TransactionNo || body.vnp_TxnRef;
  const orderCode = body.vnp_TxnRef;
  const logMeta = { provider, clientIp, headers: req.headers, body };

  console.info("[vnpay-ipn] received", logMeta);

  if (!verifyVNPayIPN(body)) {
    console.warn("[vnpay-ipn] signature verification failed", logMeta);
    await ProcessedIPN.create({
      provider,
      transactionId,
      orderCode,
      status: "failed",
      payload: body,
    });
    alertPaymentIssue({
      level: "warn",
      type: "vnpay-signature",
      message: "Signature verification failed on VNPay IPN",
      meta: { orderCode, transactionId, clientIp },
    });
    return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
  }

  // Anti-replay timestamp trong 30 phút nếu cung cấp
  if (body.vnp_PayDate) {
    const txnDate = new Date(
      body.vnp_PayDate.replace(/^(.{4})(..)(..)$/, "$1-$2-$3"),
    );
    if (isNaN(txnDate.getTime())) {
      return res
        .status(200)
        .json({ RspCode: "10", Message: "Invalid timestamp" });
    }
    if (Math.abs(Date.now() - txnDate.getTime()) > 30 * 60 * 1000) {
      return res
        .status(200)
        .json({ RspCode: "09", Message: "Timestamp out of acceptable range" });
    }
  }

  try {
    const isSuccess = body.vnp_ResponseCode === "00";
    const result = await processIPN({
      provider,
      transactionId,
      orderCode,
      isSuccess,
      payload: body,
    });

    if (result.alreadyProcessed) {
      return res
        .status(200)
        .json({ RspCode: "02", Message: "Order already confirmed" });
    }
    if (!result.order) {
      return res
        .status(200)
        .json({ RspCode: "01", Message: "Order not found" });
    }

    console.info("[vnpay-ipn] success processed", {
      provider,
      transactionId,
      orderCode,
      clientIp,
    });
    return res.status(200).json({
      RspCode: "00",
      Message: isSuccess ? "Confirm Success" : "Confirm Failed",
    });
  } catch (error) {
    console.error("[vnpay-ipn] error", {
      error,
      provider,
      transactionId,
      orderCode,
      clientIp,
    });
    alertPaymentIssue({
      level: "error",
      type: "vnpay-processing",
      message: "Error processing VNPay IPN",
      meta: { error: error?.message, orderCode, transactionId, clientIp },
    });
    return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
};

export const recreateVNPayUrl = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "Thiếu mã đơn hàng (orderId)" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.paymentStatus === "paid") {
      return res
        .status(400)
        .json({ message: "Đơn hàng này đã được thanh toán" });
    }

    // Recreate VNPay payment URL
    const paymentUrl = createVNPayPayment(order, req);
    res.status(200).json({ paymentUrl });
  } catch (error) {
    console.error("Error recreating VNPay URL:", error);
    res
      .status(500)
      .json({
        message: "Lỗi hệ thống khi tạo lại liên kết thanh toán",
        error: error.message,
      });
  }
};

export const changePaymentMethod = async (req, res) => {
  try {
    const { orderId, method } = req.body;
    if (!orderId || !method) {
      return res
        .status(400)
        .json({ message: "Thiếu mã đơn hàng hoặc phương thức thanh toán mới" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.paymentStatus === "paid") {
      return res
        .status(400)
        .json({
          message:
            "Không thể thay đổi phương thức thanh toán của đơn hàng đã trả tiền",
        });
    }

    if (method.toLowerCase() === "cod") {
      order.paymentMethod = "cod";
      order.status = "confirmed";
      await order.save();

      // Gửi email xác nhận COD ngay lập tức
      const emailTarget = req.user?.email || order.shippingDetails?.email;
      if (emailTarget) {
        try {
          await emailQueue.add("order-confirmation", {
            email: emailTarget,
            subject: `Xác nhận đơn hàng #${order.orderCode} - Luxury Watch (COD)`,
            order: {
              orderCode: order.orderCode,
              totalAmount: order.totalAmount,
              shippingDetails: order.shippingDetails,
              paymentMethod: "Thanh toán khi nhận hàng (COD)",
            },
          });
        } catch (emailErr) {
          console.error(
            "Error sending COD email change confirmation:",
            emailErr,
          );
        }
      }

      return res.status(200).json(order);
    } else {
      return res
        .status(400)
        .json({ message: "Phương thức thanh toán mới không hợp lệ" });
    }
  } catch (error) {
    console.error("Error changing payment method:", error);
    res
      .status(500)
      .json({
        message: "Lỗi hệ thống khi thay đổi phương thức thanh toán",
        error: error.message,
      });
  }
};
