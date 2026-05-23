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
		<div className="section-divider py-10 md:py-14 bg-[linear-gradient(180deg,#fff7f0_0%,#ffffff_25%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#1a0e0e_0%,#100c09_30%,#0d0b08_100%)] relative">
			<div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="editorial-surface rounded-2xl px-5 py-5 md:px-6 md:py-6 mb-6 md:mb-8">
					<div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
						<div className="space-y-2">
							<div className="flex items-center gap-2.5">
								<span className="bg-black text-white font-bold tracking-widest uppercase text-[10px] px-2.5 py-0.5 rounded-full inline-block">
									Ưu Đãi
								</span>
								<span className="text-[color:var(--color-gold)] text-sm font-semibold">{campaignName || "Sự Kiện Đặc Quyền"}</span>
							</div>
							<h2 className="hero-title text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
								{title || "Ưu Đãi Đặc Biệt"}
								<Zap className="w-6 h-6 md:w-7 md:h-7 text-[color:var(--color-gold)] fill-[color:var(--color-gold)]" />
							</h2>
						</div>

						<div className="flex flex-wrap gap-2 text-center">
							{Object.entries(timeLeft).map(([label, value]) => {
								if (label === 'days' && value === 0) return null;
								return (
									<div key={label} className="min-w-[64px] sm:min-w-[72px] bg-white/70 dark:bg-zinc-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-black/5 dark:border-white/8 shadow-sm">
										<div className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
											{value.toString().padStart(2, "0")}
										</div>
										<div className="text-[9px] md:text-[10px] uppercase tracking-widest text-gray-500 font-bold">
											{label === "days" ? "NGÀY" : label === "hours" ? "GIỜ" : label === "minutes" ? "PHÚT" : "GIÂY"}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				<div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-4 md:gap-5`}>
					{products.map((product) => (
						<ProductCard
							key={String(product._id)}
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