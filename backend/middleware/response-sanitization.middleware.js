/**
 * Response Sanitization Middleware
 * Removes sensitive data from API responses to prevent information leakage
 */

// List of sensitive fields to remove from responses
const SENSITIVE_FIELDS = new Set([
	"password",
	"passwordHash",
	"salt",
	"cvv",
	"cvc",
	"cardNumber",
	"creditCardNumber",
	"bankAccountNumber",
	"ssn",
	"socialSecurityNumber",
	"apiKey",
	"apiSecret",
	"accessToken",
	"refreshToken",
	"secretKey",
	"privateKey",
	"oauthToken",
	"webhookSecret",
	"encryptionKey",
	"jwtSecret",
	"stripeKey",
	"googleKey",
	"awsSecret",
	"dbPassword",
	"databasePassword",
	"mongoPassword",
	"twoFactorSecret",
	"recoveryCodes",
]);

/**
 * Deep clone and sanitize an object by removing sensitive fields
 * Handles circular references by tracking visited objects
 * @param {*} obj - Object to sanitize (can be any type)
 * @param {Set<string>} fieldsToRemove - Set of field names to remove
 * @param {WeakSet} visited - Track visited objects to prevent circular references
 * @returns {*} Sanitized copy of the object
 */
export const sanitizeData = (obj, fieldsToRemove = SENSITIVE_FIELDS, visited = new WeakSet()) => {
	if (obj === null || obj === undefined) {
		return obj;
	}

	// Handle primitives
	if (typeof obj !== "object") {
		return obj;
	}

	// Handle circular references
	if (visited.has(obj)) {
		return undefined; // Omit circular references
	}

	// Handle dates
	if (obj instanceof Date) {
		return new Date(obj);
	}

	// Handle Buffer (convert to hex string)
	if (Buffer.isBuffer(obj)) {
		return obj.toString("hex");
	}

	// Handle MongoDB ObjectId (has toHexString method, iterate with Object.entries exposes internals)
	if (typeof obj.toHexString === "function" && obj._bsontype === "ObjectId") {
		return obj.toHexString();
	}

	// Handle Mongoose documents (call toJSON to get plain object, then sanitize)
	if (typeof obj.toJSON === "function" && !Array.isArray(obj) && !(obj instanceof Date) && !Buffer.isBuffer(obj)) {
		return sanitizeData(obj.toJSON(), fieldsToRemove, visited);
	}

	// Mark as visited
	visited.add(obj);

	// Handle arrays
	if (Array.isArray(obj)) {
		return obj.map((item) => {
			if (item !== null && typeof item === "object") {
				return sanitizeData(item, fieldsToRemove, visited);
			}
			return item;
		});
	}

	// Handle objects
	const sanitized = {};
	try {
		for (const [key, value] of Object.entries(obj)) {
			// Skip sensitive fields (case-insensitive)
			if (fieldsToRemove.has(key.toLowerCase())) {
				continue;
			}

			// Recursively sanitize nested objects and arrays
			if (value !== null && typeof value === "object") {
				const sanitizedValue = sanitizeData(value, fieldsToRemove, visited);
				if (sanitizedValue !== undefined) {
					sanitized[key] = sanitizedValue;
				}
			} else if (value !== null && value !== undefined) {
				sanitized[key] = value;
			}
		}
	} catch (err) {
		// If iteration fails, return the object as-is (can't sanitize safely)
		console.warn("Warning: Could not safely sanitize object", err.message);
		return obj;
	}

	return sanitized;
};

/**
 * Response interceptor middleware to automatically sanitize responses
 * Wraps the res.json() method to sanitize data before sending
 */
export const responseSanitizationMiddleware = (req, res, next) => {
	const originalJson = res.json;

	// Override res.json to sanitize before sending
	res.json = function (data) {
		const sanitized = sanitizeData(data);
		return originalJson.call(this, sanitized);
	};

	next();
};

/**
 * Utility function to create custom sanitizer with specific fields
 * @param {string[]} fieldsToRemove - Array of additional fields to remove
 * @returns {Function} Sanitize function
 */
export const createCustomSanitizer = (additionalFields = []) => {
	const fields = new Set([...SENSITIVE_FIELDS, ...additionalFields.map((f) => f.toLowerCase())]);
	return (obj) => sanitizeData(obj, fields);
};
