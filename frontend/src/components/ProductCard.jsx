import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Heart, ShoppingBag, ArrowLeftRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { shallow } from "zustand/shallow";

import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useCompareStore } from "../stores/useCompareStore";

const overlayButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[color:var(--color-gold)] hover:text-black";

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

  const isWishlisted = Array.isArray(wishlist) && wishlist.some((item) => item._id === product._id);
  const isCompared = compareItems?.some((item) => item._id === product._id);
  const isOutOfStock = Number(product.stock) <= 0;

  const discountPercent =
    product.originalPrice && product.price < product.originalPrice
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  const imageSrc =
    product.image ||
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1200&auto=format&fit=crop";

  const brand = product.brand?.name || product.brand || "Collection";
  const category = product.categoryId?.name || product.category || "Luxury watch";

  const rating = useMemo(() => Math.round(product.rating || product.averageRating || 4), [product]);

  const openDetail = () => navigate(`/product/${product._id}`);

  const handleAddToCart = async (event) => {
    event.stopPropagation();
    if (isOutOfStock) return;
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng", { id: "login" });
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
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="group luxury-card relative overflow-hidden"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={openDetail}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openDetail();
            }
          }}
          className="relative aspect-[4/5] cursor-pointer overflow-hidden bg-[color:var(--color-surface-2)]"
        >
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(true)}
            className={`h-full w-full object-cover transition duration-700 ${imageReady ? "opacity-100 group-hover:scale-[1.04]" : "opacity-0"}`}
          />
          {!imageReady && <div className="animate-shimmer absolute inset-0" />}

          <div className="absolute inset-0 bg-gradient-to-t from-black/52 via-black/8 to-transparent opacity-90 transition duration-300 group-hover:opacity-100" />

          <div className="absolute left-3 top-3 z-20 flex gap-2">
            {discountPercent > 0 && (
              <span className="rounded-full border border-black/20 bg-black/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                Sale {discountPercent}%
              </span>
            )}
            {product.isNew && (
              <span className="rounded-full border border-white/30 bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
                New
              </span>
            )}
          </div>

          <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 opacity-0 transition duration-300 group-hover:opacity-100">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleWishlist(product, !!user);
              }}
              className={overlayButtonClass}
              aria-label="Yêu thích"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                isCompared ? removeFromCompare(product._id) : addToCompare(product);
              }}
              className={overlayButtonClass}
              aria-label="So sánh"
            >
              <ArrowLeftRight className={`h-4 w-4 ${isCompared ? "text-[color:var(--color-gold)]" : ""}`} />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowQuickView(true);
              }}
              className={overlayButtonClass}
              aria-label="Xem nhanh"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between">
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur">
              {category}
            </span>
            {isOutOfStock && (
              <span className="rounded-full border border-black/30 bg-black/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                Hết hàng
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{brand}</p>

          <h3 className="hero-title line-clamp-2 text-xl leading-tight text-primary">{product.name}</h3>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="price-display text-xl">{product.price?.toLocaleString("vi-VN")} đ</p>
              {product.originalPrice && (
                <p className="price-original text-xs">{product.originalPrice?.toLocaleString("vi-VN")} đ</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              className="btn-base btn-primary h-9 w-9 rounded-full p-0"
              aria-label="Thêm vào giỏ"
            >
              {isAdding ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-muted">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`h-3.5 w-3.5 ${index < rating ? "fill-[color:var(--color-gold)] text-[color:var(--color-gold)]" : "text-gray-300 dark:text-gray-600"}`}
              />
            ))}
            <span className="ml-1">({product.reviews || product.reviewsCount || 0})</span>
          </div>
        </div>
      </motion.article>

      <AnimatePresence>
        {showQuickView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowQuickView(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-black/10 bg-surface shadow-[0_32px_90px_-34px_rgba(0,0,0,0.65)] md:grid-cols-2"
            >
              <div className="relative bg-black">
                <img src={imageSrc} alt={product.name} className="h-full min-h-[340px] w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setShowQuickView(false)}
                  className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 p-6 md:p-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{brand}</p>
                <h3 className="hero-title text-3xl leading-tight">{product.name}</h3>
                <p className="text-sm text-secondary line-clamp-4">
                  {product.description ||
                    "Mẫu đồng hồ được tuyển chọn với tiêu chí độ hoàn thiện cao, tỷ lệ cân đối và khả năng đeo thoải mái trong nhiều bối cảnh."}
                </p>
                <div className="pt-1">
                  <p className="price-display text-3xl">{product.price?.toLocaleString("vi-VN")} đ</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAdding}
                  className="btn-base btn-primary h-11 w-full"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {isAdding ? "Đang thêm" : "Thêm vào giỏ"}
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
