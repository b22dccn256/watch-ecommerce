import fs from "fs";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";
import OrderService from "../services/order.service.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { emailQueue } from "./mail.controller.js";

export const createCheckoutSession = async (req, res) => {
	const sessionOpts = await mongoose.startSession();
	sessionOpts.startTransaction();

	try {
		const { products, couponCode, shippingDetails } = req.body;

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

		await OrderService.deductStock(products, sessionOpts, newOrderId, req.user._id, "Thanh toán Stripe");

		const coupon = couponCode ? await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true }).session(sessionOpts) : null;
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

		const newOrder = new Order({
			_id: newOrderId,
			user: req.user._id,
			products: products.map(p => ({
				product: p._id || p.id,
				quantity: p.quantity,
				price: p.price
			})),
			totalAmount: dbTotalAmount, // Lấy từ DB tính ở trên
			orderCode,
			shippingDetails,
			paymentMethod: "stripe",
			paymentStatus: "pending",
			status: "pending"
		});
		await newOrder.save({ session: sessionOpts });

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
			expires_at: Math.floor(Date.now() / 1000) + (31 * 60), // Hết hạn sau 31 phút (Stripe yêu cầu > 30 phút, để 30 chẵn dễ bị lỗi lệch mili-giây)
			discounts: coupon
				? [
					{
						coupon: await createStripeCoupon(coupon.discountPercentage),
					},
				]
				: [],
			metadata: {
				userId: req.user._id.toString(),
				couponCode: couponCode || "",
				orderId: newOrder._id.toString(),
			},
		});

		// Lưu sessionId vào đơn hàng để tham chiếu nếu cần
		newOrder.stripeSessionId = session.id;
		await newOrder.save({ session: sessionOpts });

		// Clear user cart
		const orderedProductIds = products.map(p => (p._id || p.id).toString());
		req.user.cartItems = req.user.cartItems.filter(item =>
			item.product && !orderedProductIds.includes(item.product.toString())
		);
		await req.user.save({ session: sessionOpts });

		await sessionOpts.commitTransaction();
		sessionOpts.endSession();

		if (totalAmount >= 5000000) {
			await createNewCoupon(req.user._id);
		}
		res.status(200).json({ id: session.id, totalAmount: totalAmount });
	} catch (error) {
		await sessionOpts.abortTransaction();
		sessionOpts.endSession();
		console.error("Error processing checkout:", error);
		try { fs.appendFileSync("stripe-error.log", new Date().toISOString() + " - " + (error.stack || error.message) + "\n"); } catch (e) { }
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};

export const checkoutSuccess = async (req, res) => {
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
		const user = await User.findById(order.user);
		if (user) {
			await emailQueue.add("order-confirmation", {
				email: user.email,
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
		const userToClear = await User.findById(session.metadata.userId);
		if (userToClear) {
			const orderedProductIds = order.products.map(p => p.product.toString());
			userToClear.cartItems = userToClear.cartItems.filter(item =>
				item.product && !orderedProductIds.includes(item.product.toString())
			);
			await userToClear.save();
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

