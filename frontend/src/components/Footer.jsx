import { useState } from "react";
import { Link } from "react-router-dom";
import {
	Facebook, Instagram, Youtube, Mail, Phone, MapPin,
	Clock, Twitter, CheckCircle, CreditCard, Wallet,
	ShieldCheck, Truck, ArrowRight, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

// --- Sub-components for better maintainability ---

const FooterColumn = ({ title, children }) => (
	<div className="flex flex-col gap-4">
		<h3 className="text-gray-900 dark:text-luxury-text-light font-bold text-lg tracking-wide">
			{title}
		</h3>
		{children}
	</div>
);

const FooterLink = ({ to, children }) => (
	<li>
		<Link
			to={to}
			className="text-gray-600 dark:text-luxury-text-muted hover:text-luxury-gold transition-colors duration-300 text-sm flex items-center gap-2 group"
		>
			<span className="w-1.5 h-1.5 rounded-full bg-luxury-gold scale-0 group-hover:scale-100 transition-transform duration-300" />
			{children}
		</Link>
	</li>
);

const SocialIcon = ({ Icon, href, label }) => (
	<motion.a
		href={href}
		aria-label={label}
		target="_blank"
		rel="noopener noreferrer"
		whileHover={{ scale: 1.1, translateY: -2 }}
		whileTap={{ scale: 0.9 }}
		className="w-10 h-10 rounded-full bg-gray-100 dark:bg-luxury-darker flex items-center justify-center text-gray-600 dark:text-luxury-text-muted hover:text-white hover:bg-luxury-gold transition-all duration-300 border border-gray-200 dark:border-luxury-border"
	>
		<Icon size={18} />
	</motion.a>
);

const TrustBadge = ({ Icon, text }) => (
	<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border">
		<Icon size={14} className="text-luxury-gold" />
		<span className="text-[10px] md:text-xs font-medium text-gray-700 dark:text-luxury-text-light uppercase tracking-tighter">
			{text}
		</span>
	</div>
);

const Footer = () => {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubscribe = async (e) => {
		e.preventDefault();
		if (!email) return toast.error("Vui lòng nhập email của bạn.");

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) return toast.error("Email không đúng định dạng.");

		setIsLoading(true);
		try {
			// Mock API call
			await new Promise(resolve => setTimeout(resolve, 1500));
			toast.success("Đăng ký thành công! Vui lòng kiểm tra email.");
			setEmail("");
		} catch (error) {
			toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
		} finally {
			setIsLoading(false);
		}
	};

	const containerVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.6, staggerChildren: 0.1 }
		}
	};

	return (
		<footer className="bg-white dark:bg-luxury-dark border-t border-gray-200 dark:border-luxury-border font-sans">
			{/* Top Bar: Highlight Features */}
			<div className="border-b border-gray-100 dark:border-luxury-border">
				<div className="max-w-screen-2xl mx-auto px-6 py-4 flex flex-wrap justify-center md:justify-between items-center gap-4">
					<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-luxury-text-muted">
						<Truck size={18} className="text-luxury-gold" />
						<span>Giao hàng miễn phí cho đơn hàng từ 2.000.000đ</span>
					</div>
					<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-luxury-text-muted">
						<ShieldCheck size={18} className="text-luxury-gold" />
						<span>Thanh toán bảo mật 100%</span>
					</div>
				</div>
			</div>

			<motion.div
				className="max-w-screen-2xl mx-auto px-6 py-16"
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true }}
				variants={containerVariants}
			>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
					{/* Brand Column */}
					<div className="flex flex-col gap-6">
						<div className="flex items-center gap-2">
							<span className="text-2xl font-bold tracking-luxury text-luxury-gold">LUXURY</span>
							<span className="text-2xl font-bold tracking-luxury text-black dark:text-white">WATCH</span>
						</div>
						<p className="text-gray-600 dark:text-luxury-text-muted text-sm leading-relaxed max-w-xs">
							Nơi hội tụ những tuyệt tác đồng hồ từ các thương hiệu hàng đầu thế giới.
							Đẳng cấp, tinh tế và bền bỉ theo thời gian.
						</p>
						<div className="flex flex-wrap gap-2">
							<TrustBadge Icon={CheckCircle} text="Chính hãng 100%" />
							<TrustBadge Icon={ShieldCheck} text="Bảo hành 2 năm" />
						</div>
						<div className="flex gap-3 mt-2">
							<SocialIcon Icon={Facebook} href="https://www.facebook.com/HocvienPTIT" label="Facebook" />
							<SocialIcon Icon={Instagram} href="https://www.instagram.com/gdgoc.ptit//" label="Instagram" />
							<SocialIcon Icon={Twitter} href="https://x.com/elonmusk" label="X" />
							<SocialIcon Icon={Youtube} href="https://www.youtube.com/@dhcstech" label="Youtube" />
						</div>
					</div>

					{/* Categories */}
					<FooterColumn title="Danh mục">
						<ul className="flex flex-col gap-3">
							<FooterLink to="/category/men">Đồng hồ nam</FooterLink>
							<FooterLink to="/category/women">Đồng hồ nữ</FooterLink>
							<FooterLink to="/category/luxury">Đồng hồ luxury</FooterLink>
							<FooterLink to="/category/sport">Đồng hồ thể thao</FooterLink>
							<FooterLink to="/brands">Thương hiệu</FooterLink>
						</ul>
					</FooterColumn>

					{/* Customer Support */}
					<FooterColumn title="Hỗ trợ khách hàng">
						<ul className="flex flex-col gap-3">
							<FooterLink to="/about">Về chúng tôi</FooterLink>
							<FooterLink to="/shipping">Chính sách giao hàng</FooterLink>
							<FooterLink to="/returns">Đổi trả & Bảo hành</FooterLink>
							<FooterLink to="/size-guide">Hướng dẫn chọn size</FooterLink>
							<FooterLink to="/contact">Liên hệ</FooterLink>
						</ul>
					</FooterColumn>

					{/* Contact & Newsletter */}
					<div className="flex flex-col gap-8">
						<FooterColumn title="Liên hệ">
							<div className="flex flex-col gap-3">
								<div className="flex items-start gap-3 group">
									<MapPin size={18} className="text-luxury-gold shrink-0 group-hover:scale-110 transition-transform" />
									<span className="text-sm text-gray-600 dark:text-luxury-text-muted">123 Đường ABC, Quận 1, TP.HCM</span>
								</div>
								<div className="flex items-center gap-3 group">
									<Phone size={18} className="text-luxury-gold shrink-0 group-hover:scale-110 transition-transform" />
									<span className="text-sm text-gray-600 dark:text-luxury-text-muted">1900 XXX XXX</span>
								</div>
								<div className="flex items-center gap-3 group">
									<Mail size={18} className="text-luxury-gold shrink-0 group-hover:scale-110 transition-transform" />
									<span className="text-sm text-gray-600 dark:text-luxury-text-muted">info@luxurywatch.vn</span>
								</div>
								<div className="flex items-start gap-3 group">
									<Clock size={18} className="text-luxury-gold shrink-0 group-hover:scale-110 transition-transform mt-0.5" />
									<div className="text-sm text-gray-600 dark:text-luxury-text-muted leading-snug">
										<p>Thứ 2 - Thứ 7: 9:00 - 21:00</p>
										<p>Chủ nhật: 10:00 - 20:00</p>
									</div>
								</div>
							</div>
						</FooterColumn>

						<div className="flex flex-col gap-4">
							<h4 className="text-gray-900 dark:text-luxury-text-light font-bold text-sm uppercase tracking-wider">
								Nhận ưu đãi
							</h4>
							<form onSubmit={handleSubscribe} className="relative">
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Email của bạn..."
									disabled={isLoading}
									className="w-full bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border text-gray-900 dark:text-luxury-text-light placeholder-gray-400 dark:placeholder-luxury-text-muted px-6 py-3 rounded-full text-sm focus:ring-2 focus:ring-luxury-gold outline-none transition-all duration-300 disabled:opacity-50"
								/>
								<button
									type="submit"
									disabled={isLoading}
									className="absolute right-1.5 top-1.5 bottom-1.5 bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark px-5 rounded-full transition-all duration-300 flex items-center justify-center disabled:opacity-50 group shadow-lg shadow-luxury-gold/20"
									aria-label="Đăng ký nhận tin"
								>
									{isLoading ? (
										<Loader2 size={18} className="animate-spin" />
									) : (
										<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
									)}
								</button>
							</form>
							<p className="text-[11px] text-gray-400 dark:text-luxury-text-muted italic px-2">
								* Không spam, hủy bất cứ lúc nào.
							</p>
						</div>
					</div>
				</div>

				{/* Footer Bottom */}
				<div className="mt-16 pt-8 border-t border-gray-100 dark:border-luxury-border flex flex-col md:flex-row justify-between items-center gap-6">
					<div className="flex flex-col items-center md:items-start gap-2">
						<p className="text-sm text-gray-500 dark:text-luxury-text-muted">
							© 2026 <span className="text-luxury-gold font-semibold">Luxury Watch</span>. Tất cả quyền được bảo lưu.
						</p>
						<div className="flex gap-4 text-[12px] md:text-xs">
							<Link to="/privacy" className="text-gray-400 hover:text-luxury-gold transition-colors">Chính sách bảo mật</Link>
							<span className="text-gray-300 dark:text-luxury-border">|</span>
							<Link to="/terms" className="text-gray-400 hover:text-luxury-gold transition-colors">Điều khoản sử dụng</Link>
						</div>
					</div>

					<div className="flex flex-col items-center md:items-end gap-3">
						<div className="flex items-center gap-4 text-gray-400 dark:text-luxury-text-muted">
							<CreditCard size={24} title="Visa/Mastercard" />
							<Wallet size={24} title="COD" />
							<ShieldCheck size={24} title="Secure Payment" />
						</div>
						<p className="text-[10px] text-gray-400 dark:text-luxury-text-muted uppercase tracking-widest font-medium">
							Verified Security
						</p>
					</div>
				</div>
			</motion.div>
		</footer>
	);
};

export default Footer;