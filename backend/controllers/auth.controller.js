import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../lib/email.js";
import bcrypt from "bcryptjs";
import { emailQueue } from "./mail.controller.js";
import AuditLog from "../models/auditLog.model.js";

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
	const { email, password, name } = req.body;
	try {
		const userExists = await User.findOne({ email });

		if (userExists) {
			return res.status(400).json({ message: "User already exists" });
		}
		const user = await User.create({ name, email, password });

		// --- QUEUE WELCOME EMAIL ---
		await emailQueue.add("welcome-email", {
			fullName: name,
			email: email,
			shopUrl: process.env.CLIENT_URL || "http://localhost:5173",
			unsubscribeLink: (process.env.BACKEND_URL || "http://localhost:5000") + "/api/mail/unsubscribe/" + email
		});

		// authenticate
		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);

		setCookies(res, accessToken, refreshToken);

		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
		});
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });

		if (user && (await user.comparePassword(password))) {
			// Check if user is admin
			if (user.role === "admin") {
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

			// Generate tokens
			const { accessToken, refreshToken } = generateTokens(user._id);
			await storeRefreshToken(user._id, refreshToken);
			setCookies(res, accessToken, refreshToken);

			res.json({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
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
		// KHÔNG reset attempts — giữ nguyên để lockout vẫn hoạt động
		// (nếu đã sai 4 lần, resend không cho thêm lượt thử mới)
		// Set cooldown
		await redis.set(`cooldown:${email}`, "locked", "EX", 60);

		// Send email (Resilient flow)
		try {
			// Extract device info for the email
			const userAgent = req.headers["user-agent"] || "Không xác định thiết bị";
			const ip = req.ip || req.connection?.remoteAddress || "Không xác định IP";
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
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getAllUsers = async (req, res) => {
	try {
		const users = await User.find({}).select("-password").sort({ createdAt: -1 });
		res.json(users);
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

		// Regex chuẩn VN: hỗ trợ Viettel/Mobifone/Vinaphone/Gmobile/Reddi
		const phoneRegex = /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])\d{7}$/;
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

export const getAuditLogs = async (req, res) => {
	try {
		const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);
		res.json(logs);
	} catch (error) {
		console.error("Error in getAuditLogs:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const requestVerifyEmail = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

		if (user.emailVerified) {
			return res.status(400).json({ message: "Email đã được xác thực." });
		}

		// Không gửi quá nhanh: 1 phút/lần
		const key = `resend_verify:${userId}`;
		const locked = await redis.get(key);
		if (locked) {
			return res.status(429).json({ message: "Vui lòng đợi ít nhất 60 giây trước khi gửi lại email xác thực." });
		}

		const verificationToken = user.generateEmailVerificationToken();
		await user.save();

		// queue gửi email確認
		await emailQueue.add("verify-email", {
			email: user.email,
			subject: "Xác thực email tài khoản Luxury Watch",
			userName: user.name,
			token: verificationToken,
			verifyUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`,
		});

		// Set rate limit resend
		await redis.set(key, "1", "EX", 60);

		return res.json({ message: "Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư." });
	} catch (error) {
		console.error("Error in requestVerifyEmail:", error);
		return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
	}
};

export const verifyEmail = async (req, res) => {
	let { token } = req.body;
	if (!token) return res.status(400).json({ message: "Token xác thực không hợp lệ" });

	// Cắt whitespace, chỉ chấp nhận 64 ký tự hex.
	token = String(token || "").trim();
	if (!/^[0-9a-fA-F]{64}$/.test(token)) {
		return res.status(400).json({ message: "Token xác thực không hợp lệ" });
	}

	try {
		const user = await User.findOne({ emailVerificationToken: token });
		if (!user) {
			console.warn(`Email verification failed: token not found`);
			return res.status(400).json({ message: "Token xác thực không hợp lệ hoặc đã hết hạn" });
		}

		if (!user.verifyEmailToken(token)) {
			console.warn(`Email verification failed: token invalid/expired for user ${user._id}`);
			return res.status(400).json({ message: "Token xác thực không hợp lệ hoặc đã hết hạn" });
		}

		user.emailVerified = true;
		user.emailVerificationToken = null;
		user.emailVerificationExpires = null;
		await user.save();

		console.info(`Email verified success for user ${user._id}`);
		return res.json({ message: "Xác thực email thành công" });
	} catch (error) {
		console.error("Error in verifyEmail:", error);
		return res.status(500).json({ message: "Lỗi hệ thống" });
	}
};

export const resendVerificationEmail = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

		if (user.emailVerified) {
			return res.status(400).json({ message: "Email đã được xác thực." });
		}

		const key = `resend_verify:${userId}`;
		const locked = await redis.get(key);
		if (locked) {
			return res.status(429).json({ message: "Vui lòng đợi ít nhất 60 giây trước khi gửi lại email xác thực." });
		}

		const verificationToken = user.generateEmailVerificationToken();
		await user.save();

		await emailQueue.add("verify-email", {
			email: user.email,
			subject: "Xác thực email tài khoản Luxury Watch (gửi lại)",
			userName: user.name,
			token: verificationToken,
			verifyUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`,
		});

		await redis.set(key, "1", "EX", 60);

		return res.json({ message: "Đã gửi lại email xác thực" });
	} catch (error) {
		console.error("Error in resendVerificationEmail:", error);
		return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
	}
};

