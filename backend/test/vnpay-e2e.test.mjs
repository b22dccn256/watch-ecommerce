import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import qs from 'qs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import ProcessedIPN from '../models/processedIPN.model.js';
import { createVNPayPayment, verifyVNPayIPN, verifyVNPayReturn } from '../services/payment.service.js';
import { processIPN } from '../services/ipn.service.js';

// Helper: build sorted query string like lib/vnpay.js
const buildSortedQuery = (params) => {
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, k) => {
      acc[k] = params[k];
      return acc;
    }, {});
  return qs.stringify(sorted, { encode: false });
};

let created = {};

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/watch-ecommerce-test');
  }
});

test.after(async () => {
  // cleanup
  try {
    if (created.order) await Order.findByIdAndDelete(created.order._id);
    if (created.product) await Product.findByIdAndDelete(created.product._id);
    if (created.category) await Category.findByIdAndDelete(created.category._id);
    if (created.brand) await Brand.findByIdAndDelete(created.brand._id);
    if (created.processed) await ProcessedIPN.deleteMany({ orderCode: created.order?.orderCode });
  } catch (e) {
    console.error('Cleanup failed', e.message);
  }
});

test('VNPay E2E: create URL -> verify signature -> process return & IPN idempotency', async () => {
  // Create minimal product + order
  const category = await Category.create({ name: 'E2E Cat', slug: 'e2e-cat-' + Date.now() });
  const brand = await Brand.create({ name: 'E2E Brand ' + Date.now() });
  const product = await Product.create({
    name: 'E2E Product',
    description: 'E2E',
    price: 1500000,
    costPrice: 1000000,
    stock: 5,
    categoryId: category._id,
    brand: brand._id,
    type: 'quartz',
    image: 'https://example.com/e2e.jpg'
  });

  const orderCode = 'DHE2E' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const order = new Order({
    products: [{ product: product._id, quantity: 1, price: product.price }],
    totalAmount: product.price,
    subtotal: product.price,
    discountAmount: 0,
    shippingFee: 0,
    orderCode,
    shippingDetails: { fullName: 'E2E', phoneNumber: '0900000000', address: 'E2E Addr', city: 'Hà Nội' },
    paymentMethod: 'vnpay',
    paymentStatus: 'pending',
    trackingToken: crypto.randomUUID(),
  });
  await order.save();

  created = { category, brand, product, order };

  // 1) Create VNPay URL
  const fakeReq = { headers: { 'x-forwarded-for': '127.0.0.1' }, socket: {}, connection: {} };
  const url = createVNPayPayment(order, fakeReq);
  assert.ok(typeof url === 'string' && url.includes('?'), 'Expected VNPay URL string');

  const parsed = new URL(url);
  const params = Object.fromEntries(parsed.searchParams.entries());

  // Check fields
  assert.equal(params.vnp_TxnRef, order.orderCode, 'TxnRef should match orderCode');
  assert.equal(params.vnp_Amount, String(order.totalAmount * 100), 'Amount should be order.totalAmount * 100');
  assert.ok(params.vnp_SecureHash, 'Secure hash present');
  // Return URL should match environment
  assert.equal(params.vnp_ReturnUrl, process.env.VNP_RETURN_URL, 'Return URL must match configured VNP_RETURN_URL');

  // Verify signature using service wrapper
  assert.ok(verifyVNPayIPN(params), 'Signature verification should pass for created URL');

  // 2) Simulate return (user redirected back) - build a signed return payload
  const returnPayload = {
    vnp_TxnRef: order.orderCode,
    vnp_Amount: String(order.totalAmount * 100),
    vnp_ResponseCode: '00',
    vnp_TransactionNo: 'TXN' + Math.floor(Math.random() * 1000000),
    vnp_PayDate: new Date().toISOString().slice(0,19).replace(/[-:T]/g, '').slice(0,14),
  };

  // Sign returnPayload
  const secret = process.env.VNP_HASH_SECRET || '';
  const signData = buildSortedQuery(returnPayload);
  const sig = crypto.createHmac('sha512', secret).update(Buffer.from(signData, 'utf-8')).digest('hex');
  returnPayload.vnp_SecureHash = sig;

  // Verify signature via service
  assert.ok(verifyVNPayReturn(returnPayload), 'Return signature must verify');

  // Process return by invoking processIPN (as controller would)
  const procResult = await processIPN({ provider: 'vnpay', transactionId: returnPayload.vnp_TransactionNo, orderCode: order.orderCode, isSuccess: true, payload: returnPayload });
  assert.equal(procResult.success, true);

  const updated = await Order.findOne({ orderCode: order.orderCode });
  assert.equal(updated.paymentStatus, 'paid', 'Order should be marked paid after successful IPN/return');

  // 3) Replay detection: same transaction should be idempotent
  const replay = await processIPN({ provider: 'vnpay', transactionId: returnPayload.vnp_TransactionNo, orderCode: order.orderCode, isSuccess: true, payload: returnPayload });
  assert.equal(replay.alreadyProcessed, true, 'Duplicate IPN should be marked as alreadyProcessed');

  // 4) Ensure ProcessedIPN records exist
  const record = await ProcessedIPN.findOne({ provider: 'vnpay', transactionId: returnPayload.vnp_TransactionNo });
  assert.ok(record, 'ProcessedIPN record should be persisted');

  // 4) Amount mismatch should be rejected
  const badOrder = new Order({
    products: [{ product: product._id, quantity: 1, price: product.price }],
    totalAmount: product.price,
    subtotal: product.price,
    discountAmount: 0,
    shippingFee: 0,
    orderCode: 'DHE2E_BAD' + Math.random().toString(36).slice(2,6).toUpperCase(),
    shippingDetails: { fullName: 'E2E', phoneNumber: '0900000000', address: 'E2E Addr', city: 'Hà Nội' },
    paymentMethod: 'vnpay',
    paymentStatus: 'pending',
    trackingToken: crypto.randomUUID(),
  });
  await badOrder.save();

  const badPayload = {
    vnp_TxnRef: badOrder.orderCode,
    vnp_Amount: String((badOrder.totalAmount + 1000) * 100), // deliberately wrong
    vnp_ResponseCode: '00',
    vnp_TransactionNo: 'TXN_BAD' + Math.floor(Math.random() * 1000000),
    vnp_PayDate: new Date().toISOString().slice(0,19).replace(/[-:T]/g, '').slice(0,14),
  };
  const badSign = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET || '').update(Buffer.from(buildSortedQuery(badPayload), 'utf-8')).digest('hex');
  badPayload.vnp_SecureHash = badSign;

  const badResult = await processIPN({ provider: 'vnpay', transactionId: badPayload.vnp_TransactionNo, orderCode: badOrder.orderCode, isSuccess: true, payload: badPayload });
  assert.equal(badResult.success, false, 'IPN with mismatched amount should be rejected');
  const refreshedBad = await Order.findOne({ orderCode: badOrder.orderCode });
  assert.equal(refreshedBad.paymentStatus, 'pending', 'Order should remain pending after mismatched amount IPN');

  // 5) Non-existent order should return null order and fail
  const missing = await processIPN({ provider: 'vnpay', transactionId: 'TXN_NO_ORDER', orderCode: 'NON_EXISTENT_ORDER', isSuccess: true, payload: { vnp_Amount: '100' } });
  assert.equal(missing.order, null, 'Processing IPN for non-existent order should return order=null');
});

console.log('\n✅ VNPay E2E test file executed (use `node --test backend/test/vnpay-e2e.test.mjs`).\n');
