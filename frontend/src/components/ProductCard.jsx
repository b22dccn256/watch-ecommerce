import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Heart, ShoppingBag, ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { shallow } from "zustand/shallow";

import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useCompareStore } from "../stores/useCompareStore";
import { buildProductPath } from "../utils/productUrl";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const addToCart = useCartStore((state) => state.addToCart);
  const { wishlist, toggleWishlist } = useWishlistStore(
    (state) => ({
      wishlist: state.wishlist,
      toggleWishlist: state.toggleWishlist,
    }),
    shallow,
  );
  const { addToCompare, compareItems, removeFromCompare } = useCompareStore(
    (state) => ({
      addToCompare: state.addToCompare,
      compareItems: state.compareItems,
      removeFromCompare: state.removeFromCompare,
    }),
    shallow,
  );

  const [imageReady, setImageReady] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isWishlisted =
    Array.isArray(wishlist) && wishlist.some((i) => i._id === product._id);
  const isCompared = compareItems?.some((i) => i._id === product._id);
  const isOutOfStock = Number(product.stock) <= 0;

  const discountPercent =
    product.originalPrice && product.price < product.originalPrice
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  // Compute isNew if backend didn't provide it: created within 7 days
  const isNewLocal =
    product.isNew ||
    (product.createdAt &&
      Date.now() - new Date(product.createdAt) < 1000 * 60 * 60 * 24 * 7);

  // Compute best seller badge if salesCount high enough (top tier only)
  const isBestSeller =
    product.isBestSeller || (product.salesCount && product.salesCount >= 400);

  const imageSrc =
    product.image ||
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1200&auto=format&fit=crop";

  const brand = product.brand?.name || product.brand || "Collection";
  const displayName = product.name?.startsWith(brand)
    ? product.name.substring(brand.length).trim()
    : product.name;

  const openDetail = () => {
    const path = buildProductPath(product);
    if (path) navigate(path);
  };

  const handleAddToCart = async (event) => {
    event.stopPropagation();
    if (isOutOfStock) return;
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng", { id: "login" });
      return;
    }
    try {
      setIsAdding(true);
      await addToCart(product);
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 240, damping: 28 }}
        onClick={openDetail}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") &&
          (e.preventDefault(), openDetail())
        }
        role="link"
        tabIndex={0}
        className="group relative cursor-pointer outline-none"
      >
        {/* ── Image Block ── */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[color:var(--color-surface-2)]">
          {/* Product image */}
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(true)}
            className={`h-full w-full object-cover transition-transform duration-[500ms] ease-out ${
              imageReady ? "opacity-100 group-hover:scale-[1.04]" : "opacity-0"
            }`}
          />
          {!imageReady && (
            <div className="skeleton-shimmer skeleton-shimmer-premium absolute inset-0" />
          )}

          {/* Subtle hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent opacity-0 transition-opacity duration-[400ms] group-hover:opacity-100" />

          {/* Badges — top left */}
          <div className="absolute left-2.5 top-2.5 z-20 flex gap-1.5">
            {discountPercent > 0 && (
              <span className="rounded-[3px] border border-white/20 bg-black/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
                −{discountPercent}%
              </span>
            )}
            {isBestSeller && (
              <span className="rounded-[3px] border border-[color:var(--color-gold)]/10 bg-[color:var(--color-gold)]/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-gold)]">
                Best
              </span>
            )}
            {isNewLocal && (
              <span className="rounded-[3px] border border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-gold)] backdrop-blur-sm">
                New
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
              <span className="rounded-[3px] border border-white/25 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                Tạm hết hàng
              </span>
            </div>
          )}

          {/* Hover action bar — desktop: reveal on hover. Mobile: always show icon row */}
          <div className="card-reveal absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-3 pb-3">
            {/* Add to cart CTA */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              className="flex items-center gap-1.5 rounded-[4px] border border-white/20 bg-black/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition-colors duration-200 hover:border-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-black disabled:opacity-50"
            >
              <ShoppingBag className="h-3 w-3" />
              {isAdding ? "…" : "Thêm vào giỏ"}
            </button>

            {/* Icon actions */}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product, !!user);
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-[3px] border border-white/20 bg-black/60 text-white backdrop-blur-sm transition hover:bg-white hover:text-black"
                aria-label="Yêu thích"
              >
                <Heart
                  className={`h-3.5 w-3.5 ${isWishlisted ? "fill-current text-[color:var(--color-gold)]" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickView(true);
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-[3px] border border-white/20 bg-black/60 text-white backdrop-blur-sm transition hover:bg-white hover:text-black"
                aria-label="Xem nhanh"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ── Mobile: Always-visible add-to-cart icon (bottom-right) ── */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="absolute bottom-2.5 right-2.5 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-[color:var(--color-gold)] hover:text-black disabled:opacity-40 sm:hidden"
            aria-label="Thêm vào giỏ"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>

        {/* ── Info Block — Compact ── */}
        <div className="pt-3 space-y-1.5">
          {/* Brand kicker */}
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-muted truncate">
            {brand}
          </p>

          {/* Product name */}
          <h3 className="font-display text-[0.95rem] leading-snug text-primary line-clamp-2 transition-colors duration-200 hover:text-[color:var(--color-gold)]">
            {displayName}
          </h3>

          {/* Price row */}
          <div className="flex items-end justify-between pt-0.5">
            <div>
              <p className="text-[1.1rem] font-light tracking-[-0.02em] text-primary">
                {product.price?.toLocaleString("vi-VN")} đ
              </p>
              {product.originalPrice && (
                <p className="text-[10px] text-muted line-through">
                  {product.originalPrice?.toLocaleString("vi-VN")} đ
                </p>
              )}
            </div>

            {/* Compare icon — always visible on desktop, hidden by mobile bag on mobile */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                isCompared
                  ? removeFromCompare(product._id)
                  : addToCompare(product);
              }}
              className="mb-0.5 hidden text-muted transition-colors duration-200 hover:text-[color:var(--color-gold)] sm:inline-block"
              aria-label="So sánh"
            >
              <ArrowLeftRight
                className={`h-4 w-4 ${isCompared ? "text-[color:var(--color-gold)]" : ""}`}
              />
            </button>
          </div>
        </div>
      </motion.article>

      {/* ── Quick View Modal ── */}
      <AnimatePresence>
        {showQuickView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setShowQuickView(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="grid w-full max-w-3xl overflow-hidden rounded-xl border border-black/10 bg-[color:var(--color-surface)] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.65)] md:grid-cols-2"
            >
              {/* Image */}
              <div className="relative min-h-[300px] bg-[color:var(--color-surface-2)]">
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setShowQuickView(false)}
                  className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/20 bg-white/85 text-primary text-lg leading-none"
                >
                  ×
                </button>
              </div>

              {/* Info */}
              <div className="flex flex-col justify-between space-y-5 p-7 sm:p-8">
                <div className="space-y-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-muted">
                    {brand}
                  </p>
                  <h3 className="font-serif text-2xl leading-tight text-primary">
                    {displayName}
                  </h3>
                  <p className="text-sm leading-relaxed text-secondary line-clamp-4">
                    {product.description ||
                      "Mẫu đồng hồ được tuyển chọn với tiêu chí độ hoàn thiện cao, tỷ lệ cân đối và khả năng đeo thoải mái."}
                  </p>
                  <p className="text-3xl font-light tracking-[-0.03em] text-primary">
                    {product.price?.toLocaleString("vi-VN")} đ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAdding}
                  className="btn-base btn-primary h-11 w-full"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {isAdding
                    ? "Đang thêm…"
                    : isOutOfStock
                      ? "Tạm hết hàng"
                      : "Thêm vào giỏ hàng"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductCard;
