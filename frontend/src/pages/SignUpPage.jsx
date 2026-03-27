import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Loader, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";

// ─── Validation Rules ───────────────────────────────────────────────────────────
const NAME_REGEX = /^[\p{L}\s]{2,50}$/u;
const PHONE_REGEX = /^(0[35789])\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASS_REGEX  = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!])[A-Za-z\d@#$%^&*!]{8,}$/;

// ─── Password Strength ──────────────────────────────────────────────────────────
const getPasswordStrength = (password) => {
	if (!password) return { score: 0, label: "", color: "" };
	let score = 0;
	if (password.length >= 8) score++;
	if (/[a-z]/.test(password)) score++;
	if (/[A-Z]/.test(password)) score++;
	if (/\d/.test(password)) score++;
	if (/[@#$%^&*!]/.test(password)) score++;

	if (score <= 2) return { score, label: "Yếu", color: "bg-red-500", textColor: "text-red-500" };
	if (score === 3) return { score, label: "Trung bình", color: "bg-yellow-500", textColor: "text-yellow-500" };
	if (score === 4) return { score, label: "Mạnh", color: "bg-blue-500", textColor: "text-blue-500" };
	return { score, label: "Rất mạnh", color: "bg-emerald-500", textColor: "text-emerald-500" };
};

// ─── Check Email Sent Screen ────────────────────────────────────────────────────
const EmailSentScreen = ({ email, onResend, loading }) => (
	<motion.div
		initial={{ opacity: 0, scale: 0.95 }}
		animate={{ opacity: 1, scale: 1 }}
		transition={{ duration: 0.5 }}
		className="text-center py-8 px-4"
	>
		<motion.div
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
			className="flex justify-center mb-6"
		>
			<div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
				<Mail className="h-10 w-10 text-emerald-400" />
			</div>
		</motion.div>
		<h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
			Kiểm tra hộp thư email
		</h3>
		<p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
			Chúng tôi đã gửi link xác minh đến:
		</p>
		<p className="text-emerald-500 font-semibold text-base mb-6 break-all">{email}</p>
		<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6 text-left">
			<div className="flex gap-2">
				<AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
				<p className="text-amber-700 dark:text-amber-400 text-xs">
					Link xác minh có hiệu lực trong <strong>15 phút</strong>. Nhớ kiểm tra cả thư mục <strong>Spam</strong> của bạn.
				</p>
			</div>
		</div>
		<p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Không nhận được email?</p>
		<button
			onClick={onResend}
			disabled={loading}
			className="text-emerald-500 hover:text-emerald-400 font-medium text-sm underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{loading ? "Đang gửi..." : "Gửi lại email xác minh"}
		</button>
		<div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
			<Link to="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-400 transition-colors">
				← Quay lại đăng nhập
			</Link>
		</div>
	</motion.div>
);

// ─── Field Error ────────────────────────────────────────────────────────────────
const FieldError = ({ message }) =>
	message ? (
		<motion.p
			initial={{ opacity: 0, y: -4 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -4 }}
			className="mt-1 text-xs text-red-500 flex items-center gap-1"
		>
			<AlertCircle className="h-3 w-3 flex-shrink-0" />
			{message}
		</motion.p>
	) : null;

// ─── Main Component ─────────────────────────────────────────────────────────────
const SignUpPage = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [submittedEmail, setSubmittedEmail] = useState("");
	const [resendLoading, setResendLoading] = useState(false);

	const { signup, loading, resendVerificationEmail } = useUserStore();
	const strength = getPasswordStrength(formData.password);

	// ── Live validation per field ──────────────────────────────────────────────
	const validateField = (field, value) => {
		switch (field) {
			case "name":
				if (!value.trim()) return "Vui lòng nhập họ tên";
				if (!NAME_REGEX.test(value.trim())) return "Tên không hợp lệ (2–50 ký tự, chỉ chứa chữ cái và khoảng trắng)";
				return "";
			case "email":
				if (!value.trim()) return "Vui lòng nhập email";
				if (!EMAIL_REGEX.test(value.toLowerCase().trim())) return "Địa chỉ email không hợp lệ";
				return "";
			case "phone":
				if (!value.trim()) return "Vui lòng nhập số điện thoại";
				if (!PHONE_REGEX.test(value.trim())) return "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)";
				return "";
			case "password":
				if (!value) return "Vui lòng nhập mật khẩu";
				if (!PASS_REGEX.test(value)) return "Mật khẩu phải có ≥8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@#$%^&*!)";
				return "";
			case "confirmPassword":
				if (!value) return "Vui lòng xác nhận mật khẩu";
				if (value !== formData.password) return "Mật khẩu xác nhận không khớp";
				return "";
			default:
				return "";
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		// Clear error on type
		if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
	};

	const handleBlur = (e) => {
		const { name, value } = e.target;
		const error = validateField(name, value);
		setErrors((prev) => ({ ...prev, [name]: error }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		// Validate all fields
		const newErrors = {};
		Object.keys(formData).forEach((field) => {
			const err = validateField(field, formData[field]);
			if (err) newErrors[field] = err;
		});
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		const success = await signup(formData);
		if (success) {
			setSubmittedEmail(formData.email.toLowerCase().trim());
			setSubmitted(true);
		}
	};

	const handleResend = async () => {
		setResendLoading(true);
		await resendVerificationEmail(submittedEmail);
		setResendLoading(false);
	};

	// Input field class helper
	const inputClass = (field) =>
		`block w-full px-3 py-2.5 pl-10 bg-gray-50 dark:bg-gray-700 border ${
			errors[field]
				? "border-red-400 focus:ring-red-400 focus:border-red-400"
				: "border-gray-200 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500"
		} rounded-md shadow-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm transition-colors`;

	return (
		<div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<motion.div
				className="sm:mx-auto sm:w-full sm:max-w-md"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
			>
				<h2 className="mt-6 text-center text-3xl font-extrabold text-emerald-400">
					Tạo tài khoản mới
				</h2>
				<p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
					Đăng ký để trải nghiệm mua sắm đồng hồ cao cấp
				</p>
			</motion.div>

			<motion.div
				className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, delay: 0.15 }}
			>
				<div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl border border-gray-100 dark:border-transparent sm:rounded-xl">
					<AnimatePresence mode="wait">
						{submitted ? (
							<EmailSentScreen
								key="sent"
								email={submittedEmail}
								onResend={handleResend}
								loading={resendLoading}
							/>
						) : (
							<motion.form
								key="form"
								onSubmit={handleSubmit}
								className="space-y-5"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
							>
								{/* ── Full Name ─────────────────────────────────── */}
								<div>
									<label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Họ và tên <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<User className="h-4 w-4 text-gray-400" />
										</div>
										<input
											id="name"
											name="name"
											type="text"
											autoComplete="name"
											value={formData.name}
											onChange={handleChange}
											onBlur={handleBlur}
											className={inputClass("name")}
											placeholder="Nguyễn Văn An"
										/>
									</div>
									<AnimatePresence><FieldError message={errors.name} /></AnimatePresence>
								</div>

								{/* ── Email ─────────────────────────────────────── */}
								<div>
									<label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Địa chỉ Email <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<Mail className="h-4 w-4 text-gray-400" />
										</div>
										<input
											id="email"
											name="email"
											type="email"
											autoComplete="email"
											value={formData.email}
											onChange={handleChange}
											onBlur={handleBlur}
											className={inputClass("email")}
											placeholder="ban@gmail.com"
										/>
									</div>
									<AnimatePresence><FieldError message={errors.email} /></AnimatePresence>
								</div>

								{/* ── Phone ─────────────────────────────────────── */}
								<div>
									<label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Số điện thoại <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<Phone className="h-4 w-4 text-gray-400" />
										</div>
										<input
											id="phone"
											name="phone"
											type="tel"
											autoComplete="tel"
											value={formData.phone}
											onChange={handleChange}
											onBlur={handleBlur}
											className={inputClass("phone")}
											placeholder="0912345678"
										/>
									</div>
									<AnimatePresence><FieldError message={errors.phone} /></AnimatePresence>
								</div>

								{/* ── Password ──────────────────────────────────── */}
								<div>
									<label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Mật khẩu <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<Lock className="h-4 w-4 text-gray-400" />
										</div>
										<input
											id="password"
											name="password"
											type={showPassword ? "text" : "password"}
											autoComplete="new-password"
											value={formData.password}
											onChange={handleChange}
											onBlur={handleBlur}
											className={inputClass("password") + " pr-10"}
											placeholder="••••••••"
										/>
										<button
											type="button"
											onClick={() => setShowPassword((v) => !v)}
											className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
										>
											{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
										</button>
									</div>
									{/* Strength meter */}
									{formData.password && (
										<div className="mt-2">
											<div className="flex gap-1 mb-1">
												{[1, 2, 3, 4, 5].map((i) => (
													<div
														key={i}
														className={`h-1 flex-1 rounded-full transition-all duration-300 ${
															i <= strength.score ? strength.color : "bg-gray-200 dark:bg-gray-600"
														}`}
													/>
												))}
											</div>
											<p className={`text-xs font-medium ${strength.textColor}`}>
												Độ mạnh: {strength.label}
											</p>
										</div>
									)}
									<AnimatePresence><FieldError message={errors.password} /></AnimatePresence>
								</div>

								{/* ── Confirm Password ───────────────────────────── */}
								<div>
									<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Xác nhận mật khẩu <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<Lock className="h-4 w-4 text-gray-400" />
										</div>
										<input
											id="confirmPassword"
											name="confirmPassword"
											type={showConfirmPassword ? "text" : "password"}
											autoComplete="new-password"
											value={formData.confirmPassword}
											onChange={handleChange}
											onBlur={handleBlur}
											className={inputClass("confirmPassword") + " pr-10"}
											placeholder="••••••••"
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword((v) => !v)}
											className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
										>
											{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
										</button>
									</div>
									{/* Match indicator */}
									{formData.confirmPassword && formData.password && (
										<p className={`mt-1 text-xs flex items-center gap-1 ${
											formData.confirmPassword === formData.password
												? "text-emerald-500"
												: "text-red-500"
										}`}>
											{formData.confirmPassword === formData.password ? (
												<><CheckCircle className="h-3 w-3" /> Mật khẩu khớp</>
											) : (
												<><AlertCircle className="h-3 w-3" /> Mật khẩu không khớp</>
											)}
										</p>
									)}
									<AnimatePresence><FieldError message={errors.confirmPassword} /></AnimatePresence>
								</div>

								{/* ── Submit ────────────────────────────────────── */}
								<button
									type="submit"
									disabled={loading}
									className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
								>
									{loading ? (
										<>
											<Loader className="h-4 w-4 animate-spin" />
											Đang xử lý...
										</>
									) : (
										<>
											<UserPlus className="h-4 w-4" />
											Đăng ký
										</>
									)}
								</button>

								<p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
									Đã có tài khoản?{" "}
									<Link to="/login" className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors">
										Đăng nhập <ArrowRight className="inline h-3.5 w-3.5" />
									</Link>
								</p>
							</motion.form>
						)}
					</AnimatePresence>
				</div>
			</motion.div>
		</div>
	);
};

export default SignUpPage;
