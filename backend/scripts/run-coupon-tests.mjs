import assert from "assert";
import { getCouponDiscountAmount } from "../lib/coupon.js";

const tests = [];

// percent coupon
tests.push(() => {
  const coupon = { type: "percent", discountValue: 10, isActive: true };
  const subtotal = 100000;
  const discount = getCouponDiscountAmount(coupon, subtotal);
  assert.equal(discount, 10000, "10% of 100000 should be 10000");
});

// percent capped at 100
tests.push(() => {
  const coupon = { type: "percent", discountValue: 150, isActive: true };
  const subtotal = 200000;
  const discount = getCouponDiscountAmount(coupon, subtotal);
  assert.equal(
    discount,
    200000,
    "Percent >100 should cap to 100% (whole subtotal)",
  );
});

// fixed coupon less than subtotal
tests.push(() => {
  const coupon = { type: "fixed", discountValue: 50000, isActive: true };
  const subtotal = 120000;
  const discount = getCouponDiscountAmount(coupon, subtotal);
  assert.equal(discount, 50000, "Fixed discount should be applied");
});

// fixed coupon greater than subtotal -> min(subtotal, fixed)
tests.push(() => {
  const coupon = { type: "fixed", discountValue: 200000, isActive: true };
  const subtotal = 120000;
  const discount = getCouponDiscountAmount(coupon, subtotal);
  assert.equal(discount, 120000, "Fixed discount cannot exceed subtotal");
});

// inactive coupon
tests.push(() => {
  const coupon = { type: "percent", discountValue: 10, isActive: false };
  const subtotal = 100000;
  const discount = getCouponDiscountAmount(coupon, subtotal);
  assert.equal(discount, 0, "Inactive coupon should return 0");
});

// zero subtotal
tests.push(() => {
  const coupon = { type: "percent", discountValue: 10, isActive: true };
  const subtotal = 0;
  const discount = getCouponDiscountAmount(coupon, subtotal);
  assert.equal(discount, 0, "Zero subtotal should yield zero discount");
});

console.log("Running coupon tests:", tests.length);

for (let i = 0; i < tests.length; i++) {
  try {
    tests[i]();
    console.log(`✓ test ${i + 1} passed`);
  } catch (e) {
    console.error(`✗ test ${i + 1} FAILED:`, e.message);
    process.exit(1);
  }
}

console.log("All coupon tests passed");
