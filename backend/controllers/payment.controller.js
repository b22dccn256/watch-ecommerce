import fs from "fs";
import crypto from "crypto";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import ProcessedIPN from "../models/processedIPN.model.js";
import { stripe } from "../lib/stripe.js";
import OrderService from "../services/order.service.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { emailQueue } from "./mail.controller.js";
import { createVNPayPayment, createMoMoPayment, createZaloPayPayment, vnpayInstance } from "../services/payment.service.js";

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
	const secretKey = process.env.VNPAY_HASH_SECRET || "";
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
	const sessionOpts = await mongoose.startSession();
	sessionOpts.startTransaction();

	try {
		const { products, couponCode, shippingDetails, paymentMethod = "stripe" } = req.body;

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

		const coupon = (couponCode && req.user) ? await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true }).session(sessionOpts) : null;
		let dbTotalAmount = await OrderService.calculateTotalAmount(products, coupon, sessionOpts);

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

		if (coupon) {
			totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
		}

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
					? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
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
			sessionResponse = { url: `${process.env.CLIENT_URL}/purchase-success?order_id=${newOrder._id}`, totalAmount: totalAmount, isCod: true };
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
		res.status(200).json(sessionResponse);
	} catch (error) {
		await sessionOpts.abortTransaction();
		sessionOpts.endSession();
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
			});
		} else {
			res.status(400).json({ success: false, message: "Payment not completed" });
		}
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ message: "Error processing successful checkout", error: error.message });
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
		event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
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

const handlePaymentSuccess = async (session) => {
	if (session.metadata.couponCode) {
		await Coupon.findOneAndUpdate(
			{
				code: session.metadata.couponCode,
				userId: session.metadata.userId,
			},
			{
				isActive: false,
			}
		);
	}

	const orderId = session.metadata.orderId;
	const order = await Order.findById(orderId);
	if (order && order.paymentStatus === "pending") {
		order.paymentStatus = "paid";
		order.status = "confirmed";
		await order.save();

		// Queue Order Confirmation Email
		const emailTarget = session.metadata.userEmail || "guest";
		if (emailTarget !== "guest") {
			await emailQueue.add("order-confirmation", {
				email: emailTarget,
				subject: `Xác nhận đơn hàng #${order.orderCode} - Luxury Watch`,
				order: {
					orderCode: order.orderCode,
					totalAmount: order.totalAmount,
					shippingDetails: order.shippingDetails,
					paymentMethod: order.paymentMethod
				}
			});
		}

		// Clear cart just in case (webhook safety)
		if (session.metadata.userId && session.metadata.userId !== "guest") {
			const userToClear = await User.findById(session.metadata.userId);
			if (userToClear) {
				const orderedProductIds = order.products.map(p => p.product.toString());
				userToClear.cartItems = userToClear.cartItems.filter(item =>
					item.product && !orderedProductIds.includes(item.product.toString())
				);
				await userToClear.save();
			}
		}
	}
};

const handlePaymentExpired = async (session) => {
	const orderId = session.metadata.orderId;
	const order = await Order.findById(orderId);
	if (order && order.paymentStatus === "pending") {
		order.paymentStatus = "cancelled";
		order.status = "cancelled";
		await order.save();

		// Hoàn lại kho
		await OrderService.restoreStock(order.products, null, orderId, "Stripe Checkout hết hạn");
	}
};


async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});

	return coupon.id;
}

