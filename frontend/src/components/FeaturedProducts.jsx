import ProductCard from "./ProductCard";

const FeaturedProducts = ({ featuredProducts, gridCols = 4 }) => {
    const gridColsClass = {
        3: "md:grid-cols-3 lg:grid-cols-3",
        4: "md:grid-cols-4 lg:grid-cols-4",
        5: "md:grid-cols-5 lg:grid-cols-5",
        6: "md:grid-cols-6 lg:grid-cols-6",
    }[gridCols] || "md:grid-cols-4 lg:grid-cols-4";

    return (
        <div className="section-divider py-10 md:py-14 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="editorial-surface rounded-2xl px-5 py-5 md:px-6 md:py-6 mb-6 md:mb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                    <div className="space-y-1 max-w-2xl">
                        <p className="hero-kicker text-[color:var(--color-gold)]">Featured pieces</p>
                        <h2 className="hero-title text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Tuyển chọn tinh hoa</h2>
                    </div>
                    <a href="/catalog" className="group hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition-colors duration-200 hover:text-[color:var(--color-gold)] sm:inline-flex">
                        Xem tất cả
                        <svg className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                    </a>
                </div>
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-3 ${gridColsClass} gap-4 md:gap-5`}>
                {featuredProducts?.map((product) => (
                    <ProductCard key={String(product._id)} product={product} />
                ))}
            </div>
        </div>
    );
};

export default FeaturedProducts;
