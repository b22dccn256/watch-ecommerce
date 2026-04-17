import { motion } from "framer-motion";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { Heart, ArrowRight, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import toast from "react-hot-toast";
import { SkeletonProductCard } from "../components/SkeletonLoaders";

const WishlistPage = () => {
	const { wishlist, loading } = useWishlistStore();
	const { addToCart } = useCartStore();
	const { user } = useUserStore();

	const handleAddAll = async () => {
		if (!user) {
			toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
			return;
		}
		const results = await Promise.allSettled(wishlist.map(p => addToCart(p)));
		const failed = results.filter(r => r.status === "rejected").length;
		const succeeded = results.length - failed;
		if (failed > 0 && succeeded > 0) {
			toast.error(`${failed} sản phẩm không thể thêm (có thể đã hết hàng)`);
		} else if (failed === results.length) {
			toast.error("Không thể thêm sản phẩm nào vào giỏ hàng");
		} else {
			toast.success(`Đã thêm ${succeeded} sản phẩm vào giỏ hàng!`);
		}
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-white dark:bg-luxury-dark pt-32 pb-16'>
				<div className='max-w-screen-2xl mx-auto px-6'>
					<div className='mb-10 space-y-3'>
						<div className='h-10 w-80 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium' />
						<div className='h-5 w-1/2 rounded-full bg-gray-200 dark:bg-zinc-700 skeleton-shimmer skeleton-shimmer-premium' />
					</div>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
						{Array.from({ length: 8 }).map((_, index) => (
							<SkeletonProductCard key={index} />
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-white dark:bg-luxury-dark text-gray-900 dark:text-white pt-28 pb-16 transition-colors duration-300'>
			<div className='max-w-screen-2xl mx-auto px-6 h-full'>
				{/* Header */}
				<motion.div
					className='mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					<div>
						<p className='hero-kicker text-[11px] text-[color:var(--color-gold)] mb-3'>Client Selection</p>
						<h1 className='hero-title text-4xl md:text-5xl font-bold mb-4 text-primary'>Danh sách yêu thích</h1>
						<p className='text-secondary dark:text-luxury-text-muted max-w-2xl leading-relaxed'>
							Nơi lưu giữ những tuyệt tác thời gian bạn đang khao khát sở hữu.
							Hãy để chúng tôi giúp bạn hiện thực hóa giấc mơ luxury của mình.
						</p>
					</div>
					{wishlist.length > 0 && (
						<button
							onClick={handleAddAll}
							className='btn-base btn-primary h-11 px-6 rounded-full shrink-0'
						>
							<ShoppingCart className='w-4 h-4' />
							Thêm tất cả vào giỏ ({wishlist.length})
						</button>
					)}
				</motion.div>

				{wishlist.length === 0 ? (
					<EmptyWishlist />
				) : (
					<motion.div
						className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
						{wishlist.map((product) => (
							<ProductCard key={product._id} product={product} />
						))}
					</motion.div>
				)}
			</div>
		</div>
	);
};

const EmptyWishlist = () => (
	<motion.div
		className='flex flex-col items-center justify-center py-24 text-center border border-black/10 dark:border-white/10 rounded-3xl bg-surface-soft backdrop-blur-sm'
		initial={{ opacity: 0, scale: 0.95 }}
		animate={{ opacity: 1, scale: 1 }}
	>
		<div className='bg-[color:var(--color-gold)]/10 p-8 rounded-full mb-8'>
			<Heart className='w-20 h-20 text-[color:var(--color-gold)]' />
		</div>
		<h2 className='hero-title text-3xl font-bold mb-4 text-primary'>Chưa có sản phẩm yêu thích</h2>
		<p className='text-secondary mb-10 max-w-md mx-auto'>
			Bạn chưa thêm bất kỳ sản phẩm nào vào danh sách mong muốn.
			Hãy khám phá bộ sưu tập của chúng tôi để tìm thấy chiếc đồng hồ hoàn mỹ dành riêng cho bạn.
		</p>
		<Link
			to='/catalog'
			className='group btn-base btn-primary h-12 px-8 rounded-full'
		>
			KHÁM PHÁ BỘ SƯU TẬP
			<ArrowRight className='w-5 h-5 group-hover:translate-x-2 transition-transform' />
		</Link>
	</motion.div>
);

export default WishlistPage;
