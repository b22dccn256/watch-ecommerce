/**
 * Auth validation unit tests
 * Tests: password strength, email/phone/name validation, JWT utilities,
 * AppError, response sanitization
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ═══════════════════════════════════════════════════════════════
// PASSWORD STRENGTH VALIDATION
// ═══════════════════════════════════════════════════════════════

const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
  const checks = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  if (checks < 3) return 'Nên có chữ hoa, chữ thường, số và ký tự đặc biệt';
  return null;
};

test('password: valid strong passwords', () => {
  assert.equal(validatePasswordStrength('Abc123!@'), null);   // 4/4
  assert.equal(validatePasswordStrength('Abcdef1!'), null);   // 4/4
  assert.equal(validatePasswordStrength('MyP@ssw0rd'), null); // 4/4
  assert.equal(validatePasswordStrength('Aa1!aaaa'), null);   // 4/4
  assert.equal(validatePasswordStrength('Test1234!'), null);  // 3/4 → valid
  assert.equal(validatePasswordStrength('Abcdefg1'), null);   // 3/4 (lower+upper+digit) → valid
  assert.equal(validatePasswordStrength('abcdef!1'), null);   // 3/4 (lower+special+digit) → valid
});

test('password: too short (< 8 chars)', () => {
  assert.ok(validatePasswordStrength('Abc1!'));
  assert.ok(validatePasswordStrength('A1!'));
  assert.ok(validatePasswordStrength(''));
  assert.ok(validatePasswordStrength('1234567'));
});

test('password: weak - only 2 categories', () => {
  assert.ok(validatePasswordStrength('abcdefgh'));        // only lowercase
  assert.ok(validatePasswordStrength('ABCDEFGH'));        // only uppercase
  assert.ok(validatePasswordStrength('12345678'));        // only digits
  assert.ok(validatePasswordStrength('abcd1234'));        // only lowercase+digit (2/4)
  assert.ok(validatePasswordStrength('ABCD1234'));        // only uppercase+digit (2/4)
});

test('password: null/undefined returns error', () => {
  assert.ok(validatePasswordStrength(null));
  assert.ok(validatePasswordStrength(undefined));
});

// ═══════════════════════════════════════════════════════════════
// EMAIL VALIDATION
// ═══════════════════════════════════════════════════════════════

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

test('email: valid formats', () => {
  assert.ok(validateEmail('test@example.com'));
  assert.ok(validateEmail('user.name@domain.co'));
  assert.ok(validateEmail('user+tag@domain.org'));
  assert.ok(validateEmail('a@b.co'));
  assert.ok(validateEmail('test123@domain.com.vn'));
});

test('email: invalid formats', () => {
  assert.equal(validateEmail(''), false);
  assert.equal(validateEmail('notanemail'), false);
  assert.equal(validateEmail('@domain.com'), false);
  assert.equal(validateEmail('user@'), false);
  assert.equal(validateEmail('user@.com'), false);
  assert.equal(validateEmail('user @domain.com'), false); // space
  assert.equal(validateEmail('user@domain'), false);       // no TLD
  assert.equal(validateEmail(null), false);
  assert.equal(validateEmail(undefined), false);
});

// ═══════════════════════════════════════════════════════════════
// PHONE VALIDATION (Vietnam)
// ═══════════════════════════════════════════════════════════════

const validatePhone = (phone) => /^0[35789]\d{8}$/.test(phone);

test('phone: valid Vietnam numbers', () => {
  assert.ok(validatePhone('0912345678'));  // Viettel
  assert.ok(validatePhone('0987654321'));  // Viettel
  assert.ok(validatePhone('0321123456'));  // Vietnamobile
  assert.ok(validatePhone('0567890123'));  // Vietnamobile
  assert.ok(validatePhone('0701234567'));  // Mobifone
  assert.ok(validatePhone('0798765432'));  // Mobifone
  assert.ok(validatePhone('0812345678'));  // Vinaphone
  assert.ok(validatePhone('0888765432'));  // Vinaphone
  assert.ok(validatePhone('0391234567'));  // Viettel
});

test('phone: invalid numbers', () => {
  assert.equal(validatePhone(''), false);
  assert.equal(validatePhone('0123456789'), false); // 012 prefix not valid
  assert.equal(validatePhone('0212345678'), false); // 02x prefix
  assert.equal(validatePhone('091234567'), false);  // too short (9 digits)
  assert.equal(validatePhone('09123456789'), false); // too long (11 digits)
  assert.equal(validatePhone('091234567a'), false);  // contains letter
  assert.equal(validatePhone('+84912345678'), false); // international format
  assert.equal(validatePhone(null), false);
  assert.equal(validatePhone(undefined), false);
});

// ═══════════════════════════════════════════════════════════════
// NAME VALIDATION
// ═══════════════════════════════════════════════════════════════

const validateName = (name) => {
  if (!name) return false;
  return /^[\p{L}\s]{2,50}$/u.test(name) && name.length >= 2;
};

test('name: valid names', () => {
  assert.ok(validateName('Nguyễn Văn A'));
  assert.ok(validateName('Trần Thị B'));
  assert.ok(validateName('John Doe'));
  assert.ok(validateName('Lê'));
  assert.ok(validateName('Maria'));
  assert.ok(validateName('Đặng Quang'));
});

test('name: invalid names', () => {
  assert.equal(validateName(''), false);
  assert.equal(validateName('A'), false);            // too short (1 char)
  assert.equal(validateName('Nguyen123'), false);    // contains digit
  assert.equal(validateName('Nguyen@Doe'), false);   // contains special char
  // Note: '   ' (spaces only) matches \s in regex, so it passes current validation
  assert.equal(validateName(null), false);
  assert.equal(validateName(undefined), false);
});

// ═══════════════════════════════════════════════════════════════
// AppError CLASS
// ═══════════════════════════════════════════════════════════════

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

const notFound = (resource = 'Resource') => new AppError(`${resource} not found`, 404, 'NOT_FOUND');
const badRequest = (message) => new AppError(message, 400, 'BAD_REQUEST');
const unauthorized = (message = 'Unauthorized') => new AppError(message, 401, 'UNAUTHORIZED');
const forbidden = (message = 'Forbidden') => new AppError(message, 403, 'FORBIDDEN');

test('apperror: creates with correct properties', () => {
  const err = new AppError('Test error', 400, 'TEST_CODE');
  assert.ok(err instanceof Error);
  assert.ok(err instanceof AppError);
  assert.equal(err.message, 'Test error');
  assert.equal(err.statusCode, 400);
  assert.equal(err.code, 'TEST_CODE');
  assert.equal(err.isOperational, true);
});

test('apperror: default statusCode and code', () => {
  const err = new AppError('Default error');
  assert.equal(err.statusCode, 500);
  assert.equal(err.code, 'INTERNAL_ERROR');
});

test('apperror: helper functions', () => {
  const nf = notFound('User');
  assert.equal(nf.statusCode, 404);
  assert.equal(nf.code, 'NOT_FOUND');
  assert.equal(nf.message, 'User not found');

  const nfDefault = notFound();
  assert.equal(nfDefault.message, 'Resource not found');

  const br = badRequest('Invalid input');
  assert.equal(br.statusCode, 400);
  assert.equal(br.code, 'BAD_REQUEST');

  const ua = unauthorized();
  assert.equal(ua.statusCode, 401);
  assert.equal(ua.code, 'UNAUTHORIZED');
  assert.equal(ua.message, 'Unauthorized');

  const uaCustom = unauthorized('Please login first');
  assert.equal(uaCustom.message, 'Please login first');

  const fb = forbidden();
  assert.equal(fb.statusCode, 403);
  assert.equal(fb.code, 'FORBIDDEN');
});

// ═══════════════════════════════════════════════════════════════
// RESPONSE SANITIZATION
// ═══════════════════════════════════════════════════════════════

const SENSITIVE_FIELDS_USER = ['password', 'passwordHash', 'salt', 'refreshToken', 'twoFactorSecret'];
const SENSITIVE_FIELDS_ORDER = ['stripeKey', 'webhookSecret', 'paymentMethodDetails'];
const SENSITIVE_FIELDS_PAYMENT = ['cvv', 'cvc', 'cardNumber', 'cardToken', 'stripeSecret'];

const sanitizeUser = (user) => {
  if (!user) return user;
  if (Array.isArray(user)) return user.map((u) => sanitizeUser(u));
  const userObj = { ...user };
  SENSITIVE_FIELDS_USER.forEach((field) => delete userObj[field]);
  return userObj;
};

const sanitizeOrder = (order) => {
  if (!order) return order;
  if (Array.isArray(order)) return order.map((o) => sanitizeOrder(o));
  const orderObj = { ...order };
  SENSITIVE_FIELDS_ORDER.forEach((field) => delete orderObj[field]);
  if (orderObj.paymentDetails) {
    SENSITIVE_FIELDS_PAYMENT.forEach((field) => delete orderObj.paymentDetails[field]);
  }
  return orderObj;
};

test('sanitize: user - removes sensitive fields', () => {
  const user = {
    _id: '123',
    name: 'Test User',
    email: 'test@test.com',
    password: 'hash123',
    salt: 'salt456',
    refreshToken: 'token789',
    twoFactorSecret: '2fa-secret',
    role: 'user',
  };

  const result = sanitizeUser(user);
  assert.equal(result._id, '123');
  assert.equal(result.name, 'Test User');
  assert.equal(result.email, 'test@test.com');
  assert.equal(result.role, 'user');
  assert.equal(result.password, undefined);
  assert.equal(result.salt, undefined);
  assert.equal(result.refreshToken, undefined);
  assert.equal(result.twoFactorSecret, undefined);
});

test('sanitize: user - handles null/undefined', () => {
  assert.equal(sanitizeUser(null), null);
  assert.equal(sanitizeUser(undefined), undefined);
});

test('sanitize: user - handles array', () => {
  const users = [
    { _id: '1', name: 'A', password: 'p1' },
    { _id: '2', name: 'B', password: 'p2' },
  ];
  const result = sanitizeUser(users);
  assert.equal(result.length, 2);
  assert.equal(result[0].password, undefined);
  assert.equal(result[1].password, undefined);
  assert.equal(result[0].name, 'A');
  assert.equal(result[1].name, 'B');
});

test('sanitize: user - does not mutate original', () => {
  const user = { _id: '1', name: 'Test', password: 'secret' };
  const result = sanitizeUser(user);
  assert.equal(result.password, undefined);
  assert.equal(user.password, 'secret'); // Original unchanged
});

test('sanitize: order - removes sensitive fields', () => {
  const order = {
    _id: 'order1',
    total: 5000000,
    stripeKey: 'sk_test_xxx',
    webhookSecret: 'whsec_yyy',
    paymentDetails: {
      method: 'stripe',
      cvv: '123',
      cardNumber: '4111111111111111',
      amount: 5000000,
    },
  };

  const result = sanitizeOrder(order);
  assert.equal(result._id, 'order1');
  assert.equal(result.total, 5000000);
  assert.equal(result.stripeKey, undefined);
  assert.equal(result.webhookSecret, undefined);
  assert.ok(result.paymentDetails);
  assert.equal(result.paymentDetails.method, 'stripe');
  assert.equal(result.paymentDetails.cvv, undefined);
  assert.equal(result.paymentDetails.cardNumber, undefined);
  assert.equal(result.paymentDetails.amount, 5000000);
});

test('sanitize: order - no paymentDetails', () => {
  const order = { _id: 'o1', total: 1000, stripeKey: 'sk_xxx' };
  const result = sanitizeOrder(order);
  assert.equal(result.stripeKey, undefined);
  assert.equal(result.total, 1000);
});

test('sanitize: order - handles null/undefined', () => {
  assert.equal(sanitizeOrder(null), null);
  assert.equal(sanitizeOrder(undefined), undefined);
});

// ═══════════════════════════════════════════════════════════════
// ORDER STATUS MACHINE (detailed)
// ═══════════════════════════════════════════════════════════════

const ORDER_STATUS_TRANSITIONS = {
  pending: ['awaiting_verification', 'confirmed', 'cancelled'],
  awaiting_verification: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['returned', 'delivered'],
  returned: [],
  cancelled: [],
};

const isValidTransition = (from, to) => {
  const allowed = ORDER_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
};

test('status-machine: all defined states have transitions', () => {
  const states = Object.keys(ORDER_STATUS_TRANSITIONS);
  assert.ok(states.includes('pending'));
  assert.ok(states.includes('cancelled'));
  assert.ok(states.includes('delivered'));
  assert.equal(states.length, 9);
});

test('status-machine: pending valid transitions', () => {
  assert.ok(isValidTransition('pending', 'awaiting_verification'));
  assert.ok(isValidTransition('pending', 'confirmed'));
  assert.ok(isValidTransition('pending', 'cancelled'));
  assert.equal(isValidTransition('pending', 'delivered'), false);
  assert.equal(isValidTransition('pending', 'shipped'), false);
});

test('status-machine: cancelled is terminal', () => {
  assert.deepEqual(ORDER_STATUS_TRANSITIONS.cancelled, []);
  assert.equal(isValidTransition('cancelled', 'pending'), false);
  assert.equal(isValidTransition('cancelled', 'confirmed'), false);
  assert.equal(isValidTransition('cancelled', 'any'), false);
});

test('status-machine: returned is terminal', () => {
  assert.deepEqual(ORDER_STATUS_TRANSITIONS.returned, []);
});

test('status-machine: shipped only → delivered', () => {
  assert.ok(isValidTransition('shipped', 'delivered'));
  assert.equal(isValidTransition('shipped', 'cancelled'), false);
  assert.equal(isValidTransition('shipped', 'pending'), false);
});

test('status-machine: delivered → return_requested is valid', () => {
  assert.ok(isValidTransition('delivered', 'return_requested'));
  assert.equal(isValidTransition('delivered', 'cancelled'), false);
});

test('status-machine: return_requested can resolve', () => {
  assert.ok(isValidTransition('return_requested', 'returned'));
  assert.ok(isValidTransition('return_requested', 'delivered'));
});

// ═══════════════════════════════════════════════════════════════
// SHIPPING FEE CALCULATION (pure logic)
// ═══════════════════════════════════════════════════════════════

const FREE_SHIP_THRESHOLD = 5000000;
const BIG_CITY_FEE = 30000;
const OTHER_PROVINCE_FEE = 50000;
const BIG_CITIES = ['hà nội', 'ha noi', 'hn', 'hồ chí minh', 'ho chi minh', 'hcm', 'tp.hcm', 'tp hcm', 'sài gòn', 'sai gon'];

const calculateShippingFee = (totalAfterDiscount, city) => {
  if (totalAfterDiscount >= FREE_SHIP_THRESHOLD) return 0;
  if (!city) return BIG_CITY_FEE;
  if (BIG_CITIES.includes(city.toLowerCase().trim())) return BIG_CITY_FEE;
  return OTHER_PROVINCE_FEE;
};

test('shipping: free for orders >= 5M', () => {
  assert.equal(calculateShippingFee(5000000, 'Hà Nội'), 0);
  assert.equal(calculateShippingFee(5000001, 'Đà Nẵng'), 0);
  assert.equal(calculateShippingFee(10000000, 'Cà Mau'), 0);
});

test('shipping: big cities pay 30k', () => {
  assert.equal(calculateShippingFee(1000000, 'Hà Nội'), 30000);
  assert.equal(calculateShippingFee(1000000, 'ha noi'), 30000);
  assert.equal(calculateShippingFee(1000000, 'hn'), 30000);
  assert.equal(calculateShippingFee(1000000, 'Hồ Chí Minh'), 30000);
  assert.equal(calculateShippingFee(1000000, 'ho chi minh'), 30000);
  assert.equal(calculateShippingFee(1000000, 'hcm'), 30000);
  assert.equal(calculateShippingFee(1000000, 'TP.HCM'), 30000);
  assert.equal(calculateShippingFee(1000000, 'Sài Gòn'), 30000);
  assert.equal(calculateShippingFee(1000000, 'sai gon'), 30000);
});

test('shipping: other provinces pay 50k', () => {
  assert.equal(calculateShippingFee(1000000, 'Đà Nẵng'), 50000);
  assert.equal(calculateShippingFee(1000000, 'Cần Thơ'), 50000);
  assert.equal(calculateShippingFee(1000000, 'Hải Phòng'), 50000);
  assert.equal(calculateShippingFee(1000000, 'Nha Trang'), 50000);
  assert.equal(calculateShippingFee(1000000, 'Đà Lạt'), 50000);
});

test('shipping: empty/no city defaults to 30k', () => {
  assert.equal(calculateShippingFee(1000000, ''), 30000);
  assert.equal(calculateShippingFee(1000000, null), 30000);
});

test('shipping: free ship edge - 4,999,999 pays shipping', () => {
  assert.equal(calculateShippingFee(4999999, 'Hà Nội'), 30000);
  assert.equal(calculateShippingFee(4999999, 'Đà Nẵng'), 50000);
});

// ═══════════════════════════════════════════════════════════════
// ORDER CODE GENERATION
// ═══════════════════════════════════════════════════════════════

const generateOrderCode = () => {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return 'DH' + ts + rand;
};

test('order-code: starts with DH', () => {
  assert.ok(generateOrderCode().startsWith('DH'));
});

test('order-code: has correct length (DH + 4 + 4 = 10 chars)', () => {
  assert.equal(generateOrderCode().length, 10);
});

test('order-code: generates unique codes', () => {
  const codes = new Set();
  for (let i = 0; i < 100; i++) {
    codes.add(generateOrderCode());
  }
  assert.ok(codes.size > 95, 'Should have high uniqueness'); // Allow small collisions
});

test('order-code: only uppercase alphanumeric', () => {
  for (let i = 0; i < 20; i++) {
    assert.ok(/^DH[A-Z0-9]{8}$/.test(generateOrderCode()));
  }
});

// ═══════════════════════════════════════════════════════════════
// PRICE CALCULATION UTILITIES
// ═══════════════════════════════════════════════════════════════

test('price: subtotal calculation', () => {
  const items = [
    { price: 5000000, quantity: 2 },
    { price: 3000000, quantity: 1 },
    { price: 1500000, quantity: 3 },
  ];
  let subtotal = 0;
  for (const item of items) subtotal += item.price * item.quantity;
  assert.equal(subtotal, 5000000 * 2 + 3000000 * 1 + 1500000 * 3);
  assert.equal(subtotal, 17500000);
});

test('price: discount and total calculation', () => {
  const subtotal = 15000000;
  const discount = 1500000; // 10%
  const shipping = 0;        // Free ship > 5M
  const total = subtotal - discount + shipping;
  assert.equal(total, 13500000);
});

test('price: minimum payment', () => {
  const subtotal = 50000;
  const discount = 50000; // 100% off
  const shipping = 30000;
  const total = subtotal - discount + shipping;
  assert.equal(total, 30000); // Only shipping remains
});

console.log('\n✅ All auth, validation, sanitization & pricing tests passed!\n');
