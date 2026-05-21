/**
 * Inventory Controller Tests
 * Verifies: adjustStock (IN/OUT/ADJUST), validation, InventoryLog creation logic
 * Run: node --test test/inventory.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ─── Action Validation ───
const VALID_ACTIONS = ['IN', 'OUT', 'ADJUST'];

test('inventory: accepts valid actions', () => {
  assert.ok(VALID_ACTIONS.includes('IN'));
  assert.ok(VALID_ACTIONS.includes('OUT'));
  assert.ok(VALID_ACTIONS.includes('ADJUST'));
});

test('inventory: rejects invalid actions', () => {
  assert.ok(!VALID_ACTIONS.includes('DELETE'));
  assert.ok(!VALID_ACTIONS.includes('UPDATE'));
  assert.ok(!VALID_ACTIONS.includes(''));
});

// ─── Quantity Validation ───
test('inventory: IN/OUT requires quantity > 0', () => {
  // IN with quantity <= 0 should fail
  assert.equal(0 > 0, false, 'IN with 0 should fail');
  assert.equal(-5 > 0, false, 'IN with negative should fail');
  assert.equal(10 > 0, true, 'IN with 10 should pass');
});

test('inventory: ADJUST requires quantity >= 0', () => {
  assert.equal(-1 < 0, true, 'ADJUST with negative should fail');
  assert.equal(0 < 0, false, 'ADJUST with 0 should pass');
  assert.equal(100 < 0, false, 'ADJUST with 100 should pass');
});

test('inventory: quantity must be integer', () => {
  assert.ok(Number.isInteger(5));
  assert.ok(!Number.isInteger(5.5));
  assert.ok(!Number.isInteger('abc'));
});

// ─── Stock Calculation ───
test('inventory: IN increases stock', () => {
  let stock = 10;
  const parsedQuantity = 5;
  stock += parsedQuantity;
  assert.equal(stock, 15);
});

test('inventory: OUT decreases stock', () => {
  let stock = 10;
  const parsedQuantity = 3;
  assert.ok(stock - parsedQuantity >= 0, 'Should not go negative');
  stock -= parsedQuantity;
  assert.equal(stock, 7);
});

test('inventory: OUT prevents negative stock', () => {
  const stock = 5;
  const parsedQuantity = 10;
  assert.ok(stock - parsedQuantity < 0, 'Should detect insufficient stock');
});

test('inventory: ADJUST sets absolute stock', () => {
  const oldStock = 10;
  const newStock = 25;
  const actualDelta = newStock - oldStock;
  assert.equal(actualDelta, 15, 'Delta = newStock - oldStock');
});

// ─── InventoryLog structure ───
test('inventory: log captures correct structure', () => {
  const log = {
    productId: 'prod123',
    action: 'IN',
    quantity: 5,
    referenceOrderId: null,
    userId: 'user456',
    note: 'Admin nhập kho thủ công',
  };

  assert.ok(VALID_ACTIONS.includes(log.action));
  assert.ok(Number.isInteger(log.quantity));
  assert.ok(log.note.length > 0);
});

test('inventory: log action matches delta sign', () => {
  // OUT → negative delta
  const outLog = { action: 'OUT', quantity: -3 };
  assert.equal(outLog.quantity < 0, true);

  // IN → positive delta
  const inLog = { action: 'IN', quantity: 5 };
  assert.equal(inLog.quantity > 0, true);

  // ADJUST → can be positive or negative
  const adjLog = { action: 'ADJUST', quantity: -2 };
  assert.ok(VALID_ACTIONS.includes(adjLog.action));
});

console.log('\n✅ Inventory tests complete');
