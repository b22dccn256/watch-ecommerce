// middleware/auth.middleware.js - PHIÊN BẢN CẢI THIỆN (Debug + Logic chuẩn)
import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";
import { getAccessTokenSecrets, verifyWithSecretRotation } from "../lib/jwt.js";

export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        message: "Unauthorized - No access token provided",
        needLogin: true,
      });
    }

    try {
      const decoded = verifyWithSecretRotation(
        accessToken,
        getAccessTokenSecrets(),
      );
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Unauthorized - Access token expired",
          needRefresh: true, // ← Frontend sẽ dùng flag này để tự refresh
        });
      }

      return res.status(401).json({
        message: "Unauthorized - Invalid access token",
        needLogin: true,
      });
    }
  } catch (error) {
    console.error("💥 [protectRoute] Server error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - user not loaded" });
  }

  if (!req.user.emailVerified) {
    return res
      .status(403)
      .json({
        message: "Vui lòng xác minh email trước khi thực hiện hành động này.",
      });
  }

  next();
};

export const resendVerificationLimiter = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id.toString() : null;
    const key = userId
      ? `resend_verification:${userId}`
      : `resend_verification_ip:${req.ip}`;

    const exists = await redis.get(key);
    if (exists) {
      return res
        .status(429)
        .json({
          message: "Bạn chỉ có thể gửi lại email xác thực sau 60 giây.",
        });
    }

    await redis.set(key, "1", "EX", 60);
    next();
  } catch (error) {
    console.error("Error in resendVerificationLimiter:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied - Admin only" });
  }
};

export const managementRoute = (req, res, next) => {
  if (req.user && ["admin", "staff"].includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({ message: "Access denied - Quản lý/Admin" });
  }
};

export const optionalRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return next();
    }

    try {
      const decoded = verifyWithSecretRotation(
        accessToken,
        getAccessTokenSecrets(),
      );
      const user = await User.findById(decoded.userId).select("-password");
      if (user) {
        req.user = user;
      }
      return next();
    } catch (error) {
      return next();
    }
  } catch (error) {
    return next();
  }
};
