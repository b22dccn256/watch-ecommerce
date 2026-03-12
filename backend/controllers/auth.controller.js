import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

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
			res.status(400).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		console.log("Error in login controller", error.message);
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
