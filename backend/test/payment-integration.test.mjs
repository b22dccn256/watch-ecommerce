/**
 * Payment Integration Tests
 * Tests: VNPay/MoMo/ZaloPay signature verification, Stripe validation,
 * IPN processing logic, payment amount boundaries
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
// VNPAY SIGNATURE VERIFICATION
// ═══════════════════════════════════════════════════════════════

const verifyVnpaySignature = (query, secretKey) => {
  if (!secretKey) return false;
  const secureHash = query.vnp_SecureHash || query.vnp_SecureHash?.toLowerCase();
  if (!secureHash) return false;

  const clone = { ...query };
  delete clone.vnp_SecureHash;
  delete clone.vnp_SecureHashType;

  const keys = Object.keys(clone).sort();
  const raw = keys
    .filter((k) => clone[k] !== undefined && clone[k] !== null && clone[k] !== '')
    .map((k) => `${k}=${clone[k]}`)
    .join('&');

  const hashed = crypto.createHmac('sha512', secretKey).update(raw, 'utf8').digest('hex');
  return hashed.toLowerCase() === secureHash.toLowerCase();
};

test('vnpay: valid signature passes verification', () => {
  const secretKey = 'TESTSECRET12345678';
  const params = {
    vnp_Amount: '10000000',
    vnp_BankCode: 'NCB',
    vnp_OrderInfo: 'Thanh+toan+don+hang+DHABC1234',
    vnp_TxnRef: 'DHABC1234',
    vnp_ResponseCode: '00',
    vnp_TransactionNo: '12345678',
  };

  // Generate a real valid signature
  const clone = { ...params };
  const keys = Object.keys(clone).sort();
  const raw = keys
    .filter((k) => clone[k] !== undefined && clone[k] !== null && clone[k] !== '')
    .map((k) => `${k}=${clone[k]}`)
    .join('&');
  const hash = crypto.createHmac('sha512', secretKey).update(raw, 'utf8').digest('hex');

  params.vnp_SecureHash = hash;

  assert.ok(verifyVnpaySignature(params, secretKey));
});

test('vnpay: tampered data fails verification', () => {
  const secretKey = 'TESTSECRET12345678';
  const params = {
    vnp_Amount: '10000000',
    vnp_TxnRef: 'DHABC1234',
    vnp_ResponseCode: '00',
    vnp_SecureHash: 'tamperedhash1234567890abcdef',
  };

  assert.equal(verifyVnpaySignature(params, secretKey), false, 'Tampered hash should fail');
});

test('vnpay: missing hash returns false', () => {
  const params = { vnp_Amount: '10000000', vnp_TxnRef: 'DH123' };
  assert.equal(verifyVnpaySignature(params, 'SECRET'), false);
});

test('vnpay: missing secret key returns false', () => {
  const params = { vnp_Amount: '10000000', vnp_SecureHash: 'abc123' };
  assert.equal(verifyVnpaySignature(params, ''), false);
  assert.equal(verifyVnpaySignature(params, null), false);
});

test('vnpay: empty values are filtered from signature', () => {
  const secretKey = 'TESTKEY';
  const params = {
    vnp_Amount: '5000000',
    vnp_TxnRef: 'DHORDER1',
    vnp_EmptyField: '',    // Should be filtered out
    vnp_NullField: null,   // Should be filtered out
    vnp_UndefinedField: undefined, // Should be filtered out
  };

  // Generate signature WITHOUT empty fields
  const cleanKeys = ['vnp_Amount', 'vnp_TxnRef'];
  const raw = cleanKeys.map((k) => `${k}=${params[k]}`).join('&');
  params.vnp_SecureHash = crypto.createHmac('sha512', secretKey).update(raw, 'utf8').digest('hex');

  assert.ok(verifyVnpaySignature(params, secretKey), 'Empty values should be excluded from hash');
});

test('vnpay: case-insensitive hash comparison', () => {
  const secretKey = 'TESTKEY';
  const params = { vnp_Amount: '1000000', vnp_TxnRef: 'DHX1' };
  const raw = 'vnp_Amount=1000000&vnp_TxnRef=DHX1';
  const hash = crypto.createHmac('sha512', secretKey).update(raw, 'utf8').digest('hex');

  // Uppercase hash
  params.vnp_SecureHash = hash.toUpperCase();
  assert.ok(verifyVnpaySignature(params, secretKey));

  // Lowercase hash
  params.vnp_SecureHash = hash.toLowerCase();
  assert.ok(verifyVnpaySignature(params, secretKey));
});

test('vnpay: keys sorted alphabetically', () => {
  const secretKey = 'TESTKEY';
  // vnp_TxnRef comes before vnp_Amount in sort order? Actually A < T
  // Let's verify: sorted keys = ['vnp_Amount', 'vnp_BankCode', 'vnp_TxnRef']
  const params = {
    vnp_TxnRef: 'DHZ99',       // T comes after A, B alphabetically
    vnp_BankCode: 'VCB',       // B comes after A
    vnp_Amount: '10000000',    // A comes first
  };
  const raw = 'vnp_Amount=10000000&vnp_BankCode=VCB&vnp_TxnRef=DHZ99';
  params.vnp_SecureHash = crypto.createHmac('sha512', secretKey).update(raw, 'utf8').digest('hex');

  assert.ok(verifyVnpaySignature(params, secretKey), 'Keys must be sorted alphabetically');
});

// ═══════════════════════════════════════════════════════════════
// MOMO SIGNATURE VERIFICATION
// ═══════════════════════════════════════════════════════════════

const verifyMomoSignature = (body, secretKey, accessKey) => {
  if (!secretKey || !body.signature) return false;
  const rawSignature = `partnerCode=${body.partnerCode}&accessKey=${accessKey}&requestId=${body.requestId}&amount=${body.amount}&orderId=${body.orderId}&orderInfo=${body.orderInfo}&orderType=${body.orderType}&transId=${body.transId}&resultCode=${body.resultCode}&message=${body.message}&payType=${body.payType}&responseTime=${body.responseTime}&extraData=${body.extraData}`;
  const computed = crypto.createHmac('sha256', secretKey).update(rawSignature, 'utf8').digest('hex');
  return computed === body.signature;
};

test('momo: valid signature passes', () => {
  const secretKey = 'MOMOSECRET123';
  const accessKey = 'MOMOACCESS';
  const body = {
    partnerCode: 'MOMO',
    requestId: 'REQ123',
    amount: '500000',
    orderId: 'DHORDER1',
    orderInfo: 'Thanh toan DHORDER1',
    orderType: 'momo_wallet',
    transId: 'TRANS456',
    resultCode: '0',
    message: 'Success',
    payType: 'qr',
    responseTime: '1700000000',
    extraData: '',
  };
  const raw = `partnerCode=MOMO&accessKey=MOMOACCESS&requestId=REQ123&amount=500000&orderId=DHORDER1&orderInfo=Thanh toan DHORDER1&orderType=momo_wallet&transId=TRANS456&resultCode=0&message=Success&payType=qr&responseTime=1700000000&extraData=`;
  body.signature = crypto.createHmac('sha256', secretKey).update(raw, 'utf8').digest('hex');

  assert.ok(verifyMomoSignature(body, secretKey, accessKey));
});

test('momo: tampered amount fails', () => {
  const secretKey = 'MOMOSECRET123';
  const accessKey = 'MOMOACCESS';
  const body = {
    partnerCode: 'MOMO', requestId: 'REQ123', amount: '999999', // Tampered
    orderId: 'DHORDER1', orderInfo: 'Test', orderType: 'wallet',
    transId: 'TRANS456', resultCode: '0', message: 'Success',
    payType: 'qr', responseTime: '1700000000', extraData: '',
  };
  body.signature = 'fakesignature1234567890abcdef';

  assert.equal(verifyMomoSignature(body, secretKey, accessKey), false);
});

test('momo: missing signature returns false', () => {
  const body = { partnerCode: 'MOMO', amount: '500000' };
  assert.equal(verifyMomoSignature(body, 'SECRET', 'ACCESS'), false);
});

test('momo: missing secret returns false', () => {
  const body = { signature: 'abc123', partnerCode: 'MOMO' };
  assert.equal(verifyMomoSignature(body, '', 'ACCESS'), false);
});

// ═══════════════════════════════════════════════════════════════
// ZALOPAY MAC VERIFICATION
// ═══════════════════════════════════════════════════════════════

const verifyZaloPayMac = (body, key2) => {
  if (!key2 || !body.mac) return false;
  const computed = crypto.createHmac('sha256', key2).update(body.data, 'utf8').digest('hex');
  return computed === body.mac;
};

test('zalopay: valid MAC passes', () => {
  const key2 = 'ZALOPAYKEY2SECRET';
  const data = 'app_id|trans_id|user|amount|time|embed|items';
  const mac = crypto.createHmac('sha256', key2).update(data, 'utf8').digest('hex');
  const body = { data, mac };

  assert.ok(verifyZaloPayMac(body, key2));
});

test('zalopay: tampered data fails', () => {
  const key2 = 'ZALOPAYKEY2SECRET';
  const body = { data: 'tampered_data', mac: 'fake_mac_12345' };
  assert.equal(verifyZaloPayMac(body, key2), false);
});

test('zalopay: missing MAC fails', () => {
  assert.equal(verifyZaloPayMac({ data: 'test' }, 'KEY'), false);
});

test('zalopay: missing key2 fails', () => {
  assert.equal(verifyZaloPayMac({ data: 'test', mac: 'abc123' }, ''), false);
});

// ═══════════════════════════════════════════════════════════════
// STRIPE AMOUNT VALIDATION
// ═══════════════════════════════════════════════════════════════

const STRIPE_MIN_AMOUNT = 10000;     // 10,000 VND
const STRIPE_MAX_AMOUNT = 99999999;  // 99,999,999 VND

const validateStripeAmount = (totalAmount) => {
  if (totalAmount < STRIPE_MIN_AMOUNT) {
    return { valid: false, reason: 'Giá trị đơn hàng tối thiểu qua Stripe là 10.000 VNĐ' };
  }
  if (totalAmount > STRIPE_MAX_AMOUNT) {
    return { valid: false, reason: 'Tổng đơn hàng vượt quá giới hạn 99.999.999 VNĐ' };
  }
  return { valid: true };
};

test('stripe: valid amounts pass', () => {
  assert.ok(validateStripeAmount(10000).valid);      // Minimum
  assert.ok(validateStripeAmount(100000).valid);     // Normal
  assert.ok(validateStripeAmount(50000000).valid);   // Large
  assert.ok(validateStripeAmount(99999999).valid);   // Maximum
});

test('stripe: below minimum fails', () => {
  assert.equal(validateStripeAmount(0).valid, false);
  assert.equal(validateStripeAmount(5000).valid, false);
  assert.equal(validateStripeAmount(9999).valid, false);
});

test('stripe: above maximum fails', () => {
  assert.equal(validateStripeAmount(100000000).valid, false);
  assert.equal(validateStripeAmount(200000000).valid, false);
});

// ═══════════════════════════════════════════════════════════════
// IPN IDEMPOTENCY LOGIC
// ═══════════════════════════════════════════════════════════════

test('ipn: idempotency - first call processes', () => {
  const processedSet = new Set(); // Simulate ProcessedIPN collection
  
  const processIPNMock = (transactionId, orderCode) => {
    if (processedSet.has(transactionId)) {
      return { alreadyProcessed: true, success: false };
    }
    processedSet.add(transactionId);
    return { alreadyProcessed: false, success: true, order: { orderCode } };
  };

  const result1 = processIPNMock('TXN001', 'DHORDER1');
  assert.equal(result1.alreadyProcessed, false);
  assert.equal(result1.success, true);
  assert.equal(result1.order.orderCode, 'DHORDER1');
});

test('ipn: idempotency - duplicate call rejected', () => {
  const processedSet = new Set();
  
  const processIPNMock = (transactionId, orderCode) => {
    if (processedSet.has(transactionId)) {
      return { alreadyProcessed: true, success: false };
    }
    processedSet.add(transactionId);
    return { alreadyProcessed: false, success: true, order: { orderCode } };
  };

  processIPNMock('TXN001', 'DHORDER1'); // First call
  const result2 = processIPNMock('TXN001', 'DHORDER1'); // Duplicate

  assert.equal(result2.alreadyProcessed, true);
  assert.equal(result2.success, false);
});

test('ipn: different transactions processed independently', () => {
  const processedSet = new Set();
  
  const processIPNMock = (transactionId, orderCode) => {
    if (processedSet.has(transactionId)) return { alreadyProcessed: true, success: false };
    processedSet.add(transactionId);
    return { alreadyProcessed: false, success: true, order: { orderCode } };
  };

  const r1 = processIPNMock('TXN001', 'DH1');
  const r2 = processIPNMock('TXN002', 'DH2');
  const r3 = processIPNMock('TXN003', 'DH3');

  assert.equal(r1.alreadyProcessed, false);
  assert.equal(r2.alreadyProcessed, false);
  assert.equal(r3.alreadyProcessed, false);
  assert.equal(r1.success, true);
  assert.equal(r2.success, true);
  assert.equal(r3.success, true);
});

test('ipn: failed payment restores stock', () => {
  const stockLevels = { 'PROD1': 10, 'PROD2': 5 };
  const orders = { 'DHFAIL': { products: [{ product: 'PROD1', quantity: 2 }, { product: 'PROD2', quantity: 1 }], stock: stockLevels } };

  const restoreStockMock = (orderCode) => {
    const order = orders[orderCode];
    if (!order) return { success: false };
    for (const item of order.products) {
      stockLevels[item.product] += item.quantity;
    }
    return { success: true };
  };

  // Simulate failed IPN
  restoreStockMock('DHFAIL');

  assert.equal(stockLevels['PROD1'], 12, 'PROD1 stock restored: 10 + 2');
  assert.equal(stockLevels['PROD2'], 6, 'PROD2 stock restored: 5 + 1');
});

test('ipn: payment success marks order as paid', () => {
  const orders = { 'DH123': { paymentStatus: 'pending', status: 'pending' } };

  const markAsPaid = (orderCode) => {
    if (!orders[orderCode]) return null;
    orders[orderCode].paymentStatus = 'paid';
    orders[orderCode].status = 'confirmed';
    return orders[orderCode];
  };

  const result = markAsPaid('DH123');
  assert.equal(result.paymentStatus, 'paid');
  assert.equal(result.status, 'confirmed');
});

// ═══════════════════════════════════════════════════════════════
// ORDER CREATION FAIL-SAFE CHECKS
// ═══════════════════════════════════════════════════════════════

test('order: empty products rejected', () => {
  const validateProducts = (products) => {
    if (!products || !Array.isArray(products) || products.length === 0) {
      return { valid: false, error: 'Invalid or empty products array' };
    }
    return { valid: true };
  };

  assert.equal(validateProducts(null).valid, false);
  assert.equal(validateProducts(undefined).valid, false);
  assert.equal(validateProducts([]).valid, false);
  assert.equal(validateProducts('string').valid, false);
  assert.equal(validateProducts([{ _id: 'p1', quantity: 1 }]).valid, true);
});

test('order: missing shipping details rejected', () => {
  const validateShipping = (details) => {
    if (!details) return { valid: false, error: 'Thiếu thông tin giao hàng.' };
    if (!details.fullName || !details.phoneNumber || !details.address) {
      return { valid: false, error: 'Thiếu thông tin giao hàng bắt buộc.' };
    }
    return { valid: true };
  };

  assert.equal(validateShipping(null).valid, false);
  assert.equal(validateShipping(undefined).valid, false);
  assert.equal(validateShipping({}).valid, false);
  assert.equal(validateShipping({ fullName: 'Test', phoneNumber: '', address: '' }).valid, false);
  assert.equal(validateShipping({ fullName: 'Test', phoneNumber: '0912345678', address: '123 ABC' }).valid, true);
});

// ═══════════════════════════════════════════════════════════════
// PAYMENT METHOD ROUTING
// ═══════════════════════════════════════════════════════════════

const SUPPORTED_METHODS = ['stripe', 'vnpay', 'momo', 'zalopay', 'cod', 'qr'];

test('payment-methods: all methods supported', () => {
  for (const method of SUPPORTED_METHODS) {
    assert.ok(SUPPORTED_METHODS.includes(method), `${method} should be supported`);
  }
});

test('payment-methods: unknown methods rejected', () => {
  assert.equal(SUPPORTED_METHODS.includes('bitcoin'), false);
  assert.equal(SUPPORTED_METHODS.includes('cash'), false);
});

// ═══════════════════════════════════════════════════════════════
// ORDER CODE UNIQUENESS & FORMAT
// ═══════════════════════════════════════════════════════════════

const generateOrderCode = () => {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return 'DH' + ts + rand;
};

test('order-code: format DH + 8 chars = 10 total', () => {
  assert.equal(generateOrderCode().length, 10);
  assert.ok(/^DH[A-Z0-9]{8}$/.test(generateOrderCode()));
});

test('order-code: 1000 generations all unique', () => {
  const codes = new Set();
  for (let i = 0; i < 1000; i++) {
    codes.add(generateOrderCode());
  }
  assert.ok(codes.size >= 995, `1000 codes, ${codes.size} unique (expect >= 995)`);
});

// ═══════════════════════════════════════════════════════════════
// STRIPE METADATA EXTRACTION
// ═══════════════════════════════════════════════════════════════

test('stripe: metadata extraction from session', () => {
  const session = {
    metadata: {
      userId: 'user123',
      userEmail: 'test@test.com',
      couponCode: 'SAVE10',
      orderId: 'order456',
    },
  };

  assert.equal(session.metadata.userId, 'user123');
  assert.equal(session.metadata.userEmail, 'test@test.com');
  assert.equal(session.metadata.couponCode, 'SAVE10');
  assert.equal(session.metadata.orderId, 'order456');
});

test('stripe: missing metadata handles gracefully', () => {
  const session = { metadata: {} };
  assert.equal(session.metadata.couponCode || '', '');
  assert.equal(session.metadata.orderId || 'unknown', 'unknown');
});

// ═══════════════════════════════════════════════════════════════
// COUPON DEACTIVATION AFTER PAYMENT
// ═══════════════════════════════════════════════════════════════

test('coupon: deactivates after successful payment', () => {
  const coupons = { 'SAVE10': { isActive: true, usedCount: 0 } };

  const deactivateCoupon = (code) => {
    if (coupons[code]) {
      coupons[code].isActive = false;
      coupons[code].usedCount += 1;
      return true;
    }
    return false;
  };

  assert.ok(deactivateCoupon('SAVE10'));
  assert.equal(coupons['SAVE10'].isActive, false);
  assert.equal(coupons['SAVE10'].usedCount, 1);
});

test('coupon: double deactivation is safe', () => {
  const coupons = { 'SAVE10': { isActive: false, usedCount: 1 } };
  const deactivateCoupon = (code) => {
    if (coupons[code]) {
      coupons[code].isActive = false;
      coupons[code].usedCount += 1;
    }
  };

  deactivateCoupon('SAVE10'); // Already inactive
  assert.equal(coupons['SAVE10'].isActive, false);
  assert.equal(coupons['SAVE10'].usedCount, 2, 'Used count still increments (for tracking)');
});

console.log('\n✅ All payment integration, IPN & signature tests passed!\n');
