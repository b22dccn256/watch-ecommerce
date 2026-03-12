import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, Mail, Lock, ArrowRight, Loader, ShieldCheck, RefreshCw } from "lucide-react";
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
				<h2 className='mt-6 text-center text-3xl font-extrabold text-emerald-400'>
					{step === "login" ? "Đăng nhập tài khoản" : "Xác thực 2-Lớp (2FA)"}
				</h2>
				{step === "otp" && (
					<p className='mt-2 text-center text-sm text-gray-400'>
						Mã xác thực đã được gửi đến email <b>{email}</b>
					</p>
				)}
			</motion.div>

			<motion.div
				className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
			>
				<div className='bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10'>
					{step === "login" ? (
						<form onSubmit={handleLoginSubmit} className='space-y-6'>
							<div>
								<label htmlFor='email' className='block text-sm font-medium text-gray-300'>
									Địa chỉ Email
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<Mail className='h-5 w-5 text-gray-400' aria-hidden='true' />
									</div>
									<input
										id='email'
										type='email'
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className=' block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 
									rounded-md shadow-sm
									 placeholder-gray-400 focus:outline-none focus:ring-emerald-500 
									 focus:border-emerald-500 sm:text-sm'
										placeholder='you@example.com'
									/>
								</div>
							</div>

							<div>
								<label htmlFor='password' className='block text-sm font-medium text-gray-300'>
									Mật khẩu
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
									</div>
									<input
										id='password'
										type='password'
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className=' block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 
									rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm'
										placeholder='••••••••'
									/>
								</div>
							</div>

							<button
								type='submit'
								className='w-full flex justify-center py-2 px-4 border border-transparent 
							rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600
							 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2
							  focus:ring-emerald-500 transition duration-150 ease-in-out disabled:opacity-50'
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
						</form>
					) : (
						<form onSubmit={handleVerifySubmit} className='space-y-6'>
							<div>
								<label htmlFor='otp' className='block text-sm font-medium text-gray-300'>
									Nhập mã xác thực (OTP)
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<ShieldCheck className='h-5 w-5 text-gray-400' aria-hidden='true' />
									</div>
									<input
										id='otp'
										type='text'
										required
										maxLength={6}
										value={otp}
										onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
										className=' block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 
									rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm'
										placeholder='123456'
									/>
								</div>
								<div className='mt-2 flex justify-between items-center text-xs'>
									<span className={otpExpiry > 0 ? "text-gray-400" : "text-red-400"}>
										{otpExpiry > 0 ? `Hết hạn sau: ${formatTime(otpExpiry)}` : "Mã đã hết hạn"}
									</span>
									<button
										type='button'
										onClick={handleResend}
										disabled={resendCooldown > 0}
										className='flex items-center text-emerald-400 hover:text-emerald-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors'
									>
										<RefreshCw className={`mr-1 h-3 w-3 ${resendCooldown > 0 ? "" : "hover:animate-spin"}`} />
										{resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại mã"}
									</button>
								</div>
							</div>

							<button
								type='submit'
								className='w-full flex justify-center py-2 px-4 border border-transparent 
							rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600
							 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2
							  focus:ring-emerald-500 transition duration-150 ease-in-out disabled:opacity-50'
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
								className='w-full text-center text-sm text-gray-400 hover:text-white transition-colors'
							>
								Quay lại đăng nhập
							</button>
						</form>
					)}

					{step === "login" && (
						<p className='mt-8 text-center text-sm text-gray-400'>
							Chưa có tài khoản?{" "}
							<Link to='/signup' className='font-medium text-emerald-400 hover:text-emerald-300'>
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
