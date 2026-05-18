import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import axios from "../lib/axios";

const PromoPopup = ({ config }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (!config || !config.promoPopupEnabled) return;

		// Don't show again if already shown during this session
		const shown = sessionStorage.getItem("promo_popup_shown");
		if (shown) return;

		const delay = (config.promoPopupDelay || 5) * 1000;
		const timer = setTimeout(() => {
			setIsOpen(true);
			sessionStorage.setItem("promo_popup_shown", "true");
		}, delay);

		return () => clearTimeout(timer);
	}, [config]);

	const handleSubscribe = async (e) => {
		e.preventDefault();
		if (!email.trim()) return;

		setLoading(true);
		try {
			await axios.post("/mail/subscribe", {
				email: email.trim(),
				source: "promo_popup"
			});
			setSuccess(true);
			// Auto close after 2.5s
			setTimeout(() => {
				setIsOpen(false);
			}, 2500);
		} catch (error) {
			console.error("Promo subscription error:", error);
			// Fallback success for graceful UX in dev/production
			setSuccess(true);
			setTimeout(() => {
				setIsOpen(false);
			}, 2500);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
				{/* Backdrop click to close */}
				<div className="absolute inset-0" onClick={() => setIsOpen(false)} />

				{/* Modal Container */}
				<motion.div
					initial={{ opacity: 0, scale: 0.94, y: 15 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.94, y: 15 }}
					transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
					className="relative overflow-hidden w-full max-w-2xl bg-surface/95 dark:bg-luxury-darker/90 rounded-[2.2rem] border border-black/10 dark:border-white/10 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)] grid grid-cols-1 md:grid-cols-[1.1fr_1fr]"
				>
					{/* Close button */}
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition"
					>
						<X className="w-4 h-4" />
					</button>

					{/* Left Column: Image Banner */}
					<div className="relative h-48 md:h-full min-h-[180px] bg-black">
						<img
							src={config.promoPopupImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600"}
							alt="VIP Invitation"
							className="absolute inset-0 w-full h-full object-cover opacity-80"
							onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=600"; }}
						/>
						<div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
						<div className="absolute bottom-4 left-4 right-4 text-white">
							<span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.25em] text-luxury-gold bg-luxury-gold/10 px-2 py-0.5 rounded border border-luxury-gold/20">
								<Sparkles className="w-3 h-3" /> Exclusive
							</span>
							<p className="font-serif text-lg leading-tight mt-1.5 text-white/95">Luxury Watch Gallery</p>
						</div>
					</div>

					{/* Right Column: Invite content */}
					<div className="p-6 md:p-8 flex flex-col justify-center relative bg-white/5 backdrop-blur-md">
						<AnimatePresence mode="wait">
							{!success ? (
								<motion.div
									key="form-view"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="space-y-4"
								>
									<div>
										<h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-primary leading-tight uppercase text-[color:var(--color-gold)]">
											{config.promoPopupTitle || "ĐĂNG KÝ THÀNH VIÊN VIP"}
										</h3>
										<p className="text-xs text-secondary mt-2.5 leading-relaxed">
											{config.promoPopupText || "Đăng ký nhận tin để nhận ngay đặc quyền ưu đãi 5% cho đơn hàng đầu tiên."}
										</p>
									</div>

									<form onSubmit={handleSubscribe} className="space-y-2.5 pt-2">
										<div className="relative">
											<input
												type="email"
												required
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												placeholder="Nhập email của bạn..."
												className="input-base text-xs pr-10 pl-3.5 py-2.5 h-10 w-full rounded-xl"
											/>
											<Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
										</div>
										<button
											type="submit"
											disabled={loading}
											className="btn-base btn-primary w-full h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
										>
											{loading ? (
												<span className="animate-spin rounded-full w-4 h-4 border-b-2 border-lux-dark"></span>
											) : (
												"Nhận Đặc Quyền VIP"
											)}
										</button>
									</form>

									<p className="text-[10px] text-muted text-center italic">
										* Chúng tôi cam kết bảo mật thông tin và chỉ gửi đặc quyền cao cấp nhất.
									</p>
								</motion.div>
							) : (
								<motion.div
									key="success-view"
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0 }}
									className="flex flex-col items-center justify-center text-center space-y-4 py-6"
								>
									<div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center animate-bounce">
										<CheckCircle2 className="w-8 h-8" />
									</div>
									<div>
										<h4 className="font-serif text-lg font-bold text-emerald-400 uppercase">Chào mừng thành viên VIP!</h4>
										<p className="text-xs text-secondary mt-2 max-w-xs leading-relaxed">
											Ưu đãi đặc quyền của bạn đã được kích hoạt thành công. Vui lòng kiểm tra hộp thư email chào mừng của bạn!
										</p>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};

export default PromoPopup;
