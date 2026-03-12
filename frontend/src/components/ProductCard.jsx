import toast from "react-hot-toast";
import { ShoppingCart, Star } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
	const { user } = useUserStore();
	const { addToCart } = useCartStore();

	const handleAddToCart = () => {
		if (!user) {
			toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng", { id: "login" });
			return;
		} else {
			addToCart(product);
		}
	};

	return (
		<div className='group relative flex flex-col h-full w-full overflow-hidden rounded-lg border border-gray-200 dark:border-luxury-border bg-white dark:bg-luxury-darker shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-luxury-gold'>
			{/* Product Image */}
			<div className='relative flex w-full aspect-square overflow-hidden rounded-t-lg bg-black'>
				<img loading='lazy' className='object-cover w-full h-full transition-transform duration-300 group-hover:scale-105' src={product.image || "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=200&auto=format&fit=crop"} alt={product.name} />
				<div className='absolute inset-0 bg-gradient-to-t from-luxury-dark/20 to-transparent' />

				{/* Add to Cart Button */}
				<button
					onClick={handleAddToCart}
					className='absolute bottom-4 right-4 bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0'
				>
					<ShoppingCart className="w-5 h-5" />
				</button>
			</div>

			{/* Product Info */}
			<div className='mt-4 px-5 pb-5 flex flex-col flex-grow'>
				{/* Brand/Category */}
				<p className='text-xs font-medium text-gray-500 dark:text-luxury-text-muted uppercase tracking-luxury mb-1'>
					{product.category || 'Luxury Watch'}
				</p>

				{/* Product Name */}
				<h5 className='text-xl font-semibold tracking-tight text-gray-900 dark:text-luxury-text-light mb-2 line-clamp-2 overflow-hidden min-h-[3.5rem]'>
					{product.name}
				</h5>

				{/* Rating */}
				<div className='flex items-center gap-1 mb-3'>
					{[...Array(5)].map((_, i) => (
						<Star
							key={i}
							className={`w-4 h-4 ${i < (product.rating || 4) ? 'text-luxury-gold fill-luxury-gold' : 'text-gray-400 dark:text-luxury-text-muted'}`}
						/>
					))}
					<span className='text-sm text-gray-500 dark:text-luxury-text-muted ml-2'>
						({product.reviews || 0})
					</span>
				</div>

				{/* Price */}
				<div className='flex items-center justify-between mb-4 mt-auto'>
					<div className='flex flex-col'>
						<span className='text-3xl font-bold text-luxury-gold'>
							{product.price?.toLocaleString("vi-VN")} ₫
						</span>
						{product.originalPrice && (
							<span className='text-sm text-gray-400 dark:text-luxury-text-muted line-through'>
								{product.originalPrice?.toLocaleString("vi-VN")} ₫
							</span>
						)}
					</div>

					{/* Discount Badge */}
					{(product.salePercentage || product.discount) && (
						<span className='bg-luxury-accent text-white px-2 py-1 rounded text-xs font-semibold'>
							-{product.salePercentage || product.discount}%
						</span>
					)}
				</div>

				{/* View Details Link */}
				<Link
					to={`/product/${product._id}`}
					className="block text-center bg-gray-100 dark:bg-luxury-darker hover:bg-luxury-gold border border-gray-200 dark:border-luxury-border hover:border-luxury-gold text-gray-900 dark:text-luxury-text-light hover:text-luxury-dark px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
				>
					Xem chi tiết
				</Link>
			</div>
		</div>
	);
};

export default ProductCard;
