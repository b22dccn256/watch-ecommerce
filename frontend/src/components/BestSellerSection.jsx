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
        <div className="py-20 max-w-screen-2xl mx-auto px-6">
            <h2 className="text-center text-5xl font-bold font-luxury mb-4 text-gray-900 dark:text-white capitalize text-luxury-gold">{title || "Sản phẩm Bán chạy"}</h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-md mx-auto">
                Khám phá những mẫu đồng hồ được yêu thích nhất và làm nên tên tuổi của giới thượng lưu.
            </p>

            <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-6 md:gap-10`}>
                {products.map((product) => (
                    <ProductCard key={product._id} product={product} addToCart={addToCart} isBestSeller />
                ))}
            </div>
        </div>
    );
};

export default BestSellersSection;