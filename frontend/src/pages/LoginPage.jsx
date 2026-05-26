import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, Mail, Lock, ArrowRight, Loader, ShieldCheck, RefreshCw, Gift, Truck, Percent, Star, BadgeCheck, Gem } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

import AuthLeftPanel from "../components/AuthLeftPanel";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("login");
  const [otpExpiry, setOtpExpiry] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login, verifyOTP, resendOTP, loading } = useUserStore();

  useEffect(() => {
    let timer;
    if (step === "otp" && otpExpiry > 0) {
      timer = setInterval(() => setOtpExpiry((p) => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpExpiry]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(email, password);
      console.debug("login result:", result);
      if (result === "OTP_REQUIRED") {
        setStep("otp");
        setOtpExpiry(300);
        setResendCooldown(60);
      }
    } catch (err) { 
      console.error("login error:", err);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    try { await verifyOTP(email, otp); } catch (err) { 
      console.error("verifyOTP error:", err);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const ok = await resendOTP(email);
    if (ok) { setResendCooldown(60); setOtpExpiry(300); setOtp(""); }
  };

  return (
    <div className="flex min-h-screen bg-[#f5f3ef] dark:bg-[#0f0c08]">
      {/* ═══ LEFT — Benefits Panel ═══ */}
      <AuthLeftPanel />

      {/* ═══ RIGHT — Form Panel ═══ */}
      <div className="flex flex-1 items-center justify-center bg-white dark:bg-[#161310] px-6 py-14 sm:px-12 w-full lg:w-1/2">
        <div className="w-full max-w-[400px]">

          {/* Mobile brand */}
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[color:var(--color-gold)]/15 border border-[color:var(--color-gold)]/30 flex items-center justify-center">
                <span className="text-xs font-bold text-[color:var(--color-gold)]">LW</span>
              </div>
              <div>
                <p className="text-base font-bold tracking-wider text-primary">LUXURY</p>
                <p className="text-[9px] uppercase text-muted">Watch Gallery</p>
              </div>
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-[color:var(--color-gold)]/10 border border-[color:var(--color-gold)]/20 text-[10px] font-semibold text-[color:var(--color-gold)] uppercase">SMEMBER</span>
          </div>

          <AnimatePresence mode="wait">
            {/* ── Login step ── */}
            {step === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.38 }}
              >
                {/* Heading */}
                <div className="mb-7 space-y-1">
                  <h1 className="text-[1.75rem] font-bold text-primary leading-tight">Đăng nhập SMEMBER</h1>
                  <p className="text-sm text-secondary">Đăng nhập để tiếp tục hành trình của bạn</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-primary placeholder:text-muted text-sm focus:outline-none focus:border-[color:var(--color-gold)] focus:ring-1 focus:ring-[color:var(--color-gold)]/30 transition"
                        placeholder="you@example.com" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-primary placeholder:text-muted text-sm focus:outline-none focus:border-[color:var(--color-gold)] focus:ring-1 focus:ring-[color:var(--color-gold)]/30 transition"
                        placeholder="••••••••" />
                    </div>
                    <div className="text-right">
                      <Link to="/forgot-password" className="text-xs text-[color:var(--color-gold)] hover:underline">Quên mật khẩu?</Link>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="btn-base btn-primary h-12 w-full rounded-xl font-bold text-sm">
                    {loading ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Đang xử lý…</> : <><LogIn className="mr-2 h-4 w-4" />Đăng nhập</>}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                  <span className="text-xs text-muted font-medium">Hoặc đăng nhập bằng</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <a href="/api/auth/oauth/google"
                    className="flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 dark:border-white/10 hover:border-[color:var(--color-gold)]/50 hover:bg-[color:var(--color-gold)]/5 transition-colors text-sm text-secondary">
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.545,10.239v3.821h5.445c-0.231,1.139-1.317,3.33-5.445,3.33c-3.284,0-5.962-2.73-5.962-6.101s2.678-6.101,5.962-6.101c1.86,0,3.109,0.796,3.818,1.472l2.997-2.909c-1.782-1.636-4.085-2.617-6.816-2.617c-5.467,0-9.897,4.48-9.897,10.038s4.43,10.038,9.897,10.038c5.719,0,9.507-4.02,9.507-9.673c0-0.742-0.088-1.393-0.211-1.999H12.545z"/></svg>
                    Google
                  </a>
                  <a href="/api/auth/oauth/facebook"
                    className="flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 dark:border-white/10 hover:border-[color:var(--color-gold)]/50 hover:bg-[color:var(--color-gold)]/5 transition-colors text-sm text-secondary">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </a>
                </div>

                <p className="mt-8 text-center text-sm text-secondary">
                  Bạn chưa có tài khoản?{" "}
                  <Link to="/signup" className="font-semibold text-[color:var(--color-gold)] hover:underline">Đăng ký ngay</Link>
                </p>

                <p className="mt-6 text-center text-[10px] text-muted">
                  Mua sắm tại <span className="text-[color:var(--color-gold)]">luxurywatch.vn</span>
                </p>
              </motion.div>
            )}

            {/* ── OTP step ── */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.38 }}
              >
                <div className="mb-7 space-y-1">
                  <h1 className="text-[1.75rem] font-bold text-primary leading-tight">Xác thực danh tính</h1>
                  <p className="text-sm text-secondary">Mã OTP đã được gửi đến <span className="font-medium text-primary">{email}</span></p>
                </div>

                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="otp" className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary">Mã xác thực (OTP)</label>
                    <div className="relative">
                      <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input id="otp" type="text" required value={otp} onChange={(e) => setOtp(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-primary text-lg font-mono tracking-[0.4em] text-center focus:outline-none focus:border-[color:var(--color-gold)] focus:ring-1 focus:ring-[color:var(--color-gold)]/30 transition"
                        placeholder="000000" maxLength={6} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Hết hạn: <strong className="text-primary">{fmt(otpExpiry)}</strong></span>
                    <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                      className="flex items-center gap-1 transition hover:text-[color:var(--color-gold)] disabled:opacity-40">
                      <RefreshCw className="h-3.5 w-3.5" />
                      {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : "Gửi lại OTP"}
                    </button>
                  </div>

                  <button type="submit" disabled={loading}
                    className="btn-base btn-primary h-12 w-full rounded-xl font-bold text-sm">
                    {loading ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Đang xác thực…</> : <><ShieldCheck className="mr-2 h-4 w-4" />Xác nhận</>}
                  </button>
                </form>

                <button type="button" onClick={() => setStep("login")}
                  className="mt-5 block w-full text-center text-sm text-muted transition hover:text-primary">
                  ← Quay lại đăng nhập
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
