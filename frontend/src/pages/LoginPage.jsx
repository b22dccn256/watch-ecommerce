import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, Mail, Lock, ArrowRight, Loader, ShieldCheck, RefreshCw, Facebook, Github } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const EDITORIAL_IMAGE =
  "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1600&auto=format&fit=crop";

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
      if (result === "OTP_REQUIRED") {
        setStep("otp");
        setOtpExpiry(300);
        setResendCooldown(60);
      }
    } catch (err) { 
      // Handled in store
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    try { await verifyOTP(email, otp); } catch (err) { 
      // Handled in store
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const ok = await resendOTP(email);
    if (ok) { setResendCooldown(60); setOtpExpiry(300); setOtp(""); }
  };

  return (
    <div className="flex min-h-screen">

      {/* â”€â”€ Left â€” Editorial Panel â”€â”€ */}
      <div
        className="relative hidden lg:flex lg:w-[46%] flex-col justify-between overflow-hidden p-14"
        style={{ background: "#0d0c0a" }}
      >
        {/* Background image */}
        <img
          src={EDITORIAL_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.22] mix-blend-luminosity"
        />
        {/* Gradient veil */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/65" />

        {/* Brand lockup */}
        <div className="relative flex items-center gap-3">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/14">
            <span className="text-[10px] font-bold tracking-[0.08em] text-[color:var(--color-gold)]">LW</span>
          </div>
          <div>
            <p className="text-sm font-bold tracking-[0.3em] text-white">LUXURY</p>
            <p className="text-[9px] uppercase tracking-[0.36em] text-white/35">Watch Gallery</p>
          </div>
        </div>

        {/* Quote block */}
        <div className="relative space-y-5">
          <div className="h-px w-12 bg-[color:var(--color-gold)]/55" />
          <blockquote className="font-serif text-[1.95rem] font-medium leading-[1.24] text-white/92">
            &quot;Thá»i gian lĂ  xa xá»‰ pháº©m<br />duy nháº¥t khĂ´ng thá»ƒ mua
            Ä‘Æ°á»£c â€”<br />nhÆ°ng báº¡n cĂ³ thá»ƒ Ä‘eo nĂ³.&quot;
          </blockquote>
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
            Luxury Watch Gallery Â· 2026
          </p>
        </div>

        {/* Bottom */}
        <p className="relative text-[10px] uppercase tracking-[0.2em] text-white/20">
          Â© 2026 Â· Hanoi Â· Vietnam
        </p>
      </div>

      {/* â”€â”€ Right â€” Form Panel â”€â”€ */}
      <div className="flex flex-1 items-center justify-center bg-[color:var(--color-bg)] px-6 py-20 sm:px-10">
        <div className="w-full max-w-[360px]">

          {/* Mobile brand (hidden on lg) */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/14">
              <span className="text-[10px] font-bold tracking-[0.08em] text-[color:var(--color-gold)]">LW</span>
            </div>
            <div>
              <p className="font-serif text-base tracking-[0.26em] text-primary">LUXURY</p>
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted">Watch Gallery</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* â”€â”€ Login step â”€â”€ */}
            {step === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.38 }}
              >
                {/* Heading */}
                <div className="mb-8 space-y-1.5">
                  <h1 className="font-serif text-[2rem] leading-tight text-primary">
                    ChĂ o má»«ng trá»Ÿ láº¡i
                  </h1>
                  <p className="text-sm text-muted">ÄÄƒng nháº­p Ä‘á»ƒ tiáº¿p tá»¥c hĂ nh trĂ¬nh cá»§a báº¡n</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.18em] text-secondary">
                      Äá»‹a chá»‰ Email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        id="email" type="email" required
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className="input-base h-11 rounded-lg pl-10"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.18em] text-secondary">
                      Máº­t kháº©u
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        id="password" type="password" required
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className="input-base h-11 rounded-lg pl-10"
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      />
                    </div>
                    <div className="text-right">
                      <Link to="/forgot-password" className="text-xs text-[color:var(--color-gold)] hover:underline">
                        QuĂªn máº­t kháº©u?
                      </Link>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="btn-base btn-primary mt-1 h-11 w-full">
                    {loading
                      ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Äang xá»­ lĂ½â€¦</>
                      : <><LogIn className="mr-2 h-4 w-4" />ÄÄƒng nháº­p</>}
                  </button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center gap-4">
                  <div className="flex-1 border-t border-[color:var(--color-border)]" />
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted">hoáº·c</span>
                  <div className="flex-1 border-t border-[color:var(--color-border)]" />
                </div>

                {/* Social Login â€” minimal line buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => window.location.href = "/api/auth/oauth/google"}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-surface transition-colors duration-300 hover:border-[color:var(--color-gold)] hover:bg-[color:var(--color-surface-2)]"
                    aria-label="Google"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12.545,10.239v3.821h5.445c-0.231,1.139-1.317,3.33-5.445,3.33c-3.284,0-5.962-2.73-5.962-6.101s2.678-6.101,5.962-6.101c1.86,0,3.109,0.796,3.818,1.472l2.997-2.909c-1.782-1.636-4.085-2.617-6.816-2.617c-5.467,0-9.897,4.48-9.897,10.038s4.43,10.038,9.897,10.038c5.719,0,9.507-4.02,9.507-9.673c0-0.742-0.088-1.393-0.211-1.999H12.545z"/>
                      <path fill="#34A853" d="M22.052,12.038c0-0.742-0.088-1.393-0.211-1.999H12.545v3.821h5.445c-0.231,1.139-1.317,3.33-5.445,3.33c-0.908,0-1.76-0.203-2.527-0.569l-2.674,2.028v0.015c1.442,1.339,3.396,2.152,5.201,2.152C17.771,22.076,22.052,18.056,22.052,12.038z"/>
                      <path fill="#4A90E2" d="M12.545,8.156c1.86,0,3.109,0.796,3.818,1.472l2.997-2.909c-1.782-1.636-4.085-2.617-6.816-2.617C8.751,4.102,5.83,5.656,4.053,8.016l2.674,2.028C7.545,8.818,9.866,8.156,12.545,8.156z"/>
                      <path fill="#FBBC05" d="M6.726,10.044c-0.187,0.612-0.291,1.267-0.291,1.956s0.104,1.344,0.291,1.956l-2.674,2.028C3.473,14.887,3.18,13.488,3.18,12s0.293-2.887,0.871-4.148L6.726,10.044z"/>
                    </svg>
                  </button>
                  {/* Facebook */}
                  <button
                    type="button"
                    onClick={() => window.location.href = "/api/auth/oauth/facebook"}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-surface transition-colors duration-300 hover:border-[color:var(--color-gold)] hover:bg-[color:var(--color-surface-2)]"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4 text-muted" />
                  </button>
                  {/* GitHub */}
                  <button
                    type="button"
                    onClick={() => window.location.href = "/api/auth/oauth/github"}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-surface transition-colors duration-300 hover:border-[color:var(--color-gold)] hover:bg-[color:var(--color-surface-2)]"
                    aria-label="GitHub"
                  >
                    <Github className="h-4 w-4 text-muted" />
                  </button>
                </div>

                <p className="mt-7 text-center text-sm text-muted">
                  ChÆ°a cĂ³ tĂ i khoáº£n?{" "}
                  <Link to="/signup" className="font-medium text-[color:var(--color-gold)] transition hover:underline">
                    ÄÄƒng kĂ½ <ArrowRight className="inline h-3.5 w-3.5" />
                  </Link>
                </p>
              </motion.div>
            )}

            {/* â”€â”€ OTP step â”€â”€ */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.38 }}
              >
                <div className="mb-8 space-y-1.5">
                  <h1 className="font-serif text-[2rem] leading-tight text-primary">XĂ¡c thá»±c danh tĂ­nh</h1>
                  <p className="text-sm text-muted">
                    MĂ£ OTP Ä‘Ă£ Ä‘Æ°á»£c gá»­i Ä‘áº¿n <span className="font-medium text-primary">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="otp" className="block text-[10px] uppercase tracking-[0.18em] text-secondary">
                      MĂ£ xĂ¡c thá»±c Admin (OTP)
                    </label>
                    <div className="relative">
                      <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        id="otp" type="text" required
                        value={otp} onChange={(e) => setOtp(e.target.value)}
                        className="input-base h-11 rounded-lg pl-10 font-mono tracking-[0.3em]"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Háº¿t háº¡n sau: <strong className="text-primary">{fmt(otpExpiry)}</strong></span>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="flex items-center gap-1 transition hover:text-[color:var(--color-gold)] disabled:opacity-40"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {resendCooldown > 0 ? `Gá»­i láº¡i (${resendCooldown}s)` : "Gá»­i láº¡i OTP"}
                    </button>
                  </div>

                  <button type="submit" disabled={loading} className="btn-base btn-primary h-11 w-full">
                    {loading
                      ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Äang xĂ¡c thá»±câ€¦</>
                      : <><ShieldCheck className="mr-2 h-4 w-4" />XĂ¡c nháº­n</>}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setStep("login")}
                  className="mt-5 block w-full text-center text-sm text-muted transition hover:text-primary"
                >
                  â† Quay láº¡i Ä‘Äƒng nháº­p
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

