import { useEffect, useState } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { LayoutGrid, Grid3X3, X } from "lucide-react";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import { useStorefrontStore } from "../stores/useStorefrontStore";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";
import { SkeletonProductCard } from "../components/SkeletonLoaders";

const CatalogPage = () => {
	const { category } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const { config, fetchConfig } = useStorefrontStore();
	// B-01 Fix: default từ storeConfig.gridColumns, fallback về 4 nếu chưa load
	const [gridCols, setGridCols] = useState(4);
	const {
		products, loading, totalPages, currentPage, sort, totalCount,
		fetchFilteredProducts, setPage, setSearchTerm, setFilters, filters, setSort
	} = useProductStore();

	// B-01 Fix: Load storeConfig để lấy gridColumns mặc định
	useEffect(() => {
		fetchConfig();
	}, [fetchConfig]);

	// B-01 Fix: Sync gridCols khi config load xong (chỉ lần đầu)
	useEffect(() => {
		if (config?.gridColumns) {
			setGridCols(Number(config.gridColumns));
		}
	}, [config?.gridColumns]);

	// Đồng bộ URL params với store
	useEffect(() => {
		const q = searchParams.get("q") || "";
		setSearchTerm(q);

		// Phân tích Param nâng cao (từ Mega Menu hoặc Deep Link)
		const brandParam = searchParams.get("brand");
		const machineTypeParam = searchParams.get("machineType");
		const resetParam = searchParams.get("reset");

		if (resetParam === "true") {
			setFilters({ brands: [], machineType: [], minPrice: 0, maxPrice: 1000000000, strapMaterial: [] });
			searchParams.delete("reset");
			setSearchParams(searchParams, { replace: true });
		} else {
			const urlFilters = {};
			if (brandParam) urlFilters.brands = brandParam.split(",");
			if (machineTypeParam) urlFilters.machineType = machineTypeParam.split(",");
			if (searchParams.get("colors")) urlFilters.colors = searchParams.get("colors").split(",");
			if (searchParams.get("sizes")) urlFilters.sizes = searchParams.get("sizes").split(",");
			if (searchParams.get("minRating")) urlFilters.minRating = Number(searchParams.get("minRating"));
			if (searchParams.get("minPrice")) urlFilters.minPrice = Number(searchParams.get("minPrice"));
			if (searchParams.get("maxPrice")) urlFilters.maxPrice = Number(searchParams.get("maxPrice"));

			// Nếu có param URL, ưu tiên ghi đè vào Zustand
			if (Object.keys(urlFilters).length > 0) {
				setFilters(urlFilters);
			}

			const sortParam = searchParams.get("sort");
			if (sortParam) setSort(sortParam);
		}

		fetchFilteredProducts({
			category: category || searchParams.get("category") || undefined,
			q
		});
	}, [searchParams, category, fetchFilteredProducts, setSearchTerm, setFilters, setSort, setSearchParams, config?.productsPerPage]);

	// Active filter chips builder
	const buildActiveChips = () => {
		const chips = [];
		if (filters.category) chips.push({ key: "category", label: filters.category.split(" (")[0] });
		(filters.brands || []).forEach(b => chips.push({ key: `brand:${b}`, label: b }));
		(filters.machineType || []).forEach(t => chips.push({ key: `machineType:${t}`, label: t }));
		(filters.strapMaterial || []).forEach(m => chips.push({ key: `strapMaterial:${m}`, label: m }));
		(filters.colors || []).forEach(c => chips.push({ key: `colors:${c}`, label: c }));
		(filters.sizes || []).forEach(s => chips.push({ key: `sizes:${s}`, label: s }));
		if (filters.minRating > 0) chips.push({ key: "minRating", label: `${filters.minRating}+ sao` });
		if (filters.minPrice > 0 || filters.maxPrice < 1_000_000_000)
			chips.push({ key: "price", label: `${(filters.minPrice/1e6).toFixed(0)}–${filters.maxPrice >= 1e9 ? "∞" : (filters.maxPrice/1e6).toFixed(0)} Tr₫` });
		return chips;
	};

	const removeChip = (chipKey) => {
		if (chipKey === "category") setFilters({ category: "" });
		else if (chipKey === "minRating") setFilters({ minRating: 0 });
		else if (chipKey === "price") setFilters({ minPrice: 0, maxPrice: 1_000_000_000 });
		else {
			const [filterName, value] = chipKey.split(":");
			const arr = (filters[filterName] || []).filter(v => v !== value);
			setFilters({ [filterName]: arr });
		}
		setPage(1);
		setTimeout(() => fetchFilteredProducts(), 0);
	};

	const clearAllFilters = () => {
		setFilters({ brands: [], category: "", machineType: [], strapMaterial: [], colors: [], sizes: [], minRating: 0, minPrice: 0, maxPrice: 1_000_000_000 });
		setPage(1);
		setTimeout(() => fetchFilteredProducts(), 0);
	};

	const activeChips = buildActiveChips();

	// Format Pagination Window Helper
	const getPaginationRange = (currentPage, totalPages) => {
		if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
		if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
		if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
		return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
	};

	// Phân trang
	const handlePageChange = (newPage) => {
		setPage(newPage);
		fetchFilteredProducts();
		window.scrollTo({ top: 300, behavior: 'smooth' }); // Scroll back up
	};

	const handleSortChange = (e) => {
		setSort(e.target.value);
		fetchFilteredProducts();
	};

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f8f5f0_0%,#ffffff_14%,#ffffff_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.08)_0%,rgba(15,12,8,1)_40%,rgba(10,10,10,1)_100%)] text-gray-900 dark:text-white transition-colors duration-500">
			<div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
				<div className="grid gap-10 lg:grid-cols-[280px_1fr]">
					{/* Bộ lọc bên trái */}
					<FilterSidebar />

					{/* Danh sách sản phẩm */}
					<div className="flex-1 w-full max-w-full overflow-hidden">
						{/* Breadcrumbs */}
						<div className="mb-4 flex items-center text-sm text-gray-500">
							<Link to="/" className="hover:text-luxury-gold transition">Trang chủ</Link>
							<span className="mx-2">/</span>
							<Link to="/catalog" className="hover:text-luxury-gold transition">Đồng hồ</Link>
							{category && (
								<>
									<span className="mx-2">/</span>
									<span className="text-luxury-gold font-medium">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
								</>
							)}
						</div>

						<div className="flex flex-wrap justify-between items-center mb-4 gap-3 rounded-[1.5rem] border border-black/5 dark:border-white/5 bg-white/85 dark:bg-white/5 px-4 py-4 shadow-sm">
							<div>
								<p className="hero-kicker text-[10px] font-semibold text-luxury-gold mb-2">Danh mục sản phẩm</p>
								<h2 className="heading-section text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
									{category ? category : "Tất cả đồng hồ"}
								</h2>
							</div>
							<div className="flex items-center gap-3">
								{/* Grid toggle */}
								<div className="flex items-center gap-1 bg-gray-100/90 dark:bg-zinc-900 rounded-2xl p-1 border border-black/5 dark:border-white/5">
									{[3, 4, 5, 6].map(num => (
										<button
											key={num}
											onClick={() => setGridCols(num)}
											className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all duration-300 ${gridCols === num ? "bg-luxury-gold text-lux-dark shadow-[0_2px_8px_rgba(212,175,55,0.3)]" : "text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
											title={`${num} cột`}
										>
											{num}C
										</button>
									))}
								</div>
								<select
									value={sort}
									onChange={handleSortChange}
									className="bg-gray-100/90 dark:bg-zinc-900 border border-gray-200/80 dark:border-luxury-border text-gray-900 dark:text-white px-4 py-2 rounded-2xl text-sm outline-none focus:border-luxury-gold transition"
								>
									<option value="newest">Mới nhất</option>
									<option value="best_selling">Bán chạy nhất</option>
									<option value="price_asc">Giá: Thấp → Cao</option>
									<option value="price_desc">Giá: Cao → Thấp</option>
									<option value="name_asc">Tên: A-Z</option>
									<option value="name_desc">Tên: Z-A</option>
								</select>
							</div>
						</div>

						{/* Active Filter Chips */}
						{activeChips.length > 0 && (
							<div className="flex flex-wrap items-center gap-2 mb-4 rounded-2xl border border-black/5 dark:border-white/5 bg-white/70 dark:bg-white/5 px-4 py-4">
								{activeChips.map(chip => (
									<button
										key={chip.key}
										onClick={() => removeChip(chip.key)}
										className="filter-chip"
									>
										{chip.label}
										<X className="w-3 h-3" />
									</button>
								))}
								<button
									onClick={clearAllFilters}
									className="text-xs text-gray-500 hover:text-[color:var(--color-gold)] underline transition ml-1"
								>
									Xóa tất cả
								</button>
							</div>
						)}

						{!loading && products.length > 0 && (
							<p className="text-sm text-gray-500 mb-8 border-b border-black/10 dark:border-zinc-800 pb-4">
								Hiển thị <span className="text-luxury-gold font-bold">{products.length}</span> sản phẩm trên trang này (Tổng cộng <span className="text-luxury-gold font-bold">{totalCount ?? products.length}</span> kết quả)
							</p>
						)}

						{loading ? (
							<div className={`product-grid-${gridCols}`}>
								{Array.from({ length: 8 }).map((_, index) => (
									<SkeletonProductCard key={index} />
								))}
							</div>
						) : products.length === 0 ? (
							<div className="text-center py-16 bg-white/80 dark:bg-zinc-900/30 rounded-2xl border border-black/5 dark:border-zinc-800/50 px-4">
								<svg className="w-14 h-14 mx-auto text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
								<h2 className="text-lg font-medium text-primary mb-2">Không tìm thấy sản phẩm</h2>
								{activeChips.length > 0 || searchParams.get("q") ? (
									<>
										<p className="text-sm text-secondary max-w-md mx-auto mb-4">Thử điều chỉnh lại bộ lọc hoặc khoảng giá để tìm thấy chiếc đồng hồ ưng ý nhất.</p>
										<button onClick={clearAllFilters} className="btn-base btn-outline h-9 px-5 text-xs">Xóa tất cả bộ lọc</button>
									</>
								) : (
									<>
										<p className="text-sm text-secondary max-w-md mx-auto mb-4">Danh mục hiện chưa có sản phẩm nào. Quản trị viên có thể thêm sản phẩm từ bảng điều khiển.</p>
										<Link to="/secret-dashboard?tab=products" className="btn-base btn-primary h-9 px-5 text-xs">Thêm sản phẩm đầu tiên</Link>
									</>
								)}
							</div>
						) : (
							<motion.div
								className={`product-grid-${gridCols}`}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, amount: 0.05 }}
								variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
							>
								{products.map((product) => (
									<motion.div
										key={product._id}
										variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38 } } }}
									>
										<ProductCard product={product} />
									</motion.div>
								))}
							</motion.div>
						)}

						{/* Phân trang */}
						{totalPages > 1 && (
							<div className="flex justify-center mt-16 gap-2 flex-wrap">
								{getPaginationRange(currentPage, totalPages).map((page, index) => (
									page === '...' ? (
										<span key={`ellipsis-${index}`} className="flex items-center justify-center w-10 h-10 text-gray-400">...</span>
									) : (
										<button
											key={page}
											onClick={() => handlePageChange(page)}
											className={`w-10 h-10 rounded-full font-medium transition ${currentPage === page
												? "bg-luxury-gold text-lux-dark shadow-[0_0_10px_rgba(212,175,55,0.3)]"
												: "bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white"
												}`}
										>
											{page}
										</button>
									)
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default CatalogPage;