import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Phone, ArrowRight, Loader, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";

const EDITORIAL_IMAGE =
  "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1600&auto=format&fit=crop";

// Field component tĂ¡i sá»­ dá»¥ng
const Field = ({ id, label, type = "text", value, onChange, onBlur, error, touched, placeholder, icon: Icon, suffix }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-[10px] uppercase tracking-[0.18em] text-secondary">
      {label}
    </label>
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`input-base h-11 w-full rounded-lg ${Icon ? "pl-10" : ""} ${suffix ? "pr-10" : ""} ${touched && error ? "border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)]" : ""}`}
      />
      {suffix}
    </div>
    {touched && error && <p className="text-[11px] text-[color:var(--color-danger)]">{error}</p>}
  </div>
);

const SignUpPage = () => {
  const NAME_REGEX = /^[\p{L}\s]{2,50}$/u;

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { signup, loading } = useUserStore();
  const navigate = useNavigate();

  const validatePasswordStrength = (password) => {
    if (password.length < 8) return "Máº­t kháº©u pháº£i cĂ³ Ă­t nháº¥t 8 kĂ½ tá»±";
    const score = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
    if (score < 3) return "NĂªn cĂ³ chá»¯ hoa, chá»¯ thÆ°á»ng, sá»‘ vĂ  kĂ½ tá»± Ä‘áº·c biá»‡t";
    return "";
  };

  const validateField = (field, value) => {
    let msg = "";
    if (field === "name") {
      if (!value.trim()) msg = "Vui lĂ²ng nháº­p há» vĂ  tĂªn";
      else if (!NAME_REGEX.test(value.trim())) msg = "Chá»‰ chá»©a chá»¯ cĂ¡i vĂ  khoáº£ng tráº¯ng (2â€“50 kĂ½ tá»±)";
    }
    if (field === "email") {
      if (!value.trim()) msg = "Vui lĂ²ng nháº­p email";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) msg = "Email khĂ´ng há»£p lá»‡";
    }
    if (field === "phone" && value.trim() && !/^0[35789]\d{8}$/.test(value.trim()))
      msg = "Sá»‘ Ä‘iá»‡n thoáº¡i khĂ´ng há»£p lá»‡";
    if (field === "password") msg = value ? validatePasswordStrength(value) : "Vui lĂ²ng nháº­p máº­t kháº©u";
    if (field === "confirmPassword") {
      if (!value) msg = "Vui lĂ²ng nháº­p láº¡i máº­t kháº©u";
      else if (formData.password !== value) msg = "Máº­t kháº©u xĂ¡c nháº­n khĂ´ng khá»›p";
    }
    setErrors((prev) => ({ ...prev, [field]: msg }));
    return msg;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) validateField(field, value);
    if (field === "password" && touched.confirmPassword) validateField("confirmPassword", formData.confirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(formData).map((k) => [k, true]));
    setTouched(allTouched);
    const hasError = Object.keys(formData).some((k) => validateField(k, formData[k]));
    if (hasError) return;
    const result = await signup(formData);
    if (result?.success) {
      localStorage.setItem("pendingVerifyEmail", result.email);
      navigate("/verify-email");
    }
  };

  return (
    <div className="flex min-h-screen">

      {/* â”€â”€ Left â€” Editorial Panel â”€â”€ */}
      <div
        className="relative hidden lg:flex lg:w-[46%] flex-col justify-between overflow-hidden p-14"
        style={{ background: "#0d0c0a" }}
      >
        <img
          src={EDITORIAL_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.2] mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/14">
            <span className="text-[10px] font-bold tracking-[0.08em] text-[color:var(--color-gold)]">LW</span>
          </div>
          <div>
            <p className="text-sm font-bold tracking-[0.3em] text-white">LUXURY</p>
            <p className="text-[9px] uppercase tracking-[0.36em] text-white/35">Watch Gallery</p>
          </div>
        </div>

        {/* Quote */}
        <div className="relative space-y-5">
          <div className="h-px w-12 bg-[color:var(--color-gold)]/55" />
          <blockquote className="font-serif text-[1.9rem] font-medium leading-[1.26] text-white/92">
            &quot;Má»—i chiáº¿c Ä‘á»“ng há»“ lĂ <br />má»™t tuyĂªn ngĂ´n vá» báº¡n â€”<br />
            trÆ°á»›c khi báº¡n nĂ³i má»™t lá»i.&quot;
          </blockquote>
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
            Luxury Watch Gallery Â· 2026
          </p>
        </div>

        <p className="relative text-[10px] uppercase tracking-[0.2em] text-white/20">
          Â© 2026 Â· Hanoi Â· Vietnam
        </p>
      </div>

      {/* â”€â”€ Right â€” Form Panel â”€â”€ */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto bg-[color:var(--color-bg)] px-6 py-16 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42 }}
          className="w-full max-w-[380px]"
        >
          {/* Mobile brand */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/14">
              <span className="text-[10px] font-bold tracking-[0.08em] text-[color:var(--color-gold)]">LW</span>
            </div>
            <div>
              <p className="font-serif text-base tracking-[0.26em] text-primary">LUXURY</p>
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted">Watch Gallery</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 space-y-1.5">
            <h1 className="font-serif text-[2rem] leading-tight text-primary">Táº¡o tĂ i khoáº£n</h1>
            <p className="text-sm text-muted">Gia nháº­p cá»™ng Ä‘á»“ng nhá»¯ng ngÆ°á»i yĂªu Ä‘á»“ng há»“</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              id="name" label="Há» vĂ  tĂªn *"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              error={errors.name} touched={touched.name}
              placeholder="Nguyá»…n VÄƒn A"
              icon={User}
            />

            <Field
              id="email" label="Äá»‹a chá»‰ Email *" type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              error={errors.email} touched={touched.email}
              placeholder="you@example.com"
              icon={Mail}
            />

            <Field
              id="phone" label="Sá»‘ Ä‘iá»‡n thoáº¡i" type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              onBlur={() => handleBlur("phone")}
              error={errors.phone} touched={touched.phone}
              placeholder="0912 345 678"
              icon={Phone}
            />

            {/* Password with toggle */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.18em] text-secondary">
                Máº­t kháº©u *
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="password" type={showPwd ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  className={`input-base h-11 w-full rounded-lg pl-10 pr-10 ${touched.password && errors.password ? "border-[color:var(--color-danger)]" : ""}`}
                />
                <button
                  type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-primary"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted">Tá»‘i thiá»ƒu 8 kĂ½ tá»±, gá»“m hoa, thÆ°á»ng, sá»‘</p>
              {touched.password && errors.password && (
                <p className="text-[11px] text-[color:var(--color-danger)]">{errors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-[10px] uppercase tracking-[0.18em] text-secondary">
                XĂ¡c nháº­n máº­t kháº©u *
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="confirmPassword" type={showConfirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  onBlur={() => handleBlur("confirmPassword")}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  className={`input-base h-11 w-full rounded-lg pl-10 pr-10 ${touched.confirmPassword && errors.confirmPassword ? "border-[color:var(--color-danger)]" : ""}`}
                />
                <button
                  type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-primary"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-[11px] text-[color:var(--color-danger)]">{errors.confirmPassword}</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-base btn-primary mt-2 h-11 w-full">
              {loading
                ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Äang táº¡o tĂ i khoáº£nâ€¦</>
                : <><UserPlus className="mr-2 h-4 w-4" />ÄÄƒng kĂ½</>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            ÄĂ£ cĂ³ tĂ i khoáº£n?{" "}
            <Link to="/login" className="font-medium text-[color:var(--color-gold)] transition hover:underline">
              ÄÄƒng nháº­p <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUpPage;

