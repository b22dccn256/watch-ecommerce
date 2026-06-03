/**
 * Response Sanitization Utilities
 * Use these functions in controllers to remove sensitive data before responding
 *
 * Example usage:
 *   const userResponse = sanitizeUser(user);
 *   res.json(userResponse);
 */

// List of sensitive fields to NEVER expose in API responses
const SENSITIVE_FIELDS_USER = [
  "password",
  "passwordHash",
  "salt",
  "refreshToken",
  "twoFactorSecret",
];
const SENSITIVE_FIELDS_ORDER = [
  "stripeKey",
  "webhookSecret",
  "paymentMethodDetails",
];
const SENSITIVE_FIELDS_PAYMENT = [
  "cvv",
  "cvc",
  "cardNumber",
  "cardToken",
  "stripeSecret",
];
const SENSITIVE_FIELDS_ADMIN = [
  "apiKey",
  "apiSecret",
  "encryptionKey",
  "jwtSecret",
  "dbPassword",
];

/**
 * Sanitize user object - remove passwords and auth tokens
 * @param {Object} user - User object (or array of users)
 * @returns {Object|Array} User object with sensitive fields removed
 */
export const sanitizeUser = (user) => {
  if (!user) return user;

  if (Array.isArray(user)) {
    return user.map((u) => sanitizeUser(u));
  }

  // Convert to plain object if it's a Mongoose document
  const userObj = user.toObject ? user.toObject() : { ...user };

  // Remove sensitive fields
  SENSITIVE_FIELDS_USER.forEach((field) => {
    delete userObj[field];
  });

  return userObj;
};

/**
 * Sanitize order object - remove sensitive payment details
 * @param {Object} order - Order object (or array of orders)
 * @returns {Object|Array} Order with sensitive fields removed
 */
export const sanitizeOrder = (order) => {
  if (!order) return order;

  if (Array.isArray(order)) {
    return order.map((o) => sanitizeOrder(o));
  }

  const orderObj = order.toObject ? order.toObject() : { ...order };

  // Remove sensitive fields
  SENSITIVE_FIELDS_ORDER.forEach((field) => {
    delete orderObj[field];
  });

  // Sanitize nested payment details
  if (orderObj.paymentDetails) {
    SENSITIVE_FIELDS_PAYMENT.forEach((field) => {
      delete orderObj.paymentDetails[field];
    });
  }

  return orderObj;
};

/**
 * Sanitize product object - mostly safe, but remove admin-only fields
 * @param {Object} product - Product object (or array of products)
 * @returns {Object|Array} Product with admin fields removed
 */
export const sanitizeProduct = (product) => {
  if (!product) return product;

  if (Array.isArray(product)) {
    return product.map((p) => sanitizeProduct(p));
  }

  const productObj = product.toObject ? product.toObject() : { ...product };

  // Remove admin-only fields
  delete productObj.apiKey;
  delete productObj.supplierSecret;

  return productObj;
};

/**
 * Sanitize authentication response
 * Remove sensitive data from login/signup responses
 * @param {Object} response - Auth response object
 * @returns {Object} Sanitized response
 */
export const sanitizeAuthResponse = (response) => {
  if (!response) return response;

  const authObj = { ...response };

  // Keep only necessary fields
  if (authObj.user) {
    authObj.user = sanitizeUser(authObj.user);
  }

  // Remove any admin-only fields
  SENSITIVE_FIELDS_ADMIN.forEach((field) => {
    delete authObj[field];
  });

  return authObj;
};

/**
 * Sanitize error response - make sure we don't leak sensitive info in error messages
 * @param {Object} error - Error object
 * @returns {Object} Safe error response
 */
export const sanitizeErrorResponse = (error) => {
  // Don't expose sensitive details in error messages
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /api/i,
    /database/i,
    /credential/i,
  ];

  let message = error?.message || "An error occurred";

  // Check if message contains sensitive information
  if (sensitivePatterns.some((pattern) => pattern.test(message))) {
    message = "An error occurred. Please try again.";
  }

  return {
    message,
    ...(process.env.NODE_ENV === "development" && {
      fullError: error?.message,
    }),
  };
};
