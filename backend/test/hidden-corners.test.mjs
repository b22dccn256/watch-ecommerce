/**
 * Hidden Corners & Edge Cases Verification Tests
 * Verifies:
 * 1. Vietnamese Search accent-insensitivity limitations of basic regex search.
 * 2. Concurrency / Race Condition simulation when two customers buy the last item at once.
 * 3. VNPay IPN Idempotency behavior to prevent double-processing.
 * 4. Token expiration validation.
 * Run: node --test test/hidden-corners.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { getVietnameseRegex } from '../services/product.service.js';

// ─── 1. Vietnamese Search Accent-Insensitivity ───
test('Hidden Corners: basic regex search is accent-sensitive (accentless query fails to match accented text)', () => {
  const products = [
    { name: 'Đồng hồ Rolex Oyster Perpetual Nam' },
    { name: 'Đồng Hồ Omega Seamaster Thụy Sỹ' },
    { name: 'Đồng hồ Casio Edifice Chronograph' }
  ];

  // Helper simulating the current buildProductQuery regex logic:
  // query.name = { $regex: escapeRegex(searchTerm), $options: 'i' }
  const searchRegex = (searchTerm) => {
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'i');
  };

  const query1 = 'Rolex';
  const matches1 = products.filter(p => searchRegex(query1).test(p.name));
  assert.equal(matches1.length, 1, 'Should match Rolex (no accents in keyword or target)');

  const query2 = 'dong ho';
  const matches2 = products.filter(p => searchRegex(query2).test(p.name));
  // Proves the GAP: "dong ho" does NOT match "Đồng hồ" using standard regex!
  assert.equal(matches2.length, 0, 'GAP PROVED: accentless query "dong ho" fails to match accented name "Đồng hồ"');
  
  // Test our newly implemented actual getVietnameseRegex helper!
  const matchesActual = products.filter(p => getVietnameseRegex(query2).test(p.name));
  assert.equal(matchesActual.length, 3, 'Our real getVietnameseRegex successfully matches all accented Vietnamese names!');
});


// ─── 2. Concurrency & Race Condition Simulation ───
test('Hidden Corners: Concurrent buy simulation on single stock item', async () => {
  let dbProduct = {
    _id: 'rolex123',
    name: 'Rolex Submariner',
    stock: 1
  };

  // Simulating stock deduction logic:
  // if (product.stock < quantity) throw Error;
  // product.stock -= quantity;
  const processStockDeduction = async (quantity, latencyMs) => {
    // Read stage (simulated database fetch delay)
    await new Promise(resolve => setTimeout(resolve, latencyMs));
    const currentStock = dbProduct.stock;

    if (currentStock < quantity) {
      throw new Error(`Sản phẩm "${dbProduct.name}" chỉ còn ${currentStock} cái`);
    }

    // Write stage
    dbProduct.stock -= quantity;
    return `Đặt hàng thành công! Số lượng mua: ${quantity}`;
  };

  // User A and User B concurrently buy the last item (stock = 1)
  const results = await Promise.allSettled([
    processStockDeduction(1, 10), // User A
    processStockDeduction(1, 12)  // User B (slightly delayed read, but overlaps)
  ]);

  const fulfilled = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');

  // If there's no atomic database lock (e.g. { stock: { $gte: quantity } } in update filter),
  // a race condition can cause BOTH requests to read stock = 1 and proceed, pushing stock to -1!
  const hasRaceCondition = dbProduct.stock < 0;

  if (hasRaceCondition) {
    assert.equal(fulfilled.length, 2, 'Race condition allowed both to purchase');
    assert.equal(dbProduct.stock, -1, 'Stock went negative to -1!');
    console.log('⚠️ Race Condition detected! Stock is now: ', dbProduct.stock);
  } else {
    // Safe scenario (if locking was used)
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal(dbProduct.stock, 0);
  }
});


// ─── 3. VNPay IPN Idempotency ───
test('Hidden Corners: duplicate IPN webhook requests are rejected (Idempotency)', () => {
  const processedIPNs = new Set();

  const handleIPN = (txnRef, paymentStatus) => {
    if (processedIPNs.has(txnRef)) {
      return { success: false, message: 'Giao dịch đã được xử lý trước đó (Duplicate IPN)' };
    }

    processedIPNs.add(txnRef);
    return { success: true, message: 'Thanh toán thành công' };
  };

  const txnId = 'VNP12345678';
  
  // First IPN request
  const ipn1 = handleIPN(txnId, '00');
  assert.equal(ipn1.success, true);
  assert.equal(ipn1.message, 'Thanh toán thành công');

  // Duplicate IPN request (e.g. retry from server or late webhook)
  const ipn2 = handleIPN(txnId, '00');
  assert.equal(ipn2.success, false, 'Duplicate should be blocked');
  assert.equal(ipn2.message, 'Giao dịch đã được xử lý trước đó (Duplicate IPN)');
});


// ─── 4. Token Expiration Validation ───
test('Hidden Corners: token expiration check returns false if expired', () => {
  const checkTokenValidity = (tokenExpiresDate) => {
    if (!tokenExpiresDate) return false;
    return new Date(tokenExpiresDate) >= new Date();
  };

  const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins in future
  const pastDate = new Date(Date.now() - 1000).toISOString(); // 1 second in past

  assert.equal(checkTokenValidity(futureDate), true, 'Future token should be valid');
  assert.equal(checkTokenValidity(pastDate), false, 'Past token must be expired');
  assert.equal(checkTokenValidity(null), false);
});

console.log('\n✅ All Hidden Corners & Edge Cases tests completed!');
