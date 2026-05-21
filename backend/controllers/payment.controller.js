import fs from "fs";
import crypto from "crypto";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import ProcessedIPN from "../models/processedIPN.model.js";
import { stripe } from "../lib/stripe.js";
import { handlePaymentSuccess, handlePaymentExpired, createStripeCoupon, createNewCoupon } from "../services/payment.service.js";
import OrderService from "../services/order.service.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { emailQueue } from "./mail.controller.js";
import { createVNPayPayment, createMoMoPayment, createZaloPayPayment, vnpayInstance } from "../services/payment.service.js";
import { alertPaymentIssue } from '../lib/payment-alerts.js';
import { createCODOrder, createQROrder } from "./order.controller.js";
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
	return req.connection?.remoteAddress ? req.connection.remoteAddress.replace(/^::ffff:/, "") : null;
};

// Verify VNPay secure hash theo thuật toán
const verifyVnpaySignature = (query) => {
	// Use VNP_HASH_SECRET (preferred) or fallback to legacy VNPAY_HASH_SECRET / VNP_SECRET
	const secretKey = process.env.VNP_HASH_SECRET || process.env.VNPAY_HASH_SECRET || process.env.VNP_SECRET || "";
	if (!secretKey) {
		return false;
	}
	const secureHash = query.vnp_SecureHash || query.vnp_SecureHash?.toLowerCase();
	if (!secureHash) {
		return false;
	}

	// Loại bỏ vnp_SecureHash/vnp_SecureHashType trước khi tạo string
	const clone = { ...query };
	delete clone.vnp_SecureHash;
	delete clone.vnp_SecureHashType;

	const keys = Object.keys(clone).sort();
	const raw = keys
		.filter((k) => clone[k] !== undefined && clone[k] !== null && clone[k] !== "")
		.map((k) => `${k}=${clone[k]}`)
		.join("&");

	const hashed = crypto.createHmac("sha512", secretKey).update(raw, "utf8").digest("hex");
	return hashed.toLowerCase() === secureHash.toLowerCase();
};

// Verify MoMo signature HMAC-SHA256
const verifyMomoSignature = (body) => {
	const secretKey = process.env.MOMO_SECRET_KEY || "";
	if (!secretKey || !body.signature) return false;

	const rawSignature = `partnerCode=${body.partnerCode}&accessKey=${process.env.MOMO_ACCESS_KEY}&requestId=${body.requestId}&amount=${body.amount}&orderId=${body.orderId}&orderInfo=${body.orderInfo}&orderType=${body.orderType}&transId=${body.transId}&resultCode=${body.resultCode}&message=${body.message}&payType=${body.payType}&responseTime=${body.responseTime}&extraData=${body.extraData}`;
	const computed = crypto.createHmac("sha256", secretKey).update(rawSignature, "utf8").digest("hex");
	return computed === body.signature;
};

// Verify ZaloPay HMAC-SHA256
const verifyZaloPayMac = (body) => {
	const key2 = process.env.ZALOPAY_KEY2 || "";
	if (!key2 || !body.mac) return false;

	const computed = crypto.createHmac("sha256", key2).update(body.data, "utf8").digest("hex");
	return computed === body.mac;
};

