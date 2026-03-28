import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { useThemeStore } from "../stores/useThemeStore";
import { Zap } from "lucide-react";

const FlashSaleSection = ({ products, timeLeft, addToCart, campaignName, title, gridCols }) => {
	if (!products.length) return null;

	const gridColsClass = {
		3: "md:grid-cols-3",
		4: "md:grid-cols-3 lg:grid-cols-4",
		5: "md:grid-cols-4 lg:grid-cols-5",
		6: "md:grid-cols-4 lg:grid-cols-6",
	}[gridCols] || "md:grid-cols-3 lg:grid-cols-4";

	return (
		<div className="py-16 md:py-24 bg-gradient-to-b from-red-50 to-white dark:from-[#2a0808] dark:to-[#1a120b] relative mt-12 md:mt-24">
			<div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<span className="bg-red-500 text-white font-bold tracking-widest uppercase text-xs px-3 py-1 rounded inline-block animate-pulse">
								Limited Time Use
							</span>
							<span className="text-red-500 font-semibold">{campaignName || "Sự kiện Siêu Sale"}</span>
						</div>
						<h2 className="font-luxury text-4xl md:text-5xl font-bold text-gray-900 dark:text-white flex items-center gap-4">
							{title || "Ưu Đãi Đặc Biệt"} 
							<Zap className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 fill-yellow-400" />
						</h2>
					</div>

					<div className="flex gap-4 text-center">
						{Object.entries(timeLeft).map(([label, value]) => {
							if (label === 'days' && value === 0) return null;
							return (
								<div key={label} className="bg-white/60 dark:bg-zinc-900/80 backdrop-blur-md px-4 md:px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg transition-all duration-500">
									<div className="text-3xl md:text-4xl font-bold text-yellow-600 dark:text-yellow-400">
										{value.toString().padStart(2, "0")}
									</div>
									<div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 font-bold">
										{label === "days" ? "NGÀY" : label === "hours" ? "GIỜ" : label === "minutes" ? "PHÚT" : "GIÂY"}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-6 md:gap-8`}>
					{products.map((product) => (
						<ProductCard
							key={product._id}
							product={product.salePercentage ? product : { ...product, discount: Math.floor(Math.random() * 30) + 10 }}
							addToCart={addToCart}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

export default FlashSaleSection;