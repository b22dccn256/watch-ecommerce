const sanitizeValue = (value) => {
	if (typeof value === "string") {
		return value.replace(/\0/g, "").trim();
	}

	if (Array.isArray(value)) {
		return value.map(sanitizeValue);
	}

	if (value && typeof value === "object") {
		return Object.fromEntries(Object.entries(value).map(([key, innerValue]) => [key, sanitizeValue(innerValue)]));
	}

	return value;
};

export const sanitizeInput = (req, res, next) => {
	if (req.body && typeof req.body === "object") {
		// mutate body in-place where possible to preserve references
		try {
			const sanitizedBody = sanitizeValue(req.body);
			Object.keys(sanitizedBody).forEach((k) => (req.body[k] = sanitizedBody[k]));
		} catch (e) {
			// fallback: replace body
			req.body = sanitizeValue(req.body);
		}
	}

	if (req.query && typeof req.query === "object") {
		// req.query may be a getter-only object in some Node/Express setups; mutate keys instead of reassigning
		Object.keys(req.query).forEach((k) => {
			try {
				req.query[k] = sanitizeValue(req.query[k]);
			} catch (e) {
				// ignore individual key failures
			}
		});
	}

	if (req.params && typeof req.params === "object") {
		Object.keys(req.params).forEach((k) => {
			try {
				req.params[k] = sanitizeValue(req.params[k]);
			} catch (e) {
				// ignore
			}
		});
	}

	next();
};