export const createCheckoutSession = async (req, res) => {
	let sessionOpts = null;
	try {
		const { products, couponCode, shippingDetails, paymentMethod = "stripe" } = req.body;

		if (paymentMethod === "cod") {
			return createCODOrder(req, res);
		}

		if (paymentMethod === "qr") {
			return createQROrder(req, res);
		}

		sessionOpts = await mongoose.startSession();
		sessionOpts.startTransaction();

		if (!products || !Array.isArray(products) || products.length === 0) {
			await sessionOpts.abortTransaction();
			sessionOpts.endSession();
			return res.status(400).json({ error: "Invalid or empty products array" });
		}
		if (!shippingDetails) {
			await sessionOpts.abortTransaction();
			sessionOpts.endSession();
			return res.status(400).json({ message: "Thiếu thông tin giao hàng." });
		}

		const orderCode = OrderService.generateOrderCode();
		const newOrderId = new mongoose.Types.ObjectId();

		await OrderService.deductStock(products, sessionOpts, newOrderId, req.user?._id, "Thanh toán Stripe");

		let coupon = null;
		if (couponCode) {
			const code = couponCode.trim().toUpperCase();
			coupon = await Coupon.findOne({ code, isActive: true }).session(sessionOpts);
			if (coupon && coupon.userId && (!req.user || String(coupon.userId) !== String(req.user._id))) {
				// coupon reserved for another user
				coupon = null;
			}
		}
		const { subtotal, discount, shippingFee } = await OrderService.calculateTotals(products, coupon, shippingDetails?.city, sessionOpts);
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
			products: products.map(p => ({
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
			couponCode: couponCode || '',
			orderCode,
			trackingToken: crypto.randomUUID(),
			shippingDetails,
			paymentMethod: paymentMethod,
			paymentStatus: "pending",
			status: "pending"
		});

		let sessionResponse = {};

		if (paymentMethod === "stripe") {
			if (totalAmount < 10000) {
				await sessionOpts.abortTransaction();
				sessionOpts.endSession();
				return res.status(400).json({ message: "Giá trị đơn hàng tối thiểu qua Stripe là 10.000 VNĐ" });
			}

			if (totalAmount > 99999999) {
				await sessionOpts.abortTransaction();
				sessionOpts.endSession();
				return res.status(400).json({ message: "Tổng đơn hàng vượt quá giới hạn 99.999.999 VNĐ của cổng thanh toán Stripe. Vui lòng chọn chuyển khoản QR hoặc thanh toán COD." });
			}

			if (!stripe) {
				await sessionOpts.abortTransaction();
				sessionOpts.endSession();
				return res.status(500).json({ message: "Stripe chưa cấu hình (STRIPE_SECRET_KEY missing)." });
			}
			const session = await stripe.checkout.sessions.create({
				payment_method_types: ["card"],
				line_items: lineItems,
				mode: "payment",
				success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
				expires_at: Math.floor(Date.now() / 1000) + (31 * 60),
				discounts: coupon
					? [{ coupon: await createStripeCoupon(coupon) }]
					: [],
				metadata: {
					userId: req.user ? req.user._id.toString() : "guest",
					userEmail: req.user ? req.user.email : shippingDetails.email,
					couponCode: couponCode || "",
					orderId: newOrder._id.toString(),
				},
			});
			newOrder.stripeSessionId = session.id;
			sessionResponse = { id: session.id, url: session.url, totalAmount: totalAmount };
		} else if (paymentMethod === "vnpay") {
			const url = createVNPayPayment(newOrder, req);
			sessionResponse = { url, totalAmount: totalAmount };
		} else if (paymentMethod === "momo") {
			const url = await createMoMoPayment(newOrder);
			sessionResponse = { url, totalAmount: totalAmount };
		} else if (paymentMethod === "zalopay") {
			const url = await createZaloPayPayment(newOrder);
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
			const orderedVariants = products.map(p => ({
				productId: (p._id || p.id).toString(),
				wristSize: p.wristSize || null,
				selectedColor: p.selectedColor || null,
				selectedSize: p.selectedSize || null,
			}));
			req.user.cartItems = req.user.cartItems.filter(item => {
				if (!item.product) return true;
				const matchesOrderedVariant = orderedVariants.some(v =>
					item.product.toString() === v.productId
					&& (item.wristSize || null) === v.wristSize
					&& (item.selectedColor || null) === v.selectedColor
					&& (item.selectedSize || null) === v.selectedSize
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
						paymentMethod: "Thanh toán khi nhận hàng (COD)"
					}
				});
			}
		}

		if (req.user && totalAmount >= 5000000) {
			await createNewCoupon(req.user._id);
		}
		// Return trackingToken and orderCode so frontend can poll order status
		res.status(200).json({ ...sessionResponse, trackingToken: newOrder.trackingToken, orderCode: newOrder.orderCode, orderId: newOrder._id });
	} catch (error) {
		if (sessionOpts) {
			await sessionOpts.abortTransaction();
			sessionOpts.endSession();
		}
		console.error("Error processing checkout:", error);
		try { fs.appendFileSync("stripe-error.log", new Date().toISOString() + " - " + (error.stack || error.message) + "\n"); } catch (e) { }
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};

export const checkoutSuccess = async (req, res) => {
	if (!stripe) {
		return res.status(500).json({ message: "Stripe chưa cấu hình (STRIPE_SECRET_KEY missing)." });
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
				message: "Trạng thái được tự động xử lý bởi webhook, chỉ trả về để frontend tiếp tục.",
				orderId: order._id,
				trackingToken: order.trackingToken,
			});
		} else {
			res.status(400).json({ success: false, message: "Payment not completed" });
		}
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ message: "Error processing successful checkout", error: error.message });
	}
};

