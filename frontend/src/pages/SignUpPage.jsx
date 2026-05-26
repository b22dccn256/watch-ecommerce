import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Phone, ArrowRight, Loader, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";
import AuthLeftPanel from "../components/AuthLeftPanel";

// Field component tái sử dụng
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
    if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
    const score = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
    if (score < 3) return "Nên có chữ hoa, chữ thường, số và ký tự đặc biệt";
    return "";
  };

  const validateField = (field, value) => {
    let msg = "";
    if (field === "name") {
      if (!value.trim()) msg = "Vui lòng nhập họ và tên";
      else if (!NAME_REGEX.test(value.trim())) msg = "Chỉ chứa chữ cái và khoảng trắng (2–50 ký tự)";
    }
    if (field === "email") {
      if (!value.trim()) msg = "Vui lòng nhập email";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) msg = "Email không hợp lệ";
    }
    if (field === "phone" && value.trim() && !/^0[35789]\d{8}$/.test(value.trim()))
      msg = "Số điện thoại không hợp lệ";
    if (field === "password") msg = value ? validatePasswordStrength(value) : "Vui lòng nhập mật khẩu";
    if (field === "confirmPassword") {
      if (!value) msg = "Vui lòng nhập lại mật khẩu";
      else if (formData.password !== value) msg = "Mật khẩu xác nhận không khớp";
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

      {/* ── Left — Editorial Panel ── */}
      <AuthLeftPanel />

      {/* ── Right — Form Panel ── */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto bg-[color:var(--color-bg)] px-6 py-16 sm:px-10 w-full lg:w-1/2">
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
            <h1 className="font-serif text-[2rem] leading-tight text-primary">Tạo tài khoản</h1>
            <p className="text-sm text-muted">Gia nhập cộng đồng những người yêu đồng hồ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              id="name" label="Họ và tên *"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              error={errors.name} touched={touched.name}
              placeholder="Nguyễn Văn A"
              icon={User}
            />

            <Field
              id="email" label="Địa chỉ Email *" type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              error={errors.email} touched={touched.email}
              placeholder="you@example.com"
              icon={Mail}
            />

            <Field
              id="phone" label="Số điện thoại" type="tel"
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
                Mật khẩu *
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="password" type={showPwd ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder="••••••••"
                  className={`input-base h-11 w-full rounded-lg pl-10 pr-10 ${touched.password && errors.password ? "border-[color:var(--color-danger)]" : ""}`}
                />
                <button
                  type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-primary"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted">Tối thiểu 8 ký tự, gồm hoa, thường, số</p>
              {touched.password && errors.password && (
                <p className="text-[11px] text-[color:var(--color-danger)]">{errors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-[10px] uppercase tracking-[0.18em] text-secondary">
                Xác nhận mật khẩu *
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="confirmPassword" type={showConfirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  onBlur={() => handleBlur("confirmPassword")}
                  placeholder="••••••••"
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
                ? <><Loader className="mr-2 h-4 w-4 animate-spin" />Đang tạo tài khoản…</>
                : <><UserPlus className="mr-2 h-4 w-4" />Đăng ký</>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-medium text-[color:var(--color-gold)] transition hover:underline">
              Đăng nhập <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUpPage;
