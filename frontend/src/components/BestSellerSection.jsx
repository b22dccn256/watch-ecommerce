import ProductCard from "./ProductCard";

const BestSellersSection = ({ products, addToCart }) => {
    return (
        <div className="py-20 max-w-screen-2xl mx-auto px-6">
            <h2 className="text-center text-5xl font-bold mb-4">Sản phẩm Bán chạy</h2>
            <p className="text-center text-gray-400 mb-12 max-w-md mx-auto">
                Khám phá những mẫu đồng hồ được yêu thích nhất và làm nên tên tuổi của giới thượng lưu.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {products.map((product) => (
                    <ProductCard key={product._id} product={product} addToCart={addToCart} isBestSeller />
                ))}
            </div>
        </div>
    );
};

export default BestSellersSection;