import ProductCard from "./ProductCard";

const BestSellersSection = ({ products, addToCart, title, gridCols }) => {
  // Helper mapper since tailwind doesn't support completely dynamic numeric classes safely
  const gridColsClass =
    {
      4: "md:grid-cols-4 lg:grid-cols-4",
      6: "md:grid-cols-4 lg:grid-cols-6",
    }[gridCols] || "md:grid-cols-4 lg:grid-cols-4";

  return (
    <div className="section-divider py-10 md:py-14 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="editorial-surface rounded-2xl px-5 py-5 md:px-6 md:py-6 mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <h2 className="hero-title text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {title || "Sản phẩm Bán chạy"}
            </h2>
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-4 md:gap-5`}
      >
        {products.map((product) => (
          <ProductCard
            key={String(product._id)}
            product={product}
            addToCart={addToCart}
            isBestSeller
          />
        ))}
      </div>
    </div>
  );
};

export default BestSellersSection;
