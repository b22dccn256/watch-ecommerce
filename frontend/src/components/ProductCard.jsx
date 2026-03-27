import toast from "react-hot-toast";
import { ShoppingCart, Star, Heart, Eye, TrendingUp } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
	const { user } = useUserStore();
	const { addToCart } = useCartStore();
	const { wishlist, toggleWishlist } = useWishlistStore();

	const isWishlisted = Array.isArray(wishlist) && wishlist.some((w) => w._id === product._id);
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
			await addToCart(product);
			toast.success("Đã thêm vào giỏ hàng");
		} catch (err) {
			console.error(err);
			toast.error("Không thể thêm vào giỏ hàng");
		}
	};

	const brandLabel = product.brand?.name || product.brand || "Thương hiệu";
	const brandLogo = product.brand?.logo || null;

	return (
		<motion.article
			whileHover={{
				scale: 1.025,
				boxShadow: "0 24px 60px -10px rgba(212,175,55,0.35)",
				y: -4,
			}}
			transition={{ duration: 0.22, ease: "easeOut" }}
			className="group relative bg-white dark:bg-luxury-darker rounded-2xl overflow-hidden border border-gray-100 dark:border-luxury-border transition-colors duration-200 flex flex-col"
		>
			{/* ── Image Zone ─────────────────────────── */}
			<div className="relative w-full aspect-square overflow-hidden bg-black flex-shrink-0">
				<img
					loading="lazy"
					src={product.image || "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop"}
					alt={product.name}
					className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
				/>

				{/* Dark gradient overlay on hover */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

				{/* TOP-LEFT: Brand badge */}
				<div className="absolute top-3 left-3 flex items-center gap-2 z-20">
					{brandLogo ? (
						<img src={brandLogo} alt={brandLabel} className="h-7 w-auto rounded-md shadow-sm bg-white/80 p-1" />
					) : (
						<div className="px-3 py-1 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800 dark:text-white shadow-sm">
							{brandLabel}
						</div>
					)}
				</div>

				{/* TOP-RIGHT: Wishlist heart */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						toggleWishlist(product, !!user);
					}}
					className="absolute top-3 right-3 z-30 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:text-red-500 transition"
					title="Wishlist"
				>
					<motion.div whileTap={{ scale: 1.3 }}>
						<Heart className={`${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-900 dark:text-white"} w-5 h-5`} />
					</motion.div>
				</button>

				{/* BOTTOM-LEFT: Quick view */}
				<Link
					to={`/product/${product._id}`}
					onClick={(e) => e.stopPropagation()}
					className="absolute bottom-3 left-3 z-20 bg-white/90 dark:bg-black/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:scale-110 transition opacity-0 group-hover:opacity-100"
					title="Xem nhanh"
				>
					<Eye className="w-4 h-4 text-gray-800 dark:text-white" />
				</Link>

				{/* BOTTOM-RIGHT: Movement badge */}
				{product.type && (
					<div className="absolute bottom-3 right-3 z-20 bg-luxury-gold/90 dark:bg-luxury-gold text-lux-dark text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm">
						{product.type}
					</div>
				)}

				{/* Discount badge */}
				{discountPercent && (
					<div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
						<TrendingUp className="w-3 h-3" />
						-{discountPercent}%
					</div>
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
			<div className="p-4 flex flex-col gap-2 flex-1">
				{/* Category label */}
				<p className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-luxury-text-muted uppercase">
					{product.category || "Đồng hồ"}
				</p>

				{/* Product name */}
				<h3 className="text-sm font-semibold text-gray-900 dark:text-luxury-text-light line-clamp-2 leading-snug">
					{product.name}
				</h3>

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
				<div className="flex items-end justify-between gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-luxury-border">
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

					<button
						onClick={handleAddToCart}
						disabled={isOutOfStock}
						className="flex items-center gap-1.5 bg-luxury-gold hover:bg-amber-400 active:scale-95 text-lux-dark px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md shadow-luxury-gold/20"
					>
						<ShoppingCart className="w-3.5 h-3.5" />
						Thêm
					</button>
				</div>

				{/* Detail link – subtle */}
				<Link
					to={`/product/${product._id}`}
					className="text-[11px] text-center text-gray-400 hover:text-luxury-gold transition mt-1 opacity-70 hover:opacity-100"
				>
					Xem chi tiết →
				</Link>
			</div>
		</motion.article>
	);
};

export default ProductCard;
