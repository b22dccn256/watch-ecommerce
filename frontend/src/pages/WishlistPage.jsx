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
			toast.error("Vui lĂ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ thĂªm vĂ o giá» hĂ ng");
			return;
		}
		const results = await Promise.allSettled(wishlist.map(p => addToCart(p)));
		const failed = results.filter(r => r.status === "rejected").length;
		const succeeded = results.length - failed;
		if (failed > 0 && succeeded > 0) {
			toast.error(`${failed} sáº£n pháº©m khĂ´ng thá»ƒ thĂªm (cĂ³ thá»ƒ Ä‘Ă£ háº¿t hĂ ng)`);
		} else if (failed === results.length) {
			toast.error("KhĂ´ng thá»ƒ thĂªm sáº£n pháº©m nĂ o vĂ o giá» hĂ ng");
		} else {
			toast.success(`ÄĂ£ thĂªm ${succeeded} sáº£n pháº©m vĂ o giá» hĂ ng!`);
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
						<h1 className='hero-title text-4xl md:text-5xl font-bold mb-4 text-primary'>Danh sĂ¡ch yĂªu thĂ­ch</h1>
						<p className='text-secondary dark:text-luxury-text-muted max-w-2xl leading-relaxed'>
							NÆ¡i lÆ°u giá»¯ nhá»¯ng tuyá»‡t tĂ¡c thá»i gian báº¡n Ä‘ang khao khĂ¡t sá»Ÿ há»¯u.
							HĂ£y Ä‘á»ƒ chĂºng tĂ´i giĂºp báº¡n hiá»‡n thá»±c hĂ³a giáº¥c mÆ¡ luxury cá»§a mĂ¬nh.
						</p>
					</div>
					{wishlist.length > 0 && (
						<button
							onClick={handleAddAll}
							className='btn-base btn-primary h-11 px-6 rounded-full shrink-0'
						>
							<ShoppingCart className='w-4 h-4' />
							ThĂªm táº¥t cáº£ vĂ o giá» ({wishlist.length})
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
		<h2 className='hero-title text-3xl font-bold mb-4 text-primary'>ChÆ°a cĂ³ sáº£n pháº©m yĂªu thĂ­ch</h2>
		<p className='text-secondary mb-10 max-w-md mx-auto'>
			Báº¡n chÆ°a thĂªm báº¥t ká»³ sáº£n pháº©m nĂ o vĂ o danh sĂ¡ch mong muá»‘n.
			HĂ£y khĂ¡m phĂ¡ bá»™ sÆ°u táº­p cá»§a chĂºng tĂ´i Ä‘á»ƒ tĂ¬m tháº¥y chiáº¿c Ä‘á»“ng há»“ hoĂ n má»¹ dĂ nh riĂªng cho báº¡n.
		</p>
		<Link
			to='/catalog'
			className='group btn-base btn-primary h-12 px-8 rounded-full'
		>
			KHĂM PHĂ Bá»˜ SÆ¯U Táº¬P
			<ArrowRight className='w-5 h-5 group-hover:translate-x-2 transition-transform' />
		</Link>
	</motion.div>
);

export default WishlistPage;

