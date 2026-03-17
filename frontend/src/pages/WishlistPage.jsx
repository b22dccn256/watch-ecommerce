import { motion } from "framer-motion";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { Heart, ShoppingBag, ArrowRight, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import toast from "react-hot-toast";

const WishlistPage = () => {
	const { wishlist, loading } = useWishlistStore();
	const { addToCart } = useCartStore();
	const { user } = useUserStore();

	const handleAddAll = () => {
		if (!user) {
			toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
			return;
		}
		wishlist.forEach(p => addToCart(p));
		toast.success(`Đã thêm ${wishlist.length} sản phẩm vào giỏ hàng!`);
	};

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center pt-20'>
				<div className='animate-luxury-pulse text-luxury-gold text-xl tracking-widest'>ĐANG TẢI...</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-white dark:bg-luxury-dark text-gray-900 dark:text-white pt-32 pb-16 transition-colors duration-300'>
			<div className='max-w-screen-2xl mx-auto px-6 h-full'>
				{/* Header */}
				<motion.div
					className='mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					<div>
						<h1 className='text-4xl md:text-5xl font-bold tracking-luxury mb-4'>DANH SÁCH <span className='text-luxury-gold'>YÊU THÍCH</span></h1>
						<p className='text-gray-500 dark:text-luxury-text-muted max-w-2xl'>
							Nơi lưu giữ những tuyệt tác thời gian bạn đang khao khát sở hữu.
							Hãy để chúng tôi giúp bạn hiện thực hóa giấc mơ luxury của mình.
						</p>
					</div>
					{wishlist.length > 0 && (
						<button
							onClick={handleAddAll}
							className='flex items-center gap-2 bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark px-6 py-3 rounded-full font-bold text-sm transition-all shrink-0 shadow-lg'
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
		className='flex flex-col items-center justify-center py-24 text-center border border-luxury-border/30 rounded-3xl bg-luxury-darker/50 backdrop-blur-sm'
		initial={{ opacity: 0, scale: 0.95 }}
		animate={{ opacity: 1, scale: 1 }}
	>
		<div className='bg-luxury-gold/10 p-8 rounded-full mb-8'>
			<Heart className='w-20 h-20 text-luxury-gold' />
		</div>
		<h2 className='text-3xl font-bold mb-4'>Chưa có sản phẩm yêu thích</h2>
		<p className='text-luxury-text-muted mb-10 max-w-md mx-auto'>
			Bạn chưa thêm bất kỳ sản phẩm nào vào danh sách mong muốn.
			Hãy khám phá bộ sưu tập của chúng tôi để tìm thấy chiếc đồng hồ hoàn mỹ dành riêng cho bạn.
		</p>
		<Link
			to='/catalog'
			className='group flex items-center gap-3 bg-luxury-gold text-luxury-dark px-10 py-4 rounded-full font-bold transition-all duration-300 hover:bg-white hover:scale-105'
		>
			KHÁM PHÁ BỘ SƯU TẬP
			<ArrowRight className='w-5 h-5 group-hover:translate-x-2 transition-transform' />
		</Link>
	</motion.div>
);

export default WishlistPage;
