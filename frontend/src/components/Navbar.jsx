import { ShoppingCart, User, LogOut, Lock, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useProductStore } from "../stores/useProductStore";
import { useState } from "react";

const Navbar = () => {
	const { user, logout } = useUserStore();
	const { cart } = useCartStore();
	const { searchProducts } = useProductStore(); // sẽ dùng sau

	const [searchTerm, setSearchTerm] = useState("");

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
		}
	};

	return (
		<header className="fixed top-0 left-0 w-full bg-luxury-dark/98 backdrop-blur-md border-b border-luxury-border z-50">
			<div className="max-w-screen-2xl mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					{/* LOGO */}
					<Link to="/" className="flex items-center gap-2">
						<span className="text-3xl font-bold tracking-luxury text-luxury-gold">LUXURY</span>
						<span className="text-3xl font-bold tracking-luxury text-white">WATCH</span>
					</Link>

					{/* MENU CHÍNH */}
					<nav className="hidden md:flex items-center gap-10 text-sm font-medium text-luxury-text-muted">
						<Link to="/" className="hover:text-luxury-gold transition duration-300">Trang chủ</Link>

						{/* Dropdown Đồng Hồ */}
						<div className="relative group h-full flex items-center cursor-pointer">
							<span className="hover:text-luxury-gold transition duration-300 flex items-center gap-1 py-4">
								Đồng Hồ
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
							</span>

							{/* Menu xổ xuống */}
							<div className="absolute top-[80%] left-0 w-52 bg-luxury-dark/95 backdrop-blur-md border border-luxury-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden transform translate-y-2 group-hover:translate-y-0">
								<div className="flex flex-col py-2">
									<Link to="/catalog?category=Automatic" className="px-5 py-2.5 hover:bg-luxury-gold hover:text-luxury-dark transition-all duration-300 text-luxury-text-light whitespace-nowrap font-medium">Cơ khí / Tự động</Link>
									<Link to="/catalog?category=Quartz" className="px-5 py-2.5 hover:bg-luxury-gold hover:text-luxury-dark transition-all duration-300 text-luxury-text-light whitespace-nowrap font-medium">Đồng hồ Quartz</Link>
									<Link to="/catalog?category=Digital" className="px-5 py-2.5 hover:bg-luxury-gold hover:text-luxury-dark transition-all duration-300 text-luxury-text-light whitespace-nowrap font-medium">Đồng hồ Điện tử</Link>
									<Link to="/catalog?category=Smartwatch" className="px-5 py-2.5 hover:bg-luxury-gold hover:text-luxury-dark transition-all duration-300 text-luxury-text-light whitespace-nowrap font-medium">Đồng hồ Thông minh</Link>
								</div>
							</div>
						</div>

						<Link to="/about" className="hover:text-luxury-gold transition duration-300">Về chúng tôi</Link>
						<Link to="/support" className="hover:text-luxury-gold transition duration-300">Hotline</Link>
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
								className="w-full bg-luxury-darker border border-luxury-border focus:border-luxury-gold text-white pl-5 pr-12 py-3 rounded-full text-sm placeholder-luxury-text-muted focus:outline-none transition duration-300"
							/>
							<button onClick={executeSearch} className="absolute right-5 top-1/2 -translate-y-1/2 text-luxury-gold">
								<Search className="w-5 h-5" />
							</button>
						</div>

						{/* Giỏ hàng */}
						{user && (
							<Link to="/cart" className="relative group">
								<ShoppingCart className="w-6 h-6 text-luxury-text-muted group-hover:text-luxury-gold transition duration-300" />
								{cart.length > 0 && (
									<span className="absolute -top-1 -right-1 bg-luxury-gold text-luxury-dark text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
										{cart.length}
									</span>
								)}
							</Link>
						)}

						{/* Tài khoản */}
						{user ? (
							<div className="flex items-center gap-3">
								<Link to="/profile" className="text-luxury-text-muted hover:text-luxury-gold transition duration-300">
									<User className="w-6 h-6" />
								</Link>
								<button
									onClick={logout}
									className="text-luxury-text-muted hover:text-red-400 transition duration-300"
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
					</div>
				</div>
			</div>
		</header>
	);
};

export default Navbar;