export const verifyPaymentReturn = async (req, res) => {
	try {
		const { method, query = {} } = req.body || {};

		if (!method || !["vnpay", "momo", "zalopay"].includes(method)) {
			return res.status(400).json({ verified: false, status: "failed", message: "Phương thức thanh toán không hợp lệ" });
		}

		let orderCode = "";
		if (method === "vnpay") {
			orderCode = query.vnp_TxnRef || "";
			if (!verifyVnpaySignature(query)) {
				return res.status(400).json({ verified: false, status: "failed", message: "Chữ ký VNPay không hợp lệ" });
			}
		} else if (method === "momo") {
			orderCode = query.orderId || "";
		} else if (method === "zalopay") {
			const apptransid = query.apptransid || "";
			orderCode = apptransid ? apptransid.split("_")[1] || "" : "";
		}

		if (!orderCode) {
			return res.status(400).json({ verified: false, status: "failed", message: "Không tìm thấy mã đơn hàng từ cổng thanh toán" });
		}

		const order = await Order.findOne({ orderCode }).select("orderCode paymentStatus status trackingToken");
		if (!order) {
			return res.status(404).json({ verified: false, status: "failed", message: "Không tìm thấy đơn hàng" });
		}

		if (order.paymentStatus === "paid") {
			return res.json({
				verified: true,
				status: "success",
				message: "Thanh toán đã được xác nhận từ hệ thống",
				orderCode: order.orderCode,
				trackingToken: order.trackingToken,
			});
		}

		if (order.paymentStatus === "failed" || order.paymentStatus === "cancelled") {
			return res.json({
				verified: true,
				status: "failed",
				message: "Giao dịch không thành công",
				orderCode: order.orderCode,
			});
		}

		return res.json({
			verified: true,
			status: "pending",
			message: "Thanh toán đang được đối soát, vui lòng chờ trong giây lát",
			orderCode: order.orderCode,
			trackingToken: order.trackingToken,
		});
	} catch (error) {
		console.error("Error in verifyPaymentReturn:", error.message);
		res.status(500).json({ verified: false, status: "failed", message: "Server error" });
	}
};

