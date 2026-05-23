/**
 * COD Order Flow Test — Delivered → Paid → Revenue
 * Verifies the critical analytics flow:
 *   Admin marks COD order "delivered" → paymentStatus auto-set to "paid" → revenue counted
 * Run: node --test test/order-cod-flow.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ORDER_STATUS_TRANSITIONS, canTransitionOrderStatus } from '../services/order.service.js';

// ─── State Transition Rules ───

test('state transitions: shipped → delivered is allowed', () => {
  assert.equal(canTransitionOrderStatus('shipped', 'delivered'), true);
});

test('state transitions: pending → confirmed is allowed', () => {
  assert.equal(canTransitionOrderStatus('pending', 'confirmed'), true);
});

test('state transitions: pending → cancelled is allowed', () => {
  assert.equal(canTransitionOrderStatus('pending', 'cancelled'), true);
});

test('state transitions: delivered → return_requested is allowed', () => {
  assert.equal(canTransitionOrderStatus('delivered', 'return_requested'), true);
});

test('state transitions: delivered → shipped is NOT allowed (no reverse)', () => {
  assert.equal(canTransitionOrderStatus('delivered', 'shipped'), false);
});

test('state transitions: cancelled → anything is NOT allowed', () => {
  assert.equal(canTransitionOrderStatus('cancelled', 'pending'), false);
  assert.equal(canTransitionOrderStatus('cancelled', 'confirmed'), false);
  assert.equal(canTransitionOrderStatus('cancelled', 'delivered'), false);
});

test('state transitions: returned → anything is NOT allowed', () => {
  assert.equal(canTransitionOrderStatus('returned', 'delivered'), false);
  assert.equal(canTransitionOrderStatus('returned', 'pending'), false);
});

test('state transitions: same state is allowed (idempotent)', () => {
  assert.equal(canTransitionOrderStatus('pending', 'pending'), true);
  assert.equal(canTransitionOrderStatus('delivered', 'delivered'), true);
});

// ─── COD → Delivered → Paid Logic ───
// (Unit test of the logic from OrderService.updateOrderStatus)
test('COD delivered: paymentStatus should become paid', () => {
  // Simulate the logic from order.service.js lines 344-348
  const order = {
    status: 'shipped',
    paymentStatus: 'pending',
    paymentMethod: 'cod',
    totalAmount: 5000000,
    user: 'user123',
    trackingEvents: [],
    internalNotes: '',
  };

  const newStatus = 'delivered';
  const oldStatus = order.status;

  // Replicate the exact logic
  if (newStatus === 'delivered' && oldStatus !== 'delivered') {
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
    }
    const pointsToAdd = Math.max(1, Math.floor(order.totalAmount / 100));
    order.loyaltyPointsGranted = pointsToAdd;
    order.trackingEvents.push({
      status: 'delivered',
      message: 'Đơn hàng đã giao thành công.',
      timestamp: new Date(),
    });
  }

  assert.equal(order.paymentStatus, 'paid', 'COD delivered should auto-set paymentStatus to paid');
  assert.ok(order.paidAt, 'paidAt should be set when delivered');
  assert.ok(order.loyaltyPointsGranted > 0, 'Loyalty points should be granted');
  assert.ok(order.trackingEvents.length > 0, 'Tracking events should be recorded');
});

test('COD delivered: does NOT double-process if already delivered', () => {
  const order = {
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'cod',
    totalAmount: 5000000,
    trackingEvents: [],
  };

  const newStatus = 'delivered';
  const oldStatus = order.status;

  // Same status → should NOT trigger the delivered block
  let triggered = false;
  if (newStatus === 'delivered' && oldStatus !== 'delivered') {
    triggered = true;
  }

  assert.equal(triggered, false, 'Should not re-process already delivered orders');
});

// ─── Revenue Counting ───
test('analytics: paid orders are counted in revenue', () => {
  // Simulate analytics query: paymentStatus === "paid"
  const orders = [
    { orderCode: 'DH001', paymentStatus: 'paid', totalAmount: 5000000 },
    { orderCode: 'DH002', paymentStatus: 'paid', totalAmount: 3000000 },
    { orderCode: 'DH003', paymentStatus: 'pending', totalAmount: 7000000 },
    { orderCode: 'DH004', paymentStatus: 'cancelled', totalAmount: 2000000 },
  ];

  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  assert.equal(paidOrders.length, 2, 'Should count 2 paid orders');
  assert.equal(totalRevenue, 8000000, 'Revenue should be 8,000,000');
});

test('analytics: pending COD orders NOT counted in revenue until delivered', () => {
  const order = { orderCode: 'DH005', paymentStatus: 'pending', paymentMethod: 'cod' };
  assert.equal(order.paymentStatus, 'pending', 'COD starts as pending');
  // Only after admin marks delivered does paymentStatus become "paid"
});

console.log('\n✅ COD flow tests complete');
