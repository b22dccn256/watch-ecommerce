import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import AuditLog from "../models/auditLog.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../lib/email.js";
import bcrypt from "bcryptjs";
import { emailQueue } from "./mail.controller.js";

const NAME_REGEX = /^[\p{L}\s]{2,50}$/u;

const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: "15m",
	});

	const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: "7d",
	});

	return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
	await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60); // 7days
};

const setCookies = (res, accessToken, refreshToken) => {
	res.cookie("accessToken", accessToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
		maxAge: 15 * 60 * 1000, // 15 minutes
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	});
};

export const signup = async (req, res) => {
	const { email, password, name, phone, confirmPassword } = req.body;
	const normalizedName = name?.trim();
	const normalizedEmail = email?.toLowerCase().trim();
	const normalizedPhone = phone?.trim();

	const validatePasswordStrength = (value) => {
		if (value.length < 8) {
			return "Mật khẩu phải có ít nhất 8 ký tự";
		}

		const hasLowercase = /[a-z]/.test(value);
		const hasUppercase = /[A-Z]/.test(value);
		const hasNumber = /\d/.test(value);
		const hasSpecialChar = /[^A-Za-z0-9]/.test(value);
		const strengthScore = [hasLowercase, hasUppercase, hasNumber, hasSpecialChar].filter(Boolean).length;

		if (strengthScore < 3) {
			return "Mật khẩu nên có chữ hoa, chữ thường, số và ký tự đặc biệt";
		}

		return null;
	};

	// Validate input
	if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
		return res.status(400).json({ message: "Vui lòng điền đầy đủ họ tên, email và mật khẩu" });
	}

	if (normalizedName.length < 2) {
		return res.status(400).json({ message: "Họ và tên phải có ít nhất 2 ký tự" });
	}

	if (!NAME_REGEX.test(normalizedName)) {
		return res.status(400).json({ message: "Họ và tên chỉ được chứa chữ cái và khoảng trắng (2–50 ký tự)" });
	}

	if (password !== confirmPassword) {
		return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(normalizedEmail)) {
		return res.status(400).json({ message: "Email không hợp lệ" });
	}

	if (normalizedPhone && !/^0[35789]\d{8}$/.test(normalizedPhone)) {
		return res.status(400).json({ message: "Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam." });
	}

	const passwordStrengthError = validatePasswordStrength(password);
	if (passwordStrengthError) {
		return res.status(400).json({ message: passwordStrengthError });
	}

	try {
		const userExists = await User.findOne({ email: normalizedEmail });

		if (userExists) {
			return res.status(400).json({ message: "Email đã được sử dụng" });
		}

		if (normalizedPhone) {
			const phoneExists = await User.findOne({ phone: normalizedPhone });
			if (phoneExists) {
				return res.status(400).json({ message: "Số điện thoại này đã được sử dụng" });
			}
		}

		// Tạo user trước, rồi mới sinh token verify để tránh lưu trạng thái dở dang
		const user = new User({
			name: normalizedName,
			email: normalizedEmail,
			phone: normalizedPhone || "",
			password,
			emailVerified: false,
		});

		// Sinh token verify email và lưu trạng thái
		const verifyToken = user.generateEmailVerificationToken();
		await user.save();

		const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${verifyToken}`;

		// --- QUEUE VERIFY EMAIL ---
		await emailQueue.add("verify-email", {
			userName: user.name,
			email: user.email,
			verifyUrl,
		});

		// --- QUEUE WELCOME EMAIL ---
		await emailQueue.add("welcome-email", {
			fullName: normalizedName,
			email: normalizedEmail,
			shopUrl: process.env.CLIENT_URL || "http://localhost:5173",
			unsubscribeLink: (process.env.BACKEND_URL || "http://localhost:5000") + "/api/mail/unsubscribe/" + normalizedEmail,
		});

		return res.status(201).json({
			message: "Tài khoản đã tạo thành công. Vui lòng kiểm tra email để xác thực.",
			email: user.email,
		});
	} catch (error) {
		console.log("Error in signup controller", error.message);
		if (error.code === 11000) {
			return res.status(400).json({ message: "Email đã được sử dụng" });
		}

		if (error.name === "ValidationError") {
			const message = Object.values(error.errors)
				.map((item) => item.message)
				.join(". ");
			return res.status(400).json({ message });
		}

		res.status(500).json({ message: error.message });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });

		if (user && (await user.comparePassword(password))) {
			console.log("Login: User found and password matches. Role:", user.role);

			// User thường phải verify email, admin được bypass để luôn vào luồng OTP
			if (user.role !== "admin" && !user.emailVerified) {
				return res.status(403).json({
					message: "Vui lòng xác thực email trước khi đăng nhập",
					unverified: true,
				});
			}

			// Check if user is admin
			if (user.role === "admin") {
				console.log("Login: Admin detected, triggering OTP flow");
				// Check for account lockout
				const lockUntil = await redis.get(`lockUntil:${email}`);
				if (lockUntil && lockUntil > Date.now()) {
					const minutesLeft = Math.ceil((lockUntil - Date.now()) / 60000);
					return res.status(429).json({
						message: `Tài khoản bị khóa do nhập sai OTP quá nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút.`,
					});
				}

				// Check cooldown to prevent spam (even from Step 1 login)
				const cooldown = await redis.get(`cooldown:${email}`);
				if (cooldown) {
					return res.status(429).json({
						message: "Vui lòng đợi 60 giây giữa các lần yêu cầu mã xác thực.",
					});
				}

				// Generate 6-digit OTP
				const otp = Math.floor(100000 + Math.random() * 900000).toString();
				const salt = await bcrypt.genSalt(10);
				const hashedOtp = await bcrypt.hash(otp, salt);

				// Store hashed OTP in Redis (5 mins)
				await redis.set(`otp:${email}`, hashedOtp, "EX", 5 * 60);
				// Set cooldown (60s)
				await redis.set(`cooldown:${email}`, "locked", "EX", 60);

				// Only initialize attempt count if it doesn't exist (preserve progress towards lockout)
				const existingAttempts = await redis.get(`attempts:${email}`);
				if (!existingAttempts) {
					await redis.set(`attempts:${email}`, 0, "EX", 30 * 60);
				}

				// Extract device info
				const userAgent = req.headers["user-agent"] || "Không xác định thiết bị";
				const ip = req.ip || req.connection.remoteAddress || "Không xác định IP";

				// Send email (Resilient flow)
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

				return res.json({ message: "OTP_REQUIRED" });
			}

			// For normal user, proceed with tokens
			const { accessToken, refreshToken } = generateTokens(user._id);
			await storeRefreshToken(user._id, refreshToken);
			setCookies(res, accessToken, refreshToken);

			res.json({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				emailVerified: user.emailVerified,
			});
		} else {
			res.status(400).json({ message: "Email hoặc mật khẩu không chính xác" });
		}
	} catch (error) {
		console.log("Error in login controller:", error);
		if (error.code === "EAUTH" || error.message.includes("certificate")) {
			return res.status(503).json({ 
				message: "Dịch vụ gửi email hiện không khả dụng. Vui lòng thử lại sau hoặc liên hệ hỗ trợ." 
			});
		}
		res.status(500).json({ message: error.message });
	}
};

export const verifyOTP = async (req, res) => {
	try {
		const { email, otp } = req.body;
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({ message: "Không tìm thấy người dùng" });
		}

		// Check lock
		const lockUntil = await redis.get(`lockUntil:${email}`);
		if (lockUntil && lockUntil > Date.now()) {
			const minutesLeft = Math.ceil((lockUntil - Date.now()) / 60000);
			return res.status(429).json({
				message: `Tài khoản vẫn đang bị khóa. Thử lại sau ${minutesLeft} phút.`,
			});
		}

		const storedHash = await redis.get(`otp:${email}`);
		if (!storedHash) {
			return res.status(410).json({ message: "Mã OTP đã hết hạn, vui lòng yêu cầu mã mới" });
		}

		const isMatch = await bcrypt.compare(otp, storedHash);

		if (isMatch) {
			// Clear all related keys on success
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

			// Generate tokens
			const { accessToken, refreshToken } = generateTokens(user._id);
			await storeRefreshToken(user._id, refreshToken);
			setCookies(res, accessToken, refreshToken);

			res.json({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				emailVerified: user.emailVerified,
			});
		} else {
			const attempts = await redis.incr(`attempts:${email}`);
			if (attempts >= 5) {
				const lockDuration = 30 * 60; // 30 mins
				const lockTimestamp = Date.now() + lockDuration * 1000;
				await redis.set(`lockUntil:${email}`, lockTimestamp, "EX", lockDuration);
				return res.status(429).json({
					message: "Bạn đã nhập sai quá nhiều lần. Tài khoản bị khóa trong 30 phút.",
				});
			}
			res.status(400).json({ message: `Mã OTP không chính xác. Bạn còn ${5 - attempts} lần thử.` });
		}
	} catch (error) {
		console.log("Error in verifyOTP controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

export const resendOTP = async (req, res) => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email });

		if (!user || user.role !== "admin") {
			return res.status(403).json({ message: "Yêu cầu không hợp lệ" });
		}

		// Cooldown check (60s)
		const cooldown = await redis.get(`cooldown:${email}`);
		if (cooldown) {
			return res.status(429).json({ message: "Vui lòng đợi 60 giây trước khi yêu cầu mã mới" });
		}

		// Generate new OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const salt = await bcrypt.genSalt(10);
		const hashedOtp = await bcrypt.hash(otp, salt);

		// Store in Redis (refresh TTL)
		await redis.set(`otp:${email}`, hashedOtp, "EX", 5 * 60);
		// Reset attempts on manual resend (30 mins to match design)
		await redis.set(`attempts:${email}`, 0, "EX", 30 * 60);
		// Set cooldown
		await redis.set(`cooldown:${email}`, "locked", "EX", 60);

		// Send email (Resilient flow)
		try {
			await sendEmail(
				email,
				"Mã xác thực 2FA mới của bạn",
				`
				<div style='font-family: sans-serif; padding: 20px; color: #333;'>
					<h2>Mã xác thực mới</h2>
					<p>Bạn vừa yêu cầu gửi lại mã xác thực đăng nhập.</p>
					<p>Mã mới của bạn là: <b style='font-size: 24px; color: #10b981;'>${otp}</b></p>
					<p>Mã này có hiệu lực trong <b>5 phút</b>.</p>
					<hr />
					<p style='font-size: 12px; color: #888;'>
						Yêu cầu từ thiết bị: ${userAgent}<br />
						IP: ${ip}
					</p>
				</div>
				`
			);
		} catch (error) {
			console.error("Non-critical: Resend email failed, but proceeding for UI testing.", error.message);
		}

		res.json({ message: "Đã gửi mã OTP mới vào email của bạn" });
	} catch (error) {
		console.log("Error in resendOTP controller:", error);
		if (error.code === "EAUTH" || error.message.includes("certificate")) {
			return res.status(503).json({ 
				message: "Dịch vụ gửi email hiện không khả dụng. Vui lòng thử lại sau." 
			});
		}
		res.status(500).json({ message: error.message });
	}
};

export const logout = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		if (refreshToken) {
			const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
			await redis.del(`refresh_token:${decoded.userId}`);
		}

		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");
		res.json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// this will refresh the access token
export const refreshToken = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;

		if (!refreshToken) {
			return res.status(401).json({ message: "No refresh token provided" });
		}

		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

		if (storedToken !== refreshToken) {
			return res.status(401).json({ message: "Invalid refresh token" });
		}

		const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 15 * 60 * 1000,
		});

		res.json({ message: "Token refreshed successfully" });
	} catch (error) {
		console.log("Error in refreshToken controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProfile = async (req, res) => {
	try {
		if (!req.user?._id) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const user = await User.findById(req.user._id)
			.select("-password -emailVerificationToken -emailVerificationExpires -lastVerificationEmailSent")
			.lean();

		if (!user) {
			return res.status(404).json({ message: "Không tìm thấy người dùng" });
		}

		res.json(user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const verifyEmail = async (req, res) => {
	try {
		const token = req.body?.token || req.query?.token;
		if (!token) {
			return res.status(400).json({ message: "Token xác thực không hợp lệ" });
		}

		const user = await User.findOne({ emailVerificationToken: token });

		if (!user) {
			return res.status(400).json({ message: "Liên kết xác thực không hợp lệ hoặc đã được sử dụng" });
		}

		if (!user.verifyEmailToken(token)) {
			return res.status(400).json({ message: "Token xác thực đã hết hạn hoặc không hợp lệ" });
		}

		user.emailVerified = true;
		user.emailVerificationToken = null;
		user.emailVerificationExpires = null;
		await user.save();

		return res.json({ message: "Email đã được xác thực thành công" });
	} catch (error) {
		console.error("Error in verifyEmail controller:", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const resendVerificationEmail = async (req, res) => {
	try {
		const user = req.user;
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		if (user.emailVerified) {
			return res.status(400).json({ message: "Email đã được xác thực" });
		}

		const token = user.generateEmailVerificationToken();
		await user.save();

		const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${token}`;

		await emailQueue.add("verify-email", {
			userName: user.name,
			email: user.email,
			verifyUrl,
		});

		return res.json({ message: "Email xác thực đã được gửi lại" });
	} catch (error) {
		console.error("Error in resendVerificationEmail controller:", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getAllUsers = async (req, res) => {
	try {
		const page = Math.max(parseInt(req.query.page) || 1, 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
		const search = (req.query.search || "").trim();
		const role = (req.query.role || "").trim();

		const query = {};
		if (role) {
			query.role = role;
		}
		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } },
				{ phone: { $regex: search, $options: "i" } },
			];
		}

		const totalUsers = await User.countDocuments(query);
		const totalPages = Math.max(Math.ceil(totalUsers / limit), 1);
		const safePage = Math.min(page, totalPages);

		const users = await User.find(query)
			.select("-password")
			.sort({ createdAt: -1 })
			.skip((safePage - 1) * limit)
			.limit(limit);

		res.json({
			users,
			pagination: {
				currentPage: safePage,
				totalPages,
				totalUsers,
				limit,
			},
		});
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getAuditLogs = async (req, res) => {
	try {
		const page = Math.max(parseInt(req.query.page) || 1, 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

		const totalLogs = await AuditLog.countDocuments();
		const totalPages = Math.max(Math.ceil(totalLogs / limit), 1);
		const safePage = Math.min(page, totalPages);

		const logs = await AuditLog.find()
			.populate("userId", "name email role")
			.sort({ createdAt: -1 })
			.skip((safePage - 1) * limit)
			.limit(limit);

		res.json({
			logs,
			pagination: {
				currentPage: safePage,
				totalPages,
				totalLogs,
				limit,
			},
		});
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteUser = async (req, res) => {
	try {
		const { id } = req.params;

		// Prevent admin from deleting themselves
		if (id === req.user._id.toString()) {
			return res.status(400).json({ message: "Không thể xóa chính mình" });
		}

		const user = await User.findById(id);
		if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

		// Hard delete — if you want soft delete uncomment below
		await User.findByIdAndDelete(id);

		res.json({ message: "Đã xóa user thành công" });
	} catch (error) {
		console.error("Error in deleteUser:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateUserRole = async (req, res) => {
	try {
		const { id } = req.params;
		const { role } = req.body;

		if (!["customer", "admin"].includes(role)) {
			return res.status(400).json({ message: "Role không hợp lệ. Phải là customer hoặc admin" });
		}

		if (id === req.user._id.toString()) {
			return res.status(400).json({ message: "Không thể tự thay đổi role của mình" });
		}

		const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
		if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

		res.json({ message: `Đã cập nhật role thành ${role}`, user });
	} catch (error) {
		console.error("Error in updateUserRole:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const { name, phone } = req.body;
		const userId = req.user._id;

		if (!name) {
			return res.status(400).json({ message: "Tên không được để trống" });
		}

		if (!NAME_REGEX.test(name.trim())) {
			return res.status(400).json({ message: "Họ và tên chỉ được chứa chữ cái và khoảng trắng (2–50 ký tự)" });
		}

		// Regex VN: 0 + (3,5,7,8,9) + 8 digits
		const phoneRegex = /^(0)[3|5|7|8|9]\d{8}$/;
		if (phone && !phoneRegex.test(phone)) {
			return res.status(400).json({ message: "Số điện thoại không hợp lệ (định dạng di động VN)" });
		}

		// Check unique phone (excluding current user)
		if (phone) {
			const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
			if (existingPhone) {
				return res.status(400).json({ message: "Số điện thoại này đã được sử dụng bởi tài khoản khác" });
			}
		}

		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ name, phone },
			{ new: true }
		).select("-password");

		res.json({ message: "Cập nhật thông tin thành công", user: updatedUser });
	} catch (error) {
		console.error("Error in updateProfile:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const changePassword = async (req, res) => {
	try {
		const { oldPassword, newPassword, confirmPassword } = req.body;
		const user = await User.findById(req.user._id);

		if (!oldPassword || !newPassword || !confirmPassword) {
			return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
		}

		if (newPassword !== confirmPassword) {
			return res.status(400).json({ message: "Mật khẩu mới và xác nhận mật khẩu không khớp" });
		}

		if (newPassword.length < 6) {
			return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
		}

		const isMatch = await user.comparePassword(oldPassword);
		if (!isMatch) {
			return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác" });
		}

		user.password = newPassword;
		await user.save();

		res.json({ message: "Đổi mật khẩu thành công" });
	} catch (error) {
		console.error("Error in changePassword:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
