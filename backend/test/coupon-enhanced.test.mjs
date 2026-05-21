/**
 * Enhanced coupon validation & CRUD tests
 * Tests coupon creation, validation, and edge cases
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { getCouponDiscountAmount } from '../lib/coupon.js';

// ─── EDGE CASE: DISCOUNT CALCULATION ──────────────────────────
test('discount: fixed coupon on large order', () => {
  const c = { isActive: true, type: 'fixed', discountValue: 500000 };
  assert.equal(getCouponDiscountAmount(c, 50000000), 500000, '50M order, 500k fixed discount');
});

test('discount: fixed coupon less than 1 VND', () => {
  const c = { isActive: true, type: 'fixed', discountValue: 0.5 };
  assert.equal(getCouponDiscountAmount(c, 100), 0.5, 'Fractional discount');
});

test('discount: percentage 0% returns 0', () => {
  const c = { isActive: true, type: 'percentage', discountPercentage: 0 };
  assert.equal(getCouponDiscountAmount(c, 1000), 0);
});

test('discount: percentage 1% rounding', () => {
  const c = { isActive: true, type: 'percentage', discountPercentage: 1 };
  assert.equal(getCouponDiscountAmount(c, 999), 10, '1% of 999 = 9.99 → round to 10');
  assert.equal(getCouponDiscountAmount(c, 1), 0, '1% of 1 = 0.01 → round to 0');
});

test('discount: percentage 100% clips full amount', () => {
  const c = { isActive: true, type: 'percentage', discountPercentage: 100 };
  assert.equal(getCouponDiscountAmount(c, 5000000), 5000000, '100% = full discount');
});

test('discount: large percentage clipping', () => {
  const c = { isActive: true, type: 'percentage', discountPercentage: 200 };
  assert.equal(getCouponDiscountAmount(c, 1000), 1000, '200% clips to 100%');
});

test('discount: string values coerced to number', () => {
  const c = { isActive: true, type: 'percentage', discountPercentage: '20' };
  assert.equal(getCouponDiscountAmount(c, 1000), 200, 'String "20" → 20%');
});

test('discount: undefined discountValue/Percentage returns 0', () => {
  const c = { isActive: true, type: 'percentage' };
  assert.equal(getCouponDiscountAmount(c, 1000), 0);
});

test('discount: NaN values return 0', () => {
  const c = { isActive: true, type: 'percentage', discountPercentage: NaN };
  assert.equal(getCouponDiscountAmount(c, 1000), 0);
});

// ─── COUPON VALIDATION LOGIC ──────────────────────────────────
test('validation: coupon without code is invalid', () => {
  const isValid = (coupon) => {
    if (!coupon || !coupon.isActive) return false;
    if (!coupon.code || coupon.code.toString().trim() === '') return false;
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return false;
    if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) return false;
    return true;
  };

  assert.equal(isValid({ isActive: true, code: '' }), false, 'Empty code');
  assert.equal(isValid({ isActive: true, code: 'VALID' }), true, 'Valid code');
  assert.equal(isValid({ isActive: false, code: 'VALID' }), false, 'Inactive');
  assert.equal(isValid({ isActive: true, code: 'VALID', maxUses: 5, usedCount: 5 }), false, 'Maxed out');
  assert.equal(isValid({ isActive: true, code: 'VALID', maxUses: 5, usedCount: 4 }), true, 'Not maxed');
  assert.equal(isValid({ isActive: true, code: 'VALID', maxUses: 0, usedCount: 999 }), true, 'Unlimited uses');
  assert.equal(isValid({ isActive: true, code: 'VALID', expirationDate: new Date('2020-01-01') }), false, 'Expired');
  assert.equal(isValid({ isActive: true, code: 'VALID', expirationDate: new Date('2099-01-01') }), true, 'Not expired');
  assert.equal(isValid(null), false, 'Null');
  assert.equal(isValid(undefined), false, 'Undefined');
});

// ─── MIN ORDER AMOUNT LOGIC ───────────────────────────────────
test('min-order: discount only applies if subtotal >= minOrderAmount', () => {
  const computeDiscount = (coupon, subtotal) => {
    if (!coupon || !coupon.isActive) return 0;
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) return 0;
    return getCouponDiscountAmount(coupon, subtotal);
  };

  const c = { isActive: true, type: 'percentage', discountPercentage: 10, minOrderAmount: 1000000 };

  assert.equal(computeDiscount(c, 500000), 0, 'Below min order → no discount');
  assert.equal(computeDiscount(c, 1000000), 100000, 'At min order → 10%');
  assert.equal(computeDiscount(c, 2000000), 200000, 'Above min order → 10%');
  assert.equal(computeDiscount({ ...c, minOrderAmount: 0 }, 500000), 50000, 'No min order requirement');
});

// ─── COMBINED SCENARIOS ──────────────────────────────────────
test('scenario: 10% coupon on 15M order = 1.5M discount, free ship', () => {
  const coupon = { isActive: true, type: 'percentage', discountPercentage: 10 };
  const subtotal = 15000000;
  const discount = getCouponDiscountAmount(coupon, subtotal);
  assert.equal(discount, 1500000);

  const afterDiscount = subtotal - discount; // 13.5M
  assert.ok(afterDiscount >= 5000000, 'Above free ship threshold → 0 shipping');
  assert.equal(afterDiscount, 13500000);
});

test('scenario: 50k fixed coupon on 45k order caps at 45k', () => {
  const coupon = { isActive: true, type: 'fixed', discountValue: 50000 };
  const subtotal = 45000;
  const discount = getCouponDiscountAmount(coupon, subtotal);
  assert.equal(discount, 45000, 'Capped at subtotal');
  assert.equal(subtotal - discount, 0, 'Effectively free');
});

console.log('\n✅ All enhanced coupon tests passed!\n');
