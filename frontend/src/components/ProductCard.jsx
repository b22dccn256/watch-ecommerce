import toast from "react-hot-toast";
import { ShoppingCart, Star, Heart, Eye, TrendingUp, ShieldCheck, ArrowLeftRight, Sparkles } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useCompareStore } from "../stores/useCompareStore";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { shallow } from "zustand/shallow";
import Button from "./ui/Button";
import ProductBadge from "./ui/ProductBadge";

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
	const [showQuickView, setShowQuickView] = useState(false);
	const [isAddingToCart, setIsAddingToCart] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);

	const isWishlisted = Array.isArray(wishlist) && wishlist.some((w) => w._id === product._id);
	const isCompared = compareItems?.some((c) => c._id === product._id);
	const isOutOfStock = product.stock !== undefined && product.stock <= 0;

	// Discount calculation
	const discountPercent = product.originalPrice && product.price < product.originalPrice
		? Math.round((1 - product.price / product.originalPrice) * 100)
		: null;

	const handleAddToCart = async (e) => {
		e.stopPropagation();
		if (!user) {
			toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng", { id: "login" });
			return;
		}
		try {
			setIsAddingToCart(true);
			await addToCart(product);
			toast.success("Đã thêm vào giỏ hàng");
		} catch (err) {
			console.error(err);
			toast.error("Không thể thêm vào giỏ hàng");
		} finally {
			setIsAddingToCart(false);
		}
	};

	const brandLabel = product.brand?.name || product.brand || "Thương hiệu";
	const brandLogo = product.brand?.logo || null;
	const productImage = product.image || "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop";
	const isBestSeller = Boolean(product.isBestSeller || product.salesCount >= 20);
	const hasDiscount = Boolean(discountPercent || product.salePercentage || product.discount);
	const isFeaturedCard = Boolean(isBestSeller || hasDiscount || product.isFeatured);

	const cardToneClass = isFeaturedCard
		? "bg-[#111111] border-luxury-gold/20 dark:border-luxury-gold/25"
		: "card-surface dark:bg-luxury-darker dark:border-luxury-border";
	const contentToneClass = isFeaturedCard
		? "bg-gradient-to-b from-[#16120c] to-[#0f0f0f] text-white"
		: "";
	const metaTextClass = isFeaturedCard
		? "text-white/55"
		: "text-gray-400 dark:text-luxury-text-muted";
	const titleClass = isFeaturedCard
		? "text-white"
		: "text-gray-900 dark:text-luxury-text-light";
	const priceRowBorderClass = isFeaturedCard
		? "border-white/10"
		: "border-gray-100 dark:border-luxury-border";
	const mediaControlClass = "absolute z-30 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 transition";

	const handleOpenDetail = () => {
		navigate(`/product/${product._id}`);
	};

	return (
		<>
		<motion.article
			whileHover={{
				y: -5,
				boxShadow: "0 28px 80px -28px rgba(201,166,107,0.48)",
			}}
			transition={{ type: "spring", stiffness: 300, damping: 28 }}
			className={`group relative overflow-hidden rounded-3xl border transition-all duration-200 flex flex-col ${cardToneClass}`}
		>
			{/* ── Image Zone ─────────────────────────── */}
			<div
				onClick={handleOpenDetail}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						handleOpenDetail();
					}
				}}
				className="relative w-full aspect-[4/5] overflow-hidden bg-black flex-shrink-0 cursor-pointer"
			>
				<img
					loading="lazy"
					src={productImage}
					alt={product.name}
					onLoad={() => setImageLoaded(true)}
					onError={() => setImageLoaded(true)}
					className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
				/>
				<div className={`absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10 transition-opacity duration-500 ${imageLoaded ? "opacity-0" : "opacity-100"} skeleton-shimmer`} />

				{/* Dark gradient overlay on hover */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/74 via-black/10 to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_45%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

				{/* TOP-LEFT: Brand badge */}
				<div className="absolute top-3 left-3 flex items-center gap-2 z-20">
					{brandLogo ? (
						<img src={brandLogo} alt={brandLabel} className="h-8 w-auto rounded-md shadow-sm bg-white/85 p-1" />
					) : (
						<div className="px-3 py-1 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800 dark:text-white shadow-sm">
							{brandLabel}
						</div>
					)}
					{isBestSeller && <ProductBadge tone="dark">Best seller</ProductBadge>}
				</div>

				{/* TOP-RIGHT: Wishlist heart */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						toggleWishlist(product, !!user);
					}}
					className={`${mediaControlClass} top-3 right-3 text-white hover:text-red-500`}
					title="Wishlist"
				>
					<motion.div whileTap={{ scale: 1.3 }}>
						<Heart className={`${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-900 dark:text-white"} w-5 h-5`} />
					</motion.div>
				</button>

				{/* RIGHT-SIDE BELOW WISHLIST: Compare */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						isCompared ? removeFromCompare(product._id) : addToCompare(product);
					}}
					className={`${mediaControlClass} top-14 right-3 text-white hover:text-blue-400 opacity-0 group-hover:opacity-100 flex items-center justify-center`}
					title="So sánh"
				>
					<motion.div whileTap={{ scale: 1.3 }} className="flex items-center gap-1">
						<ArrowLeftRight className={`${isCompared ? "text-blue-400" : "text-white"} w-5 h-5`} />
						<span className="sr-only">{isCompared ? "Xóa khỏi so sánh" : "Thêm vào so sánh"}</span>
					</motion.div>
				</button>

				{/* BOTTOM-LEFT: Quick view */}
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						setShowQuickView(true);
					}}
					className="absolute bottom-3 left-3 z-20 bg-white/90 dark:bg-black/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:scale-110 transition opacity-0 group-hover:opacity-100"
					title="Xem nhanh"
				>
					<Eye className="w-4 h-4 text-gray-800 dark:text-white" />
				</button>

				{/* BOTTOM-RIGHT: Movement badge */}
				{product.type && <ProductBadge tone="accent" className="absolute bottom-3 right-3 z-20">{product.type}</ProductBadge>}

				{/* Discount badge */}
				{hasDiscount && (
					<ProductBadge tone="danger" className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
						<TrendingUp className="w-3 h-3" />
						Sale{discountPercent ? ` -${discountPercent}%` : ""}
					</ProductBadge>
				)}

				{/* Out of stock overlay */}
				{isOutOfStock && (
					<div className="absolute inset-0 bg-black/60 flex items-center justify-center z-40">
						<span className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider">
							Hết hàng
						</span>
					</div>
				)}
			</div>

			{/* ── Content Zone ────────────────────────── */}
				<div className={`p-5 flex flex-col gap-2.5 flex-1 ${contentToneClass}`}>
				{/* Category label */}
					<p className={`text-[10px] font-semibold tracking-widest uppercase line-clamp-1 ${metaTextClass}`}>
					{product.categoryId?.name || product.category || "Đồng hồ luxury"}
				</p>

				{/* Product name */}
					<h3 className={`heading-section line-clamp-2 leading-snug ${titleClass}`}>
					{product.name}
				</h3>

				{/* Warranty tag */}
					<div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
					<ShieldCheck className="w-3 h-3" />
					<span>Bảo hành Quốc tế 5 Năm</span>
				</div>

					{isFeaturedCard && (
						<div className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-luxury-gold/25 bg-luxury-gold/10 px-2.5 py-1 text-[10px] font-semibold text-luxury-gold">
							<Sparkles className="h-3 w-3" />
							Curated highlight
						</div>
					)}

				{/* Star rating */}
				<div className="flex items-center gap-1 mt-auto">
					{Array.from({ length: 5 }).map((_, i) => (
						<Star
							key={i}
							className={`w-3.5 h-3.5 ${i < Math.round(product.rating || 4) ? "text-luxury-gold fill-luxury-gold" : "text-gray-200 dark:text-luxury-text-muted"}`}
						/>
					))}
					{product.reviews > 0 && (
						<span className="text-[10px] text-gray-400 dark:text-luxury-text-muted ml-1">({product.reviews})</span>
					)}
				</div>

				{/* Price row */}
					<div className={`flex items-end justify-between gap-2 mt-2 pt-3 border-t ${priceRowBorderClass}`}>
					<div className="flex flex-col min-w-0">
							<span className="text-lg font-bold text-luxury-gold leading-tight">
							{product.price?.toLocaleString("vi-VN")} ₫
						</span>
						{product.originalPrice && (
							<span className="text-xs text-gray-400 dark:text-luxury-text-muted line-through">
								{product.originalPrice?.toLocaleString("vi-VN")} ₫
							</span>
						)}
					</div>

						<Button
						onClick={handleAddToCart}
						disabled={isOutOfStock || isAddingToCart}
							size="sm"
							className="flex-shrink-0 text-xs shadow-md shadow-luxury-gold/20 group-hover:shadow-lg group-hover:shadow-luxury-gold/30"
					>
						{isAddingToCart ? (
							<span className="h-3.5 w-3.5 rounded-full border-2 border-lux-dark/30 border-t-lux-dark animate-spin" />
						) : (
							<ShoppingCart className="w-3.5 h-3.5" />
						)}
						{isAddingToCart ? "Đang thêm" : "Thêm"}
						</Button>
				</div>

			</div>
		</motion.article>

				<AnimatePresence>
					{showQuickView && (
						<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQuickView(false)}>
							<motion.div
								initial={{ opacity: 0, scale: 0.96, y: 16 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.96, y: 16 }}
								transition={{ duration: 0.2 }}
								onClick={(e) => e.stopPropagation()}
								className="w-full max-w-4xl rounded-3xl overflow-hidden bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border shadow-2xl"
							>
								<div className="grid grid-cols-1 md:grid-cols-2">
									<div className="relative bg-black">
										<img src={productImage} alt={product.name} className="w-full h-full object-cover min-h-[360px]" />
										<button
											type="button"
											onClick={() => setShowQuickView(false)}
											className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 text-gray-800 font-bold shadow-lg"
										>
											×
										</button>
									</div>
									<div className="p-6 md:p-8 flex flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,245,240,0.98))] dark:bg-luxury-darker">
										<p className="text-xs font-semibold tracking-[0.3em] text-gray-400 uppercase">Xem nhanh</p>
										<h3 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white leading-tight">{product.name}</h3>
										<p className="mt-2 text-sm uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">{brandLabel}</p>
										<p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4">{product.description || "Mẫu đồng hồ cao cấp được chọn lọc kỹ lưỡng về thiết kế, độ hoàn thiện và giá trị sử dụng lâu dài."}</p>
										<div className="mt-6 flex items-end justify-between gap-3">
											<div>
												<p className="text-xs uppercase tracking-[0.2em] text-gray-400">Giá</p>
												<p className="text-3xl font-bold text-luxury-gold">{product.price?.toLocaleString("vi-VN")} ₫</p>
											</div>
											<button
												onClick={handleAddToCart}
												disabled={isOutOfStock || isAddingToCart}
												className="flex items-center gap-2 bg-luxury-gold hover:bg-amber-400 active:scale-95 text-lux-dark px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-luxury-gold/20"
											>
												{isAddingToCart ? (
													<span className="h-4 w-4 rounded-full border-2 border-lux-dark/30 border-t-lux-dark animate-spin" />
												) : (
													<ShoppingCart className="w-4 h-4" />
												)}
												{isAddingToCart ? "Đang thêm" : "Thêm vào giỏ"}
											</button>
										</div>
										<div className="mt-6 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
											<ShieldCheck className="w-3.5 h-3.5" />
											<span>Bảo hành Quốc tế 5 Năm</span>
										</div>
									</div>
								</div>
							</motion.div>
						</div>
					)}
				</AnimatePresence>
			</>
	);
};

export default ProductCard;
