import { Link, NavLink, useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useProductStore } from "../stores/useProductStore";
import { useThemeStore } from "../stores/useThemeStore";
import { useState } from "react";
import { ShoppingCart, User, LogOut, Lock, Search, Heart, Menu, X as CloseIcon } from "lucide-react";

const Navbar = () => {
	const { user, logout } = useUserStore();
	const { cart } = useCartStore();
	const { wishlist } = useWishlistStore();
	const { searchProducts } = useProductStore(); // sẽ dùng sau
	const { theme, toggleTheme } = useThemeStore();

	const [searchTerm, setSearchTerm] = useState("");
	const [isContactModalOpen, setIsContactModalOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const isAdmin = user?.role === "admin";

	const navigate = useNavigate();

	const handleSearch = (e) => {
		setSearchTerm(e.target.value);
	};

	const handleKeyDown = (e) => {
		if (e.key === 'Enter' && searchTerm.trim()) {
			navigate(`/catalog?q=${encodeURIComponent(searchTerm.trim())}`);
		}
	};

	const executeSearch = () => {
		if (searchTerm.trim()) {
			navigate(`/catalog?q=${encodeURIComponent(searchTerm.trim())}`);
			setIsMobileMenuOpen(false);
		}
	};

	const closeMobileMenu = () => setIsMobileMenuOpen(false);

	return (
		<>
			<header className="fixed top-0 left-0 w-full bg-white/98 dark:bg-luxury-dark/98 backdrop-blur-md border-b border-gray-200 dark:border-luxury-border z-50">
				<div className="max-w-screen-2xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						{/* LOGO */}
						<Link to="/" className="flex items-center gap-2">
							<span className="text-3xl font-bold tracking-luxury text-luxury-gold">LUXURY</span>
							<span className="text-3xl font-bold tracking-luxury text-black dark:text-white">WATCH</span>
						</Link>

						{/* MENU CHÍNH */}
						<nav className="hidden md:flex items-center gap-10 text-sm font-medium">
							<NavLink
								to="/"
								className={({ isActive }) =>
									`transition duration-300 ${isActive ? 'text-luxury-gold' : 'text-luxury-text-muted hover:text-luxury-gold'}`
								}
							>
								Trang Chủ
							</NavLink>

							{/* Dropdown Đồng Hồ */}
							<div className="relative group h-full flex items-center cursor-pointer">
								<NavLink
									to="/catalog?reset=true"
									className={({ isActive }) =>
										`transition duration-300 flex items-center gap-1 py-4 ${isActive ? 'text-luxury-gold' : 'text-gray-500 dark:text-luxury-text-muted hover:text-luxury-gold'}`
									}
								>
									Đồng Hồ
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
								</NavLink>

								{/* Mega Menu thả xuống */}
								<div className="absolute top-[80%] left-0 w-[500px] bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-gray-200 dark:border-white/5 p-6 grid grid-cols-2 gap-8 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 rounded-xl transform translate-y-2 group-hover:translate-y-0">
									{/* Cột 1: Thương Hiệu */}
									<div>
										<h3 className="text-[#D4AF37] uppercase text-xs tracking-widest mb-4 font-bold border-b border-[#D4AF37]/20 pb-2">Thương Hiệu Nổi Bật</h3>
										<ul className="space-y-3">
											<li><NavLink to="/catalog?brand=Rolex" className="text-gray-600 dark:text-gray-300 hover:text-[#D4AF37] transition-colors text-sm block">Rolex Heritage</NavLink></li>
											<li><NavLink to="/catalog?brand=Omega" className="text-gray-600 dark:text-gray-300 hover:text-[#D4AF37] transition-colors text-sm block">Omega Seamaster</NavLink></li>
											<li><NavLink to="/catalog?brand=Patek+Philippe" className="text-gray-600 dark:text-gray-300 hover:text-[#D4AF37] transition-colors text-sm block">Patek Philippe Classic</NavLink></li>
											<li><NavLink to="/catalog?brand=Hublot" className="text-gray-600 dark:text-gray-300 hover:text-[#D4AF37] transition-colors text-sm block">Hublot Big Bang</NavLink></li>
											<li><NavLink to="/catalog?brand=Tag+Heuer" className="text-gray-600 dark:text-gray-300 hover:text-[#D4AF37] transition-colors text-sm block">Tag Heuer Carrera</NavLink></li>
										</ul>
									</div>

									{/* Cột 2: Bộ Máy */}
									<div>
										<h3 className="text-[#D4AF37] uppercase text-xs tracking-widest mb-4 font-bold border-b border-[#D4AF37]/20 pb-2">Cỗ Máy Thời Gian</h3>
										<ul className="space-y-3">
											<li><NavLink to="/catalog?machineType=automatic" className="text-gray-600 dark:text-gray-300 hover:text-[#D4AF37] transition-colors text-sm block">Cơ Tự Động (Automatic)</NavLink></li>
											<li><NavLink to="/catalog?machineType=mechanical" className="text-gray-600 dark:text-gray-300 hover:text-[#D4AF37] transition-colors text-sm block">Cơ Lên Cót (Mechanical)</NavLink></li>
											<li><NavLink to="/catalog?machineType=quartz" className="text-gray-600 dark:text-gray-300 hover:text-[#D4AF37] transition-colors text-sm block">Bộ máy Pin (Quartz)</NavLink></li>
											<li><NavLink to="/catalog?machineType=digital" className="text-gray-600 dark:text-gray-300 hover:text-[#D4AF37] transition-colors text-sm block">Siêu Bền Điện Tử (Digital)</NavLink></li>
											<li><NavLink to="/catalog?machineType=smartwatch" className="text-gray-600 dark:text-gray-300 hover:text-[#D4AF37] transition-colors text-sm block">Đồng Hồ Thông Minh</NavLink></li>
										</ul>
									</div>
								</div>
							</div>

							<NavLink
								to="/about"
								className={({ isActive }) =>
									`transition duration-300 ${isActive ? 'text-luxury-gold' : 'text-gray-500 dark:text-luxury-text-muted hover:text-luxury-gold'}`
								}
							>
								Giới Thiệu
							</NavLink>

							<button
								onClick={() => setIsContactModalOpen(true)}
								className="text-luxury-gold font-semibold hover:text-luxury-gold-light transition duration-300 flex items-center gap-1"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
								Hotline
							</button>
						</nav>

						{/* SEARCH + CART + USER */}
						<div className="flex items-center gap-6">
							{/* Thanh tìm kiếm */}
							<div className="relative w-80 hidden lg:block">
								<input
									type="text"
									value={searchTerm}
									onChange={handleSearch}
									onKeyDown={handleKeyDown}
									placeholder="Tìm kiếm đồng hồ..."
									className="w-full bg-gray-100 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border focus:border-luxury-gold text-black dark:text-white pl-5 pr-12 py-3 rounded-full text-sm placeholder-gray-400 dark:placeholder-luxury-text-muted focus:outline-none transition duration-300"
								/>
								<button onClick={executeSearch} className="absolute right-5 top-1/2 -translate-y-1/2 text-luxury-gold">
									<Search className="w-5 h-5" />
								</button>
							</div>

							{/* Actions (Wishlist/Cart) */}
							<div className="flex items-center gap-2">
								<Link
									to={"/wishlist"}
									className='relative group p-2 text-gray-700 dark:text-luxury-text-light hover:text-luxury-gold transition-colors'
								>
									<Heart className='w-5 h-5 group-hover:scale-110 transition-transform' />
									{wishlist.length > 0 && (
										<span className='absolute -top-1 -right-1 bg-luxury-gold text-luxury-dark text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white dark:border-luxury-dark'>
											{wishlist.length}
										</span>
									)}
								</Link>

								{user && (
									<Link
										to={"/cart"}
										className='relative group p-2 text-gray-700 dark:text-luxury-text-light hover:text-luxury-gold transition-colors'
									>
										<ShoppingCart className='w-5 h-5 group-hover:scale-110 transition-transform' />
										{cart.length > 0 && (
											<span className='absolute -top-1 -right-1 bg-luxury-gold text-luxury-dark text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white dark:border-luxury-dark'>
												{cart.reduce((sum, item) => sum + item.quantity, 0)}
											</span>
										)}
									</Link>
								)}
							</div>

							{/* Tài khoản */}
							{user ? (
								<div className="flex items-center gap-3">
									<Link to="/profile" className="text-gray-400 dark:text-luxury-text-muted hover:text-luxury-gold transition duration-300">
										<User className="w-6 h-6" />
									</Link>
									<button
										onClick={logout}
										className="text-gray-400 dark:text-luxury-text-muted hover:text-red-400 transition duration-300"
									>
										<LogOut className="w-6 h-6" />
									</button>
								</div>
							) : (
								<Link
									to="/login"
									className="flex items-center gap-2 text-sm font-medium text-luxury-gold hover:text-luxury-gold-light transition duration-300"
								>
									<User className="w-5 h-5" />
									Đăng nhập
								</Link>
							)}

							{/* Admin Dashboard */}
							{isAdmin && (
								<Link
									to="/secret-dashboard"
									className="bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition duration-300"
								>
									<Lock className="w-4 h-4" />
									Dashboard
								</Link>
							)}

							{/* Hamburger Button (mobile only) */}
							<button
								className="md:hidden p-2 text-gray-700 dark:text-luxury-text-light hover:text-luxury-gold transition-colors"
								onClick={() => setIsMobileMenuOpen(o => !o)}
								aria-label="Toggle menu"
							>
								{isMobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Mobile Menu Drawer */}
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-40 md:hidden" onClick={closeMobileMenu}>
					<div
						className="absolute top-[73px] left-0 right-0 bg-white dark:bg-luxury-dark border-b border-gray-200 dark:border-luxury-border shadow-2xl px-6 py-6 space-y-5"
						onClick={e => e.stopPropagation()}
					>
						{/* Search */}
						<div className="relative">
							<input
								type="text"
								value={searchTerm}
								onChange={handleSearch}
								onKeyDown={handleKeyDown}
								placeholder="Tìm kiếm đồng hồ..."
								className="w-full bg-gray-100 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border focus:border-luxury-gold text-black dark:text-white pl-4 pr-12 py-3 rounded-full text-sm placeholder-gray-400 dark:placeholder-luxury-text-muted focus:outline-none transition duration-300"
							/>
							<button onClick={executeSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-luxury-gold">
								<Search className="w-5 h-5" />
							</button>
						</div>

						{/* Nav Links */}
						<nav className="space-y-1">
							{[
								{ to: "/", label: "Trang Chủ" },
								{ to: "/catalog?reset=true", label: "Đồng Hồ" },
								{ to: "/about", label: "Giới Thiệu" },
								{ to: "/contact", label: "Liên Hệ" },
								{ to: "/order-lookup", label: "Tra Cứu Đơn Hàng" },
							].map(item => (
								<NavLink
									key={item.to}
									to={item.to}
									onClick={closeMobileMenu}
									className={({ isActive }) =>
										`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
											? 'bg-luxury-gold/10 text-luxury-gold'
											: 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-luxury-gold'
										}`
									}
								>
									{item.label}
								</NavLink>
							))}
						</nav>

						{/* Divider */}
						<div className="border-t border-gray-100 dark:border-luxury-border" />

						{/* Actions */}
						<div className="flex items-center gap-3 flex-wrap">
							<Link to="/wishlist" onClick={closeMobileMenu} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-luxury-gold transition-colors relative">
								<Heart className="w-5 h-5" />
								Yêu thích
								{wishlist.length > 0 && <span className="ml-auto bg-luxury-gold text-luxury-dark text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{wishlist.length}</span>}
							</Link>
							{user && (
								<Link to="/cart" onClick={closeMobileMenu} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-luxury-gold transition-colors">
									<ShoppingCart className="w-5 h-5" />
									Giỏ hàng
									{cart.length > 0 && <span className="ml-auto bg-luxury-gold text-luxury-dark text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
								</Link>
							)}
						</div>

						{/* Auth */}
						{user ? (
							<div className="flex items-center gap-3 border-t border-gray-100 dark:border-luxury-border pt-4">
								<Link to="/profile" onClick={closeMobileMenu} className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-luxury-gold transition-colors">
									<User className="w-5 h-5" />
									{user.name || "Hồ sơ"}
								</Link>
								<button onClick={() => { logout(); closeMobileMenu(); }} className="px-4 py-3 bg-red-50 dark:bg-red-500/10 rounded-xl text-sm font-medium text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
									<LogOut className="w-5 h-5" />
								</button>
							</div>
						) : (
							<Link to="/login" onClick={closeMobileMenu} className="block w-full text-center bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark px-4 py-3 rounded-xl text-sm font-bold transition duration-300">
								Đăng nhập / Đăng ký
							</Link>
						)}
					</div>
				</div>
			)}

			{/* Contact Modal */}
			{isContactModalOpen && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
					<div className="bg-white dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border p-8 rounded-2xl max-w-sm w-full relative shadow-2xl">
						<button
							onClick={() => setIsContactModalOpen(false)}
							className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white transition"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
						</button>
						<h3 className="text-2xl font-semibold mb-6 text-black dark:text-white text-center">Liên Hệ Trực Tiếp</h3>

						<div className="space-y-4">
							<a href="tel:19008888" className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 p-4 rounded-xl transition border border-gray-100 dark:border-zinc-800">
								<div className="bg-luxury-gold/20 p-3 rounded-full text-luxury-gold">
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
								</div>
								<div>
									<p className="text-sm text-gray-500 dark:text-gray-400">Tổng đài 24/7</p>
									<p className="text-lg font-bold text-black dark:text-white">1900 8888</p>
								</div>
							</a>

							<a href="https://zalo.me" target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 p-4 rounded-xl transition border border-gray-100 dark:border-zinc-800">
								<div className="bg-blue-500/20 p-3 rounded-full text-blue-400">
									<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21.23,12.78c-0.21,2.02-1.3,3.8-3.03,4.92c-0.34,0.22-0.5,0.64-0.37,1c0.18,0.51,0.52,1.38,1.07,2.54c0.16,0.34-0.03,0.73-0.39,0.79c-1.36,0.21-2.92,0.11-4.04-0.28c-0.3-0.1-0.62-0.09-0.9,0.06c-0.5,0.25-1.03,0.44-1.58,0.58c-1.87,0.46-3.83,0.35-5.61-0.31c-3.1-1.14-5.26-4.03-5.36-7.31C0.91,11,2.94,7.85,5.98,6.5c1.81-0.81,3.84-1.02,5.77-0.58C16.89,7.1,20.84,9.66,21.23,12.78z"></path></svg>
								</div>
								<div>
									<p className="text-sm text-gray-500 dark:text-gray-400">Tư vấn qua Zalo</p>
									<p className="text-lg font-bold text-black dark:text-white">Zalo Official</p>
								</div>
							</a>
						</div>

						<div className="mt-6 pt-6 border-t border-zinc-800 text-center">
							<p className="text-sm text-gray-400">Giờ làm việc: 08:00 - 22:00 (Thứ 2 - CN)</p>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Navbar;