import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { emailQueue } from "../controllers/mail.controller.js";
import { sendEmail } from "../lib/email.js";
import jwt from "jsonwebtoken";

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

const validatePasswordStrength = (password) => {
	if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
	const checks = [
		/[a-z]/.test(password),
		/[A-Z]/.test(password),
		/\d/.test(password),
		/[^A-Za-z0-9]/.test(password),
	].filter(Boolean).length;
	if (checks < 3) return "Mật khẩu nên có chữ hoa, chữ thường, số và ký tự đặc biệt";
	return null;
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePhone = (phone) => /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])\d{7}$/.test(phone);

const validateName = (name) => {
	if (!name) return false;
	return /^[\p{L}\s]{2,50}$/u.test(name) && name.length >= 2;
};

const normalizeAddressEntry = (entry) => {
	if (!entry) return null;
	const id = String(entry.id || crypto.randomUUID()).trim();
	const label = String(entry.label || "").trim();
	const fullName = String(entry.fullName || "").trim();
	const phone = String(entry.phone || "").trim();
	const address = String(entry.address || "").trim();
	const city = String(entry.city || "").trim();
	if (!label || !address || !city) return null;
	return {
		id,
		label,
		fullName,
		phone,
		address,
		city,
		isDefault: Boolean(entry.isDefault),
	};
};

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

export const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: "15m",
	});
	const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: "7d",
	});
	return { accessToken, refreshToken };
};

export const storeRefreshToken = async (userId, refreshToken) => {
	await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
};

