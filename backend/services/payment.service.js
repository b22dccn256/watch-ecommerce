import dotenv from 'dotenv';
dotenv.config();

import { createVNPayUrl, verifyVNPaySignature } from '../lib/vnpay.js';
import crypto from 'crypto';

export const createVNPayPayment = (order, req) => {
    try {
		const ipAddr = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || req?.connection?.remoteAddress || '127.0.0.1';
		return createVNPayUrl({
			amount: order.totalAmount,
			orderId: order.orderCode,
			ipAddr,
		});
    } catch (error) {
        console.error("VNPay Error:", error);
        throw error;
    }
};

export const verifyVNPayIPN = (query) => {
	return verifyVNPaySignature(query);
};

export const verifyVNPayReturn = (query) => {
	return verifyVNPaySignature(query);
};

// --- Extracted Webhook Business Logic ---
import { emailQueue } from '../controllers/mail.controller.js';
import Coupon from '../models/coupon.model.js';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import OrderService from './order.service.js';
import { stripe } from '../lib/stripe.js';
export const handlePaymentSuccess = async (session) => {
	if (session.metadata.couponCode) {
        const code = session.metadata.couponCode.toUpperCase();
        try {
            const coupon = await Coupon.findOne({ code });
            if (coupon) {
                // If coupon is user-bound, ensure metadata userId matches
                if (coupon.userId && session.metadata.userId && String(coupon.userId) !== String(session.metadata.userId)) {
                    // Do not apply coupon for mismatched user
                } else {
                    const update = await Coupon.findOneAndUpdate(
                        { code },
                        {
                            $inc: { usedCount: 1 },
                            $push: { usageHistory: { usedAt: new Date(), orderId: session.metadata.orderId, userId: session.metadata.userId !== 'guest' ? session.metadata.userId : null } }
                        },
                        { new: true }
                    );

                    if (update && update.maxUses > 0 && (update.usedCount || 0) >= update.maxUses) {
                        await Coupon.findOneAndUpdate({ code }, { isActive: false });
                    }
                }
            }
        } catch (e) {
            console.error('Error updating coupon usage in webhook:', e.message);
        }
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

export const handlePaymentExpired = async (session) => {
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


export async function createStripeCoupon(coupon) {
	const discountValue = Number(coupon?.discountValue ?? coupon?.discountPercentage ?? 0);
	const stripeCoupon = await stripe.coupons.create(coupon?.type === "fixed" ? {
		amount_off: Math.round(discountValue),
		currency: "vnd",
		duration: "once",
	} : {
		percent_off: Math.min(discountValue, 100),
		duration: "once",
	});

	return stripeCoupon.id;
}

export async function createNewCoupon(userId) {
	await Coupon.findOneAndDelete({ userId });

	const newCoupon = new Coupon({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
		type: "percent",
		discountValue: 10,
		expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		userId: userId,
	});

	await newCoupon.save();

	return newCoupon;
}

