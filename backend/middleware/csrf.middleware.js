import crypto from "crypto";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const PUBLIC_PATH_PREFIXES = [
	"/api/auth/signup",
	"/api/auth/login",
	"/api/auth/verify-email",
	"/api/auth/resend-verification",
	"/api/auth/forgot-password",
	"/api/auth/reset-password",
	"/api/mail/subscribe",
	"/api/mail/track/open",
	"/api/mail/track/click",
	"/api/mail/unsubscribe",
	"/api/orders/track",
	"/api/orders/lookup",
	"/api/payments/webhook",
	"/api/payments/vnpay/ipn",
	"/api/payments/momo/ipn",
	"/api/payments/zalopay/ipn",
	"/api/ai/chat",
];

const setCsrfCookie = (res, token) => {
	res.cookie("csrfToken", token, {
		httpOnly: false,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/",
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});
};

export const issueCsrfToken = (req, res) => {
	let csrfToken = req.cookies?.csrfToken;
	if (!csrfToken) {
		csrfToken = crypto.randomBytes(32).toString("hex");
	}
	setCsrfCookie(res, csrfToken);
	return csrfToken;
};

export const csrfProtection = (req, res, next) => {
	// For non-mutating requests, ensure a CSRF cookie exists so the SPA
	// can read it and send it back in the X-CSRF-Token header later
	if (!MUTATING_METHODS.has(req.method)) {
		if (!req.cookies?.csrfToken) {
			const token = crypto.randomBytes(32).toString("hex");
			setCsrfCookie(res, token);
		}
		return next();
	}

	const requestPath = req.originalUrl || req.url || "";
	if (PUBLIC_PATH_PREFIXES.some((prefix) => requestPath.startsWith(prefix))) {
		return next();
	}

	const csrfCookie = req.cookies?.csrfToken;
	const csrfHeader = req.get("x-csrf-token");

	if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
		return res.status(403).json({ message: "CSRF token missing or invalid" });
	}

	return next();
};
