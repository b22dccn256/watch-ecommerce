import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useUserStore } from "../stores/useUserStore";
import { Heart, ShoppingCart, Star, Clock, ShieldCheck, Truck, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import ProductCard from "../components/ProductCard";

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentProduct, fetchProductById, fetchFilteredProducts, products } = useProductStore();
    const { addToCart } = useCartStore();
    const { wishlist, toggleWishlist } = useWishlistStore();
    const { user } = useUserStore();
    const [selectedImage, setSelectedImage] = useState(0);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);

    const images = currentProduct?.images || [currentProduct?.image]; // fallback

    useEffect(() => {
        fetchProductById(id);
    }, [id, fetchProductById]);

    useEffect(() => {
        if (currentProduct) {
            const inWish = wishlist.some((item) => item._id === currentProduct._id);
            setIsInWishlist(inWish);

            // Fetch SP tương tự cùng category
            import('../lib/axios').then(({ default: axios }) => {
                axios.get(`/products?category=${encodeURIComponent(currentProduct.category || '')}&limit=5`)
                    .then(res => {
                        const filtered = (res.data.products || []).filter(p => p._id !== currentProduct._id).slice(0, 4);
                        setRelatedProducts(filtered);
                    })
                    .catch(() => { });
            });
        }
    }, [currentProduct, wishlist]);

    const handleAddToCart = () => {
        if (!currentProduct) return;
        if (currentProduct.stock < 1) {
            toast.error("Sản phẩm đã hết hàng!");
            return;
        }
        addToCart(currentProduct);
    };

    if (!currentProduct) return <div className="text-center py-32">Đang tải...</div>;

    const discount = currentProduct.originalPrice
        ? Math.round(((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0c08] text-gray-900 dark:text-white pt-20 pb-16 transition-colors duration-300">
            <div className="max-w-screen-2xl mx-auto px-6">
                {/* Breadcrumb */}
                <div className="text-sm text-gray-400 mb-8">
                    Trang chủ / Đồng hồ nam /{" "}
                    <span className="text-yellow-400">{currentProduct.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* ==================== PHẦN ẢNH ==================== */}
                    <div>
                        <motion.div
                            className="relative bg-black rounded-3xl overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <img
                                src={images[selectedImage]}
                                alt={currentProduct.name}
                                className="w-full aspect-square object-cover cursor-zoom-in"
                                onClick={() => window.open(images[selectedImage], "_blank")}
                            />
                            <button className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-6 py-2 rounded-full border border-white/30">
                                ZOOM HÌNH ẢNH
                            </button>
                        </motion.div>

                        {/* Thumbnail */}
                        <div className="flex gap-4 mt-6">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${selectedImage === idx ? "border-yellow-400" : "border-transparent"}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ==================== THÔNG TIN SẢN PHẨM ==================== */}
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-emerald-400">{currentProduct.brand || 'Luxury Watch'}</span>
                            <div className="flex text-yellow-400">
                                {'★'.repeat(Math.round(currentProduct.rating || 0))}
                                {'☆'.repeat(5 - Math.round(currentProduct.rating || 0))}
                                <span className="text-white/70 ml-2">({currentProduct.numReviews || 0} đánh giá)</span>
                            </div>
                        </div>

                        <h1 className="text-5xl font-bold mt-2 leading-tight">{currentProduct.name}</h1>

                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${currentProduct.stock > 0
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                                }`}>
                                {currentProduct.stock > 0 ? `Còn hàng (${currentProduct.stock} cái)` : 'Hết hàng'}
                            </span>
                            <span className="text-sm text-gray-400">Mã: {currentProduct._id.slice(-6)}</span>
                        </div>

                        {/* Giá */}
                        <div className="mt-8">
                            <div className="flex items-baseline gap-4">
                                <span className="text-5xl font-bold text-yellow-400">
                                    {currentProduct.price.toLocaleString("vi-VN")}đ
                                </span>
                                {discount > 0 && (
                                    <>
                                        <span className="text-2xl line-through text-gray-500">
                                            {currentProduct.originalPrice?.toLocaleString("vi-VN")}đ
                                        </span>
                                        <span className="text-red-500 font-medium">-{discount}%</span>
                                    </>
                                )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">Giá đã bao gồm VAT và bảo hành quốc tế 5 năm</p>
                        </div>

                        <p className="mt-8 text-gray-300 leading-relaxed">{currentProduct.description}</p>

                        {/* Nút hành động */}
                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition"
                            >
                                🛒 THÊM VÀO GIỎ HÀNG
                            </button>
                            <button
                                onClick={() => toggleWishlist(currentProduct, !!user)}
                                className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition ${isInWishlist ? "border-red-500 text-red-500 bg-red-500/10" : "border-white/30 hover:border-yellow-400"}`}
                            >
                                <motion.div whileTap={{ scale: 1.4 }}>
                                    <Heart className={`w-7 h-7 ${isInWishlist ? "fill-red-500" : ""}`} />
                                </motion.div>
                            </button>
                        </div>

                        {/* Thông số kỹ thuật */}
                        <div className="mt-16">
                            <h3 className="text-xl font-semibold mb-6">Thông số kỹ thuật</h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
                                <div><span className="text-gray-400">Bộ máy:</span> {currentProduct.type || "Tự động (Automatic)"}</div>
                                <div><span className="text-gray-400">Đường kính:</span> 40 mm</div>
                                <div><span className="text-gray-400">Chất liệu vỏ:</span> Thép Oystersteel</div>
                                <div><span className="text-gray-400">Chống nước:</span> 100 mét (330 feet)</div>
                                <div><span className="text-gray-400">Kính:</span> Sapphire chống trầy</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SẢN PHẨM TƯƠNG TỰ */}
                <div className="mt-24">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold">Sản phẩm tương tự</h2>
                        <Link to="/catalog" className="text-yellow-400 hover:underline">Xem tất cả →</Link>
                    </div>
                    {relatedProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                            {relatedProducts.map(p => (
                                <div
                                    key={p._id}
                                    onClick={() => navigate(`/product/${p._id}`)}
                                    className="cursor-pointer group bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-yellow-400/50 transition-all duration-300"
                                >
                                    <div className="aspect-square overflow-hidden">
                                        <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-emerald-400 font-semibold mb-1">{p.brand || p.category}</p>
                                        <h4 className="text-sm font-bold text-white line-clamp-2 mb-2">{p.name}</h4>
                                        <p className="text-yellow-400 font-bold">{p.price?.toLocaleString('vi-VN')}đ</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">Không có sản phẩm tương tự.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;