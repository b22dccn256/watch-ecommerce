import Joi from "joi";

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const authSchemas = {
	signup: Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().min(8).required(),
		confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
			"any.only": "Mật khẩu xác nhận không khớp",
		}),
		name: Joi.string().min(2).max(100).required(),
		phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
	}).unknown(false),

	login: Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().required(),
	}).unknown(false),

	forgotPassword: Joi.object({
		email: Joi.string().email().required(),
	}).unknown(false),

	resetPassword: Joi.object({
		token: Joi.string().required(),
		newPassword: Joi.string().min(8).required(),
	}).unknown(false),

	changePassword: Joi.object({
		currentPassword: Joi.string().required(),
		newPassword: Joi.string().min(8).required(),
	}).unknown(false),

	updateProfile: Joi.object({
		name: Joi.string().min(2).max(100).optional(),
		phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
		address: Joi.string().max(500).optional(),
	}).unknown(true), // Allow extra fields from frontend
};

export const productSchemas = {
	create: Joi.object({
		name: Joi.string().min(3).max(200).required(),
		description: Joi.string().min(10).max(2000).required(),
		price: Joi.number().positive().required(),
		category: Joi.string().required(),
		brand: Joi.string().required(),
		stock: Joi.number().integer().min(0).required(),
		images: Joi.array().items(Joi.string().uri()).min(1).required(),
		specifications: Joi.object().optional(),
	}).unknown(false),

	update: Joi.object({
		name: Joi.string().min(3).max(200).optional(),
		description: Joi.string().min(10).max(2000).optional(),
		price: Joi.number().positive().optional(),
		category: Joi.string().optional(),
		brand: Joi.string().optional(),
		stock: Joi.number().integer().min(0).optional(),
		images: Joi.array().items(Joi.string().uri()).optional(),
		specifications: Joi.object().optional(),
	}).unknown(false),
};

export const cartSchemas = {
	addItem: Joi.object({
		productId: Joi.string().required(),
		quantity: Joi.number().integer().min(1).max(100).required(),
	}).unknown(false),

	updateItem: Joi.object({
		quantity: Joi.number().integer().min(1).max(100).required(),
	}).unknown(false),
};

export const orderSchemas = {
	create: Joi.object({
		items: Joi.array().items(
			Joi.object({
				productId: Joi.string().required(),
				quantity: Joi.number().integer().min(1).required(),
				price: Joi.number().positive().required(),
			})
		).min(1).required(),
		shippingAddress: Joi.object({
			street: Joi.string().required(),
			city: Joi.string().required(),
			state: Joi.string().required(),
			zipCode: Joi.string().required(),
			country: Joi.string().required(),
		}).required(),
		phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
		paymentMethod: Joi.string().valid("credit_card", "debit_card", "paypal", "vnpay", "momo", "zalopay").required(),
	}).unknown(false),
};

export const reviewSchemas = {
	create: Joi.object({
		productId: Joi.string().required(),
		rating: Joi.number().integer().min(1).max(5).required(),
		title: Joi.string().min(3).max(100).required(),
		comment: Joi.string().min(10).max(1000).required(),
	}).unknown(false),
};

export const couponSchemas = {
	create: Joi.object({
		code: Joi.string().max(50).required(),
		type: Joi.string().valid("percent", "fixed").default("percent"),
		discountValue: Joi.number().positive().required(),
		minOrderAmount: Joi.number().min(0).default(0),
		maxUses: Joi.number().integer().min(0).default(0),
		expirationDate: Joi.date().iso().required(),
		isActive: Joi.boolean().default(true),
	}).unknown(false),

	apply: Joi.object({
		code: Joi.string().max(50).required(),
	}).unknown(false),
};

// ─────────────────────────────────────────────────────────────────────────────
// Validation Middleware Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates validation middleware for request body
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export const validateBody = (schema) => {
	return (req, res, next) => {
		const { error, value } = schema.validate(req.body, {
			abortEarly: false,
			stripUnknown: true,
		});

		if (error) {
			const errors = error.details.reduce((acc, err) => {
				acc[err.path.join(".")] = err.message;
				return acc;
			}, {});

			return res.status(400).json({
				message: "Validation failed",
				errors,
			});
		}

		// Replace body with validated and sanitized value
		req.body = value;
		next();
	};
};

/**
 * Creates validation middleware for query parameters
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => {
	return (req, res, next) => {
		const { error, value } = schema.validate(req.query, {
			abortEarly: false,
		});

		if (error) {
			const errors = error.details.reduce((acc, err) => {
				acc[err.path.join(".")] = err.message;
				return acc;
			}, {});

			return res.status(400).json({
				message: "Validation failed",
				errors,
			});
		}

		req.query = value;
		next();
	};
};

/**
 * Creates validation middleware for route parameters
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export const validateParams = (schema) => {
	return (req, res, next) => {
		const { error, value } = schema.validate(req.params, {
			abortEarly: false,
		});

		if (error) {
			const errors = error.details.reduce((acc, err) => {
				acc[err.path.join(".")] = err.message;
				return acc;
			}, {});

			return res.status(400).json({
				message: "Validation failed",
				errors,
			});
		}

		req.params = value;
		next();
	};
};
