import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { useCampaignStore } from "../stores/useCampaignStore";
import { useStorefrontStore } from "../stores/useStorefrontStore";
import HeroBanner from "../components/HeroBanner";
import FlashSaleSection from "../components/FlashSaleSection";
import BestSellerSection from "../components/BestSellerSection";
import ChatBot from "../components/ChatBot";
import { SkeletonProductCard } from "../components/SkeletonLoaders";
import PeopleAlsoBought from "../components/PeopleAlsoBought";


const HomePage = () => {
	const { fetchFeaturedProducts, products, loading } = useProductStore();
	const { addToCart } = useCartStore();
	const { campaigns, fetchActiveCampaigns } = useCampaignStore();
	const { config, fetchConfig } = useStorefrontStore();

	const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
	const [activeCampaign, setActiveCampaign] = useState(null);

	useEffect(() => {
		fetchFeaturedProducts();
		fetchActiveCampaigns();
		fetchConfig();
	}, [fetchFeaturedProducts, fetchActiveCampaigns, fetchConfig]);

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

	const showInitialSkeleton = !config || (loading && products.length === 0);
	const featuredProducts = products.slice(0, config?.gridColumns || 4);
	const bestsellerProducts = products.slice(4, 4 + (config?.gridColumns || 4));
	const sectionVariants = {
		hidden: { opacity: 0, y: 24 },
		show: { opacity: 1, y: 0 },
	};

	if (showInitialSkeleton) {
		return (
			<div className="min-h-screen bg-white dark:bg-[#1a120b] text-gray-900 dark:text-white">
				<div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
					<div className="rounded-[2rem] border border-gray-100 dark:border-luxury-border bg-white dark:bg-luxury-darker overflow-hidden shadow-2xl">
						<div className="h-[70vh] bg-gradient-to-b from-gray-100 via-white to-gray-50 dark:from-[#1e1e1e] dark:via-[#141414] dark:to-[#0f0f0f] animate-pulse" />
					</div>

					<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
						{Array.from({ length: 4 }).map((_, index) => (
							<SkeletonProductCard key={index} />
						))}
					</div>
				</div>
			</div>
		);
	}

	const layoutSet = new Set(config.homeLayout || ["hero", "bestSeller", "flashSale", "recommended"]);
	const sections = [
		layoutSet.has("hero") && (
			<motion.div key="hero" variants={sectionVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.35 }}>
				<HeroBanner slogan={config.heroSlogan} />
			</motion.div>
		),
		layoutSet.has("bestSeller") && (
			<motion.div key="bestSeller" variants={sectionVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.35 }}>
				<BestSellerSection title={config.bestSellerTitle} gridCols={config.gridColumns} products={bestsellerProducts} addToCart={addToCart} />
			</motion.div>
		),
		layoutSet.has("flashSale") && (
			<motion.div key="flashSale" variants={sectionVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.35 }}>
				<FlashSaleSection title={config.flashSaleTitle} gridCols={config.gridColumns} products={featuredProducts} timeLeft={timeLeft} addToCart={addToCart} campaignName={activeCampaign?.name} />
			</motion.div>
		),
		layoutSet.has("recommended") && (
			<motion.div key="recommended" variants={sectionVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.35 }}>
				<PeopleAlsoBought />
			</motion.div>
		),
	].filter(Boolean);

	return (
		<div className="min-h-screen bg-white dark:bg-[#1a120b] text-gray-900 dark:text-white transition-colors duration-500 overflow-hidden">
			<div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 pb-16 space-y-8 md:space-y-10">
				{/* DYNAMIC CMS SECTIONS */}
				{sections}
			</div>

			{/* CMS CHATBOT */}
			{config.showChatBot && <ChatBot />}
		</div>
	);
};

export default HomePage;