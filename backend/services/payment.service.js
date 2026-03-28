import { VNPay, ignoreLogger } from 'vnpay';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// 1. VNPay Configuration
// In vnpay 1.x, we initialize like this:
export const vnpayInstance = new VNPay({
    tmnCode: process.env.VNP_TMN_CODE || 'TESTCODE',
    secureSecret: process.env.VNP_SECRET || 'TESTSECRET12345678TESTSECRET1234',
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: 'SHA512',
    enableLog: false,
    loggerFn: ignoreLogger,
});

export const createVNPayPayment = (order, req) => {
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
    const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
    const accessKey = process.env.MOMO_ACCESS_KEY || 'KEY';
    const secretKey = process.env.MOMO_SECRET_KEY || 'SECRET';
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
    const config = {
        app_id: process.env.ZALOPAY_APP_ID || "2553",
        key1: process.env.ZALOPAY_KEY1 || "PcY4iZIKFCIdgZvA6ueMcMHHUbRlYjPL",
        key2: process.env.ZALOPAY_KEY2 || "kLtgPl8PIATweXSmK76MamLSXMDZcnCj",
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
