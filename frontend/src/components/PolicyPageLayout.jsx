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
		<div className="min-h-screen bg-gray-50 dark:bg-luxury-dark pt-32 pb-20">

			<div className="max-w-screen-xl mx-auto px-6">
				{/* Breadcrumbs */}
				<nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-luxury-text-muted mb-8">
					<NavLink to="/" className="hover:text-luxury-gold transition">Trang chủ</NavLink>
					<ChevronRight className="w-4 h-4" />
					<span className="text-luxury-gold font-medium">{title}</span>
				</nav>

				<div className="flex flex-col lg:flex-row gap-12">
					{/* Sidebar Navigation */}
					<aside className="w-full lg:w-80 shrink-0">
						<div className="sticky top-32 space-y-2 bg-white dark:bg-luxury-darker p-4 rounded-2xl border border-gray-100 dark:border-luxury-border shadow-sm">
							<h3 className="text-[11px] uppercase tracking-[0.24em] text-gray-500 dark:text-luxury-text-muted font-bold mb-4 px-3">Hỗ trợ nhanh</h3>
							{menuItems.map((item) => {
								const Icon = item.icon;
								const isActive = item.id === activeId || location.pathname === item.path;
								return (
									<NavLink
										key={item.id}
										to={item.path}
										className={`flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 transition-colors ${isActive
											? "bg-gray-100 dark:bg-white/5 border-luxury-gold text-gray-900 dark:text-white"
											: "border-transparent text-gray-600 dark:text-luxury-text-muted hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"}`}
									>
										<Icon className={`w-5 h-5 ${isActive ? "text-luxury-gold" : "text-gray-400"}`} />
										<span className="flex-1 text-left text-sm font-medium">{item.label}</span>
										<ChevronRight className={`w-4 h-4 transition-transform ${isActive ? "translate-x-0.5 text-luxury-gold" : "text-gray-300 dark:text-gray-600"}`} />
									</NavLink>
								);
							})}
						</div>
					</aside>

					{/* Main Content Area */}
					<main className="flex-1 bg-white dark:bg-luxury-darker p-5 md:p-8 rounded-2xl border border-gray-100 dark:border-luxury-border shadow-sm">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
						>
							<div className="mb-6 border-b border-gray-100 dark:border-luxury-border pb-4">
								<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500 dark:text-luxury-text-muted mb-2">{title}</p>
								<p className="text-sm text-gray-600 dark:text-luxury-text-muted leading-relaxed max-w-3xl">{description}</p>
							</div>
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
