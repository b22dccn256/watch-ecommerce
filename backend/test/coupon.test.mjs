import test from 'node:test';
import assert from 'node:assert/strict';
import { getCouponDiscountAmount } from '../lib/coupon.js';

test('returns 0 for missing or inactive coupon', () => {
  assert.equal(getCouponDiscountAmount(null, 100), 0);
  assert.equal(getCouponDiscountAmount({ isActive: false }, 100), 0);
});

test('returns 0 for zero or negative subtotal', () => {
  const c = { isActive: true, type: 'fixed', discountValue: 50 };
  assert.equal(getCouponDiscountAmount(c, 0), 0);
  assert.equal(getCouponDiscountAmount(c, -10), 0);
});

test('fixed coupon caps at subtotal', () => {
  const c = { isActive: true, type: 'fixed', discountValue: 50 };
  assert.equal(getCouponDiscountAmount(c, 200), 50);
  assert.equal(getCouponDiscountAmount(c, 30), 30);
});

test('percentage coupon computes correctly and rounds', () => {
  const c = { isActive: true, type: 'percentage', discountPercentage: 12.5 };
  assert.equal(getCouponDiscountAmount(c, 1000), Math.round(1000 * 12.5 / 100));
});

test('uses discountValue or discountPercentage fallback', () => {
  const c1 = { isActive: true, type: 'percentage', discountValue: 20 };
  // discountValue should be used when present
  assert.equal(getCouponDiscountAmount(c1, 200), Math.round(200 * 20 / 100));

  const c2 = { isActive: true, type: 'percentage', discountPercentage: 15 };
  assert.equal(getCouponDiscountAmount(c2, 200), Math.round(200 * 15 / 100));
});

test('percentage above 100 is clipped to 100', () => {
  const c = { isActive: true, type: 'percentage', discountPercentage: 150 };
  assert.equal(getCouponDiscountAmount(c, 100), 100);
});
