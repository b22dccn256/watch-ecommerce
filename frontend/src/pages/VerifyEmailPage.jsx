import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Loader, Mail, RefreshCw, ArrowRight, ShieldCheck } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";

const VerifyEmailPage = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const params = useParams();
	const verifyAttemptedRef = useRef(false); // Prevent double verification in StrictMode

	const [status, setStatus] = useState("loading"); // loading | success | error | no_token | email_sent | already_verified
	const [message, setMessage] = useState("Đang xác minh tài khoản của bạn...");
	const [resendLoading, setResendLoading] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);
	const [redirectCountdown, setRedirectCountdown] = useState(5);

	const pendingEmail = localStorage.getItem("pendingVerifyEmail") || "";

	// ── Verify token on mount ──
	useEffect(() => {
		// Prevent double verification due to StrictMode in development
		if (verifyAttemptedRef.current) return;

		const queryParams = new URLSearchParams(location.search);
		const token = params.token || queryParams.get("token");

		if (!token) {
			verifyAttemptedRef.current = true;
			if (pendingEmail) {
				// After signup — email was already sent, user just needs to check inbox
				setStatus("email_sent");
				setMessage(`Chúng tôi đã gửi email xác minh đến ${pendingEmail}. Vui lòng kiểm tra hộp thư đến (bao gồm cả thư mục Spam) và nhấn vào liên kết xác minh để kích hoạt tài khoản.`);
			} else {
				setStatus("no_token");
				setMessage("Vui lòng kiểm tra email để tìm liên kết xác minh tài khoản.");
			}
			return;
		}

		verifyAttemptedRef.current = true;
		axios.post("/auth/verify-email", { token })
			.then(async (res) => {
				if (res.data?.alreadyVerified) {
					setStatus("already_verified");
					setMessage("Tài khoản của bạn đã được xác minh trước đó.");
				} else {
					setStatus("success");
					setMessage(res.data.message || "Tài khoản đã được xác minh thành công.");
					localStorage.removeItem("pendingVerifyEmail");
					toast.success("Xác minh tài khoản thành công!");
				}
				await useUserStore.getState().checkAuth();
			})
			.catch((error) => {
				setStatus("error");
				const errMsg = error?.response?.data?.message || "Không thể xác minh tài khoản. Liên kết có thể đã hết hạn.";
				setMessage(errMsg);
				toast.error(errMsg);
			});
	}, [location.search, params.token]);

	// ── Redirect countdown on success ──
	useEffect(() => {
		if (status !== "success") return;
		const timer = setInterval(() => {
			setRedirectCountdown((p) => {
				if (p <= 1) { navigate("/"); return 0; }
				return p - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [status, navigate]);

	// ── Resend cooldown ──
	useEffect(() => {
		if (resendCooldown <= 0) return;
		const timer = setInterval(() => setResendCooldown((p) => p - 1), 1000);
		return () => clearInterval(timer);
	}, [resendCooldown]);

	const handleResend = useCallback(async () => {
		if (resendLoading || resendCooldown > 0) return;
		if (!pendingEmail && !useUserStore.getState().user?.email) {
			toast.error("Không tìm thấy địa chỉ email để gửi lại");
			return;
		}
		const emailToUse = pendingEmail || useUserStore.getState().user?.email;
		setResendLoading(true);
		try {
			const res = await axios.post("/auth/resend-verification", { email: emailToUse });
			toast.success(res.data.message || "Đã gửi lại email xác minh");
			setResendCooldown(60);
		} catch (err) {
			toast.error(err?.response?.data?.message || "Không thể gửi lại email xác minh");
		} finally {
			setResendLoading(false);
		}
	}, [pendingEmail, resendLoading, resendCooldown]);

	// ── Status icon ──
	const StatusIcon = status === "success" || status === "already_verified" ? CheckCircle
		: status === "error" ? XCircle
		: status === "loading" ? Loader
		: status === "email_sent" ? Mail
		: Mail;

	const statusColor = status === "success" || status === "already_verified" ? "text-green-600 dark:text-green-400"
		: status === "error" ? "text-red-500 dark:text-red-400"
		: "text-amber-500 dark:text-amber-400";

	return (
		<div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-20">
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="w-full max-w-md"
			>
				<div className="rounded-2xl border border-black/6 bg-surface p-6 sm:p-8 dark:border-white/6 text-center">
					{/* Icon */}
					<div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${
						status === "success" || status === "already_verified"
							? "border-green-500/20 bg-green-500/8"
							: status === "error"
							? "border-red-500/20 bg-red-500/8"
							: "border-amber-500/20 bg-amber-500/8"
					}`}>
						<StatusIcon className={`h-6 w-6 ${status === "loading" ? "animate-spin" : ""} ${statusColor}`} />
					</div>

					{/* Title */}
					<h1 className="font-display text-xl font-semibold text-primary mb-2">
						{status === "loading" && "Đang xác minh tài khoản"}
						{status === "success" && "Xác minh thành công"}
						{status === "already_verified" && "Đã xác minh"}
						{status === "error" && "Xác minh thất bại"}
						{status === "no_token" && "Cần xác minh tài khoản"}
						{status === "email_sent" && "Email xác minh đã được gửi"}
					</h1>

					{/* Message */}
					<p className="text-sm text-secondary leading-relaxed mb-6">{message}</p>

					{/* Actions */}
					<AnimatePresence mode="wait">
						{status === "loading" && (
							<motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
								<div className="flex items-center justify-center gap-2 text-sm text-muted">
									<Loader className="h-4 w-4 animate-spin" />
									Đang xử lý, vui lòng chờ...
								</div>
							</motion.div>
						)}

						{status === "success" && (
							<motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
								<button className="btn-base btn-primary h-10 w-full text-sm" onClick={() => navigate("/")}>
									Trở về trang chủ
									<ArrowRight className="h-4 w-4" />
								</button>
								<p className="text-[11px] text-muted">Tự động chuyển hướng sau {redirectCountdown}s</p>
							</motion.div>
						)}

						{status === "already_verified" && (
							<motion.div key="verified" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
								<button className="btn-base btn-primary h-10 w-full text-sm" onClick={() => navigate("/")}>
									Trở về trang chủ
									<ArrowRight className="h-4 w-4" />
								</button>
							</motion.div>
						)}

						{(status === "error" || status === "no_token" || status === "email_sent") && (
							<motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
								<button
									className="btn-base btn-primary h-10 w-full text-sm"
									onClick={handleResend}
									disabled={resendLoading || resendCooldown > 0}
								>
									{resendLoading ? (
										<><Loader className="h-4 w-4 animate-spin" /> Đang gửi...</>
									) : resendCooldown > 0 ? (
										<><RefreshCw className="h-4 w-4" /> Gửi lại sau {resendCooldown}s</>
									) : (
										<><Mail className="h-4 w-4" /> Gửi lại email xác minh</>
									)}
								</button>
								<Link to="/login" className="btn-base btn-outline h-10 w-full text-sm">
									Quay lại đăng nhập
								</Link>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Trust reassurance */}
					<div className="mt-6 pt-5 border-t border-black/6 dark:border-white/6">
						<div className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
							<ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-gold)]" />
							Liên kết xác minh có hiệu lực 15 phút
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default VerifyEmailPage;
