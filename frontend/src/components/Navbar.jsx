import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  ShoppingBag,
  UserRound,
  Heart,
  Scale,
  Sun,
  Moon,
  LogOut,
  Lock,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { shallow } from "zustand/shallow";

import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useThemeStore } from "../stores/useThemeStore";
import { useCompareStore } from "../stores/useCompareStore";

const menuItems = [
  { to: "/", label: "Trang chủ" },
  { to: "/catalog?reset=true", label: "Bộ sưu tập" },
  { to: "/brands", label: "Thương hiệu" },
  { to: "/about", label: "Về chúng tôi" },
];

const iconButtonClass =
  "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/75 text-primary transition hover:-translate-y-0.5 hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] dark:border-white/10 dark:bg-[color:var(--color-surface-2)]";

const navbarLinkClass = ({ isActive }) =>
  [
    "relative inline-flex h-9 items-center px-3 text-xs font-semibold uppercase tracking-[0.2em] transition",
    isActive
      ? "text-[color:var(--color-gold)]"
      : "text-secondary hover:text-[color:var(--color-gold)]",
  ].join(" ");

const Navbar = () => {
  const navigate = useNavigate();

  const { user, logout } = useUserStore(
    (state) => ({ user: state.user, logout: state.logout }),
    shallow
  );
  const cartCount = useCartStore((state) =>
    state.cart.reduce((sum, item) => sum + item.quantity, 0)
  );
  const wishlistCount = useWishlistStore((state) => state.wishlist.length);
  const { theme, toggleTheme } = useThemeStore(
    (state) => ({ theme: state.theme, toggleTheme: state.toggleTheme }),
    shallow
  );
  const { compareCount, setIsOpen } = useCompareStore(
    (state) => ({
      compareCount: state.compareItems.length,
      setIsOpen: state.setIsOpen,
    }),
    shallow
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const clickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const executeSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/catalog?q=${encodeURIComponent(searchTerm.trim())}`);
    setIsMobileOpen(false);
  };

  const userName = user?.name?.split(" ")[0] || "Khách";

  return (
    <header className="fixed inset-x-0 top-0 z-[90] border-b border-black/5 bg-[color:var(--color-surface)] dark:border-white/5">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group inline-flex items-center gap-3">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-gold)]/45 bg-[color:var(--color-gold)]/15">
            <span className="text-[11px] font-bold tracking-[0.08em] text-[color:var(--color-gold)]">LW</span>
          </div>
          <div className="leading-none">
            <p className="hero-title text-sm tracking-[0.28em] text-primary transition group-hover:text-[color:var(--color-gold)]">LUXURY</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.34em] text-muted">Watch Gallery</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {menuItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navbarLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex lg:items-center lg:gap-2 lg:min-w-[18rem] lg:max-w-[21rem] lg:w-full">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && executeSearch()}
              placeholder="Tìm đồng hồ"
              className="input-base h-9 rounded-full pl-9 pr-10"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <button type="button" onClick={executeSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted transition hover:text-[color:var(--color-gold)]">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleTheme}
            className={iconButtonClass}
            title="Đổi giao diện"
            aria-label="Đổi giao diện"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link to="/wishlist" className={iconButtonClass} aria-label="Yêu thích">
            <Heart className="h-4 w-4" />
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-gold)] px-1 text-[10px] font-bold text-black">
                {wishlistCount}
              </span>
            )}
          </Link>

          <button onClick={() => setIsOpen(true)} className={iconButtonClass} aria-label="So sánh">
            <Scale className="h-4 w-4" />
            {compareCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-gold)] px-1 text-[10px] font-bold text-black">
                {compareCount}
              </span>
            )}
          </button>

          {user && (
            <Link to="/cart" className={iconButtonClass} aria-label="Giỏ hàng">
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-gold)] px-1 text-[10px] font-bold text-black">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((open) => !open)}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white/70 pl-1.5 pr-2 text-xs text-primary transition hover:border-[color:var(--color-gold)] dark:border-white/10 dark:bg-[color:var(--color-surface-2)]"
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Avatar" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--color-gold)]/50 bg-[color:var(--color-gold)]/10 text-[color:var(--color-gold)]">
                    <UserRound className="h-3.5 w-3.5" />
                  </span>
                )}
                <span className="font-semibold">{userName}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted transition ${isProfileOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-black/10 bg-[color:var(--color-surface)] p-2 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)] dark:border-white/10"
                  >
                    <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary transition hover:bg-[color:var(--color-surface-2)] hover:text-primary">
                      <UserRound className="h-4 w-4" /> Tài khoản
                    </Link>
                    <Link to="/order-lookup" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary transition hover:bg-[color:var(--color-surface-2)] hover:text-primary">
                      <ShoppingBag className="h-4 w-4" /> Đơn hàng
                    </Link>
                    {["admin", "staff"].includes(user.role) && (
                      <Link to="/secret-dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[color:var(--color-gold)] transition hover:bg-[color:var(--color-surface-2)]">
                        <Lock className="h-4 w-4" /> Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary transition hover:bg-[color:var(--color-gold)]/10 hover:text-[color:var(--color-gold)]"
                    >
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="hidden h-9 items-center rounded-full border border-black/10 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-secondary transition hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] sm:inline-flex dark:border-white/10">
              Đăng nhập
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsMobileOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-primary transition hover:text-[color:var(--color-gold)] lg:hidden dark:border-white/10"
            aria-label="Mở menu"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-black/5 bg-[color:var(--color-surface)] px-4 pb-5 pt-4 lg:hidden dark:border-white/10"
          >
            <div className="relative mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && executeSearch()}
                placeholder="Tìm kiếm"
                className="input-base h-10 rounded-full pl-9 pr-10"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <button type="button" onClick={executeSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted">
                <Search className="h-4 w-4" />
              </button>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    [
                      "block rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition",
                      isActive
                        ? "bg-[color:var(--color-gold)]/12 text-[color:var(--color-gold)]"
                        : "text-secondary hover:bg-[color:var(--color-surface-2)] hover:text-primary",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {!user && (
              <Link
                to="/login"
                onClick={() => setIsMobileOpen(false)}
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[color:var(--color-gold)] px-4 text-sm font-bold uppercase tracking-[0.14em] text-black"
              >
                Đăng nhập
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
