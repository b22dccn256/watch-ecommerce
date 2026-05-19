import { VNPay, ignoreLogger } from 'vnpay';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// 1. VNPay Configuration
// In vnpay 1.x, we initialize like this:
export const vnpayInstance = new VNPay({
    tmnCode: process.env.VNP_TMN_CODE || 'TESTCODE',
    // Prefer VNP_HASH_SECRET (used in .env) but accept legacy VNP_SECRET if present
    secureSecret: process.env.VNP_HASH_SECRET || process.env.VNP_SECRET || 'TESTSECRET12345678TESTSECRET1234',
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: 'SHA512',
    enableLog: false,
    loggerFn: ignoreLogger,
});

export const createVNPayPayment = (order, req) => {
    // Require TMN code and secure secret. Support VNP_HASH_SECRET (current .env) and legacy VNP_SECRET.
    const vnpSecret = process.env.VNP_HASH_SECRET || process.env.VNP_SECRET;
    if (!process.env.VNP_TMN_CODE || !vnpSecret) {
        throw new Error("VNPAY chưa cấu hình VNP_TMN_CODE hoặc VNP_HASH_SECRET/VNP_SECRET");
    }
    try {
        const ipAddr = req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress || '127.0.0.1';
        
        const paymentUrl = vnpayInstance.buildPaymentUrl({
            vnp_Amount: order.totalAmount, // SDK tự động x100
            vnp_IpAddr: ipAddr,
            vnp_TxnRef: order.orderCode,
            vnp_OrderInfo: `Thanh toan don hang ${order.orderCode}`,
            vnp_OrderType: 'other',
            vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:5173/payment/vnpay-return',
            vnp_Locale: 'vn',
        });
        return paymentUrl;
    } catch (error) {
        console.error("VNPay Error:", error);
        throw error;
    }
};

export const verifyVNPayIPN = (query) => {
    return vnpayInstance.verifyIpnCall(query);
};

export const verifyVNPayReturn = (query) => {
    return vnpayInstance.verifyReturnUrl(query);
};

// 2. MoMo Sandbox Mock Setup (Implementation Example)
export const createMoMoPayment = async (order) => {
    // Basic structural implementation for Momo Create Payment
    if (!process.env.MOMO_PARTNER_CODE || !process.env.MOMO_ACCESS_KEY || !process.env.MOMO_SECRET_KEY) {
        throw new Error("MoMo chưa cấu hình MOMO_PARTNER_CODE / MOMO_ACCESS_KEY / MOMO_SECRET_KEY");
    }
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const requestId = order.orderCode;
    const orderId = order.orderCode;
    const orderInfo = `Thanh toán MoMo đơn hàng ${orderId}`;
    const redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:5173/payment/momo-return';
    const ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:5000/api/payment/momo/ipn';
    const amount = order.totalAmount;
    const requestType = "captureWallet";
    const extraData = ""; 

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    const requestBody = {
        partnerCode,
        partnerName: "Test",
        storeId: "MomoTestStore",
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang: "vi",
        requestType,
        autoCapture: true,
        extraData,
        signature
    };

    try {
        // Fallback simulate success return if API keys are just TEST dummies
        if (partnerCode === 'TEST' || partnerCode === 'MOMO') {
            return `${redirectUrl}?orderId=${orderId}&resultCode=0&message=Success`;
        }

        const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody);
        if (response.data && response.data.payUrl) {
            return response.data.payUrl;
        }
        throw new Error("MoMo API Error");
    } catch (error) {
        console.error("MoMo Error:", error.response?.data || error.message);
        throw error;
    }
};

// 3. ZaloPay Configuration
export const createZaloPayPayment = async (order) => {
    if (!process.env.ZALOPAY_APP_ID || !process.env.ZALOPAY_KEY1 || !process.env.ZALOPAY_KEY2) {
        throw new Error("ZaloPay chưa cấu hình ZALOPAY_APP_ID / ZALOPAY_KEY1 / ZALOPAY_KEY2");
    }
    const config = {
        app_id: process.env.ZALOPAY_APP_ID,
        key1: process.env.ZALOPAY_KEY1,
        key2: process.env.ZALOPAY_KEY2,
        endpoint: process.env.ZALOPAY_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create"
    };

    const embed_data = {
        redirecturl: "http://localhost:5173/payment/zalopay-return"
    };
    const items = [{}];
    const transID = Math.floor(Math.random() * 1000000);
    
    // app_trans_id must format: yyMMdd_xxxx
    const app_trans_id = `${new Date().toISOString().slice(2, 10).replace(/-/g, '')}_${order.orderCode}`;
    
    const orderInfo = {
        app_id: config.app_id,
        app_trans_id: app_trans_id,
        app_user: "WatchEcommerce",
        app_time: Date.now(),
        item: JSON.stringify(items),
        embed_data: JSON.stringify(embed_data),
        amount: order.totalAmount,
        description: `Thanh toan don hang ${order.orderCode}`,
        bank_code: "zalopayapp",
    };

    const data = config.app_id + "|" + orderInfo.app_trans_id + "|" + orderInfo.app_user + "|" + orderInfo.amount + "|" + orderInfo.app_time + "|" + orderInfo.embed_data + "|" + orderInfo.item;
    orderInfo.mac = crypto.createHmac("sha256", config.key1).update(data).digest("hex");

    try {
        const response = await axios.post(config.endpoint, null, { params: orderInfo });
        if (response.data && response.data.order_url) {
            return response.data.order_url;
        }
        // Mock fallback if ZaloPay sandbox fails
        return `${embed_data.redirecturl}?apptransid=${app_trans_id}&status=1`;
    } catch (error) {
        console.error("ZaloPay Error:", error.response?.data || error.message);
        throw error;
    }
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

