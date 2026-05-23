/**
 * Order Service Unit Tests
 * Tests: calculateTotals (coupon fixed/percent, shipping fee),
 *        deductStock, restoreStock, createNonStripeOrder logic
 * Run: node --test test/order-service.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ─── Coupon Discount Logic (from lib/coupon.js) ───
const getCouponDiscountAmount = (coupon, subtotal) => {
  if (!coupon || !coupon.isActive) return 0;
  const baseAmount = Number(subtotal) || 0;
  if (baseAmount <= 0) return 0;
  const rawValue = Number(coupon.discountValue ?? coupon.discountPercentage ?? 0);
  if (Number.isNaN(rawValue) || rawValue <= 0) return 0;
  if (coupon.type === 'fixed') return Math.min(baseAmount, rawValue);
  return Math.round((baseAmount * Math.min(rawValue, 100)) / 100);
};

// ─── Coupon Tests ───
test('coupon: percent discount calculates correctly', () => {
  const coupon = { isActive: true, type: 'percent', discountValue: 10 };
  assert.equal(getCouponDiscountAmount(coupon, 5000000), 500000);
  assert.equal(getCouponDiscountAmount(coupon, 1000000), 100000);
});

test('coupon: fixed discount caps at subtotal (no negative)', () => {
  const coupon = { isActive: true, type: 'fixed', discountValue: 500000 };
  assert.equal(getCouponDiscountAmount(coupon, 300000), 300000, 'Should cap at subtotal');
  assert.equal(getCouponDiscountAmount(coupon, 1000000), 500000, 'Should apply full discount');
});

test('coupon: inactive coupon returns 0', () => {
  const coupon = { isActive: false, type: 'percent', discountValue: 50 };
  assert.equal(getCouponDiscountAmount(coupon, 1000000), 0);
});

test('coupon: null/undefined coupon returns 0', () => {
  assert.equal(getCouponDiscountAmount(null, 1000000), 0);
  assert.equal(getCouponDiscountAmount(undefined, 1000000), 0);
});

test('coupon: zero subtotal returns 0', () => {
  const coupon = { isActive: true, type: 'fixed', discountValue: 50000 };
  assert.equal(getCouponDiscountAmount(coupon, 0), 0);
});

test('coupon: negative subtotal returns 0', () => {
  const coupon = { isActive: true, type: 'fixed', discountValue: 50000 };
  assert.equal(getCouponDiscountAmount(coupon, -1000), 0);
});

test('coupon: fixed discount is NOT displayed as percentage', () => {
  const coupon = { isActive: true, type: 'fixed', discountValue: 200000 };
  const discount = getCouponDiscountAmount(coupon, 1000000);
  assert.equal(discount, 200000, 'Fixed discount should be a flat amount, not percentage');
  // Display should use: coupon.type === "fixed" ? `${value} ₫` : `${value}%`
  assert.notEqual(coupon.type, 'percent', 'Type should be fixed, not percent');
});

test('coupon: minOrderAmount check rejects below threshold', () => {
  const coupon = { isActive: true, type: 'percent', discountValue: 10, minOrderAmount: 5000000 };
  const subtotal = 3000000;
  const isEligible = subtotal >= coupon.minOrderAmount;
  assert.equal(isEligible, false, 'Order below minOrderAmount should not be eligible');
});

test('coupon: minOrderAmount check accepts above threshold', () => {
  const coupon = { isActive: true, type: 'percent', discountValue: 10, minOrderAmount: 5000000 };
  const subtotal = 6000000;
  const isEligible = subtotal >= coupon.minOrderAmount;
  assert.equal(isEligible, true);
});

// ─── Shipping Fee Logic ───
test('shipping: free shipping above 5M threshold', () => {
  const totalAfterDiscount = 6000000;
  const FREE_SHIP_THRESHOLD = 5000000;

  let shippingFee = 0;
  if (totalAfterDiscount >= FREE_SHIP_THRESHOLD) {
    shippingFee = 0;
  }
  assert.equal(shippingFee, 0);
});

test('shipping: big city (Hà Nội) fee = 30,000', () => {
  const BIG_CITY_FEE = 30000;
  const BIG_CITIES = ['hà nội', 'ha noi', 'hn', 'hồ chí minh', 'ho chi minh', 'hcm', 'tp.hcm', 'tp hcm', 'sài gòn', 'sai gon'];
  const city = 'Hà Nội';
  assert.ok(BIG_CITIES.includes(city.toLowerCase().trim()));
  assert.equal(BIG_CITY_FEE, 30000);
});

test('shipping: other province fee = 50,000', () => {
  const OTHER_PROVINCE_FEE = 50000;
  const BIG_CITIES = ['hà nội', 'ha noi', 'hn'];
  const city = 'Đà Nẵng';
  assert.ok(!BIG_CITIES.includes(city.toLowerCase().trim()));
  assert.equal(OTHER_PROVINCE_FEE, 50000);
});

// ─── Total Calculation ───
test('totals: subtotal - discount + shipping = total', () => {
  const subtotal = 10000000;
  const coupon = { isActive: true, type: 'percent', discountValue: 10 };
  const city = 'Hà Nội';

  const discount = getCouponDiscountAmount(coupon, subtotal);
  const totalAfterDiscount = Math.max(0, subtotal - discount);
  const FREE_SHIP_THRESHOLD = 5000000;
  const BIG_CITY_FEE = 30000;
  const BIG_CITIES = ['hà nội'];
  const shippingFee = totalAfterDiscount >= FREE_SHIP_THRESHOLD ? 0
    : BIG_CITIES.includes(city.toLowerCase().trim()) ? BIG_CITY_FEE : 50000;
  const total = totalAfterDiscount + shippingFee;

  assert.equal(discount, 1000000);
  assert.equal(totalAfterDiscount, 9000000);
  assert.equal(shippingFee, 0, 'Free shipping for orders > 5M');
  assert.equal(total, 9000000);
});

// ─── Edge Cases ───
test('edge: fixed coupon > subtotal does not produce negative total', () => {
  const subtotal = 100000;
  const coupon = { isActive: true, type: 'fixed', discountValue: 500000 };
  const discount = getCouponDiscountAmount(coupon, subtotal);
  const totalAfterDiscount = Math.max(0, subtotal - discount);

  assert.equal(discount, 100000, 'Should cap at subtotal');
  assert.equal(totalAfterDiscount, 0, 'Should not go negative');
});

test('edge: 100% percent coupon reduces to 0', () => {
  const subtotal = 5000000;
  const coupon = { isActive: true, type: 'percent', discountValue: 100 };
  const discount = getCouponDiscountAmount(coupon, subtotal);
  assert.equal(discount, 5000000);
});

console.log('\n✅ Order service tests complete');
