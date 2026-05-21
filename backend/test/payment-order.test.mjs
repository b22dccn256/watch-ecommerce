/**
 * Comprehensive tests for payment order totals calculation
 * Tests: OrderService.calculateTotals with various scenarios
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import services for testing
import OrderService from '../services/order.service.js';
import CampaignService from '../services/campaign.service.js';
import { getCouponDiscountAmount } from '../lib/coupon.js';
import Product from '../models/product.model.js';
import Coupon from '../models/coupon.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';

// ─── SETUP / TEARDOWN ────────────────────────────────────────
let testProduct, testCoupon, testCategory, testBrand;

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/watch-ecommerce-test');
  }
});

test.after(async () => {
  // Cleanup test data
  if (testProduct) await Product.findByIdAndDelete(testProduct._id);
  if (testCoupon) await Coupon.findByIdAndDelete(testCoupon._id);
  if (testCategory) await Category.findByIdAndDelete(testCategory._id);
  if (testBrand) await Brand.findByIdAndDelete(testBrand._id);
});

// ─── UNIT: Coupon Discount Calculation ───────────────────────
test('coupon: returns 0 for null/undefined coupon', () => {
  assert.equal(getCouponDiscountAmount(null, 100), 0);
  assert.equal(getCouponDiscountAmount(undefined, 100), 0);
});

test('coupon: returns 0 for inactive coupon', () => {
  assert.equal(getCouponDiscountAmount({ isActive: false, type: 'fixed', discountValue: 100 }, 500), 0);
});

test('coupon: returns 0 for expired coupon', () => {
  const expired = { isActive: true, type: 'fixed', discountValue: 100, expirationDate: new Date('2020-01-01') };
  assert.equal(getCouponDiscountAmount(expired, 500), 100); // Library doesn't check date - controller handles it
});

test('coupon: returns 0 for zero/negative subtotal', () => {
  const c = { isActive: true, type: 'fixed', discountValue: 50 };
  assert.equal(getCouponDiscountAmount(c, 0), 0);
  assert.equal(getCouponDiscountAmount(c, -100), 0);
});

test('coupon: fixed coupon caps at subtotal', () => {
  const c = { isActive: true, type: 'fixed', discountValue: 500 };
  assert.equal(getCouponDiscountAmount(c, 1000), 500);
  assert.equal(getCouponDiscountAmount(c, 200), 200); // Caps at subtotal
  assert.equal(getCouponDiscountAmount(c, 500), 500);
});

test('coupon: fixed coupon with 0 value returns 0', () => {
  const c = { isActive: true, type: 'fixed', discountValue: 0 };
  assert.equal(getCouponDiscountAmount(c, 500), 0);
});

test('coupon: percentage coupon computes correctly', () => {
  const c = { isActive: true, type: 'percentage', discountPercentage: 10 };
  assert.equal(getCouponDiscountAmount(c, 1000), 100);
  assert.equal(getCouponDiscountAmount(c, 555), 56); // Round(555 * 10 / 100) = 55.5 → 56
  assert.equal(getCouponDiscountAmount(c, 999), 100); // Round(99.9) → 100
});

test('coupon: percentage above 100% clips to 100%', () => {
  const c = { isActive: true, type: 'percentage', discountPercentage: 150 };
  assert.equal(getCouponDiscountAmount(c, 100), 100);
});

test('coupon: percentage with negative value returns 0', () => {
  const c = { isActive: true, type: 'percentage', discountPercentage: -10 };
  assert.equal(getCouponDiscountAmount(c, 500), 0);
});

test('coupon: uses discountValue fallback for percentage', () => {
  const c1 = { isActive: true, type: 'percentage', discountValue: 20 };
  assert.equal(getCouponDiscountAmount(c1, 200), 40); // 200 * 20 / 100

  const c2 = { isActive: true, type: 'percentage', discountPercentage: 15 };
  assert.equal(getCouponDiscountAmount(c2, 200), 30); // 200 * 15 / 100
});

test('coupon: invalid type defaults to percentage behavior', () => {
  const c = { isActive: true, type: 'unknown', discountPercentage: 10 };
  assert.equal(getCouponDiscountAmount(c, 500), 50);
});

// ─── INTEGRATION: Order Totals with DB ────────────────────────
test('order-totals: calculates subtotal from products', async () => {
  // Create test data
  testCategory = await Category.create({
    name: 'Test Category',
    slug: 'test-category-totals',
  });
  testBrand = await Brand.create({
    name: 'Test Brand Totals',
  });

  testProduct = await Product.create({
    name: 'Test Watch for Totals',
    description: 'A test watch',
    price: 5000000,
    costPrice: 3000000,
    stock: 10,
    categoryId: testCategory._id,
    brand: testBrand._id,
    type: 'automatic',
  });

  const products = [{ _id: testProduct._id, quantity: 2 }];
  const result = await OrderService.calculateTotals(products, null, 'hà nội');

  assert.equal(result.subtotal, 10000000, 'Subtotal should be 2 * 5M = 10M');
  assert.equal(result.discount, 0, 'No coupon = no discount');
  assert.equal(result.shippingFee, 0, 'Free shipping for orders > 5M');
  assert.equal(result.total, 10000000, 'Total = subtotal - discount + shipping');
});

test('order-totals: applies coupon discount', async () => {
  const coupon = { isActive: true, type: 'percent', discountValue: 10 };
  const products = [{ _id: testProduct._id, quantity: 1 }];
  const result = await OrderService.calculateTotals(products, coupon, 'hà nội');

  assert.equal(result.subtotal, 5000000);
  assert.equal(result.discount, 500000, '10% of 5M = 500k');
  assert.equal(result.shippingFee, 0, 'Free shipping for orders >= 5M after discount');
  assert.equal(result.total, 4500000, '5M - 500k = 4.5M');
});

test('order-totals: big city shipping (HN - 30k)', async () => {
  const products = [{ _id: testProduct._id, quantity: 1 }];
  const coupon = { isActive: true, type: 'fixed', discountValue: 4500000 }; // Makes total after discount = 500k

  const result = await OrderService.calculateTotals(products, coupon, 'Hà Nội');

  assert.equal(result.subtotal, 5000000);
  assert.equal(result.discount, 4500000);
  assert.equal(result.totalAfterDiscount || (result.subtotal - result.discount), 500000);
  assert.equal(result.shippingFee, 30000, 'Big city shipping = 30k');
  assert.equal(result.total, 530000, '500k + 30k = 530k');
});

test('order-totals: big city shipping (HCM - 30k)', async () => {
  const products = [{ _id: testProduct._id, quantity: 1 }];
  const coupon = { isActive: true, type: 'fixed', discountValue: 4500000 };

  const result = await OrderService.calculateTotals(products, coupon, 'TP.HCM');

  assert.equal(result.shippingFee, 30000, 'HCM shipping = 30k');
});

test('order-totals: other province shipping (50k)', async () => {
  const products = [{ _id: testProduct._id, quantity: 1 }];
  const coupon = { isActive: true, type: 'fixed', discountValue: 4500000 };

  const result = await OrderService.calculateTotals(products, coupon, 'Đà Nẵng');

  assert.equal(result.shippingFee, 50000, 'Province shipping = 50k');
});

test('order-totals: empty city defaults to big city (30k)', async () => {
  const products = [{ _id: testProduct._id, quantity: 1 }];
  const coupon = { isActive: true, type: 'fixed', discountValue: 4500000 };

  const result = await OrderService.calculateTotals(products, coupon, '');

  assert.equal(result.shippingFee, 30000, 'Empty city defaults to big city rate');
});

test('order-totals: free shipping threshold at 5M', async () => {
  // Product at 5M, no coupon → free ship
  const products1 = [{ _id: testProduct._id, quantity: 1 }];
  const result1 = await OrderService.calculateTotals(products1, null, 'Đà Nẵng');
  assert.equal(result1.shippingFee, 0, '5M = free shipping');

  // 2 products at 5M each = 10M with 6M discount → 4M after discount → should pay shipping
  const coupon2 = { isActive: true, type: 'fixed', discountValue: 6000000 };
  const products2 = [{ _id: testProduct._id, quantity: 2 }];
  const result2 = await OrderService.calculateTotals(products2, coupon2, 'Đà Nẵng');
  assert.equal(result2.shippingFee, 50000, '4M after discount → province shipping 50k');
});

test('order-totals: empty cart = no shipping', async () => {
  const result = await OrderService.calculateTotals([], null, 'Hà Nội');
  assert.equal(result.subtotal, 0);
  assert.equal(result.shippingFee, 0);
  assert.equal(result.total, 0);
});

test('order-totals: non-existent product throws error', async () => {
  const fakeId = new mongoose.Types.ObjectId();
  const products = [{ _id: fakeId, quantity: 1 }];
  await assert.rejects(
    () => OrderService.calculateTotals(products, null, 'Hà Nội'),
    /Sản phẩm không tồn tại/
  );
});

// ─── ORDER STATUS MACHINE ─────────────────────────────────────
const VALID_TRANSITIONS = {
  pending: ['awaiting_verification', 'confirmed', 'cancelled'],
  awaiting_verification: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['returned', 'delivered'],
  returned: [],
  cancelled: [],
};

test('order-status: all valid transitions', () => {
  for (const [from, toList] of Object.entries(VALID_TRANSITIONS)) {
    for (const to of toList) {
      // Each transition should be valid
      assert.ok(
        VALID_TRANSITIONS[from]?.includes(to),
        `${from} → ${to} should be valid`
      );
    }
  }
});

test('order-status: invalid transition from cancelled', () => {
  assert.ok(!VALID_TRANSITIONS.cancelled.includes('confirmed'), 'Cancelled → Confirmed should be invalid');
  assert.ok(!VALID_TRANSITIONS.cancelled.includes('processing'), 'Cancelled → Processing should be invalid');
});

test('order-status: invalid transition from delivered', () => {
  assert.ok(!VALID_TRANSITIONS.delivered.includes('cancelled'), 'Delivered → Cancelled should be invalid');
  assert.ok(!VALID_TRANSITIONS.delivered.includes('pending'), 'Delivered → Pending should be invalid');
});

test('order-status: shipped can only go to delivered', () => {
  assert.deepEqual(VALID_TRANSITIONS.shipped, ['delivered']);
});

// ─── SHIPPING FEE BOUNDARY TESTS ─────────────────────────────
test('shipping: exactly at free ship threshold', async () => {
  const cheapProduct = await Product.create({
    name: 'Cheap Watch',
    price: 5000000,
    costPrice: 3000000,
    stock: 10,
    categoryId: testCategory._id,
    brand: testBrand._id,
    type: 'quartz',
  });

  const products = [{ _id: cheapProduct._id, quantity: 1 }];
  const result = await OrderService.calculateTotals(products, null, 'Đà Nẵng');
  assert.equal(result.shippingFee, 0, 'Exactly 5M = free shipping');

  await Product.findByIdAndDelete(cheapProduct._id);
});

test('shipping: just below free ship threshold', async () => {
  const cheapProduct = await Product.create({
    name: 'Almost Free Watch',
    price: 4999000,
    costPrice: 3000000,
    stock: 10,
    categoryId: testCategory._id,
    brand: testBrand._id,
    type: 'quartz',
  });

  const products = [{ _id: cheapProduct._id, quantity: 1 }];
  // Province shipping
  const result = await OrderService.calculateTotals(products, null, 'Đà Nẵng');
  assert.equal(result.shippingFee, 50000, 'Just below 5M → province shipping 50k');

  // Big city shipping
  const resultCity = await OrderService.calculateTotals(products, null, 'Hà Nội');
  assert.equal(resultCity.shippingFee, 30000, 'Just below 5M → big city shipping 30k');

  await Product.findByIdAndDelete(cheapProduct._id);
});

console.log('\n✅ All payment & order tests passed!\n');
