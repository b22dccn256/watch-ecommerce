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

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const addToCart = useCartStore((state) => state.addToCart);
  const { wishlist, toggleWishlist } = useWishlistStore(
    (state) => ({ wishlist: state.wishlist, toggleWishlist: state.toggleWishlist }),
    shallow
  );
  const { addToCompare, compareItems, removeFromCompare } = useCompareStore(
    (state) => ({
      addToCompare: state.addToCompare,
      compareItems: state.compareItems,
      removeFromCompare: state.removeFromCompare,
    }),
    shallow
  );

  const [imageReady, setImageReady] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isWishlisted = Array.isArray(wishlist) && wishlist.some((i) => i._id === product._id);
  const isCompared = compareItems?.some((i) => i._id === product._id);
  const isOutOfStock = Number(product.stock) <= 0;

  const discountPercent =
    product.originalPrice && product.price < product.originalPrice
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  const imageSrc =
    product.image ||
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1200&auto=format&fit=crop";

  const brand = product.brand?.name || product.brand || "Collection";

  const openDetail = () => navigate(`/product/${product._id}`);

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
      toast.success("Đã thêm vào giỏ hàng");
    } catch {
      toast.error("Không thể thêm vào giỏ hàng");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="group relative cursor-pointer"
      >
        {/* ── Image Block ── */}
        <div
          role="button"
          tabIndex={0}
          onClick={openDetail}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openDetail())}
          className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[color:var(--color-surface-2)]"
        >
          {/* Product image */}
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(true)}
            className={`h-full w-full object-cover transition-transform duration-[600ms] ease-out ${
              imageReady ? "opacity-100 group-hover:scale-[1.06]" : "opacity-0"
            }`}
          />
          {!imageReady && <div className="animate-shimmer absolute inset-0" />}

          {/* Dark vignette on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent opacity-0 transition-opacity duration-[500ms] group-hover:opacity-100" />

          {/* Badges — top left */}
          <div className="absolute left-3 top-3 z-20 flex gap-1.5">
            {discountPercent > 0 && (
              <span className="rounded-[3px] border border-white/20 bg-black/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white">
                −{discountPercent}%
              </span>
            )}
            {product.isNew && (
              <span className="rounded-[3px] border border-[color:var(--color-gold)]/50 bg-[color:var(--color-gold)]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-gold)] backdrop-blur-sm">
                New
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
              <span className="rounded-[3px] border border-white/30 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white">
                Tạm hết hàng
              </span>
            </div>
          )}

          {/* Hover action bar — bottom of image */}
          <div className="card-reveal absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-3 pb-4">
            {/* Add to cart CTA */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              className="flex items-center gap-2 rounded-[4px] border border-white/25 bg-black/65 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-colors duration-300 hover:border-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)] hover:text-black disabled:opacity-50"
            >
              <ShoppingBag className="h-3 w-3" />
              {isAdding ? "…" : "Thêm vào giỏ"}
            </button>

            {/* Icon actions */}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleWishlist(product, !!user); }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] border border-white/25 bg-black/65 text-white backdrop-blur-sm transition hover:bg-white hover:text-black"
                aria-label="Yêu thích"
              >
                <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-current text-[color:var(--color-gold)]" : ""}`} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowQuickView(true); }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] border border-white/25 bg-black/65 text-white backdrop-blur-sm transition hover:bg-white hover:text-black"
                aria-label="Xem nhanh"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Info Block ── */}
        <div className="pt-4 space-y-2">
          {/* Brand kicker */}
          <p className="text-[9px] font-semibold uppercase tracking-[0.34em] text-muted">{brand}</p>

          {/* Product name — Serif */}
          <h3
            onClick={openDetail}
            className="font-serif text-[1.0625rem] leading-snug text-primary line-clamp-2 transition-colors duration-300 hover:text-[color:var(--color-gold)]"
          >
            {product.name}
          </h3>

          {/* Price row */}
          <div className="flex items-end justify-between pt-0.5">
            <div>
              <p className="text-[1.25rem] font-light tracking-[-0.03em] text-primary">
                {product.price?.toLocaleString("vi-VN")} đ
              </p>
              {product.originalPrice && (
                <p className="text-[11px] text-muted line-through">
                  {product.originalPrice?.toLocaleString("vi-VN")} đ
                </p>
              )}
            </div>

            {/* Compare icon — minimal */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                isCompared ? removeFromCompare(product._id) : addToCompare(product);
              }}
              className="mb-0.5 text-muted transition-colors duration-300 hover:text-[color:var(--color-gold)]"
              aria-label="So sánh"
            >
              <ArrowLeftRight className={`h-4 w-4 ${isCompared ? "text-[color:var(--color-gold)]" : ""}`} />
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
                <img src={imageSrc} alt={product.name} className="h-full w-full object-cover" />
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
                  <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-muted">{brand}</p>
                  <h3 className="font-serif text-2xl leading-tight text-primary">{product.name}</h3>
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
                  {isAdding ? "Đang thêm…" : isOutOfStock ? "Tạm hết hàng" : "Thêm vào giỏ hàng"}
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