export const setCookies = (res, accessToken, refreshToken) => {
	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		// In production keep Strict; in local dev allow Lax so browser will send cookies from frontend origin
		sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
		maxAge: 15 * 60 * 1000,
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		// In production keep Strict; in local dev allow Lax so browser will send cookies from frontend origin
		sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});
};

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const signup = async ({ email, password, name, phone, confirmPassword }) => {
	const normalizedName = name?.trim();
	const normalizedEmail = email?.toLowerCase().trim();
	const normalizedPhone = phone?.trim();

	if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
		const error = new Error("Vui lòng điền đầy đủ họ tên, email và mật khẩu");
		error.statusCode = 400;
		throw error;
	}

	if (!validateName(normalizedName)) {
		const error = new Error("Họ và tên chỉ được chứa chữ cái và khoảng trắng (2–50 ký tự)");
		error.statusCode = 400;
		throw error;
	}

	if (!validateEmail(normalizedEmail)) {
		const error = new Error("Email không hợp lệ");
		error.statusCode = 400;
		throw error;
	}

	if (password !== confirmPassword) {
		const error = new Error("Mật khẩu xác nhận không khớp");
		error.statusCode = 400;
		throw error;
	}

	const passwordErr = validatePasswordStrength(password);
	if (passwordErr) {
		const error = new Error(passwordErr);
		error.statusCode = 400;
		throw error;
	}

	if (normalizedPhone && !validatePhone(normalizedPhone)) {
		const error = new Error("Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam.");
		error.statusCode = 400;
		throw error;
	}

	const existingEmail = await User.findOne({ email: normalizedEmail });
	if (existingEmail) {
		const error = new Error("Email đã được sử dụng");
		error.statusCode = 400;
		throw error;
	}

	if (normalizedPhone) {
		const existingPhone = await User.findOne({ phone: normalizedPhone });
		if (existingPhone) {
			const error = new Error("Số điện thoại này đã được sử dụng");
			error.statusCode = 400;
			throw error;
		}
	}

	const user = new User({
		name: normalizedName,
		email: normalizedEmail,
		phone: normalizedPhone || "",
		password,
		emailVerified: false,
	});

	const verifyToken = user.generateEmailVerificationToken();
	try {
		await user.save();
	} catch (saveError) {
		// Map duplicate key errors (E11000) to a friendly HTTP 409
		if (saveError && (saveError.code === 11000 || (saveError.name === 'MongoServerError' && saveError.code === 11000))) {
			const dupField = saveError.keyPattern ? Object.keys(saveError.keyPattern)[0] : 'email';
			const err = new Error(dupField === 'email' ? 'Email đã được sử dụng' : `${dupField} đã tồn tại`);
			err.statusCode = 409;
			throw err;
		}
		throw saveError;
	}

	const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${verifyToken}`;

	// Always send verification email (Ethereal in dev, real in production)
	await emailQueue.add("verify-email", {
		userName: user.name,
		email: user.email,
		verifyUrl,
	});

	if (process.env.NODE_ENV !== "production") {
		console.log("------ VERIFY EMAIL LINK (DEV) ------");
		console.log(verifyUrl);
		console.log("-------------------------------------");
	}

	return {
		message: "Tài khoản đã tạo thành công. Vui lòng kiểm tra email để xác minh.",
		email: user.email,
	};
};

export const login = async (email, password) => {
	const user = await User.findOne({ email });
	if (!user || !(await user.comparePassword(password))) {
		const error = new Error("Email hoặc mật khẩu không chính xác");
		error.statusCode = 401;
		throw error;
	}

	if (user.role !== "admin" && !user.emailVerified && process.env.NODE_ENV !== "test") {
		const error = new Error("Vui lòng xác minh email trước khi đăng nhập. Kiểm tra hộp thư để nhận liên kết xác minh.");
		error.statusCode = 403;
		error.unverified = true;
		throw error;
	}

	// Allow disabling admin 2FA for local/test runs using DISABLE_ADMIN_2FA=true
	if (user.role === "admin" && process.env.DISABLE_ADMIN_2FA !== "true") {
		return { requiresOTP: true, email: user.email };
	}

	const { accessToken, refreshToken } = generateTokens(user._id);
	await storeRefreshToken(user._id, refreshToken);

	return {
		_id: user._id,
		name: user.name,
		email: user.email,
		role: user.role,
		emailVerified: user.emailVerified,
		accessToken,
		refreshToken,
	};
};

export const logout = async (userId) => {
	await redis.del(`refresh_token:${userId}`);
	return { message: "Đã đăng xuất thành công" };
};

export const refreshAccessToken = async (refreshToken) => {
	try {
		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

		if (storedToken !== refreshToken) {
			const error = new Error("Refresh token không hợp lệ");
			error.statusCode = 401;
			throw error;
		}

		const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
		await storeRefreshToken(decoded.userId, newRefreshToken);

		return { accessToken, refreshToken: newRefreshToken };
	} catch (error) {
		const err = new Error("Refresh token hết hạn");
		err.statusCode = 401;
		throw err;
	}
};

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

export const verifyEmail = async (token) => {
	// Prevents React 18 StrictMode double request issue in local dev
	try {
		const wasRecentlyVerified = await redis.get(`verified_token:${token}`);
		if (wasRecentlyVerified) {
			return { message: "Tài khoản đã được xác minh thành công. Chào mừng bạn!", alreadyVerified: false };
		}
	} catch (redisError) {
		console.warn("Non-critical: Redis cache lookup failed in verifyEmail:", redisError.message);
	}

	const user = await User.findOne({
		emailVerificationToken: token,
		emailVerificationExpires: { $gt: Date.now() },
	});

	if (!user) {
		const error = new Error("Liên kết xác minh không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại.");
		error.statusCode = 400;
		throw error;
	}

	if (user.emailVerified) {
		return { message: "Tài khoản đã được xác minh từ trước.", alreadyVerified: true };
	}

	user.emailVerified = true;
	user.emailVerificationToken = null;
	user.emailVerificationExpires = null;
	await user.save();

	try {
		await redis.set(`verified_token:${token}`, "true", "EX", 30);
	} catch (redisError) {
		console.warn("Non-critical: Redis cache set failed in verifyEmail:", redisError.message);
	}

	return { message: "Tài khoản đã được xác minh thành công. Chào mừng bạn!" };
};

export const resendVerificationEmail = async (email) => {
	const user = await User.findOne({ email });
	if (!user) {
		const error = new Error("Không tìm thấy tài khoản với email này");
		error.statusCode = 404;
		throw error;
	}

	if (user.emailVerified) {
		return { message: "Tài khoản đã được xác minh. Bạn có thể đăng nhập." };
	}

	const verifyToken = user.generateEmailVerificationToken();
	await user.save();

	const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${verifyToken}`;

	// Always send verification email (Ethereal in dev, real in production)
	await emailQueue.add("verify-email", {
		userName: user.name,
		email: user.email,
		verifyUrl,
	});

	if (process.env.NODE_ENV !== "production") {
		console.log("------ VERIFY EMAIL LINK (DEV - RESEND) ------");
		console.log(verifyUrl);
		console.log("-------------------------------------");
	}

	return { message: "Email xác minh đã được gửi. Vui lòng kiểm tra hộp thư (bao gồm thư mục spam)." };
};

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

