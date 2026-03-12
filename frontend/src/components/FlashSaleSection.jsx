import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { useThemeStore } from "../stores/useThemeStore";

const FlashSaleSection = ({ products, timeLeft, addToCart, campaignName }) => {
	const { theme } = useThemeStore();
	const isDark = theme === "dark";

	const bgGradient = isDark
		? "linear-gradient(to bottom, rgba(15, 15, 15, 0.98), rgba(26, 18, 11, 0.85), rgba(15, 15, 15, 0.98))"
		: "linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(245, 245, 245, 0.85), rgba(255, 255, 255, 0.95))";

	return (
		<div
			className="py-20 border-b border-gray-100 dark:border-gray-800 relative bg-cover bg-center bg-no-repeat bg-fixed transition-all duration-500"
			style={{ backgroundImage: `${bgGradient}, url('/sale-5.jpg')` }}
		>
			<div className="max-w-screen-2xl mx-auto px-6 relative z-10">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
					<div>
						<div className="flex items-center gap-3">
							<span className="text-red-500 text-3xl md:text-4xl">⚡</span>
							<h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white transition-colors duration-500">
								{campaignName ? campaignName.toUpperCase() : "FLASH SALE"}
							</h2>
						</div>
						<p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mt-2 transition-colors duration-500">Ưu đãi giới hạn</p>
					</div>

					<div className="flex gap-4 text-center">
						{Object.entries(timeLeft).map(([label, value]) => {
							if (label === 'days' && value === 0) return null;
							return (
								<div key={label} className="bg-white/60 dark:bg-zinc-900/80 backdrop-blur-md px-4 md:px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg transition-all duration-500">
									<div className="text-3xl md:text-4xl font-bold text-yellow-600 dark:text-yellow-400">
										{value.toString().padStart(2, "0")}
									</div>
									<div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 dark:text-gray-500 font-bold">
										{label === "days" ? "NGÀY" : label === "hours" ? "GIỜ" : label === "minutes" ? "PHÚT" : "GIÂY"}
									</div>
								</div>
							);
						})}
					</div>
				</div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product) => (
                        <ProductCard
                            key={product._id}
                            product={product.salePercentage ? product : { ...product, discount: Math.floor(Math.random() * 30) + 10 }} // real campaign or fallback
                            addToCart={addToCart}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FlashSaleSection;