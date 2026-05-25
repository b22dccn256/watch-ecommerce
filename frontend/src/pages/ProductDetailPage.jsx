import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftRight, Heart, Share2, ShoppingBag, MessageCircle, MapPin, Gift, CreditCard, ShieldCheck, ShoppingCart, Info, Phone, CheckCircle2, Truck } from "lucide-react";
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
import { SkeletonProductDetail } from "../components/SkeletonLoaders";
import ReviewsList from "../components/ReviewsList";
import NotFoundPage from "./NotFoundPage";
import { buildProductPath } from "../utils/productUrl";
import { MOVEMENT_LABELS } from "../constants/watchFilters";

const ProductDetailPage = () => {
  const { slugToken, slug, token } = useParams();
  const navigate = useNavigate();

  const { currentProduct, fetchProductBySlug, loading, notFound } = useProductStore();
  const addToCart = useCartStore((state) => state.addToCart);
  const { wishlist, toggleWishlist } = useWishlistStore();
  const addToCompare = useCompareStore((state) => state.addToCompare);
  const user = useUserStore((state) => state.user);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedWristSize, setSelectedWristSize] = useState(null);

  const routeSlugToken = slugToken || (slug && token ? `${slug}--${token}` : null);
  const [routeSlug, routeToken] = useMemo(() => {
    if (slug && token) return [slug, token];
    if (!routeSlugToken || !routeSlugToken.includes("--")) return [null, null];
    const [parsedSlug, parsedToken] = routeSlugToken.split("--");
    return [parsedSlug || null, parsedToken || null];
  }, [routeSlugToken, slug, token]);

  // Refs for scroll-to-section
  const promosRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!currentProduct || !routeSlug || !routeToken) return;

    const canonicalPath = buildProductPath(currentProduct);
    if (!canonicalPath) return;

    const canonicalUrl = `${window.location.origin}${canonicalPath}`;
    const metaEntries = [
      ["property", "og:url", canonicalUrl],
      ["property", "og:title", currentProduct.name],
      ["property", "og:description", currentProduct.metaDescription || currentProduct.description || currentProduct.name],
      ["property", "og:image", currentProduct.image],
      ["name", "twitter:url", canonicalUrl],
      ["name", "twitter:title", currentProduct.name],
      ["name", "twitter:description", currentProduct.metaDescription || currentProduct.description || currentProduct.name],
      ["name", "twitter:image", currentProduct.image],
      ["name", "twitter:card", "summary_large_image"],
    ];

    const upsertMeta = (attr, key, value) => {
      if (!value) return null;
      const selector = `meta[data-product-meta="true"][${attr}="${key}"]`;
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("data-product-meta", "true");
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute("content", value);
      return element;
    };

    const previousTitle = document.title;
    const canonicalLinkSelector = 'link[rel="canonical"][data-product-meta="true"]';
    let canonicalLink = document.head.querySelector(canonicalLinkSelector);
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      canonicalLink.setAttribute("data-product-meta", "true");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    const createdNodes = metaEntries
      .map(([attr, key, value]) => upsertMeta(attr, key, value))
      .filter(Boolean);

    document.title = `${currentProduct.name} | CellphoneS-style`;

    return () => {
      document.title = previousTitle;
      createdNodes.forEach((node) => node.remove());
      const link = document.head.querySelector(canonicalLinkSelector);
      if (link) link.remove();
    };
  }, [currentProduct, routeSlug, routeToken]);

  useEffect(() => {
    if (routeSlug && routeToken) {
      fetchProductBySlug(routeSlug, routeToken);
    }
    window.scrollTo(0, 0);
  }, [fetchProductBySlug, routeSlug, routeToken]);

  useEffect(() => {
    if (!currentProduct || !routeSlug || !routeToken) return;
    const canonicalPath = buildProductPath(currentProduct);
    if (canonicalPath && (currentProduct.slug !== routeSlug || currentProduct.slugToken !== routeToken)) {
      navigate(canonicalPath, { replace: true });
    }
  }, [currentProduct, navigate, routeSlug, routeToken]);

  useEffect(() => {
    if (!currentProduct) return;

    setActiveImage(0);
    setQuantity(1);
    setSelectedColor(currentProduct.colors?.[0] || null);
    setSelectedSize(currentProduct.sizes?.[0] || null);

    const firstAvailableWristSize = currentProduct.wristSizeOptions?.find(opt => opt.stock > 0)?.size 
      || currentProduct.wristSizeOptions?.[0]?.size 
      || null;
    setSelectedWristSize(firstAvailableWristSize);

    const categoryParam = currentProduct.categoryId?._id || currentProduct.category || "";
    axios
      .get(`/products?category=${encodeURIComponent(categoryParam)}&limit=12`)
      .then((res) => {
        const all = (res.data.products || []).filter((item) => item._id !== currentProduct._id);
        setRelatedProducts(all.slice(0, 5));
      })
      .catch(() => setRelatedProducts([]));
  }, [currentProduct]);

  const activeStock = useMemo(() => {
    if (!currentProduct) return 0;
    if (selectedWristSize && currentProduct.wristSizeOptions?.length > 0) {
      const match = currentProduct.wristSizeOptions.find(opt => opt.size === selectedWristSize);
      return match ? match.stock : 0;
    }
    return currentProduct.stock;
  }, [currentProduct, selectedWristSize]);

  if (notFound) {
    return <NotFoundPage />;
  }

  if (loading || !currentProduct) {
    return <SkeletonProductDetail />;
  }

  const isWishlisted = wishlist.some((item) => item._id === currentProduct._id);
  const images = currentProduct.images?.length
    ? currentProduct.images
    : currentProduct.image
      ? [currentProduct.image]
      : ["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1200&auto=format&fit=crop"];

  const category = currentProduct.categoryId?.name || currentProduct.category || "Đồng hồ";
  const brandName = currentProduct.brand?.name || currentProduct.brand || "Không rõ";
  const machineTypeLabel = MOVEMENT_LABELS[currentProduct.type] || currentProduct.type || null;
  const specItems = [
    { label: "Thương hiệu", value: brandName },
    { label: "Bộ máy", value: machineTypeLabel },
    { label: "Chất liệu vỏ", value: currentProduct.specs?.case?.material },
    { label: "Chất liệu dây", value: currentProduct.specs?.strap?.material },
    { label: "Đường kính", value: currentProduct.specs?.case?.diameter },
    { label: "Chống nước", value: currentProduct.specs?.waterResistance },
    { label: "Kính", value: currentProduct.specs?.glass },
    { label: "Bảo hành", value: currentProduct.specs?.warranty },
  ].filter((item) => item.value);

  const handleAddToCart = () => {
    if (activeStock <= 0) return;
    const payload = {
      ...currentProduct,
      quantity: 1, // Fix 1
      selectedColor,
      selectedSize,
      wristSize: selectedWristSize,
    };
    addToCart(payload);
  };

  const handleBuyNow = () => {
      if (activeStock <= 0) return;
      handleAddToCart();
      navigate("/checkout");
  }

  return (
    <div className="min-h-screen bg-[#f1f2f4] text-gray-800 pb-20 pt-14 md:pt-16 font-sans">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-gray-500 py-2 mb-1">
          <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
          <span>/</span>
          <Link to="/catalog" className="hover:text-blue-600">{category}</Link>
          <span>/</span>
          <span className="font-medium text-gray-800 truncate">{currentProduct.name}</span>
        </div>

        {/* Product Title Bar (Top) */}
        <div className="bg-white rounded-t-xl px-4 pt-4 pb-3 border-b flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <h1 className="text-[18px] md:text-[22px] font-bold text-gray-900 leading-tight">
            {currentProduct.name}
          </h1>
          <div className="flex items-center gap-4 text-[13px] text-blue-600">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-yellow-400">{Number(currentProduct.averageRating || 0).toFixed(1)}</span>
                <span className="text-xs text-gray-500">·</span>
                <span className="text-xs text-gray-500">{currentProduct.reviewsCount || 0} đánh giá</span>
              </div>
            </div>
            <button onClick={() => toggleWishlist(currentProduct, !!user)} className="flex items-center gap-1 hover:text-red-500 transition">
              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} /> Yêu thích
            </button>
            <button onClick={() => document.getElementById('qa-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-1 hover:text-blue-800"><MessageCircle className="h-4 w-4" /> Hỏi đáp</button>
            <button onClick={() => addToCompare(currentProduct)} className="flex items-center gap-1 hover:text-blue-800"><ArrowLeftRight className="h-4 w-4" /> So sánh</button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[45%_55%] gap-4 mt-4 relative">
          {/* LEFT COLUMN: Gallery & Specs */}
          <div className="space-y-4">
            {/* Gallery Block */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="relative aspect-square w-full bg-white flex items-center justify-center rounded-lg border border-gray-100 p-4 mb-4">
                <Zoom>
                  <img
                    src={images[activeImage]}
                    alt={currentProduct.name}
                    className="max-h-full w-full object-contain"
                  />
                </Zoom>
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                   <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">TRẢ GÓP 0%</span>
                   <span className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded">CHÍNH HÃNG</span>
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`h-16 w-16 shrink-0 rounded-lg border p-1 transition ${activeImage === idx ? 'border-red-600 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <img src={img} alt={`thumb-${idx}`} className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Thông số nổi bật: moved under gallery */}
              {specItems.length > 0 && (
                <div className="mt-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2">
                    <Info className="h-5 w-5 text-red-600" /> Thông số nổi bật
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {specItems.map((item) => (
                      <div key={item.label} className="rounded-lg border border-gray-200 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Commitments (Cam kết sản phẩm) */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-bold text-[15px] mb-3">Cam kết sản phẩm</h3>
              <div className="grid grid-cols-2 gap-3 text-[13px] text-gray-700">
                <div className="flex gap-2">
                  <ShieldCheck className="h-6 w-6 text-red-500 shrink-0" />
                  <p>Hàng chính hãng 100%, Mới nguyên seal.</p>
                </div>
                <div className="flex gap-2">
                  <ArrowLeftRight className="h-6 w-6 text-red-500 shrink-0" />
                  <p>1 ĐỔI 1 trong 30 ngày nếu có lỗi phần cứng từ nhà sản xuất.</p>
                </div>
                <div className="flex gap-2">
                  <MapPin className="h-6 w-6 text-red-500 shrink-0" />
                  <p>Bảo hành chính hãng 12-60 tháng tại trung tâm ủy quyền.</p>
                </div>
                <div className="flex gap-2">
                  <Info className="h-6 w-6 text-red-500 shrink-0" />
                  <p>Giá sản phẩm đã bao gồm thuế VAT, có hỗ trợ xuất hóa đơn.</p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Actions & Promo */}
          <div className="space-y-4">
            
            {/* Price Box */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Real Price */}
                    <div>
                        <div className="flex items-end gap-3">
                            <span className="text-red-600 font-bold text-[28px] leading-none">
                                {currentProduct.price.toLocaleString("vi-VN")}đ
                            </span>
                            {currentProduct.originalPrice && (
                                <span className="text-gray-400 line-through text-[16px] font-medium leading-none mb-1">
                                    {currentProduct.originalPrice.toLocaleString("vi-VN")}đ
                                </span>
                            )}
                        </div>
                        <p className="text-[12px] text-gray-500 mt-1">Đã bao gồm VAT</p>
                    </div>

                    {/* Trade-in Promo (Thu cũ) */}
                    <div onClick={() => { navigate("/contact"); toast.success("Liên hệ tư vấn thu cũ lên đời!"); }} className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-3 w-full sm:w-auto hover:bg-red-100 cursor-pointer transition">
                        <div>
                            <p className="text-[12px] text-gray-600">Thu cũ lên đời chỉ từ</p>
                            <p className="text-red-600 font-bold text-[18px]">
                                {(currentProduct.price * 0.75).toLocaleString("vi-VN")}đ
                            </p>
                        </div>
                        <div className="bg-white px-2 py-1 rounded text-red-600 border border-red-200 font-bold text-[12px]">
                            Định giá ngay
                        </div>
                    </div>
                </div>

                {/* Tiết kiệm badge */}
                {currentProduct.originalPrice && (
                   <div className="mt-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded text-[13px] px-3 py-1.5 flex items-center justify-between text-blue-900">
                       <span className="flex items-center gap-2">
                           <Gift className="h-4 w-4 text-blue-600" />
                           Tiết kiệm lên đến <b>{(currentProduct.originalPrice - currentProduct.price).toLocaleString("vi-VN")}đ</b>
                       </span>
                       <span onClick={() => scrollToSection(promosRef)} className="font-medium text-blue-600 cursor-pointer hover:underline">Kiểm tra ngay</span>
                   </div>
                )}
            </div>

            {/* Version & Color Selection */}
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                {currentProduct.sizes?.length > 0 && (
                    <div>
                        <h3 className="font-bold text-[15px] mb-2">Phiên bản / Kích cỡ mặt</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {currentProduct.sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 text-center transition ${selectedSize === size ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                >
                                    <span className="font-semibold text-[13px] text-gray-900">{size}</span>
                                    <span className="text-[11px] text-gray-500">Mặc định</span>
                                    {selectedSize === size && (
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-bl-lg rounded-tr-sm flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {currentProduct.colors?.length > 0 && (
                    <div>
                        <h3 className="font-bold text-[15px] mb-2">Màu sắc</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {currentProduct.colors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`relative flex items-center gap-3 p-2 rounded-lg border-2 text-left transition ${selectedColor === color ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                >
                                    <div className="h-10 w-10 shrink-0 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                                        <img src={images[0]} alt="color" className="w-8 h-8 object-contain mix-blend-multiply opacity-80" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-[13px] text-gray-900 block">{color}</span>
                                        <span className="text-[12px] text-red-600 font-medium">{currentProduct.price.toLocaleString("vi-VN")}đ</span>
                                    </div>
                                    {selectedColor === color && (
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-bl-lg rounded-tr-sm flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {currentProduct.wristSizeOptions?.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-[15px]">Chu vi cổ tay / Đo cắt dây (Miễn phí)</h3>
                            <button
                                type="button"
                                onClick={() => navigate("/faq")}
                                className="text-xs text-blue-600 hover:underline font-medium"
                            >
                                Hướng dẫn đo cổ tay
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {currentProduct.wristSizeOptions.map((option) => {
                                const isSelected = selectedWristSize === option.size;
                                const isOut = option.stock <= 0;
                                return (
                                    <button
                                        key={option.size}
                                        type="button"
                                        onClick={() => !isOut && setSelectedWristSize(option.size)}
                                        disabled={isOut}
                                        className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 text-center transition ${isSelected ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-gray-300 bg-white'} ${isOut ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="font-semibold text-[13px] text-gray-900 block">{option.size}</span>
                                        <span className="text-[10px] text-gray-500 font-medium">{isOut ? 'Hết hàng' : `Còn ${option.stock} cái`}</span>
                                        {isSelected && (
                                            <div className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-bl-lg rounded-tr-sm flex items-center justify-center">
                                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Promos */}
            <div ref={promosRef} className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                <div className="bg-red-50 px-4 py-2 border-b border-red-200 flex items-center gap-2">
                    <Gift className="h-5 w-5 text-red-600" />
                    <h3 className="font-bold text-[15px] text-red-600 uppercase">Khuyến mãi đi kèm</h3>
                </div>
                <div className="p-4 space-y-3">
                    {/* Voucher Block */}
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="bg-red-600 text-white rounded text-center w-14 shrink-0 px-1 py-1">
                            <span className="text-[10px] uppercase font-semibold block border-b border-white/30 pb-0.5 mb-0.5">Giảm</span>
                            <span className="text-[13px] font-bold">500K</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-[13px]">Voucher ưu đãi thanh toán</p>
                            <p className="text-[11px] text-gray-500">Áp dụng mua cho đơn hàng thanh toán qua VNPay hoặc Stripe.</p>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText("LUXURYWATCH500K"); toast.success("Đã sao chép mã: LUXURYWATCH500K"); }} className="text-[12px] font-bold bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-red-600 shrink-0">Lấy mã</button>
                    </div>

                    <ul className="text-[13px] space-y-2 text-gray-700">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span>Giảm ngay <b>1.000.000đ</b> khi mua kèm gói bảo hiểm rơi vỡ, vào nước. <span onClick={() => navigate("/warranty")} className="text-blue-600 hover:underline cursor-pointer">Xem chi tiết</span></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span>Tặng phiếu mua hàng trị giá <b>200.000đ</b> cho các phụ kiện Dây đeo đồng hồ.</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Payment offers */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2"><CreditCard className="h-5 w-5 text-red-600" /> Ưu đãi thanh toán</h3>
                <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
                    <div className="min-w-[200px] border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-5 bg-blue-100 rounded text-[9px] font-bold text-blue-800 flex items-center justify-center">VIB</div>
                            <p className="text-[12px] font-bold">Mở thẻ VIB</p>
                        </div>
                        <p className="text-[11px] text-gray-600 mb-2">Hoàn tiền đến 2 triệu đồng khi chi tiêu.</p>
                        <span onClick={() => navigate("/checkout")} className="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline">Chi tiết {'>'}</span>
                    </div>
                    <div className="min-w-[200px] border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-5 bg-black/80 rounded text-[9px] font-bold text-white flex items-center justify-center">STR</div>
                        <p className="text-[12px] font-bold">Thanh toán Stripe</p>
                      </div>
                      <p className="text-[11px] text-gray-600 mb-2">Hỗ trợ thẻ quốc tế cho đơn hàng phù hợp.</p>
                      <span onClick={() => navigate("/checkout")} className="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline">Chi tiết {'>'}</span>
                    </div>
                </div>
            </div>

            {/* Store availability */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                    <h3 className="font-bold text-[14px]">Xem chi nhánh có hàng</h3>
                    <div className="flex gap-2">
                        <select className="border border-gray-300 rounded text-[12px] px-2 py-1 outline-none">
                            <option>Hồ Chí Minh</option>
                            <option>Hà Nội</option>
                        </select>
                        <select className="border border-gray-300 rounded text-[12px] px-2 py-1 outline-none">
                            <option>Quận/Huyện</option>
                            <option>Quận 1</option>
                        </select>
                    </div>
                </div>
                <p className="text-[12px] mb-2 text-green-600 font-medium">Có 12 cửa hàng có sản phẩm</p>
                <div className="grid sm:grid-cols-2 gap-2">
                    <div className="border border-gray-200 rounded p-2 text-[12px]">
                        <p className="font-medium text-gray-800 mb-1">113-115 Xô Viết Nghệ Tĩnh, Q. Bình Thạnh</p>
                        <div className="flex items-center justify-between text-red-600 font-medium">
                            <a href="tel:02871066115" className="flex items-center gap-1 hover:underline"><Phone className="h-3 w-3"/> 02871066115</a>
                            <span onClick={() => window.open("https://www.google.com/maps/search/113-115+X%C3%B4+Vi%E1%BA%BFt+Ngh%E1%BB%87+T%C4%A9nh+B%C3%ACnh+Th%E1%BA%A1nh", "_blank")} className="flex items-center gap-1 cursor-pointer hover:underline"><MapPin className="h-3 w-3"/> Bản đồ</span>
                        </div>
                    </div>
                    <div className="border border-gray-200 rounded p-2 text-[12px]">
                        <p className="font-medium text-gray-800 mb-1">393 Đường 3/2, Q. 10</p>
                        <div className="flex items-center justify-between text-red-600 font-medium">
                            <a href="tel:02871066393" className="flex items-center gap-1 hover:underline"><Phone className="h-3 w-3"/> 02871066393</a>
                            <span onClick={() => window.open("https://www.google.com/maps/search/393+%C4%90%C6%B0%E1%BB%9Dng+3%2F2+Qu%E1%BA%ADn+10", "_blank")} className="flex items-center gap-1 cursor-pointer hover:underline"><MapPin className="h-3 w-3"/> Bản đồ</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 sticky bottom-0 bg-white/80 backdrop-blur-md p-2 rounded-xl sm:static sm:bg-transparent sm:p-0 z-50">
                <div className="flex items-center gap-2 text-[13px] text-gray-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 mb-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span>Chọn địa chỉ giao hàng để nhận <b>Giao nhanh 2h</b> miễn phí</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleBuyNow} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg flex flex-col items-center justify-center py-2.5 transition shadow-lg shadow-red-600/30">
                        <span className="font-bold text-[16px] uppercase">Mua ngay</span>
                        <span className="text-[11px] font-medium opacity-90">(Giao nhanh từ 2 giờ hoặc nhận tại cửa hàng)</span>
                    </button>
                    <button onClick={handleAddToCart} className="w-16 sm:w-20 bg-white border-2 border-red-600 rounded-lg flex flex-col items-center justify-center text-red-600 hover:bg-red-50 transition">
                        <ShoppingCart className="h-6 w-6 mb-0.5" />
                        <span className="text-[9px] font-bold uppercase text-center leading-tight">Thêm vào giỏ</span>
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { toast.success("Chuyển đến trang trả góp 0%"); navigate("/checkout"); }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex flex-col items-center justify-center py-2 transition shadow-lg shadow-blue-600/20">
                        <span className="font-bold text-[14px] uppercase">Trả góp 0%</span>
                        <span className="text-[10px] font-medium opacity-90">Xét duyệt nhanh qua điện thoại</span>
                    </button>
                    <button onClick={() => { toast.success("Chuyển đến trang trả góp qua thẻ"); navigate("/checkout"); }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex flex-col items-center justify-center py-2 transition shadow-lg shadow-blue-600/20">
                        <span className="font-bold text-[14px] uppercase">Trả góp qua thẻ</span>
                        <span className="text-[10px] font-medium opacity-90">Visa, Mastercard, JCB, Amex</span>
                    </button>
                </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews */}
        {currentProduct._id && <ReviewsList productId={currentProduct._id} />}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-[20px] font-bold text-gray-900 mb-4 uppercase">Có thể bạn cũng thích</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {relatedProducts.map((p) => (
                <div key={p._id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition bg-white relative">
                   <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-10">GIẢM 5%</div>
                   <Link to={buildProductPath(p) || "#"}>
                      <img src={p.image} alt={p.name} className="w-full aspect-square object-contain p-2 hover:scale-105 transition duration-300" />
                   </Link>
                   <div className="p-3">
                     <Link to={buildProductPath(p) || "#"} className="font-semibold text-[13px] text-gray-800 line-clamp-2 leading-snug hover:text-red-600">
                          {p.name}
                      </Link>
                      <div className="mt-2 flex items-center gap-2">
                          <span className="text-red-600 font-bold text-[15px]">{p.price.toLocaleString("vi-VN")}đ</span>
                      </div>
                      <div className="mt-1 flex gap-1">
                          <span className="bg-gray-100 text-[10px] px-1.5 py-0.5 rounded text-gray-600">Trả góp 0%</span>
                          {p.colors && p.colors.length > 1 && <span className="bg-gray-100 text-[10px] px-1.5 py-0.5 rounded text-gray-600">{p.colors.length} màu</span>}
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
