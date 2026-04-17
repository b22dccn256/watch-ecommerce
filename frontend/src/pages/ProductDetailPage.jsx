import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, Heart, Minus, Plus, Share2, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
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
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import { SkeletonProductDetail } from "../components/SkeletonLoaders";
import Input from "../components/ui/Input";

const tabItems = [
  { id: "description", label: "Mô tả" },
  { id: "specs", label: "Thông số" },
  { id: "policy", label: "Chính sách" },
];

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
      .get(`/products?category=${encodeURIComponent(currentProduct.category || "")}&limit=8`)
      .then((res) => {
        const list = (res.data.products || []).filter((item) => item._id !== currentProduct._id).slice(0, 4);
        setRelatedProducts(list);
      })
      .catch(() => setRelatedProducts([]));
  }, [currentProduct]);

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

  const hasWristOptions = currentProduct.wristSizeOptions?.length > 0;

  const activeStock = useMemo(() => {
    if (!hasWristOptions) return currentProduct.stock;
    const selected = currentProduct.wristSizeOptions.find((item) => item.size === selectedWristOption);
    return selected ? selected.stock : 0;
  }, [currentProduct.stock, currentProduct.wristSizeOptions, hasWristOptions, selectedWristOption]);

  const specsRows = [
    ["Loại máy", currentProduct.specs?.movement?.type],
    ["Caliber", currentProduct.specs?.movement?.caliber],
    ["Dự trữ cót", currentProduct.specs?.movement?.powerReserve],
    ["Đường kính", currentProduct.specs?.case?.diameter],
    ["Độ dày", currentProduct.specs?.case?.thickness],
    ["Chất liệu vỏ", currentProduct.specs?.case?.material],
    ["Chất liệu dây", currentProduct.specs?.strap?.material],
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
    <div className="min-h-screen pb-14 pt-24">
      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted">
          <Link to="/" className="transition hover:text-primary">Trang chủ</Link>
          <span>/</span>
          <Link to="/catalog" className="transition hover:text-primary">{category}</Link>
          <span>/</span>
          <span className="text-[color:var(--color-gold)]">Chi tiết</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 xl:gap-12">
          <section className="lg:col-span-6">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-[1.8rem] border border-black/10 bg-surface p-4 shadow-md dark:border-white/10">
                <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-[color:var(--color-surface-2)]">
                  <Zoom>
                    <img src={images[activeImage]} alt={currentProduct.name} className="h-full w-full object-contain p-5 sm:p-8" />
                  </Zoom>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/8 to-transparent" />

                  <div className="absolute left-4 top-4 flex flex-col gap-2">
                    {discount > 0 && (
                      <span className="rounded-full border border-black/20 bg-black/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                        Sale {discount}%
                      </span>
                    )}
                    {activeStock <= 0 && (
                      <span className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                        Hết hàng
                      </span>
                    )}
                  </div>
                </div>

                <div className="custom-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={image + index}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border ${activeImage === index ? "border-[color:var(--color-gold)]" : "border-black/10 dark:border-white/10"}`}
                    >
                      <img src={image} alt={`${currentProduct.name} ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-6">
            <div className="space-y-6 rounded-[1.8rem] border border-black/10 bg-surface p-6 shadow-md dark:border-white/10 sm:p-8">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--color-gold)]">{brand}</p>
                <h1 className="hero-title text-4xl leading-tight text-primary sm:text-5xl">{currentProduct.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <div className="flex items-center gap-1 text-[color:var(--color-gold)]">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold">{currentProduct.averageRating?.toFixed(1) || "5.0"}</span>
                  </div>
                  <span>({currentProduct.reviewsCount || 0} đánh giá)</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="price-display text-4xl">{currentProduct.price.toLocaleString("vi-VN")} đ</p>
                {currentProduct.originalPrice && (
                  <p className="price-original text-lg">{currentProduct.originalPrice.toLocaleString("vi-VN")} đ</p>
                )}
                <p className="text-sm text-muted">Đã bao gồm VAT. Bảo hành quốc tế 5 năm.</p>
              </div>

              <p className="text-sm leading-relaxed text-secondary sm:text-base">{currentProduct.description}</p>

              {currentProduct.colors?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Màu sắc</p>
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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Kích thước</p>
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
                <Input
                  label="Chu vi cổ tay (mm)"
                  name="wrist-size"
                  value={wristSize}
                  onChange={(event) => setWristSize(event.target.value)}
                  placeholder="Ví dụ: 165"
                  hint="Tùy chọn này dùng cho dịch vụ cắt dây miễn phí"
                />
              )}

              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Số lượng</p>
                <div className="inline-flex items-center rounded-full border border-black/10 bg-[color:var(--color-surface-2)] p-1 dark:border-white/10">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="btn-base btn-ghost h-8 w-8 rounded-full p-0">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => Math.min(10, value + 1))} className="btn-base btn-ghost h-8 w-8 rounded-full p-0">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={activeStock <= 0}
                  className="btn-base btn-primary h-12"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {activeStock > 0 ? "Thêm vào giỏ hàng" : "Tạm hết hàng"}
                </button>

                <button type="button" onClick={() => toggleWishlist(currentProduct, !!user)} className="btn-base btn-secondary h-12 w-12 rounded-full p-0" aria-label="Yêu thích">
                  <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current text-[color:var(--color-gold)]" : ""}`} />
                </button>
                <button type="button" onClick={() => addToCompare(currentProduct)} className="btn-base btn-secondary h-12 w-12 rounded-full p-0" aria-label="So sánh">
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={handleShare} className="btn-base btn-outline h-12 w-12 rounded-full p-0" aria-label="Chia sẻ">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-black/8 pt-5 dark:border-white/8 sm:grid-cols-4">
                <div className="rounded-xl bg-surface-soft p-3 text-center text-xs text-secondary"><ShieldCheck className="mx-auto mb-1 h-4 w-4 text-[color:var(--color-gold)]" />Bảo hành 5 năm</div>
                <div className="rounded-xl bg-surface-soft p-3 text-center text-xs text-secondary"><Truck className="mx-auto mb-1 h-4 w-4 text-[color:var(--color-gold)]" />Giao hàng toàn quốc</div>
                <div className="rounded-xl bg-surface-soft p-3 text-center text-xs text-secondary">Trả góp 0%</div>
                <div className="rounded-xl bg-surface-soft p-3 text-center text-xs text-secondary">Đổi trả 30 ngày</div>
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
                <p className="max-w-4xl text-sm leading-relaxed text-secondary sm:text-base">{currentProduct.description}</p>
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

        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="hero-title text-2xl">Sản phẩm tương tự</h2>
            <Link to="/catalog" className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary transition hover:text-[color:var(--color-gold)]">
              Xem tất cả
            </Link>
          </div>

          {relatedProducts.length > 0 ? (
            <div className="product-grid-4">
              {relatedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Không có sản phẩm tương tự.</p>
          )}
        </section>

        <PeopleAlsoBought />
      </div>
    </div>
  );
};

export default ProductDetailPage;
