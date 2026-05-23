const SENSITIVE_KEYS = new Set([
	"password",
	"passwordhash",
	"newpassword",
	"confirmpassword",
	"currentpassword",
	"accesstoken",
	"refreshtoken",
	"token",
	"otp",
	"cvv",
	"cvc",
	"cardnumber",
	"apikey",
	"apisecret",
	"authorization",
]);

const redactValue = (value) => {
	if (value === null || value === undefined) return value;
	if (typeof value === "string") return "[REDACTED]";
	if (Array.isArray(value)) return value.map(redactValue);
	if (typeof value === "object") return redactObject(value);
	return "[REDACTED]";
};

const redactObject = (obj) => {
	if (!obj || typeof obj !== "object") return obj;
	const redacted = {};
	for (const [key, value] of Object.entries(obj)) {
		if (SENSITIVE_KEYS.has(key.toLowerCase())) {
			redacted[key] = "[REDACTED]";
		} else if (value && typeof value === "object") {
			redacted[key] = redactObject(value);
		} else {
			redacted[key] = value;
		}
	}
	return redacted;
};

export const redactSensitiveData = redactObject;

/**
 * Attach safe request snapshot for error logging (no passwords/tokens).
 */
export const attachSafeRequestLog = (req, res, next) => {
	req.safeLog = {
		method: req.method,
		url: req.originalUrl,
		query: redactObject(req.query),
		body: redactObject(req.body),
	};
	next();
};