// --- STRIPE WEBHOOK ---
export const stripeWebhook = async (req, res) => {
	if (!stripe) {
		return res.status(500).json({ message: "Stripe webhook không thể xử lý vì STRIPE_SECRET_KEY chưa được cấu hình." });
	}

	const sig = req.headers['stripe-signature'];
	let event;

	try {
		if (process.env.STRIPE_WEBHOOK_SECRET) {
			event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
		} else {
			// In development/test, allow processing without webhook secret by parsing payload.
			if (process.env.NODE_ENV === 'production') {
				console.error('STRIPE_WEBHOOK_SECRET missing in production');
				return res.status(500).send('Stripe webhook not configured');
			}
			console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification (dev only)');
			try {
				const body = req.body && typeof req.body === 'object' && !(req.body instanceof Buffer) ? req.body : JSON.parse(req.body.toString());
				event = body;
			} catch (parseErr) {
				console.error('Failed to parse webhook payload without signature:', parseErr.message);
				return res.status(400).send('Invalid webhook payload');
			}
		}
	} catch (err) {
		console.error("⚠️ Webhook signature verification failed.", err.message);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	try {
		if (event.type === 'checkout.session.completed') {
			const session = event.data.object;
			await handlePaymentSuccess(session);
		} else if (event.type === 'checkout.session.expired') {
			const session = event.data.object;
			await handlePaymentExpired(session);
		}

		res.status(200).end();
	} catch (error) {
		console.error("Error handling webhook event:", error);
		res.status(500).json({ error: 'Internal server error' });
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

	if (!verifyVnpaySignature(body)) {
		console.warn("[vnpay-ipn] signature verification failed", logMeta);
		await ProcessedIPN.create({ provider, transactionId, orderCode, status: "failed", payload: body });
		alertPaymentIssue({ level: 'warn', type: 'vnpay-signature', message: 'Signature verification failed on VNPay IPN', meta: { orderCode, transactionId, clientIp } });
		return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
	}

	// Anti-replay timestamp trong 30 phút nếu cung cấp
	if (body.vnp_PayDate) {
		const txnDate = new Date(body.vnp_PayDate.replace(/^(.{4})(..)(..)$/, "$1-$2-$3"));
		if (isNaN(txnDate.getTime())) {
			return res.status(200).json({ RspCode: "10", Message: "Invalid timestamp" });
		}
		if (Math.abs(Date.now() - txnDate.getTime()) > 30 * 60 * 1000) {
			return res.status(200).json({ RspCode: "09", Message: "Timestamp out of acceptable range" });
		}
	}

	try {
		const isSuccess = body.vnp_ResponseCode === "00";
		const result = await processIPN({
			provider,
			transactionId,
			orderCode,
			isSuccess,
			payload: body
		});

		if (result.alreadyProcessed) {
			return res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
		}
		if (!result.order) {
			return res.status(200).json({ RspCode: "01", Message: "Order not found" });
		}

		console.info("[vnpay-ipn] success processed", { provider, transactionId, orderCode, clientIp });
		return res.status(200).json({
			RspCode: "00",
			Message: isSuccess ? "Confirm Success" : "Confirm Failed"
		});
	} catch (error) {
		console.error("[vnpay-ipn] error", { error, provider, transactionId, orderCode, clientIp });
		alertPaymentIssue({ level: 'error', type: 'vnpay-processing', message: 'Error processing VNPay IPN', meta: { error: error?.message, orderCode, transactionId, clientIp } });
		return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
	}
};



// MoMo IPN handler: verify signature, transaction, logging, queue email
export const momoIpn = async (req, res) => {
	const provider = "momo";
	const clientIp = getClientIp(req);
	const body = req.body;
	const transactionId = body.transId;
	const orderCode = body.orderId || body.extraData || body.order_code;
	console.info("[momo-ipn] received", { provider, clientIp, headers: req.headers, body });

	if (!verifyMomoSignature(body)) {
		console.warn("[momo-ipn] signature invalid", { provider, clientIp, transactionId, orderCode });
		return res.status(200).json({ resultCode: 94, message: "Signature mismatch" });
	}

	try {
		const isSuccess = Number(body.resultCode) === 0;
		const result = await processIPN({
			provider,
			transactionId,
			orderCode,
			isSuccess,
			payload: body
		});

		if (result.alreadyProcessed) {
			return res.status(200).json({ resultCode: 2, message: "Order already paid" });
		}
		if (!result.order) {
			return res.status(200).json({ resultCode: 1, message: "Order not found" });
		}

		return res.status(200).json({
			resultCode: 0,
			message: isSuccess ? "Confirm Success" : "Confirm Failed"
		});
	} catch (error) {
		console.error("[momo-ipn] error", { error, provider, clientIp, transactionId, orderCode });
		return res.status(200).json({ resultCode: 99, message: "Unknown error" });
	}
};



// ZaloPay IPN handler: verify signature, transaction, logging, queue email
export const zalopayIpn = async (req, res) => {
	const provider = "zalopay";
	const clientIp = getClientIp(req);
	const body = req.body;
	const transactionId = body.zp_trans_id;
	console.info("[zalopay-ipn] received", { provider, clientIp, headers: req.headers, body });

	if (!verifyZaloPayMac(body)) {
		console.warn("[zalopay-ipn] mac invalid", { provider, clientIp, transactionId });
		return res.status(200).json({ return_code: -1, return_message: "MAC mismatch" });
	}

	const parsed = JSON.parse(body.data);
	const orderCode = parsed.order_id || parsed.app_trans_id?.split("_")[1];
	const resultCode = Number(parsed.return_code);

	try {
		const isSuccess = resultCode === 1;
		const result = await processIPN({
			provider,
			transactionId,
			orderCode,
			isSuccess,
			payload: body
		});

		if (result.alreadyProcessed) {
			return res.status(200).json({ return_code: 2, return_message: "Order already paid" });
		}
		if (!result.order) {
			return res.status(200).json({ return_code: 1, return_message: "Order not found" });
		}

		return res.status(200).json({
			return_code: 1,
			return_message: "Confirm Success"
		});
	} catch (error) {
		console.error("[zalopay-ipn] error", { error, provider, clientIp, transactionId, orderCode });
		return res.status(200).json({ return_code: -99, return_message: "Unknown error" });
	}
};
