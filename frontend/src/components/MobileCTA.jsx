import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Heart, Home, Search, User } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";

/**
 * MobileCTA — Sticky bottom navigation bar for mobile users.
 * Shows primary actions always reachable by thumb.
 * Only renders on mobile (hidden at sm: breakpoint).
 */
const MobileCTA = () => {
  const location = useLocation();
  const cartCount = useCartStore((s) =>
    s.cart.reduce((sum, item) => sum + item.quantity, 0)
  );
  const wishlistCount = useWishlistStore((s) => s.wishlist.length);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { to: "/", icon: Home, label: "Trang chủ" },
    { to: "/catalog?reset=true", icon: Search, label: "Khám phá" },
    {
      to: "/wishlist",
      icon: Heart,
      label: "Yêu thích",
      badge: wishlistCount > 0 ? wishlistCount : null,
    },
    {
      to: "/cart",
      icon: ShoppingBag,
      label: "Giỏ hàng",
      badge: cartCount > 0 ? cartCount : null,
    },
    { to: "/account", icon: User, label: "Tài khoản" },
  ];

  return (
    <nav className="mobile-cta-bar">
      {navItems.map(({ to, icon: Icon, label, badge }) => (
        <Link
          key={to}
          to={to}
          className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-colors duration-150 ${
            isActive(to)
              ? "text-[color:var(--color-gold)]"
              : "text-muted hover:text-primary"
          }`}
        >
          <span className="relative inline-flex">
            <Icon className="h-5 w-5" />
            {badge != null && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[color:var(--color-gold)] px-1 text-[9px] font-bold text-white">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default MobileCTA;
