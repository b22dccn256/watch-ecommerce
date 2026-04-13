import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Truck, ShieldCheck, Ruler, Mail, Lock, FileText, Search } from "lucide-react";
import { useEffect } from "react";

const PolicyPageLayout = ({ children, title, description, activeId }) => {
	const location = useLocation();

	useEffect(() => {
		document.title = `${title} | Luxury Watch Store`;
	}, [title]);

	const menuItems = [
		{ id: "delivery", label: "Chính sách giao hàng", icon: Truck, path: "/delivery-policy" },
		{ id: "warranty", label: "Đổi trả & Bảo hành", icon: ShieldCheck, path: "/warranty" },
		{ id: "size-guide", label: "Hướng dẫn chọn size", icon: Ruler, path: "/size-guide" },
		{ id: "order-lookup", label: "Tra cứu đơn hàng", icon: Search, path: "/order-lookup" },
		{ id: "contact", label: "Liên hệ chúng tôi", icon: Mail, path: "/contact" },
		{ id: "privacy", label: "Chính sách bảo mật", icon: Lock, path: "/privacy-policy" },
		{ id: "terms", label: "Điều khoản sử dụng", icon: FileText, path: "/terms" },
	];

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f8f5f0_0%,#ffffff_16%,#ffffff_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.08)_0%,rgba(15,12,8,1)_45%,rgba(10,10,10,1)_100%)] pt-28 pb-20">

			<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Breadcrumbs */}
				<nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-luxury-text-muted mb-8">
					<NavLink to="/" className="hover:text-luxury-gold transition">Trang chủ</NavLink>
					<ChevronRight className="w-4 h-4" />
					<span className="text-luxury-gold font-medium">{title}</span>
				</nav>

				<div className="mb-10 rounded-[2rem] editorial-surface px-6 py-6 md:px-8 md:py-8 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.35)]">
					<p className="hero-kicker text-xs font-semibold text-luxury-gold mb-3">Support / policy hub</p>
					<h1 className="hero-title text-3xl md:text-5xl text-gray-900 dark:text-white mb-3">{title}</h1>
					<p className="max-w-3xl text-sm md:text-base text-gray-600 dark:text-luxury-text-muted leading-relaxed">{description}</p>
				</div>

				<div className="flex flex-col lg:flex-row gap-12">
					{/* Sidebar Navigation */}
					<aside className="w-full lg:w-80 shrink-0">
						<div className="sticky top-28 space-y-4 rounded-[2rem] border border-black/5 dark:border-luxury-border bg-white/90 dark:bg-luxury-darker/90 p-4 shadow-[0_24px_80px_-45px_rgba(0,0,0,0.35)] backdrop-blur-md">
							<h3 className="text-[11px] uppercase tracking-[0.24em] text-gray-500 dark:text-luxury-text-muted font-bold mb-4 px-3">Hỗ trợ nhanh</h3>
							{menuItems.map((item) => {
								const Icon = item.icon;
								const isActive = item.id === activeId || location.pathname === item.path;
								return (
									<NavLink
										key={item.id}
										to={item.path}
										className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors ${isActive
											? "bg-luxury-gold/10 dark:bg-white/5 border-luxury-gold text-gray-900 dark:text-white"
											: "border-transparent text-gray-600 dark:text-luxury-text-muted hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"}`}
									>
										<Icon className={`w-5 h-5 ${isActive ? "text-luxury-gold" : "text-gray-400"}`} />
										<span className="flex-1 text-left text-sm font-medium">{item.label}</span>
										<ChevronRight className={`w-4 h-4 transition-transform ${isActive ? "translate-x-0.5 text-luxury-gold" : "text-gray-300 dark:text-gray-600"}`} />
									</NavLink>
								);
							})}

							<div className="rounded-[1.5rem] border border-black/5 dark:border-white/5 bg-gradient-to-br from-[#f8f5ef] to-white dark:from-white/5 dark:to-white/0 p-4">
								<p className="text-[10px] uppercase tracking-[0.24em] text-gray-500 dark:text-luxury-text-muted font-bold mb-3">Thông tin nhanh</p>
								<div className="space-y-3 text-sm text-gray-600 dark:text-luxury-text-muted">
									<div className="flex items-start justify-between gap-3">
										<span className="font-medium text-gray-900 dark:text-white">Hotline</span>
										<span className="text-right">1900 6789</span>
									</div>
									<div className="flex items-start justify-between gap-3">
										<span className="font-medium text-gray-900 dark:text-white">Email</span>
										<span className="text-right break-all">contact@luxurywatch.vn</span>
									</div>
									<div className="flex items-start justify-between gap-3">
										<span className="font-medium text-gray-900 dark:text-white">Phản hồi</span>
										<span className="text-right">Trong 24h làm việc</span>
									</div>
								</div>
							</div>
						</div>
					</aside>

					{/* Main Content Area */}
					<main className="flex-1 rounded-[2rem] border border-black/5 dark:border-luxury-border bg-white/95 dark:bg-luxury-darker/95 p-5 md:p-8 shadow-[0_24px_80px_-45px_rgba(0,0,0,0.35)] backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
						>
							<div className="prose prose-luxury dark:prose-invert max-w-none">
								{children}
							</div>
						</motion.div>
					</main>
				</div>
			</div>
		</div>
	);
};

export default PolicyPageLayout;
