import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { useCampaignStore } from "../stores/useCampaignStore";
import HeroBanner from "../components/HeroBanner";
import FlashSaleSection from "../components/FlashSaleSection";
import BestSellerSection from "../components/BestSellerSection";
import ChatBot from "../components/ChatBot";


const HomePage = () => {
	const { fetchFeaturedProducts, products, loading } = useProductStore();
	const { addToCart } = useCartStore();
	const { campaigns, fetchCampaigns } = useCampaignStore();

	const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
	const [activeCampaign, setActiveCampaign] = useState(null);

	useEffect(() => {
		fetchFeaturedProducts();
		fetchCampaigns();
	}, [fetchFeaturedProducts, fetchCampaigns]);

	useEffect(() => {
		if (campaigns && campaigns.length > 0) {
			const active = campaigns.find(c => c.status === "Active");
			setActiveCampaign(active || null);
		} else {
			setActiveCampaign(null);
		}
	}, [campaigns]);

	useEffect(() => {
		// If no active campaign, use a mock 24h timer initialized relative to midnight
		let targetDate;
		if (activeCampaign) {
			targetDate = new Date(activeCampaign.endDate).getTime();
		} else {
			const tomorrow = new Date();
			tomorrow.setHours(24, 0, 0, 0); // Next midnight
			targetDate = tomorrow.getTime();
		}

		const timer = setInterval(() => {
			const now = new Date().getTime();
			const distance = targetDate - now;

			if (distance < 0) {
				clearInterval(timer);
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
			} else {
				setTimeLeft({
					days: Math.floor(distance / (1000 * 60 * 60 * 24)),
					hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
					minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
					seconds: Math.floor((distance % (1000 * 60)) / 1000),
				});
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [activeCampaign]);

	return (
		<div className="min-h-screen bg-[#1a120b] text-white overflow-hidden">
			{/* HERO BANNER */}
			<HeroBanner />

			{/* FLASH SALE / ACTIVE CAMPAIGN */}
			<FlashSaleSection
				products={products.slice(0, 4)} // 4 sản phẩm flash
				timeLeft={timeLeft}
				addToCart={addToCart}
				campaignName={activeCampaign?.name}
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