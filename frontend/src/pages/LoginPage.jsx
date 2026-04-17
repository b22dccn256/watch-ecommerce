import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, Mail, Lock, ArrowRight, Loader, ShieldCheck, RefreshCw, Facebook, Github } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [otp, setOtp] = useState("");
	const [step, setStep] = useState("login"); // "login" or "otp"
	const [otpExpiry, setOtpExpiry] = useState(300); // 5 mins in seconds
	const [resendCooldown, setResendCooldown] = useState(0);

	const { login, verifyOTP, resendOTP, loading } = useUserStore();

	// Countdown for OTP validity
	useEffect(() => {
		let timer;
		if (step === "otp" && otpExpiry > 0) {
			timer = setInterval(() => {
				setOtpExpiry((prev) => prev - 1);
			}, 1000);
		}
		return () => clearInterval(timer);
	}, [step, otpExpiry]);

	// Countdown for Resend button
	useEffect(() => {
		let timer;
		if (resendCooldown > 0) {
			timer = setInterval(() => {
				setResendCooldown((prev) => prev - 1);
			}, 1000);
		}
		return () => clearInterval(timer);
	}, [resendCooldown]);

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const handleLoginSubmit = async (e) => {
		e.preventDefault();
		try {
			const result = await login(email, password);
			if (result === "OTP_REQUIRED") {
				setStep("otp");
				setOtpExpiry(300);
				setResendCooldown(60);
			}
		} catch {
			// Error handled in store
		}
	};

	const handleVerifySubmit = async (e) => {
		e.preventDefault();
		try {
			await verifyOTP(email, otp);
		} catch {
			// Error handled in store
		}
	};

	const handleResend = async () => {
		if (resendCooldown > 0) return;
		const success = await resendOTP(email);
		if (success) {
			setResendCooldown(60);
			setOtpExpiry(300);
			setOtp("");
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
				<h2 className='hero-title mt-6 text-center text-3xl text-primary'>
					{step === "login" ? "Đăng nhập tài khoản" : "Xác thực quản trị viên (OTP)"}
				</h2>
				{step === "otp" && (
					<p className='mt-2 text-center text-sm text-secondary'>
						Mã xác thực quản trị viên đã được gửi đến email <b>{email}</b>
					</p>
				)}
			</motion.div>

			<motion.div
				className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
			>
				<div className='bg-surface py-8 px-4 shadow-xl border border-black/10 dark:border-white/10 sm:rounded-2xl sm:px-10'>
					{step === "login" ? (
						<form onSubmit={handleLoginSubmit} className='space-y-6'>
							<div>
								<label htmlFor='email' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Địa chỉ Email
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<Mail className='h-5 w-5 text-gray-400' aria-hidden='true' />
									</div>
									<input
										   id='email'
										   name='email'
										   type='email'
										   required
										   value={email}
										   onChange={(e) => setEmail(e.target.value)}
										className='input-base block w-full pl-10'
										placeholder='you@example.com'
									/>
								</div>
							</div>

							<div>
								<label htmlFor='password' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Mật khẩu
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
									</div>
									<input
										   id='password'
										   name='password'
										   type='password'
										   required
										   value={password}
										   onChange={(e) => setPassword(e.target.value)}
										className='input-base block w-full pl-10'
										placeholder='••••••••'
									/>
								</div>
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
										<LogIn className='mr-2 h-5 w-5' aria-hidden='true' />
										Đăng nhập
									</>
								)}
							</button>

							{/* Social Logins */}
							<div className="mt-6">
								<div className="relative">
									<div className="absolute inset-0 flex items-center">
										<div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
									</div>
									<div className="relative flex justify-center text-sm">
										<span className="px-2 bg-surface text-muted">Hoặc tiếp tục với</span>
									</div>
								</div>

								<div className="mt-6 grid grid-cols-3 gap-3">
									<button onClick={() => window.location.href = "/api/auth/oauth/google"} type="button" className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
										<svg className="w-5 h-5" viewBox="0 0 24 24">
											<path fill="#EA4335" d="M12.545,10.239v3.821h5.445c-0.231,1.139-1.317,3.33-5.445,3.33c-3.284,0-5.962-2.73-5.962-6.101s2.678-6.101,5.962-6.101c1.86,0,3.109,0.796,3.818,1.472l2.997-2.909c-1.782-1.636-4.085-2.617-6.816-2.617c-5.467,0-9.897,4.48-9.897,10.038s4.43,10.038,9.897,10.038c5.719,0,9.507-4.02,9.507-9.673c0-0.742-0.088-1.393-0.211-1.999H12.545z" />
											<path fill="#34A853" d="M22.052,12.038c0-0.742-0.088-1.393-0.211-1.999H12.545v3.821h5.445c-0.231,1.139-1.317,3.33-5.445,3.33c-0.908,0-1.76-0.203-2.527-0.569l-2.674,2.028v0.015c1.442,1.339,3.396,2.152,5.201,2.152C17.771,22.076,22.052,18.056,22.052,12.038z" />
											<path fill="#4A90E2" d="M12.545,8.156c1.86,0,3.109,0.796,3.818,1.472l2.997-2.909c-1.782-1.636-4.085-2.617-6.816-2.617C8.751,4.102,5.83,5.656,4.053,8.016l2.674,2.028C7.545,8.818,9.866,8.156,12.545,8.156z" />
											<path fill="#FBBC05" d="M6.726,10.044c-0.187,0.612-0.291,1.267-0.291,1.956s0.104,1.344,0.291,1.956l-2.674,2.028C3.473,14.887,3.18,13.488,3.18,12s0.293-2.887,0.871-4.148L6.726,10.044z" />
										</svg>
									</button>
									<button onClick={() => window.location.href = "/api/auth/oauth/facebook"} type="button" className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
										<Facebook className="w-5 h-5 text-blue-600" />
									</button>
									<button onClick={() => window.location.href = "/api/auth/oauth/github"} type="button" className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
										<Github className="w-5 h-5 text-gray-900 dark:text-gray-100" />
									</button>
								</div>
							</div>
						</form>
					) : (
						<form onSubmit={handleVerifySubmit} className='space-y-6'>
							<div>
								<label htmlFor='otp' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Nhập mã xác thực quản trị viên (OTP)
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<ShieldCheck className='h-5 w-5 text-gray-400' aria-hidden='true' />
									</div>
									   <input
										   id='otp'
										   name='otp'
										   type='text'
										   required
										   maxLength={6}
										   value={otp}
										   onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
										className='input-base block w-full pl-10'
										placeholder='123456'
									/>
								</div>
								<div className='mt-2 flex justify-between items-center text-xs'>
										<span className={otpExpiry > 0 ? "text-muted" : "text-red-500"}>
										{otpExpiry > 0 ? `Hết hạn sau: ${formatTime(otpExpiry)}` : "Mã đã hết hạn"}
									</span>
									<button
										type='button'
										onClick={handleResend}
										disabled={resendCooldown > 0}
											className='flex items-center text-[color:var(--color-gold)] hover:text-[color:var(--color-gold-soft)] disabled:text-gray-500 disabled:cursor-not-allowed transition-colors'
									>
										<RefreshCw className={`mr-1 h-3 w-3 ${resendCooldown > 0 ? "" : "hover:animate-spin"}`} />
											{resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại mã OTP"}
									</button>
								</div>
							</div>

							<button
								type='submit'
								className='btn-base btn-primary h-11 w-full'
								disabled={loading || otpExpiry <= 0}
							>
								{loading ? (
									<>
										<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
										Đang xác thực...
									</>
								) : (
									<>
										<ShieldCheck className='mr-2 h-5 w-5' aria-hidden='true' />
										Xác thực đăng nhập
									</>
								)}
							</button>

							<button
								type='button'
								onClick={() => setStep("login")}
								className='w-full text-center text-sm text-muted hover:text-primary transition-colors'
							>
								Quay lại đăng nhập
							</button>
						</form>
					)}

					{step === "login" && (
						<p className='mt-8 text-center text-sm text-muted'>
							Chưa có tài khoản?{" "}
							<Link to='/signup' className='font-medium text-[color:var(--color-gold)] hover:text-[color:var(--color-gold-soft)]'>
								Đăng ký ngay <ArrowRight className='inline h-4 w-4' />
							</Link>
						</p>
					)}
				</div>
			</motion.div>
		</div>
	);
};
export default LoginPage;
