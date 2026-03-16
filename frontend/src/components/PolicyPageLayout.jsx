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
						<div className="sticky top-32 space-y-2 bg-white dark:bg-luxury-darker p-6 rounded-2xl border border-gray-100 dark:border-luxury-border shadow-sm">
							<h3 className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold mb-6 px-4">Trung tâm hỗ trợ</h3>
							{menuItems.map((item) => {
								const Icon = item.icon;
								const isActive = item.id === activeId || location.pathname === item.path;
								return (
									<NavLink
										key={item.id}
										to={item.path}
										className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
											isActive 
											? "bg-luxury-gold text-luxury-dark shadow-luxury-gold/20 shadow-lg" 
											: "text-gray-600 dark:text-luxury-text-muted hover:bg-gray-100 dark:hover:bg-white/5 hover:text-luxury-gold"
										}`}
									>
										<Icon className={`w-5 h-5 ${isActive ? "text-luxury-dark" : "text-luxury-gold"}`} />
										{item.label}
									</NavLink>
								);
							})}
						</div>
					</aside>

					{/* Main Content Area */}
					<main className="flex-1 bg-white dark:bg-luxury-darker p-8 md:p-12 rounded-3xl border border-gray-100 dark:border-luxury-border shadow-sm">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
						>
							<h1 className="text-3xl md:text-4xl font-bold mb-8 text-black dark:text-white tracking-luxury">
								{title}
							</h1>
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
