import { motion } from "framer-motion";
import ProductCard from "./ProductCard"; // dùng lại card cũ của bạn

const FlashSaleSection = ({ products, timeLeft, addToCart, campaignName }) => {
    return (
        <div
            className="py-20 border-b border-gray-800 relative bg-cover bg-center bg-no-repeat bg-fixed"
            style={{ backgroundImage: "linear-gradient(to bottom, rgba(17, 17, 17, 0.98), rgba(26, 18, 11, 0.85), rgba(17, 17, 17, 0.98)), url('/sale-5.jpg')" }}
        >
            <div className="max-w-screen-2xl mx-auto px-6 relative z-10">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-red-500 text-4xl">⚡</span>
                            <h2 className="text-5xl font-bold">{campaignName ? campaignName.toUpperCase() : "FLASH SALE"}</h2>
                        </div>
                        <p className="text-2xl text-gray-400 mt-2">Ưu đãi giới hạn</p>
                    </div>

                    <div className="flex gap-4 text-center">
                        {Object.entries(timeLeft).map(([label, value]) => {
                            if (label === 'days' && value === 0) return null;
                            return (
                                <div key={label} className="bg-zinc-900 px-6 py-3 rounded-xl">
                                    <div className="text-4xl font-bold text-yellow-400">
                                        {value.toString().padStart(2, "0")}
                                    </div>
                                    <div className="text-xs uppercase tracking-widest text-gray-500">
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