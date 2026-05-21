import { calculateTotalsPure } from './order-utils.mjs';
// Avoid importing order.service (imports DB/redis). Re-declare pure helpers used in tests.
export const ORDER_STATUS_TRANSITIONS = {
  pending: ["awaiting_verification", "confirmed", "cancelled"],
  awaiting_verification: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["return_requested"],
  return_requested: ["returned", "delivered"],
  returned: [],
  cancelled: [],
};

export const canTransitionOrderStatus = (fromStatus, toStatus) => {
  if (fromStatus === toStatus) return true;
  const allowedTargets = ORDER_STATUS_TRANSITIONS[fromStatus] || [];
  return allowedTargets.includes(toStatus);
};

export const generateOrderCode = () => {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return "DH" + ts + rand;
};

async function testCalculateTotalsPercent() {
  const products = [{ _id: 'p1', quantity: 2 }];
  const coupon = { type: 'percent', discountValue: 10 };
  const productLookup = async (id) => ({ _id: id, price: 100000 });
  const campaignApplier = async (p) => p; // no campaign

  const res = await calculateTotalsPure(products, coupon, 'Hà Nội', productLookup, campaignApplier);
  console.log('testCalculateTotalsPercent:', res);
  if (res.subtotal !== 200000) throw new Error('subtotal mismatch');
  if (res.discount !== 20000) throw new Error('discount mismatch');
  if (res.shippingFee !== 30000) throw new Error('shipping mismatch');
}

async function testCalculateTotalsFreeShip() {
  const products = [{ _id: 'p2', quantity: 10 }];
  const coupon = null;
  const productLookup = async (id) => ({ _id: id, price: 600000 });
  const campaignApplier = async (p) => p;

  const res = await calculateTotalsPure(products, coupon, 'Hà Nội', productLookup, campaignApplier);
  console.log('testCalculateTotalsFreeShip:', res);
  if (res.subtotal !== 6000000) throw new Error('subtotal mismatch');
  if (res.shippingFee !== 0) throw new Error('shipping should be free');
}


function testCanTransitionStatus() {
  const ok = canTransitionOrderStatus('pending', 'confirmed');
  const no = canTransitionOrderStatus('shipped', 'processing');
  console.log('testCanTransitionStatus:', ok, no);
  if (!ok) throw new Error('should allow pending->confirmed');
  if (no) throw new Error('should not allow shipped->processing');
}

function testGenerateOrderCode() {
  const a = generateOrderCode();
  const b = generateOrderCode();
  console.log('codes', a, b);
  if (typeof a !== 'string' || typeof b !== 'string') throw new Error('code not string');
  if (a === b) throw new Error('codes should differ');
}

(async function run() {
  try {
    await testCalculateTotalsPercent();
    await testCalculateTotalsFreeShip();
    testCanTransitionStatus();
    testGenerateOrderCode();
    console.log('All order unit tests passed');
  } catch (err) {
    console.error('Order unit tests failed:', err.message);
    process.exit(1);
  }
})();