export const forgotPassword = async (email) => {
	const user = await User.findOne({ email });
	if (!user) {
		return { message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email đặt lại mật khẩu" };
	}

	const resetToken = user.generatePasswordResetToken();
	await user.save();

	const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

	if (process.env.NODE_ENV !== "production") {
		console.log("------ PASSWORD RESET LINK (DEV) ------");
		console.log(resetUrl);
		console.log("---------------------------------------");
	} else {
		await emailQueue.add("reset-password", {
			userName: user.name,
			email: user.email,
			resetUrl,
		});
	}

	return { message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email đặt lại mật khẩu" };
};

export const resetPassword = async (token, password, confirmPassword) => {
	if (password !== confirmPassword) {
		const error = new Error("Mật khẩu xác nhận không khớp");
		error.statusCode = 400;
		throw error;
	}

	const passwordErr = validatePasswordStrength(password);
	if (passwordErr) {
		const error = new Error(passwordErr);
		error.statusCode = 400;
		throw error;
	}

	const user = await User.findOne({
		passwordResetToken: token,
		passwordResetExpires: { $gt: Date.now() },
	});

	if (!user) {
		const error = new Error("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
		error.statusCode = 400;
		throw error;
	}

	user.password = password;
	user.passwordResetToken = null;
	user.passwordResetExpires = null;
	await user.save();

	return { message: "Mật khẩu đã được đặt lại thành công" };
};

export const changePassword = async (userId, currentPassword, newPassword, confirmPassword) => {
	if (newPassword !== confirmPassword) {
		const error = new Error("Mật khẩu xác nhận không khớp");
		error.statusCode = 400;
		throw error;
	}

	const passwordErr = validatePasswordStrength(newPassword);
	if (passwordErr) {
		const error = new Error(passwordErr);
		error.statusCode = 400;
		throw error;
	}

	const user = await User.findById(userId);
	if (!(await user.comparePassword(currentPassword))) {
		const error = new Error("Mật khẩu hiện tại không chính xác");
		error.statusCode = 401;
		throw error;
	}

	user.password = newPassword;
	await user.save();

	return { message: "Mật khẩu đã được thay đổi thành công" };
};

// ============================================================================
// USER PROFILE
// ============================================================================

export const getProfile = async (userId) => {
	const user = await User.findById(userId).select("-password -__v");
	if (!user) {
		const error = new Error("User không tìm thấy");
		error.statusCode = 404;
		throw error;
	}
	return user;
};

export const updateProfile = async (userId, updates) => {
	const allowedUpdates = ["name", "phone", "avatar", "address", "preferences", "gender", "birthday", "addressBook", "defaultAddressId"];
	const updateData = {};

	for (const key of allowedUpdates) {
		if (updates[key] !== undefined) {
			updateData[key] = updates[key];
		}
	}

	if (Array.isArray(updateData.addressBook)) {
		const normalizedAddressBook = updateData.addressBook
			.map(normalizeAddressEntry)
			.filter(Boolean)
			.slice(0, 5);

		if (normalizedAddressBook.length === 0 && (updateData.address || "").trim()) {
			normalizedAddressBook.push({
				label: "Mặc định",
				fullName: (updates.name || "").trim(),
				phone: (updates.phone || "").trim(),
				address: String(updateData.address).trim(),
				city: String(updates.city || "").trim() || "",
				isDefault: true,
			});
		}

		const defaultIndex = normalizedAddressBook.findIndex((item) => item.isDefault);
		if (defaultIndex > 0) {
			const [defaultItem] = normalizedAddressBook.splice(defaultIndex, 1);
			normalizedAddressBook.unshift({ ...defaultItem, isDefault: true });
		}
		if (normalizedAddressBook.length > 0 && defaultIndex === -1) {
			normalizedAddressBook[0] = { ...normalizedAddressBook[0], isDefault: true };
		}

		updateData.addressBook = normalizedAddressBook;
		if (!updateData.defaultAddressId || !normalizedAddressBook.some((item) => item.id === String(updateData.defaultAddressId))) {
			updateData.defaultAddressId = normalizedAddressBook[0]?.id || "";
		}
	}

	if (typeof updateData.address === "string") {
		updateData.address = updateData.address.trim();
	}

	if (updateData.defaultAddressId && Array.isArray(updateData.addressBook)) {
		const byId = String(updateData.defaultAddressId);
		const byIndex = updateData.addressBook.findIndex((item) => item.id === byId);
		if (byIndex >= 0) {
			updateData.addressBook = updateData.addressBook.map((item, index) => ({
				...item,
				isDefault: index === byIndex,
			}));
			updateData.address = updateData.addressBook[byIndex].address;
			updateData.defaultAddressId = byId;
		}
	}

	if (Array.isArray(updateData.addressBook) && updateData.addressBook.length > 0) {
		const defaultAddress = updateData.addressBook.find((item) => item.isDefault) || updateData.addressBook[0];
		updateData.address = defaultAddress.address;
		updateData.defaultAddressId = defaultAddress.id;
	}

	if (updateData.phone && !validatePhone(updateData.phone)) {
		const error = new Error("Số điện thoại không hợp lệ");
		error.statusCode = 400;
		throw error;
	}

	// Prevent updating email through this endpoint directly; handle via a dedicated flow
	const newEmail = updates.email ? String(updates.email).toLowerCase().trim() : null;
	delete updateData.email;

	// If the user is changing their email, set the new email but mark unverified and trigger verification
	let user = await User.findById(userId);
	if (!user) {
		const error = new Error("User không tìm thấy");
		error.statusCode = 404;
		throw error;
	}

	// Apply updates to user doc for fields that require transformation/validation
	Object.assign(user, updateData);

	if (newEmail && newEmail !== user.email) {
		if (!validateEmail(newEmail)) {
			const error = new Error("Email không hợp lệ");
			error.statusCode = 400;
			throw error;
		}

		const existing = await User.findOne({ email: newEmail });
		if (existing) {
			const error = new Error("Email đã được sử dụng");
			error.statusCode = 409;
			throw error;
		}

		// Update email but mark as unverified and generate token
		user.email = newEmail;
		user.emailVerified = false;
		const verifyToken = user.generateEmailVerificationToken();

		// Save user first to persist token fields
		try {
			await user.save();
		} catch (saveError) {
			if (saveError && (saveError.code === 11000 || (saveError.name === 'MongoServerError' && saveError.code === 11000))) {
				const dupField = saveError.keyPattern ? Object.keys(saveError.keyPattern)[0] : 'email';
				const err = new Error(dupField === 'email' ? 'Email đã được sử dụng' : `${dupField} đã tồn tại`);
				err.statusCode = 409;
				throw err;
			}
			throw saveError;
		}

		const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${verifyToken}`;
		await emailQueue.add("verify-email", {
			userName: user.name,
			email: user.email,
			verifyUrl,
		});

		if (process.env.NODE_ENV !== "production") {
			console.log("------ VERIFY EMAIL LINK (DEV - EMAIL CHANGE) ------");
			console.log(verifyUrl);
			console.log("-------------------------------------");
		}
	} else {
		// No email change: save updates normally
		user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
		if (!user) {
			const error = new Error("User không tìm thấy");
			error.statusCode = 404;
			throw error;
		}
	}

	return user;
};

// ============================================================================
// ADMIN OTP (EXISTING - PRESERVED)
// ============================================================================

export const initiateAdminLogin = async (email, userAgent, ip) => {
	const lockUntil = await redis.get(`lockUntil:${email}`);
	if (lockUntil && lockUntil > Date.now()) {
		const minutesLeft = Math.ceil((lockUntil - Date.now()) / 60000);
		const error = new Error(`Tài khoản bị khóa do nhập sai OTP quá nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút.`);
		error.statusCode = 429;
		throw error;
	}

	const cooldown = await redis.get(`cooldown:${email}`);
	if (cooldown) {
		const error = new Error("Vui lòng đợi 60 giây giữa các lần yêu cầu mã xác thực.");
		error.statusCode = 429;
		throw error;
	}

	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	const salt = await bcrypt.genSalt(12);
	const hashedOtp = await bcrypt.hash(otp, salt);

	await redis.set(`otp:${email}`, hashedOtp, "EX", 5 * 60);
	await redis.set(`cooldown:${email}`, "locked", "EX", 60);

	const existingAttempts = await redis.get(`attempts:${email}`);
	if (!existingAttempts) {
		await redis.set(`attempts:${email}`, 0, "EX", 30 * 60);
	}

	try {
		await sendEmail(
			email,
			"Mã xác thực 2FA của bạn",
			`
			<div style='font-family: sans-serif; padding: 20px; color: #333;'>
				<h2>Mã xác thực đăng nhập</h2>
				<p>Xin chào Admin,</p>
				<p>Mã OTP của bạn là: <b style='font-size: 24px; color: #10b981;'>${otp}</b></p>
				<p>Mã này có hiệu lực trong <b>5 phút</b>.</p>
				<hr />
				<p style='font-size: 12px; color: #888;'>
					Thiết bị yêu cầu: ${userAgent}<br />
					IP: ${ip}
				</p>
				<p style='color: #ef4444; font-size: 13px;'>
					* Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email và kiểm tra lại bảo mật tài khoản.
				</p>
			</div>
			`
		);
	} catch (error) {
		console.error("Non-critical: Email delivery failed, but proceeding to OTP step for UI testing.", error.message);
	}
};

export const validateAdminOTP = async (email, otp, user) => {
	const lockUntil = await redis.get(`lockUntil:${email}`);
	if (lockUntil && lockUntil > Date.now()) {
		const minutesLeft = Math.ceil((lockUntil - Date.now()) / 60000);
		const error = new Error(`Tài khoản vẫn đang bị khóa. Thử lại sau ${minutesLeft} phút.`);
		error.statusCode = 429;
		throw error;
	}

	const storedHash = await redis.get(`otp:${email}`);
	if (!storedHash) {
		const error = new Error("Mã OTP đã hết hạn, vui lòng yêu cầu mã mới");
		error.statusCode = 410;
		throw error;
	}

	const isMatch = await bcrypt.compare(otp, storedHash);

	if (isMatch) {
		await redis.del(`otp:${email}`);
		await redis.del(`attempts:${email}`);
		await redis.del(`lockUntil:${email}`);
		await redis.del(`cooldown:${email}`);

		if (user.role === "admin" && !user.emailVerified) {
			user.emailVerified = true;
			user.emailVerificationToken = null;
			user.emailVerificationExpires = null;
			await user.save();
		}
		return true;
	} else {
		const attempts = await redis.incr(`attempts:${email}`);
		if (attempts >= 5) {
			const lockDuration = 30 * 60;
			const lockTimestamp = Date.now() + lockDuration * 1000;
			await redis.set(`lockUntil:${email}`, lockTimestamp, "EX", lockDuration);
			const error = new Error("Bạn đã nhập sai quá nhiều lần. Tài khoản bị khóa trong 30 phút.");
			error.statusCode = 429;
			throw error;
		}
		const error = new Error(`Mã OTP không chính xác. Bạn còn ${5 - attempts} lần thử.`);
		error.statusCode = 400;
		throw error;
	}
};

export const resendAdminOTP = async (email, userAgent, ip) => {
	const cooldown = await redis.get(`cooldown:${email}`);
	if (cooldown) {
		const error = new Error("Vui lòng đợi 60 giây trước khi yêu cầu mã mới");
		error.statusCode = 429;
		throw error;
	}

	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	const salt = await bcrypt.genSalt(12);
	const hashedOtp = await bcrypt.hash(otp, salt);

	await redis.set(`otp:${email}`, hashedOtp, "EX", 5 * 60);
	await redis.set(`attempts:${email}`, 0, "EX", 30 * 60);
	await redis.set(`cooldown:${email}`, "locked", "EX", 60);

	try {
		await sendEmail(
			email,
			"Mã xác thực 2FA mới của bạn",
			`
			<div style='font-family: sans-serif; padding: 20px; color: #333;'>
				<h2>Mã xác thực mới</h2>
				<p>Xin chào Admin,</p>
				<p>Mã OTP mới của bạn là: <b style='font-size: 24px; color: #10b981;'>${otp}</b></p>
				<p>Mã này có hiệu lực trong <b>5 phút</b>.</p>
				<hr />
				<p style='font-size: 12px; color: #888;'>
					Thiết bị yêu cầu: ${userAgent}<br />
					IP: ${ip}
				</p>
				<p style='color: #ef4444; font-size: 13px;'>
					* Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email và kiểm tra lại bảo mật tài khoản.
				</p>
			</div>
			`
		);
	} catch (error) {
		console.error("Non-critical: Resend email failed, but proceeding for UI testing.", error.message);
	}
};
