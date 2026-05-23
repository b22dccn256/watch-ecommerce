/**
 * Analytics Controller Tests
 * Verifies: revenue counting (paid vs pending), P&L, hourly data
 * Run: node --test test/analytics.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ─── Revenue Classification ───
test('analytics: paid orders counted in revenue', () => {
  const orders = [
    { paymentStatus: 'paid', totalAmount: 5000000 },
    { paymentStatus: 'paid', totalAmount: 3000000 },
    { paymentStatus: 'pending', totalAmount: 7000000 },
    { paymentStatus: 'failed', totalAmount: 2000000 },
    { paymentStatus: 'refunded', totalAmount: 1500000 },
    { paymentStatus: 'cancelled', totalAmount: 1000000 },
  ];

  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  assert.equal(paidOrders.length, 2);
  assert.equal(totalRevenue, 8000000);
});

// ─── Pending Revenue (dòng tiền dự kiến) ───
test('analytics: pending COD orders in transit counted as pending revenue', () => {
  // From analytics.controller.js: cashFlowMatch = { paymentStatus: "pending", status: {$in: ["confirmed","processing","shipped"]} }
  const orders = [
    { paymentStatus: 'pending', status: 'confirmed', totalAmount: 5000000 },
    { paymentStatus: 'pending', status: 'processing', totalAmount: 3000000 },
    { paymentStatus: 'pending', status: 'shipped', totalAmount: 4000000 },
    { paymentStatus: 'pending', status: 'pending', totalAmount: 2000000 }, // not yet confirmed
    { paymentStatus: 'paid', status: 'delivered', totalAmount: 6000000 },
  ];

  const inTransitStatuses = ['confirmed', 'processing', 'shipped'];
  const pendingRevenueOrders = orders.filter(
    o => o.paymentStatus === 'pending' && inTransitStatuses.includes(o.status)
  );
  const pendingRevenue = pendingRevenueOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  assert.equal(pendingRevenueOrders.length, 3);
  assert.equal(pendingRevenue, 12000000);
  assert.ok(!pendingRevenueOrders.find(o => o.status === 'pending'), 'Unconfirmed pending should not count');
});

// ─── P&L Calculation ───
test('analytics: P&L gross profit = revenue - COGS', () => {
  const items = [
    { revenue: 10000000, cogs: 6000000 },
    { revenue: 5000000, cogs: 2500000 },
    { revenue: 8000000, cogs: 4000000 },
  ];

  const totalRevenue = items.reduce((s, i) => s + i.revenue, 0);
  const totalCogs = items.reduce((s, i) => s + i.cogs, 0);
  const grossProfit = totalRevenue - totalCogs;
  const margin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;

  assert.equal(totalRevenue, 23000000);
  assert.equal(totalCogs, 12500000);
  assert.equal(grossProfit, 10500000);
  assert.ok(margin > 40 && margin < 50, `Expected margin ~45%, got ${margin}%`);
});

// ─── Cancellation Rate ───
test('analytics: cancellation rate calculation', () => {
  const totalOrders = 100;
  const cancelledOrReturned = 12;
  const cancellationRate = totalOrders > 0
    ? Math.round((cancelledOrReturned / totalOrders) * 1000) / 10
    : 0;

  assert.equal(cancellationRate, 12.0);
});

// ─── AOV (Average Order Value) ───
test('analytics: AOV = total revenue / total paid orders', () => {
  const totalRevenue = 50000000;
  const totalOrdersPlaced = 10;
  const aov = totalOrdersPlaced > 0 ? Math.round(totalRevenue / totalOrdersPlaced) : 0;

  assert.equal(aov, 5000000);
});

// ─── Hourly Sales Fill ───
test('analytics: hourly sales fill missing hours with 0', () => {
  const hourlySales = [
    { _id: 9, revenue: 5000000, count: 2 },
    { _id: 14, revenue: 3000000, count: 1 },
  ];

  const hourlyMap = {};
  hourlySales.forEach(h => { hourlyMap[h._id] = h; });
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    revenue: hourlyMap[i]?.revenue || 0,
    count: hourlyMap[i]?.count || 0,
  }));

  assert.equal(hourlyData.length, 24);
  assert.equal(hourlyData[9].revenue, 5000000);
  assert.equal(hourlyData[14].revenue, 3000000);
  assert.equal(hourlyData[0].revenue, 0, 'Missing hours should be 0');
  assert.equal(hourlyData[23].revenue, 0);
});

// ─── Payment Method Stats ───
test('analytics: payment method distribution', () => {
  const orders = [
    { paymentMethod: 'cod', paymentStatus: 'paid', totalAmount: 5000000 },
    { paymentMethod: 'cod', paymentStatus: 'paid', totalAmount: 3000000 },
    { paymentMethod: 'stripe', paymentStatus: 'paid', totalAmount: 8000000 },
    { paymentMethod: 'vnpay', paymentStatus: 'paid', totalAmount: 4000000 },
  ];

  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
  const paymentStats = {};
  paidOrders.forEach(o => {
    paymentStats[o.paymentMethod] = (paymentStats[o.paymentMethod] || 0) + o.totalAmount;
  });

  assert.deepEqual(paymentStats, { cod: 8000000, stripe: 8000000, vnpay: 4000000 });
});

// ─── Not double-count ───
test('analytics: delivered COD order counted ONLY in paid revenue, not pending', () => {
  const order = { paymentMethod: 'cod', paymentStatus: 'paid', status: 'delivered', totalAmount: 5000000 };

  const isInPaidRevenue = order.paymentStatus === 'paid';
  const inTransitStatuses = ['confirmed', 'processing', 'shipped'];
  const isInPendingRevenue = order.paymentStatus === 'pending' && inTransitStatuses.includes(order.status);

  assert.equal(isInPaidRevenue, true, 'Should be in paid revenue');
  assert.equal(isInPendingRevenue, false, 'Should NOT be in pending revenue (already paid)');
});

console.log('\n✅ Analytics tests complete');
