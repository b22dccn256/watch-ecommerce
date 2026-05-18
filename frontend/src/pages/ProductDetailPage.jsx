import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, Heart, Minus, Plus, Share2, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import toast from "react-hot-toast";

import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useCompareStore } from "../stores/useCompareStore";
import { useUserStore } from "../stores/useUserStore";
import axios from "../lib/axios";
import ProductCard from "../components/ProductCard";
import ProductTrustBadges from "../components/ProductTrustBadges";
import { SkeletonProductDetail } from "../components/SkeletonLoaders";
import Input from "../components/ui/Input";

const tabItems = [
  { id: "description", label: "Mô tả" },
  { id: "specs", label: "Thông số" },
  { id: "policy", label: "Chính sách" },
];

const specTranslationMap = {
  "automatic": "Cơ tự động",
  "quartz": "Máy pin",
  "mechanical": "Cơ học",
  "digital": "Điện tử",
  "smartwatch": "Đồng hồ thông minh",
  "stainless steel": "Thép không gỉ",
  "sapphire": "Kính Sapphire",
  "leather": "Dây da",
  "steel": "Dây thép",
  "folding clasp": "Khóa gấp",
};

const translateSpecValue = (val) => {
  if (!val) return val;
  const key = val.toLowerCase().trim();
  return specTranslationMap[key] || val;
};

