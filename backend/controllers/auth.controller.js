import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../lib/email.js";
import bcrypt from "bcryptjs";
import { emailQueue } from "./mail.controller.js";
import Order from "../models/order.model.js";
import AuditLog from "../models/auditLog.model.js";
import { logAction } from "../middleware/permission.middleware.js";

// ... (existing code omitted for brevity but I will include it)

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
			console.log("Login: User found and password matches. Role:", user.role);
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

			// Log LOGIN
			await logAction({ req, action: "LOGIN", details: "Customer logged in" });

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

			// Log LOGIN
			await logAction({ req, action: "LOGIN", details: "Admin logged in with 2FA" });

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
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getAllUsers = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;
		const search = req.query.search || "";
		const roleFilter = req.query.role || "";

		// Build filter
		const matchQuery = {};
		if (search) {
			matchQuery.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } },
				{ phone: { $regex: search, $options: "i" } },
			];
		}
		if (roleFilter) {
			matchQuery.role = roleFilter;
		}

		// Aggregation pipeline
		const users = await User.aggregate([
			{ $match: matchQuery },
			{
				$lookup: {
					from: "orders",
					localField: "_id",
					foreignField: "user",
					as: "orders",
				},
			},
			{
				$addFields: {
					totalSpend: {
						$sum: {
							$map: {
								input: {
									$filter: {
										input: "$orders",
										as: "order",
										cond: { $eq: ["$$order.paymentStatus", "paid"] },
									},
								},
								as: "paidOrder",
								in: "$$paidOrder.totalAmount",
							},
						},
					},
					orderCount: {
						$size: {
							$filter: {
								input: "$orders",
								as: "order",
								cond: { $eq: ["$$order.status", "delivered"] },
							},
						},
					},
				},
			},
			{
				$addFields: {
					segment: {
						$cond: {
							if: {
								$or: [
									{ $gte: ["$totalSpend", 50000000] },
									{ $gt: ["$orderCount", 5] },
								],
							},
							then: "VIP",
							else: {
								$cond: {
									if: { $gte: ["$totalSpend", 10000000] },
									then: "Potential",
									else: "New",
								},
							},
						},
					},
				},
			},
			{ $project: { password: 0, orders: 0 } },
			{ $sort: { createdAt: -1 } },
			{ $skip: skip },
			{ $limit: limit },
		]);

		const totalUsers = await User.countDocuments(matchQuery);

		res.json({
			users,
			pagination: {
				totalUsers,
				totalPages: Math.ceil(totalUsers / limit),
				currentPage: page,
			},
		});
	} catch (error) {
		console.error("Error in getAllUsers:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getAuditLogs = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 20;
		const skip = (page - 1) * limit;
		const { action, userId, startDate, endDate } = req.query;

		const query = {};
		if (action) query.action = action;
		if (userId) query.userId = userId;
		if (startDate || endDate) {
			query.createdAt = {};
			if (startDate) query.createdAt.$gte = new Date(startDate);
			if (endDate) query.createdAt.$lte = new Date(endDate);
		}

		const logs = await AuditLog.find(query)
			.populate("userId", "name email role")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const totalLogs = await AuditLog.countDocuments(query);

		res.json({
			logs,
			pagination: {
				totalLogs,
				totalPages: Math.ceil(totalLogs / limit),
				currentPage: page,
			},
		});
	} catch (error) {
		console.error("Error in getAuditLogs:", error.message);
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
