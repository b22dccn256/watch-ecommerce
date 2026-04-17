import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, User, ArrowRight, Loader } from "lucide-react";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";

const SignUpPage = () => {
	const NAME_REGEX = /^[\p{L}\s]{2,50}$/u;
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState({});
	const [touched, setTouched] = useState({});

	const { signup, loading } = useUserStore();
	const navigate = useNavigate();

	const validatePasswordStrength = (password) => {
		if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";

		const hasLowercase = /[a-z]/.test(password);
		const hasUppercase = /[A-Z]/.test(password);
		const hasNumber = /\d/.test(password);
		const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
		const strengthScore = [hasLowercase, hasUppercase, hasNumber, hasSpecialChar].filter(Boolean).length;

		if (strengthScore < 3) {
			return "Mật khẩu nên có chữ hoa, chữ thường, số và ký tự đặc biệt";
		}

		return "";
	};

	const validateForm = () => {
		const nextErrors = {};
		const trimmedName = formData.name.trim();
		const trimmedEmail = formData.email.trim().toLowerCase();

		if (!trimmedName) {
			nextErrors.name = "Vui lòng nhập họ và tên";
		} else if (!NAME_REGEX.test(trimmedName)) {
			nextErrors.name = "Họ và tên chỉ được chứa chữ cái và khoảng trắng (2–50 ký tự)";
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!trimmedEmail) {
			nextErrors.email = "Vui lòng nhập email";
		} else if (!emailRegex.test(trimmedEmail)) {
			nextErrors.email = "Email không hợp lệ";
		}

		const phoneValue = formData.phone.trim();
		if (phoneValue && !/^0[35789]\d{8}$/.test(phoneValue)) {
			nextErrors.phone = "Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam.";
		}

		if (!formData.password) {
			nextErrors.password = "Vui lòng nhập mật khẩu";
		} else {
			const passwordError = validatePasswordStrength(formData.password);
			if (passwordError) {
				nextErrors.password = passwordError;
			}
		}

		if (!formData.confirmPassword) {
			nextErrors.confirmPassword = "Vui lòng nhập lại mật khẩu";
		} else if (formData.password !== formData.confirmPassword) {
			nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const validateField = (fieldName, value) => {
		let message = "";

		if (fieldName === "name") {
			const trimmedName = value.trim();
			if (!trimmedName) {
				message = "Vui lòng nhập họ và tên";
			} else if (!NAME_REGEX.test(trimmedName)) {
				message = "Họ và tên chỉ được chứa chữ cái và khoảng trắng (2–50 ký tự)";
			}
		}

		if (fieldName === "email") {
			const trimmedEmail = value.trim().toLowerCase();
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!trimmedEmail) {
				message = "Vui lòng nhập email";
			} else if (!emailRegex.test(trimmedEmail)) {
				message = "Email không hợp lệ";
			}
		}

		if (fieldName === "phone") {
			const phoneValue = value.trim();
			if (phoneValue && !/^0[35789]\d{8}$/.test(phoneValue)) {
				message = "Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam.";
			}
		}

		if (fieldName === "password") {
			if (!value) {
				message = "Vui lòng nhập mật khẩu";
			} else {
				message = validatePasswordStrength(value);
			}
		}

		if (fieldName === "confirmPassword") {
			if (!value) {
				message = "Vui lòng nhập lại mật khẩu";
			} else if (formData.password !== value) {
				message = "Mật khẩu xác nhận không khớp";
			}
		}

		setErrors((currentErrors) => ({
			...currentErrors,
			[fieldName]: message,
		}));

		return message;
	};

	const handleBlur = (fieldName) => {
		setTouched((currentTouched) => ({
			...currentTouched,
			[fieldName]: true,
		}));
		validateField(fieldName, formData[fieldName]);
	};

	const handleChange = (fieldName, value) => {
		setFormData((currentFormData) => ({
			...currentFormData,
			[fieldName]: value,
		}));

		if (touched[fieldName]) {
			validateField(fieldName, value);
		}

		if (fieldName === "password" && touched.confirmPassword) {
			validateField("confirmPassword", formData.confirmPassword);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		const result = await signup(formData);
		if (result?.success) {
			localStorage.setItem("pendingVerifyEmail", result.email);
			navigate("/verify-email");
		}
	};

	return (
		<div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
			<motion.div
				className='sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
			>
				<h2 className='hero-title mt-6 text-center text-3xl text-primary'>Đăng ký tài khoản</h2>
			</motion.div>

			<motion.div
				className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
			>
				<div className='bg-surface py-8 px-4 shadow-xl border border-black/10 dark:border-white/10 sm:rounded-2xl sm:px-10'>
					<form onSubmit={handleSubmit} className='space-y-6'>
						<div>
							<label htmlFor='name' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Họ và tên <span className='text-red-500'>*</span>
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<User className='h-5 w-5 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='name'
									type='text'
									required
									value={formData.name}
									onChange={(e) => handleChange("name", e.target.value)}
									onBlur={() => handleBlur("name")}
									className={`input-base block w-full pl-10 ${touched.name && errors.name ? "border-red-500 focus:border-red-500 focus:shadow-none" : ""}`}
									placeholder='Nguyễn Văn A'
								/>
							</div>
							{errors.name && <p className='mt-1 text-sm text-red-500'>{errors.name}</p>}
						</div>

						<div>
							<label htmlFor='email' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Email <span className='text-red-500'>*</span>
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Mail className='h-5 w-5 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='email'
									type='email'
									required
									value={formData.email}
									onChange={(e) => handleChange("email", e.target.value)}
									onBlur={() => handleBlur("email")}
									className={`input-base block w-full pl-10 ${touched.email && errors.email ? "border-red-500 focus:border-red-500 focus:shadow-none" : ""}`}
									placeholder='you@example.com'
								/>
							</div>
							{errors.email && <p className='mt-1 text-sm text-red-500'>{errors.email}</p>}
						</div>

							<div>
								<label htmlFor='phone' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Số điện thoại <span className='text-red-500'>*</span>
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<input
										id='phone'
										type='tel'
										value={formData.phone}
										onChange={(e) => handleChange("phone", e.target.value)}
										onBlur={() => handleBlur("phone")}
										className={`input-base block w-full ${touched.phone && errors.phone ? "border-red-500 focus:border-red-500 focus:shadow-none" : ""}`}
										placeholder='0912345678'
									/>
								</div>
								{errors.phone && <p className='mt-1 text-sm text-red-500'>{errors.phone}</p>}
							</div>

						<div>
							<label htmlFor='password' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Mật khẩu <span className='text-red-500'>*</span>
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='password'
									type='password'
									required
									value={formData.password}
									onChange={(e) => handleChange("password", e.target.value)}
									onBlur={() => handleBlur("password")}
									className={`input-base block w-full pl-10 ${touched.password && errors.password ? "border-red-500 focus:border-red-500 focus:shadow-none" : ""}`}
									placeholder='••••••••'
								/>
							</div>
							<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
								Mật khẩu nên có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
							</p>
							{errors.password && <p className='mt-1 text-sm text-red-500'>{errors.password}</p>}
						</div>

						<div>
							<label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Xác nhận mật khẩu <span className='text-red-500'>*</span>
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='confirmPassword'
									type='password'
									required
									value={formData.confirmPassword}
									onChange={(e) => handleChange("confirmPassword", e.target.value)}
									onBlur={() => handleBlur("confirmPassword")}
									className={`input-base block w-full pl-10 ${touched.confirmPassword && errors.confirmPassword ? "border-red-500 focus:border-red-500 focus:shadow-none" : ""}`}
									placeholder='••••••••'
								/>
							</div>
							{errors.confirmPassword && <p className='mt-1 text-sm text-red-500'>{errors.confirmPassword}</p>}
						</div>

						<button
							type='submit'
							className='btn-base btn-primary h-11 w-full'
							disabled={loading}
						>
							{loading ? (
								<>
									<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
									Đang xử lý...
								</>
							) : (
								<>
									<UserPlus className='mr-2 h-5 w-5' aria-hidden='true' />
									Đăng ký
								</>
							)}
						</button>
					</form>

					<p className='mt-8 text-center text-sm text-muted'>
						Đã có tài khoản?{" "}
						<Link to='/login' className='font-medium text-[color:var(--color-gold)] hover:text-[color:var(--color-gold-soft)]'>
							Đăng nhập ngay <ArrowRight className='inline h-4 w-4' />
						</Link>
					</p>
				</div>
			</motion.div>
		</div>
	);
};
export default SignUpPage;
