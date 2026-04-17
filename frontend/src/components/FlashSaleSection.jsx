import ProductCard from "./ProductCard";
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
		<div className="section-divider py-16 md:py-24 bg-[linear-gradient(180deg,#fff7f0_0%,#ffffff_32%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#250909_0%,#140d0b_40%,#0f0c08_100%)] relative mt-12 md:mt-24">
			<div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="editorial-surface rounded-[2rem] px-6 py-6 md:px-8 md:py-8 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.35)] mb-10 md:mb-14">
					<div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<span className="bg-black text-white font-bold tracking-widest uppercase text-xs px-3 py-1 rounded-full inline-block">
									Flash Sale
								</span>
								<span className="text-[color:var(--color-gold)] font-semibold">{campaignName || "Sự kiện Siêu Sale"}</span>
							</div>
							<h2 className="hero-title text-4xl md:text-5xl font-bold text-gray-900 dark:text-white flex items-center gap-4">
								{title || "Ưu Đãi Đặc Biệt"}
								<Zap className="w-8 h-8 md:w-10 md:h-10 text-[color:var(--color-gold)] fill-[color:var(--color-gold)]" />
							</h2>
						</div>

						<div className="flex flex-wrap gap-3 text-center">
							{Object.entries(timeLeft).map(([label, value]) => {
								if (label === 'days' && value === 0) return null;
								return (
									<div key={label} className="min-w-[84px] bg-white/70 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm transition-all duration-500">
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