const ProductDetailPage = () => {
  const { id } = useParams();

  const { currentProduct, fetchProductById, loading } = useProductStore();
  const addToCart = useCartStore((state) => state.addToCart);
  const { wishlist, toggleWishlist } = useWishlistStore();
  const addToCompare = useCompareStore((state) => state.addToCompare);
  const user = useUserStore((state) => state.user);

  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedWristOption, setSelectedWristOption] = useState(null);
  const [wristSize, setWristSize] = useState("");

  useEffect(() => {
    fetchProductById(id);
    window.scrollTo(0, 0);
  }, [fetchProductById, id]);

  useEffect(() => {
    if (!currentProduct) return;

    setActiveImage(0);
    setQuantity(1);
    setSelectedColor(currentProduct.colors?.[0] || null);
    setSelectedSize(currentProduct.sizes?.[0] || null);
    setSelectedWristOption(currentProduct.wristSizeOptions?.[0]?.size || null);

    document.title = `${currentProduct.name} | Luxury Watch`;

    axios
      .get(`/products?category=${encodeURIComponent(currentProduct.category || "")}&limit=16`)
      .then((res) => {
        const all = (res.data.products || []).filter((item) => item._id !== currentProduct._id);
        const priceMin = currentProduct.price * 0.6;
        const priceMax = currentProduct.price * 1.4;
        // Primary: same category + price within ±40%
        const priceFiltered = all
          .filter((item) => item.price >= priceMin && item.price <= priceMax)
          .slice(0, 4);
        // Fallback: if fewer than 2 price-matched, use category-only
        setRelatedProducts(priceFiltered.length >= 2 ? priceFiltered : all.slice(0, 4));
      })
      .catch(() => setRelatedProducts([]));
  }, [currentProduct]);

  const hasWristOptions = currentProduct?.wristSizeOptions?.length > 0;

  const activeStock = useMemo(() => {
    if (!currentProduct) return 0;
    if (!hasWristOptions) return currentProduct.stock;
    const selected = currentProduct.wristSizeOptions.find((item) => item.size === selectedWristOption);
    return selected ? selected.stock : 0;
  }, [currentProduct, hasWristOptions, selectedWristOption]);

  if (loading || !currentProduct) {
    return <SkeletonProductDetail />;
  }

  const isWishlisted = wishlist.some((item) => item._id === currentProduct._id);
  const images = currentProduct.images?.length
    ? currentProduct.images
    : currentProduct.image
      ? [currentProduct.image]
      : ["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1200&auto=format&fit=crop"];

  const brand = currentProduct.brand?.name || currentProduct.brand || "Luxury Watch";
  const category = currentProduct.categoryId?.name || currentProduct.category || "Collection";
  const discount = currentProduct.originalPrice
    ? Math.round(((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100)
    : 0;



  const specsRows = [
    ["Loại máy", translateSpecValue(currentProduct.specs?.movement?.type)],
    ["Caliber", currentProduct.specs?.movement?.caliber],
    ["Dự trữ cót", currentProduct.specs?.movement?.powerReserve],
    ["Đường kính", currentProduct.specs?.case?.diameter],
    ["Độ dày", currentProduct.specs?.case?.thickness],
    ["Chất liệu vỏ", translateSpecValue(currentProduct.specs?.case?.material)],
    ["Chất liệu dây", translateSpecValue(currentProduct.specs?.strap?.material)],
    ["Chống nước", currentProduct.specs?.waterResistance],
  ].filter(([, value]) => Boolean(value));

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép đường dẫn sản phẩm");
    } catch {
      toast.error("Không thể sao chép đường dẫn");
    }
  };

  const handleAddToCart = () => {
    if (activeStock <= 0) return;

    const payload = {
      ...currentProduct,
      quantity,
      selectedColor,
      selectedSize,
      wristSize: hasWristOptions ? selectedWristOption : wristSize || null,
    };

    addToCart(payload);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-10 pt-20 md:pt-24">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-secondary">
          <Link to="/" className="transition hover:text-primary">Trang chủ</Link>
          <span className="text-muted">/</span>
          <Link to="/catalog" className="transition hover:text-primary">{category}</Link>
          <span className="text-muted">/</span>
          <span className="font-medium text-[color:var(--color-gold)] truncate max-w-[160px]">{currentProduct.name}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 xl:gap-12">
          {/* Image Section */}
          <section className="lg:col-span-7">
            <div className="space-y-4 lg:sticky lg:top-20">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[color:var(--color-surface-2)]">
                <Zoom>
                  <img
                    src={images[activeImage]}
                    alt={currentProduct.name}
                    className="h-full w-full object-contain p-4 sm:p-8 lg:p-6"
                  />
                </Zoom>
                {/* Inventory badge — subtle top-left */}
                {activeStock <= 3 && activeStock > 0 && (
                  <span className="absolute left-4 top-4 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                    Còn {activeStock}
                  </span>
                )}
                {activeStock <= 0 && (
                  <span className="absolute left-4 top-4 rounded-full border border-red-500/20 bg-red-500/8 px-2.5 py-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
                    Hết hàng
                  </span>
                )}
                {discount > 0 && (
                  <span className="absolute right-4 top-4 rounded-full border border-[color:var(--color-gold)]/30 bg-[color:var(--color-gold)]/10 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--color-gold)]">
                    −{discount}%
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="custom-scrollbar flex gap-2.5 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                        activeImage === index
                          ? "border-[color:var(--color-gold)] ring-1 ring-[color:var(--color-gold)]/20"
                          : "border-transparent opacity-60 hover:opacity-100 hover:border-black/10 dark:hover:border-white/10"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${currentProduct.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Info Section */}
          <section className="lg:col-span-5">
            <div className="space-y-6">
              {/* Brand + Name */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[color:var(--color-gold)]">{brand}</p>
                <h1 className="font-display text-3xl leading-[1.15] text-primary sm:text-4xl lg:text-[2.25rem] font-light tracking-tight">
                  {currentProduct.name}
                </h1>
              </div>

              {/* Price block — clean */}
              <div className="space-y-2 border-y border-black/6 py-4 dark:border-white/6">
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-3xl font-semibold tracking-tight text-primary">
                    {currentProduct.price.toLocaleString("vi-VN")}
                  </p>
                  <span className="text-lg font-medium text-primary">₫</span>
                  {currentProduct.originalPrice && (
                    <p className="text-sm text-muted line-through">
                      {currentProduct.originalPrice.toLocaleString("vi-VN")} đ
                    </p>
                  )}
                </div>
                <p className="text-[11px] text-muted">Đã bao gồm VAT · Bảo hành quốc tế 5 năm · Xác thực 100%</p>
              </div>

              {/* Variant selectors — compact */}
              {currentProduct.colors?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Mặt số</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentProduct.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`rounded-lg border px-3 py-1.5 text-[13px] transition ${
                          selectedColor === color
                            ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold)]/10 text-[color:var(--color-gold)]"
                            : "border-black/8 text-secondary hover:border-[color:var(--color-gold)]/50 dark:border-white/8"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentProduct.sizes?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Kích thước mặt</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentProduct.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[44px] rounded-lg border px-3 py-1.5 text-[13px] transition ${
                          selectedSize === size
                            ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold)]/10 text-[color:var(--color-gold)]"
                            : "border-black/8 text-secondary hover:border-[color:var(--color-gold)]/50 dark:border-white/8"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasWristOptions && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Tùy chọn cổ tay</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentProduct.wristSizeOptions.map((option) => (
                      <button
                        key={option.size}
                        type="button"
                        disabled={option.stock <= 0}
                        onClick={() => setSelectedWristOption(option.size)}
                        className={`rounded-lg border px-3 py-1.5 text-[13px] transition ${
                          selectedWristOption === option.size
                            ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold)]/10 text-[color:var(--color-gold)]"
                            : "border-black/8 text-secondary hover:border-[color:var(--color-gold)]/50 dark:border-white/8"
                        } ${option.stock <= 0 ? "opacity-40" : ""}`}
                      >
                        {option.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!hasWristOptions && (
                <div className="rounded-lg border border-black/6 bg-[color:var(--color-surface-2)] p-3 dark:border-white/6">
                  <Input
                    label="Chu vi cổ tay (mm) — tùy chọn"
                    name="wrist-size"
                    value={wristSize}
                    onChange={(event) => setWristSize(event.target.value)}
                    placeholder="Vd: 165 mm — đo và điều chỉnh dây miễn phí"
                  />
                </div>
              )}

              {/* Quantity + CTA */}
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted whitespace-nowrap">SL</p>
                <div className="inline-flex items-center rounded-lg border border-black/8 bg-[color:var(--color-surface-2)] p-1 dark:border-white/8">
                  <button type="button" onClick={() => setQuantity((v) => Math.max(1, v - 1))} className="btn-base btn-ghost h-7 w-7 rounded-md p-0">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-9 text-center text-sm font-semibold">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((v) => Math.min(10, v + 1))} className="btn-base btn-ghost h-7 w-7 rounded-md p-0">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Primary CTA */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={activeStock <= 0}
                  className="btn-base btn-primary h-11 w-full text-sm font-semibold uppercase tracking-[0.1em]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {activeStock > 0 ? "Thêm vào giỏ hàng" : "Tạm hết hàng"}
                </button>

                {/* Micro-actions */}
                <div className="flex items-center justify-center gap-4">
                  <button type="button" onClick={() => toggleWishlist(currentProduct, !!user)} className="flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-[color:var(--color-gold)]" aria-label="Yêu thích">
                    <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-current text-[color:var(--color-gold)]" : ""}`} />
                    Yêu thích
                  </button>
                  <button type="button" onClick={() => addToCompare(currentProduct)} className="flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-[color:var(--color-gold)]" aria-label="So sánh">
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    So sánh
                  </button>
                  <button type="button" onClick={handleShare} className="flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-[color:var(--color-gold)]" aria-label="Chia sẻ">
                    <Share2 className="h-3.5 w-3.5" />
                    Chia sẻ
                  </button>
                </div>
              </div>

              {/* Trust reassurance — compact text row, not cards */}
              <p className="text-center text-[10px] text-muted tracking-wide">
                <ShieldCheck className="inline h-3 w-3 mr-1 text-[color:var(--color-gold)]" />
                Giao hàng bảo mật · Được bảo hiểm toàn trình · Đổi trả 30 ngày
              </p>

              {/* Trust badges — compact inline */}
              <div className="border-t border-black/6 pt-5 dark:border-white/6">
                <ProductTrustBadges product={currentProduct} stock={activeStock} />
              </div>
            </div>
          </section>
        </div>

        {/* Tabs Section — compact */}
        <section className="rounded-2xl border border-black/6 bg-surface p-4 sm:p-5 dark:border-white/6">
          <div className="custom-scrollbar flex gap-2 overflow-x-auto border-b border-black/6 pb-2.5 dark:border-white/6">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                  activeTab === tab.id
                    ? "bg-[color:var(--color-gold)]/12 text-[color:var(--color-gold)]"
                    : "text-muted hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="pt-4"
            >
              {activeTab === "description" && (
                <div className="max-w-3xl space-y-4">
                  <p className="text-sm leading-relaxed text-secondary sm:text-base">{currentProduct.description}</p>
                  {currentProduct.specs?.movement?.caliber && (
                    <div className="rounded-lg border border-black/6 bg-[color:var(--color-surface-2)] p-3.5 dark:border-white/6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary mb-2">Công nghệ & Chế tác</p>
                      <ul className="grid grid-cols-2 gap-2 text-[13px] text-secondary">
                        <li>· <span className="font-medium">{translateSpecValue(currentProduct.specs?.movement?.type)}</span></li>
                        <li>· <span className="font-medium">Caliber:</span> {currentProduct.specs?.movement?.caliber}</li>
                        {currentProduct.specs?.movement?.powerReserve && <li>· <span className="font-medium">Dự trữ cót:</span> {currentProduct.specs?.movement?.powerReserve}</li>}
                        {currentProduct.specs?.waterResistance && <li>· <span className="font-medium">Chống nước:</span> {currentProduct.specs?.waterResistance}</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "specs" && (
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {specsRows.length > 0 ? (
                    specsRows.map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-lg border border-black/6 bg-[color:var(--color-surface-2)] px-3.5 py-2.5 text-[13px] dark:border-white/6">
                        <span className="text-muted">{label}</span>
                        <span className="font-medium text-primary">{value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted">Chưa có thông số chi tiết.</p>
                  )}
                </div>
              )}

              {activeTab === "policy" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Vận chuyển", "Miễn phí toàn quốc cho mọi đơn hàng, hỗ trợ giao nhanh tại các thành phố lớn."],
                    ["Đổi trả", "Đổi hoặc trả trong 7 đến 30 ngày tùy tình trạng sản phẩm và chính sách bảo hành."],
                    ["Bảo hành", "Bảo hành quốc tế 5 năm, hỗ trợ kiểm tra và bảo dưỡng định kỳ tại hệ thống cửa hàng."],
                  ].map(([title, desc]) => (
                    <div key={title} className="rounded-lg border border-black/6 bg-[color:var(--color-surface-2)] p-3.5 dark:border-white/6">
                      <p className="text-[13px] font-semibold text-primary">{title}</p>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-secondary">{desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {relatedProducts.length > 0 && (
          <section className="border-t border-black/6 pt-8 pb-4 dark:border-white/6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-gold)]">Bộ sưu tập</p>
                <h2 className="mt-2 text-2xl font-display font-light text-primary">Đồng hồ tương tự</h2>
              </div>
              <Link
                to="/catalog"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted transition hover:text-[color:var(--color-gold)] whitespace-nowrap ml-4"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="product-grid-4">
              {relatedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Sticky CTA — compact, no shadow bloat */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-black/6 p-2.5 sm:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate text-primary">{currentProduct.name}</p>
            <p className="text-[11px] font-bold text-[color:var(--color-gold)]">{currentProduct.price.toLocaleString("vi-VN")} ₫</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={activeStock <= 0}
            className="btn-base btn-primary h-10 px-4 shrink-0 text-sm"
          >
            <ShoppingBag className="h-4 w-4" />
            {activeStock > 0 ? "Thêm vào giỏ" : "Hết hàng"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
