import * as AuthService from "../services/auth.service.js";
import User from "../models/user.model.js";
import AuditLog from "../models/auditLog.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";

// ============================================================================
// HTTP HANDLERS - MINIMAL CONTROLLERS (< 150 lines)
// All business logic delegated to auth.service.js
// ============================================================================

export const signup = async (req, res) => {
  try {
    const result = await AuthService.signup(req.body);
    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const result = await AuthService.login(req.body.email, req.body.password);
    if (result.requiresOTP) {
      const userAgent = req.headers["user-agent"] || "Unknown";
      const ip = req.ip || req.connection?.remoteAddress || "Unknown";
      await AuthService.initiateAdminLogin(result.email, userAgent, ip);
      return res.json({ requiresOTP: true });
    }
    AuthService.setCookies(res, result.accessToken, result.refreshToken);
    return res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    await AuthService.validateAdminOTP(email, otp, user);
    const { accessToken, refreshToken } = AuthService.generateTokens(user._id);
    await AuthService.storeRefreshToken(user._id, refreshToken);
    AuthService.setCookies(res, accessToken, refreshToken);
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      address: user.address || "",
      addressBook: user.addressBook || [],
      defaultAddressId: user.defaultAddressId || "",
      gender: user.gender || "other",
      birthday: user.birthday || null,
      rewardPoints: user.rewardPoints || 0,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.role !== "admin")
      return res.status(403).json({ message: "Invalid request" });

    const userAgent = req.headers["user-agent"] || "Unknown";
    const ip = req.ip || req.connection?.remoteAddress || "Unknown";
    await AuthService.resendAdminOTP(email, userAgent, ip);
    return res.json({
      message: "Đã gửi lại mã xác minh 2FA. Vui lòng kiểm tra email.",
    });
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
      );
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.json({ message: "Logged out" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const rt = req.cookies.refreshToken;
    if (!rt) return res.status(401).json({ message: "No refresh token" });

    const result = await AuthService.refreshAccessToken(rt);
    AuthService.setCookies(res, result.accessToken, result.refreshToken);
    return res.json({ message: "Token refreshed" });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    if (!req.user?._id)
      return res.status(401).json({ message: "Unauthorized" });
    const user = await AuthService.getProfile(req.user._id);
    return res.json(user);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const token = req.body?.token || req.query?.token;
    console.log(
      "🔍 [verifyEmail] token received:",
      token ? "✓ token found" : "✗ token missing",
    );
    console.log("📦 [verifyEmail] req.body:", req.body);
    console.log("📦 [verifyEmail] req.query:", req.query);
    if (!token) return res.status(400).json({ message: "Token required" });

    const result = await AuthService.verifyEmail(token);
    return res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const email = req.user?.email || req.body?.email;
    if (!email) return res.status(400).json({ message: "Email required" });

    const result = await AuthService.resendVerificationEmail(email);
    return res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const result = await AuthService.forgotPassword(req.body.email);
    return res.json(result);
  } catch (error) {
    return res.json({ message: "If account exists, reset email sent" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const result = await AuthService.resetPassword(
      req.body.token,
      req.body.newPassword,
      req.body.confirmPassword,
    );
    return res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const result = await AuthService.changePassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword,
      req.body.confirmPassword,
    );
    return res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 401;
    return res.status(statusCode).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const result = await AuthService.updateProfile(req.user._id, req.body);
    return res.json({ message: "Profile updated", user: result });
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ message: error.message });
  }
};

// ADMIN FUNCTIONS

export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const search = (req.query.search || "").trim();
    const role = (req.query.role || "").trim();

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      users,
      pagination: { currentPage: page, totalPages, totalUsers, limit },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: "Cannot delete self" });
    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const bulkDeleteUsers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res
        .status(400)
        .json({ message: "Mảng danh sách ID không hợp lệ" });
    }

    // Lọc bỏ ID của chính admin đang thực hiện thao tác
    const filteredIds = ids.filter((id) => id !== req.user._id.toString());

    if (filteredIds.length === 0) {
      return res.status(400).json({ message: "Không thể tự xóa chính mình" });
    }

    await User.deleteMany({ _id: { $in: filteredIds } });

    return res.json({
      message: `Đã xóa ${filteredIds.length} tài khoản thành công`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["customer", "staff", "admin"].includes(role))
      return res.status(400).json({ message: "Invalid role" });
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: "Cannot self-update" });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    ).select("-password");
    return res.json({ message: `Role updated to ${role}`, user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const adjustLoyaltyPoints = async (req, res) => {
  try {
    const { delta } = req.body;
    if (!delta || isNaN(delta))
      return res.status(400).json({ message: "Delta required" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.rewardPoints = Math.max(0, (user.rewardPoints || 0) + delta);
    if (delta > 0)
      user.totalPointsEarned = (user.totalPointsEarned || 0) + delta;
    await user.save();

    return res.json({
      message: `${delta > 0 ? "Added" : "Subtracted"} ${Math.abs(delta)} points`,
      rewardPoints: user.rewardPoints,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateUserAdminNotes = async (req, res) => {
  try {
    const { adminNotes, tags } = req.body;
    const update = {};
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (tags !== undefined) {
      const validTags = ["VIP", "Wholesale", "Problematic", "New", "Loyal"];
      update.tags = (tags || []).filter((t) => validTags.includes(t));
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "Admin notes updated", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const totalLogs = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLogs / limit),
        totalLogs,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ============================================================================
// DEBUG ENDPOINT (DEV ONLY) - Get verification link without email delay
// ============================================================================
export const getVerificationLinkDebug = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ message: "Not available in production" });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.emailVerified) {
      return res.json({ message: "Account already verified" });
    }

    // Generate a new verification token
    const verifyToken = user.generateEmailVerificationToken();
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${verifyToken}`;

    return res.json({
      message: "✅ Verification link generated (DEV ONLY)",
      email: user.email,
      verificationUrl: verifyUrl,
      token: verifyToken,
      expiresIn: "24 hours",
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};
