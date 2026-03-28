import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader, Mail, ArrowRight, RefreshCw } from "lucide-react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";

const EmailVerificationPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { resendVerificationEmail } = useUserStore();

	const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
	const [message, setMessage] = useState("");
	const [resendLoading, setResendLoading] = useState(false);
	const [resendSent, setResendSent] = useState(false);

	// Guard against React StrictMode double-invoke (runs effect twice in dev)
	const hasCalledRef = useRef(false);

	// Try to retrieve the pending email from localStorage (set during signup)
	const pendingEmail = localStorage.getItem("pendingVerifyEmail") || "";

	useEffect(() => {
		// Prevent second call from overwriting the result of the first
		if (hasCalledRef.current) return;
		hasCalledRef.current = true;

		const token = searchParams.get("token");
		if (!token) {
			setStatus("error");
			setMessage("Đường link xác minh không hợp lệ. Vui lòng kiểm tra lại email của bạn.");
			return;
		}

		const verify = async () => {
			try {
				const res = await axios.get(`/auth/verify-email?token=${token}`);
				setStatus("success");
				setMessage(res.data.message || "Tài khoản đã được xác minh thành công!");
				// Clear stored email after successful verification
				localStorage.removeItem("pendingVerifyEmail");
			} catch (error) {
				setStatus("error");
				setMessage(
					error.response?.data?.message ||
					"Link xác minh không hợp lệ hoặc đã hết hạn."
				);
			}
		};

		verify();
	}, [searchParams]);

	const handleResend = async () => {
		if (!pendingEmail) {
			toast.error("Không tìm thấy địa chỉ email. Vui lòng quay lại trang đăng ký.");
			return;
		}
		setResendLoading(true);
		const success = await resendVerificationEmail(pendingEmail);
		setResendLoading(false);
		if (success) setResendSent(true);
	};

	return (
		<div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-10 max-w-md w-full text-center"
			>
				{/* ── Loading ─────────────────────────────────────────────────── */}
				{status === "loading" && (
					<>
						<div className="flex justify-center mb-6">
							<div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
								<Loader className="h-10 w-10 text-emerald-400 animate-spin" />
							</div>
						</div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
							Đang xác minh...
						</h2>
						<p className="text-gray-500 dark:text-gray-400 text-sm">
							Vui lòng chờ trong giây lát
						</p>
					</>
				)}

				{/* ── Success ─────────────────────────────────────────────────── */}
				{status === "success" && (
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ type: "spring", stiffness: 180 }}
					>
						<div className="flex justify-center mb-6">
							<div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
								<CheckCircle className="h-12 w-12 text-emerald-500" />
							</div>
						</div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
							Xác minh thành công! 🎉
						</h2>
						<p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
							{message}
						</p>
						<button
							onClick={() => navigate("/login")}
							className="w-full flex justify-center items-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors duration-200"
						>
							Đăng nhập ngay <ArrowRight className="h-4 w-4" />
						</button>
					</motion.div>
				)}

				{/* ── Error ───────────────────────────────────────────────────── */}
				{status === "error" && (
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ type: "spring", stiffness: 180 }}
					>
						<div className="flex justify-center mb-6">
							<div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
								<XCircle className="h-12 w-12 text-red-500" />
							</div>
						</div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
							Xác minh thất bại
						</h2>
						<p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
							{message}
						</p>

						{resendSent ? (
							<div className="flex items-center justify-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm mb-4">
								<Mail className="h-4 w-4 flex-shrink-0" />
								<span>Email xác minh mới đã được gửi! Vui lòng kiểm tra hộp thư.</span>
							</div>
						) : (
							<button
								onClick={handleResend}
								disabled={resendLoading || !pendingEmail}
								className="w-full flex justify-center items-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors duration-200 mb-3"
							>
								{resendLoading ? (
									<><Loader className="h-4 w-4 animate-spin" /> Đang gửi...</>
								) : (
									<><RefreshCw className="h-4 w-4" /> Gửi lại email xác minh</>
								)}
							</button>
						)}

						<Link
							to="/signup"
							className="block text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-400 transition-colors mt-2"
						>
							← Quay lại đăng ký
						</Link>
					</motion.div>
				)}
			</motion.div>
		</div>
	);
};

export default EmailVerificationPage;
