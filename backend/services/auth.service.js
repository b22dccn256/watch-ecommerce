import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { emailQueue } from "../controllers/mail.controller.js";
import { sendEmail } from "../lib/email.js";

export const initiateAdminLogin = async (email, userAgent, ip) => {
    const lockUntil = await redis.get(`lockUntil:${email}`);
    if (lockUntil && lockUntil > Date.now()) {
        const minutesLeft = Math.ceil((lockUntil - Date.now()) / 60000);
        const error = new Error(`Tài khoản bị khóa do nhập sai OTP quá nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút.`);
        error.status = 429;
        throw error;
    }

    const cooldown = await redis.get(`cooldown:${email}`);
    if (cooldown) {
        const error = new Error("Vui lòng đợi 60 giây giữa các lần yêu cầu mã xác thực.");
        error.status = 429;
        throw error;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
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
        error.status = 429;
        throw error;
    }

    const storedHash = await redis.get(`otp:${email}`);
    if (!storedHash) {
        const error = new Error("Mã OTP đã hết hạn, vui lòng yêu cầu mã mới");
        error.status = 410;
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
            error.status = 429;
            throw error;
        }
        const error = new Error(`Mã OTP không chính xác. Bạn còn ${5 - attempts} lần thử.`);
        error.status = 400;
        throw error;
    }
};

export const resendAdminOTP = async (email, userAgent, ip) => {
    const cooldown = await redis.get(`cooldown:${email}`);
    if (cooldown) {
        const error = new Error("Vui lòng đợi 60 giây trước khi yêu cầu mã mới");
        error.status = 429;
        throw error;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
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
};
