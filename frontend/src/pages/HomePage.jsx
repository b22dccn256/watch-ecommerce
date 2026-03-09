import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import HeroBanner from "../components/HeroBanner";
import FlashSaleSection from "../components/FlashSaleSection";
import BestSellerSection from "../components/BestSellerSection";
import ChatBot from "../components/ChatBot";


const HomePage = () => {
	const { fetchFeaturedProducts, products, loading } = useProductStore();
	const { addToCart } = useCartStore();

	// Flash Sale countdown (hết hạn sau 24h)
	const [timeLeft, setTimeLeft] = useState({
		hours: 23,
		minutes: 59,
		seconds: 59,
	});

	useEffect(() => {
		fetchFeaturedProducts();

		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				let { hours, minutes, seconds } = prev;
				seconds--;
				if (seconds < 0) { seconds = 59; minutes--; }
				if (minutes < 0) { minutes = 59; hours--; }
				if (hours < 0) return { hours: 0, minutes: 0, seconds: 0 };
				return { hours, minutes, seconds };
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [fetchFeaturedProducts]);

	return (
		<div className="min-h-screen bg-[#1a120b] text-white overflow-hidden">
			{/* HERO BANNER */}
			<HeroBanner />

			{/* FLASH SALE */}
			<FlashSaleSection
				products={products.slice(0, 4)} // 4 sản phẩm flash
				timeLeft={timeLeft}
				addToCart={addToCart}
			/>

			{/* SẢN PHẨM BÁN CHẠY */}
			<BestSellerSection
				products={products.slice(4, 7)} // 3 sản phẩm bán chạy
				addToCart={addToCart}
			/>

			{/* FLOATING CHATBOT */}
			<ChatBot />
		</div>
	);
};

export default HomePage;