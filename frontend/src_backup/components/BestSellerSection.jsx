import ProductCard from "./ProductCard";

const BestSellersSection = ({ products, addToCart, title, gridCols }) => {
    // Helper mapper since tailwind doesn't support completely dynamic numeric classes safely
    const gridColsClass = {
        3: "md:grid-cols-3",
        4: "md:grid-cols-3 lg:grid-cols-4",
        5: "md:grid-cols-4 lg:grid-cols-5",
        6: "md:grid-cols-4 lg:grid-cols-6",
    }[gridCols] || "md:grid-cols-3 lg:grid-cols-4";

    return (
        <div className="section-divider py-20 md:py-24 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="editorial-surface rounded-[2rem] px-6 py-6 md:px-8 md:py-8 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.35)] mb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-3 max-w-2xl">
                        <h2 className="hero-title text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">{title || "Sản phẩm Bán chạy"}</h2>
                    </div>
                </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-6 md:gap-8`}>
                {products.map((product) => (
                    <ProductCard key={product._id} product={product} addToCart={addToCart} isBestSeller />
                ))}
            </div>
        </div>
    );
};

export default BestSellersSection;