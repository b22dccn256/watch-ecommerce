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
    toast.success("Đã thêm vào giỏ hàng");
  };

  return (
    <div className="min-h-screen pb-28 md:pb-14 pt-24">
      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-secondary">
          <Link to="/" className="transition hover:text-primary">Trang chủ</Link>
          <span className="text-muted">/</span>
          <Link to="/catalog" className="transition hover:text-primary">{category}</Link>
          <span className="text-muted">/</span>
          <span className="font-medium text-[color:var(--color-gold)]">Chi tiết Sản Phẩm</span>
        </div>

        <div className="grid gap-12 lg:grid-cols-12 xl:gap-16">
          {/* Image Section (lg:col-span-7 for asymmetry) */}
          <section className="lg:col-span-7">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-[color:var(--color-surface-2)]">
                <Zoom>
                  <img src={images[activeImage]} alt={currentProduct.name} className="h-full w-full object-contain p-3 sm:p-6 lg:p-4" />
                </Zoom>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />

                <div className="absolute left-6 top-6 flex flex-col gap-2">
                  {discount > 0 && (
                    <span className="rounded-full border border-black/10 bg-black/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                      Ưu đãi {discount}%
                    </span>
                  )}
                  {activeStock <= 0 && (
                    <span className="rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                      Hết hàng
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails with scale micro-interaction */}
              <div className="custom-scrollbar flex gap-4 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image + index}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`group h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${activeImage === index ? "border-[color:var(--color-gold)] ring-2 ring-[color:var(--color-gold)]/20" : "border-transparent hover:border-black/10 dark:hover:border-white/10"}`}
                  >
                    <img src={image} alt={`${currentProduct.name} ${index + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Info Section (lg:col-span-5) */}
          <section className="lg:col-span-5">
            <div className="space-y-8 py-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-[color:var(--color-gold)]">{brand}</p>
                  {activeStock <= 3 && activeStock > 0 && <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 rounded-full">Còn {activeStock} chiếc</span>}
                </div>
                <h1 className="font-serif text-4xl leading-tight text-primary sm:text-4xl lg:text-4xl xl:text-5xl font-light tracking-tight">{currentProduct.name}</h1>
              </div>

              <div className="space-y-3 py-5 border-y border-black/8 dark:border-white/8">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Giá</p>
                  <div className="flex items-baseline gap-3">
                    <p className="font-serif text-4xl font-bold tracking-tight text-primary">{currentProduct.price.toLocaleString("vi-VN")}</p>
                    <span className="text-lg font-medium text-primary">₫</span>
                    {currentProduct.originalPrice && (
                      <p className="text-sm text-muted line-through">{currentProduct.originalPrice.toLocaleString("vi-VN")} đ</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-secondary tracking-wide leading-relaxed">✓ Đã bao gồm VAT  •  ✓ Bảo hành quốc tế 5 năm  •  ✓ Xác thực 100%</p>
              </div>



              {currentProduct.colors?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Mặt số</p>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${selectedColor === color ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold)]/12 text-[color:var(--color-gold)]" : "border-black/10 text-secondary hover:border-[color:var(--color-gold)] dark:border-white/10"}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentProduct.sizes?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Kích thước mặt</p>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-11 rounded-lg border px-3 py-2 text-sm transition ${selectedSize === size ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold)]/12 text-[color:var(--color-gold)]" : "border-black/10 text-secondary hover:border-[color:var(--color-gold)] dark:border-white/10"}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasWristOptions && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Tùy chọn cổ tay</p>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.wristSizeOptions.map((option) => (
                      <button
                        key={option.size}
                        type="button"
                        disabled={option.stock <= 0}
                        onClick={() => setSelectedWristOption(option.size)}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${selectedWristOption === option.size ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold)]/12 text-[color:var(--color-gold)]" : "border-black/10 text-secondary hover:border-[color:var(--color-gold)] dark:border-white/10"} ${option.stock <= 0 ? "opacity-45" : ""}`}
                      >
                        {option.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!hasWristOptions && (
                <div className="space-y-2 rounded-lg bg-[color:var(--color-gold)]/6 border border-[color:var(--color-gold)]/20 p-4">
                  <Input
                    label="Tùy chọn: Chu vi cổ tay (mm)"
                    name="wrist-size"
                    value={wristSize}
                    onChange={(event) => setWristSize(event.target.value)}
                    placeholder="Vd: 165 mm - để trống nếu không cần điều chỉnh"
                    hint="💡 Dịch vụ đo, cắt, và điều chỉnh dây miễn phí. Gửi kích thước cổ tay để nhân viên thiết kế dây phù hợp trước khi giao hàng."
                  />
                </div>
              )}

              <div className="flex items-center gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary whitespace-nowrap">Số lượng</p>
                <div className="inline-flex items-center rounded-lg border border-black/10 bg-[color:var(--color-surface-2)] p-1.5 dark:border-white/10">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="btn-base btn-ghost h-8 w-8 rounded-full p-0">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => Math.min(10, value + 1))} className="btn-base btn-ghost h-8 w-8 rounded-full p-0">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Primary CTA: refined, not heavy black */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={activeStock <= 0}
                  className="group relative w-full overflow-hidden rounded-full border border-[color:var(--color-gold)] bg-transparent px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-gold)] transition-all duration-300 hover:bg-[color:var(--color-gold)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2.5">
                    <ShoppingBag className="h-4 w-4" />
                    {activeStock > 0 ? "Sở hữu ngay" : "Tạm hết hàng"}
                  </span>
                </button>

                {/* Secondary CTA: ghost consult */}
                <a
                  href="#"
                  className="flex w-full items-center justify-center gap-2.5 rounded-full border border-black/12 px-6 py-3.5 text-sm font-medium tracking-wide text-secondary transition-all duration-200 hover:border-black/20 hover:text-primary dark:border-white/12 dark:hover:border-white/20"
                >
                  Liên hệ tư vấn
                </a>

                {/* Micro-actions row */}
                <div className="flex items-center justify-center gap-6 pt-1">
                  <button type="button" onClick={() => toggleWishlist(currentProduct, !!user)} className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-[color:var(--color-gold)]" aria-label="Yêu thích">
                    <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current text-[color:var(--color-gold)]" : ""}`} />
                    <span>Yêu thích</span>
                  </button>
                  <button type="button" onClick={() => addToCompare(currentProduct)} className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-[color:var(--color-gold)]" aria-label="So sánh">
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>So sánh</span>
                  </button>
                  <button type="button" onClick={handleShare} className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-[color:var(--color-gold)]" aria-label="Chia sẻ">
                    <Share2 className="h-4 w-4" />
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>

              {/* Shipping trust micro-copy */}
              <p className="text-center text-[10px] uppercase tracking-[0.16em] text-muted">
                🔒 Giao hàng bảo mật · Được bảo hiểm toàn trình
              </p>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 py-6">
                <div className="rounded-lg bg-gradient-to-br from-[color:var(--color-gold)]/8 to-transparent border border-[color:var(--color-gold)]/20 p-4 text-center">
                  <ShieldCheck className="mx-auto mb-2.5 h-5 w-5 text-[color:var(--color-gold)]" />
                  <p className="text-xs font-semibold text-primary">Bảo hành</p>
                  <p className="text-[10px] text-secondary mt-1">5 năm quốc tế</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-[color:var(--color-gold)]/8 to-transparent border border-[color:var(--color-gold)]/20 p-4 text-center">
                  <Truck className="mx-auto mb-2.5 h-5 w-5 text-[color:var(--color-gold)]" />
                  <p className="text-xs font-semibold text-primary">Vận chuyển</p>
                  <p className="text-[10px] text-secondary mt-1">Toàn quốc miễn phí</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-green-500/8 to-transparent border border-green-500/20 p-4 text-center">
                  <div className="mx-auto mb-2.5 h-5 w-5 flex items-center justify-center text-green-600 font-bold">0%</div>
                  <p className="text-xs font-semibold text-primary">Trả góp</p>
                  <p className="text-[10px] text-secondary mt-1">Linh hoạt</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-blue-500/8 to-transparent border border-blue-500/20 p-4 text-center">
                  <div className="mx-auto mb-2.5 h-5 w-5 flex items-center justify-center text-blue-600 text-sm font-bold">↔</div>
                  <p className="text-xs font-semibold text-primary">Đổi trả</p>
                  <p className="text-[10px] text-secondary mt-1">30 ngày</p>
                </div>
              </div>

              <div className="border-t border-black/8 pt-6 dark:border-white/8">
                <ProductTrustBadges product={currentProduct} stock={activeStock} />
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[1.6rem] border border-black/10 bg-surface p-5 shadow-sm dark:border-white/10 sm:p-7">
          <div className="custom-scrollbar flex gap-3 overflow-x-auto border-b border-black/8 pb-3 dark:border-white/8">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${activeTab === tab.id ? "bg-[color:var(--color-gold)]/14 text-[color:var(--color-gold)]" : "text-secondary hover:text-primary"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="pt-5"
            >
              {activeTab === "description" && (
                <div className="max-w-4xl space-y-5">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm leading-relaxed text-secondary sm:text-base">{currentProduct.description}</p>
                  </div>
                  {currentProduct.specs?.movement?.caliber && (
                    <div className="bg-[color:var(--color-gold)]/8 border border-[color:var(--color-gold)]/20 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Công nghệ & Chế tác</p>
                      <ul className="grid grid-cols-2 gap-3 text-xs text-secondary">
                        <li>• <span className="font-medium">Chuyển động:</span> {translateSpecValue(currentProduct.specs?.movement?.type)}</li>
                        <li>• <span className="font-medium">Caliber:</span> {currentProduct.specs?.movement?.caliber}</li>
                        {currentProduct.specs?.movement?.powerReserve && <li>• <span className="font-medium">Dự trữ cót:</span> {currentProduct.specs?.movement?.powerReserve}</li>}
                        {currentProduct.specs?.waterResistance && <li>• <span className="font-medium">Chống nước:</span> {currentProduct.specs?.waterResistance}</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "specs" && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {specsRows.length > 0 ? (
                    specsRows.map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-xl border border-black/8 bg-surface-soft px-4 py-3 text-sm dark:border-white/8">
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
                  <div className="rounded-xl border border-black/8 bg-surface-soft p-4 text-sm text-secondary dark:border-white/8">
                    <p className="font-semibold text-primary">Vận chuyển</p>
                    <p className="mt-2">Miễn phí toàn quốc cho mọi đơn hàng, hỗ trợ giao nhanh tại các thành phố lớn.</p>
                  </div>
                  <div className="rounded-xl border border-black/8 bg-surface-soft p-4 text-sm text-secondary dark:border-white/8">
                    <p className="font-semibold text-primary">Đổi trả</p>
                    <p className="mt-2">Đổi hoặc trả trong 7 đến 30 ngày tùy tình trạng sản phẩm và chính sách bảo hành.</p>
                  </div>
                  <div className="rounded-xl border border-black/8 bg-surface-soft p-4 text-sm text-secondary dark:border-white/8">
                    <p className="font-semibold text-primary">Bảo hành</p>
                    <p className="mt-2">Bảo hành quốc tế 5 năm, hỗ trợ kiểm tra và bảo dưỡng định kỳ tại hệ thống cửa hàng.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {relatedProducts.length > 0 && (
          <section className="pt-8 pb-8 border-t border-black/8 dark:border-white/8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-gold)]">Bộ sưu tập</p>
                <h2 className="mt-3 text-3xl font-serif font-light text-primary">Những chiếc đồng hồ tương tự</h2>
                <p className="mt-2 text-sm text-secondary leading-relaxed">Khám phá thêm những mẫu đồng hồ cao cấp trong cùng tầm giá và phong cách.</p>
              </div>
              <Link
                to="/catalog"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary transition hover:text-[color:var(--color-gold)] whitespace-nowrap ml-4"
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

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-black/10 dark:border-white/10 p-3 shadow-[0_-8px_20px_rgba(0,0,0,0.04)] md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-primary">{currentProduct.name}</p>
            <p className="text-xs font-bold text-[color:var(--color-gold)]">{currentProduct.price.toLocaleString("vi-VN")} đ</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={activeStock <= 0}
            className="btn-base btn-primary h-11 px-5 shrink-0 shadow-lg shadow-black/20"
          >
            <ShoppingBag className="h-4 w-4" />
            {activeStock > 0 ? "Sở hữu ngay" : "Hết hàng"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
