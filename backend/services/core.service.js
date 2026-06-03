// ============================================================================
// UNIFIED BACKEND SERVICE LAYER
// Consolidates business logic from auth/order/payment/product controllers
// ============================================================================

import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import AuditLog from "../models/auditLog.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { emailQueue } from "../controllers/mail.controller.js";
import { sendEmail } from "../lib/email.js";

// ============================================================================
// TOKEN UTILITIES
// ============================================================================

export const TokenService = {
  generateTokens: (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { userId },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
      },
    );
    return { accessToken, refreshToken };
  },

  storeRefreshToken: async (userId, refreshToken) => {
    await redis.set(
      `refresh_token:${userId}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60,
    );
  },

  setCookies: (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  },
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

const ValidationService = {
  passwordStrength: (password) => {
    if (password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự";
    }
    const checks = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;

    if (checks < 3) {
      return "Mật khẩu nên có chữ hoa, chữ thường, số và ký tự đặc biệt";
    }
    return null;
  },

  email: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  phone: (phone) => {
    return /^0[35789]\d{8}$/.test(phone);
  },

  name: (name) => {
    return /^[\p{L}\s]{2,50}$/u.test(name) && name.length >= 2;
  },
};

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export const AuditService = {
  log: async (userId, action, details = {}) => {
    try {
      await AuditLog.create({
        user: userId,
        action,
        details,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Audit logging error:", error);
    }
  },
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// ============================================================================
// EXPORT AGGREGATED SERVICES
// ============================================================================

export { TokenService, ValidationService, AuditService };
export default { TokenService, ValidationService, AuditService };