async function createNewCoupon(userId) {
	await Coupon.findOneAndDelete({ userId });

	const newCoupon = new Coupon({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
		discountPercentage: 10,
		expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		userId: userId,
	});

	await newCoupon.save();

	return newCoupon;
}

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
		return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
	}

	const session = await mongoose.startSession();
	try {
		session.startTransaction();

		// Atomic idempotency check + mark
		const existing = await ProcessedIPN.findOne({ provider, transactionId }, null, { session });
		if (existing) {
			await session.commitTransaction();
			console.info("[vnpay-ipn] duplicate callback ignored", { provider, transactionId });
			return res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
		}

		// Anti-replay timestamp trong 30 phút nếu cung cấp
		if (body.vnp_PayDate) {
			const txnDate = new Date(body.vnp_PayDate.replace(/^(.{4})(..)(..)$/, "$1-$2-$3"));
			if (isNaN(txnDate.getTime())) {
				await session.abortTransaction();
				return res.status(200).json({ RspCode: "10", Message: "Invalid timestamp" });
			}
			if (Math.abs(Date.now() - txnDate.getTime()) > 30 * 60 * 1000) {
				await session.abortTransaction();
				return res.status(200).json({ RspCode: "09", Message: "Timestamp out of acceptable range" });
			}
		}

		const order = await Order.findOne({ orderCode }).session(session);
		if (!order) {
			await ProcessedIPN.create({ provider, transactionId, orderCode, status: "failed", payload: body, processedAt: new Date() }, { session });
			await session.commitTransaction();
			return res.status(200).json({ RspCode: "01", Message: "Order not found" });
		}

		if (order.paymentStatus === "paid") {
			await ProcessedIPN.create({ provider, transactionId, orderCode, status: "processed", payload: body }, { session });
			await session.commitTransaction();
			return res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
		}

		if (body.vnp_ResponseCode === "00") {
			order.paymentStatus = "paid";
			order.status = "confirmed";
			order.transactionId = transactionId;
			order.paymentResponse = body;
			order.ipnVerified = true;
			order.paidAt = new Date();
			await order.save({ session });

			await ProcessedIPN.create({ provider, transactionId, orderCode, status: "processed", payload: body }, { session });
			await session.commitTransaction();

			console.info("[vnpay-ipn] success", { provider, transactionId, orderCode, clientIp });

			const emailTarget = order.user ? (await User.findById(order.user))?.email : order.shippingDetails.email;
			if (emailTarget) {
				await emailQueue.add("order-confirmation", {
					email: emailTarget,
					subject: `Xác nhận thanh toán VNPay đơn hàng #${order.orderCode} - Luxury Watch`,
					order: { orderCode: order.orderCode, totalAmount: order.totalAmount, shippingDetails: order.shippingDetails, paymentMethod: "VNPay (Đã thanh toán)" }
				});
			}

			return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
		}

		order.paymentStatus = "failed";
		await order.save({ session });
		await OrderService.restoreStock(order.products, null, order._id, "VNPay IPN Failed");
		await ProcessedIPN.create({ provider, transactionId, orderCode, status: "failed", payload: body }, { session });
		await session.commitTransaction();
		return res.status(200).json({ RspCode: "00", Message: "Confirm Failed" });
	} catch (error) {
		await session.abortTransaction();
		console.error("[vnpay-ipn] error", { error, provider, transactionId, orderCode, clientIp });
		return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
	} finally {
		session.endSession();
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

	const session = await mongoose.startSession();
	try {
		session.startTransaction();

		const existing = await ProcessedIPN.findOne({ provider, transactionId }, null, { session });
		if (existing) {
			await session.commitTransaction();
			return res.status(200).json({ resultCode: 2, message: "Order already paid" });
		}

		if (!orderCode) {
			await session.abortTransaction();
			return res.status(200).json({ resultCode: 1, message: "Order not found" });
		}

		const order = await Order.findOne({ orderCode }).session(session);
		if (!order) {
			await ProcessedIPN.create([{ provider, transactionId, orderCode, status: "failed", payload: body }], { session });
			await session.commitTransaction();
			return res.status(200).json({ resultCode: 1, message: "Order not found" });
		}

		if (order.paymentStatus === "paid") {
			await ProcessedIPN.create([{ provider, transactionId, orderCode, status: "processed", payload: body }], { session });
			await session.commitTransaction();
			return res.status(200).json({ resultCode: 2, message: "Order already paid" });
		}

		if (Number(body.resultCode) === 0) {
			order.paymentStatus = "paid";
			order.status = "confirmed";
			order.transactionId = transactionId;
			order.ipnVerified = true;
			order.paymentResponse = body;
			order.paidAt = new Date();
			await order.save({ session });

			await ProcessedIPN.create([{ provider, transactionId, orderCode, status: "processed", payload: body }], { session });
			await session.commitTransaction();

			const emailTarget = order.user ? (await User.findById(order.user))?.email : order.shippingDetails?.email;
			if (emailTarget) {
				await emailQueue.add("order-confirmation", {
					email: emailTarget,
					subject: `Xác nhận thanh toán MoMo đơn hàng #${order.orderCode} - Luxury Watch`,
					order: { orderCode: order.orderCode, totalAmount: order.totalAmount, shippingDetails: order.shippingDetails, paymentMethod: "MoMo (Đã thanh toán)" }
				});
			}

			return res.status(200).json({ resultCode: 0, message: "Confirm Success" });
		}

		order.paymentStatus = "failed";
		await order.save({ session });
		await ProcessedIPN.create([{ provider, transactionId, orderCode, status: "failed", payload: body }], { session });
		await OrderService.restoreStock(order.products, null, order._id, "MoMo IPN Failed");
		await session.commitTransaction();
		return res.status(200).json({ resultCode: 0, message: "Confirm Failed" });
	} catch (error) {
		await session.abortTransaction();
		console.error("[momo-ipn] error", { error, provider, clientIp, transactionId, orderCode });
		return res.status(200).json({ resultCode: 99, message: "Unknown error" });
	} finally {
		session.endSession();
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

	const session = await mongoose.startSession();
	try {
		session.startTransaction();

		const existing = await ProcessedIPN.findOne({ provider, transactionId }, null, { session });
		if (existing) {
			await session.commitTransaction();
			return res.status(200).json({ return_code: 2, return_message: "Order already paid" });
		}

		if (!orderCode) {
			await session.abortTransaction();
			return res.status(200).json({ return_code: 1, return_message: "Order not found" });
		}

		const order = await Order.findOne({ orderCode }).session(session);
		if (!order) {
			await ProcessedIPN.create([{ provider, transactionId, orderCode, status: "failed", payload: body }], { session });
			await session.commitTransaction();
			return res.status(200).json({ return_code: 1, return_message: "Order not found" });
		}

		if (order.paymentStatus === "paid") {
			await ProcessedIPN.create([{ provider, transactionId, orderCode, status: "processed", payload: body }], { session });
			await session.commitTransaction();
			return res.status(200).json({ return_code: 2, return_message: "Order already paid" });
		}

		if (resultCode === 1) {
			order.paymentStatus = "paid";
			order.status = "confirmed";
			order.transactionId = transactionId;
			order.ipnVerified = true;
			order.paymentResponse = body;
			order.paidAt = new Date();
			await order.save({ session });

			await ProcessedIPN.create([{ provider, transactionId, orderCode, status: "processed", payload: body }], { session });
			await session.commitTransaction();

			const emailTarget = order.user ? (await User.findById(order.user))?.email : order.shippingDetails?.email;
			if (emailTarget) {
				await emailQueue.add("order-confirmation", {
					email: emailTarget,
					subject: `Xác nhận thanh toán ZaloPay đơn hàng #${order.orderCode} - Luxury Watch`,
					order: { orderCode: order.orderCode, totalAmount: order.totalAmount, shippingDetails: order.shippingDetails, paymentMethod: "ZaloPay (Đã thanh toán)" }
				});
			}

			return res.status(200).json({ return_code: 1, return_message: "Confirm Success" });
		}

		order.paymentStatus = "failed";
		await order.save({ session });
		await ProcessedIPN.create([{ provider, transactionId, orderCode, status: "failed", payload: body }], { session });
		await OrderService.restoreStock(order.products, null, order._id, "ZaloPay IPN Failed");
		await session.commitTransaction();
		return res.status(200).json({ return_code: 1, return_message: "Confirm Success" });
	} catch (error) {
		await session.abortTransaction();
		console.error("[zalopay-ipn] error", { error, provider, clientIp, transactionId, orderCode });
		return res.status(200).json({ return_code: -99, return_message: "Unknown error" });
	} finally {
		session.endSession();
	}
};
