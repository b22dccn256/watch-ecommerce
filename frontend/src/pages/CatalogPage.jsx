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
	// B-01 Fix: default tá»« storeConfig.gridColumns, fallback vá» 4 náº¿u chÆ°a load
	const [gridCols, setGridCols] = useState(4);
	const {
		products, loading, totalPages, currentPage, sort, totalCount,
		fetchFilteredProducts, setPage, setSearchTerm, setFilters, filters, setSort
	} = useProductStore();

	// B-01 Fix: Load storeConfig Ä‘á»ƒ láº¥y gridColumns máº·c Ä‘á»‹nh
	useEffect(() => {
		fetchConfig();
	}, [fetchConfig]);

	// B-01 Fix: Sync gridCols khi config load xong (chá»‰ láº§n Ä‘áº§u)
	useEffect(() => {
		if (config?.gridColumns) {
			setGridCols(Number(config.gridColumns));
		}
	}, [config?.gridColumns]);

	// Äá»“ng bá»™ URL params vá»›i store
	useEffect(() => {
		const q = searchParams.get("q") || "";
		setSearchTerm(q);

		// PhĂ¢n tĂ­ch Param nĂ¢ng cao (tá»« Mega Menu hoáº·c Deep Link)
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

			// Náº¿u cĂ³ param URL, Æ°u tiĂªn ghi Ä‘Ă¨ vĂ o Zustand
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
	}, [searchParams, category, fetchFilteredProducts, setSearchTerm, setFilters, setSort, setSearchParams]);

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
			chips.push({ key: "price", label: `${(filters.minPrice/1e6).toFixed(0)}â€“${filters.maxPrice >= 1e9 ? "âˆ" : (filters.maxPrice/1e6).toFixed(0)} Trâ‚«` });
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

	// PhĂ¢n trang
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
				<div className="mb-8 rounded-[2rem] editorial-surface px-6 py-6 md:px-8 md:py-7 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.35)]">
					<div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
						<div className="space-y-4">
							<p className="hero-kicker text-xs font-semibold text-luxury-gold">Bá»™ sÆ°u táº­p Â· Tuyá»ƒn chá»n</p>
							<h1 className="hero-title text-3xl md:text-5xl text-gray-900 leading-tight">
								{category ? category : "Táº¥t cáº£ Ä‘á»“ng há»“"}
							</h1>
							<p className="max-w-2xl text-sm md:text-base text-gray-600 dark:text-luxury-text-muted leading-relaxed">
								KhĂ¡m phĂ¡ nhá»¯ng cá»— mĂ¡y thá»i gian tinh xáº£o Ä‘Æ°á»£c tuyá»ƒn chá»n kháº¯t khe, nÆ¡i nghá»‡ thuáº­t cháº¿ tĂ¡c vĂ  phong cĂ¡ch sá»‘ng Ä‘áº³ng cáº¥p gáº·p nhau trong tá»«ng chi tiáº¿t.
							</p>
						</div>
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							{[
								{ label: "Sort", value: sort.replace("_", " ") },
								{ label: "Grid", value: `${gridCols} cols` },
								{ label: "Products", value: (totalCount ?? products.length).toString() },
								{ label: "Mode", value: loading ? "Loading" : "Live" },
							].map((item) => (
								<div key={item.label} className="rounded-2xl bg-white/90 dark:bg-white/5 border border-black/5 dark:border-white/10 px-4 py-4 shadow-sm">
									<p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-luxury-text-muted">{item.label}</p>
									<p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{item.value}</p>
								</div>
							))}
						</div>
					</div>
				</div>
				<div className="grid gap-10 lg:grid-cols-[280px_1fr]">
					{/* Bá»™ lá»c bĂªn trĂ¡i */}
					<FilterSidebar />

					{/* Danh sĂ¡ch sáº£n pháº©m */}
					<div className="flex-1 w-full max-w-full overflow-hidden">
						{/* Breadcrumbs */}
						<div className="mb-4 flex items-center text-sm text-gray-500">
							<Link to="/" className="hover:text-luxury-gold transition">Trang chá»§</Link>
							<span className="mx-2">/</span>
							<Link to="/catalog" className="hover:text-luxury-gold transition">Äá»“ng há»“</Link>
							{category && (
								<>
									<span className="mx-2">/</span>
									<span className="text-luxury-gold font-medium">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
								</>
							)}
						</div>

						<div className="flex flex-wrap justify-between items-center mb-4 gap-3 rounded-[1.5rem] border border-black/5 dark:border-white/5 bg-white/85 dark:bg-white/5 px-4 py-4 shadow-sm">
							<div>
								<p className="hero-kicker text-[10px] font-semibold text-luxury-gold mb-2">Danh má»¥c sáº£n pháº©m</p>
								<h2 className="heading-section text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
									{category ? category : "Táº¥t cáº£ Ä‘á»“ng há»“"}
								</h2>
							</div>
							<div className="flex items-center gap-3">
								{/* Grid toggle */}
								<div className="flex items-center gap-1 bg-gray-100/90 dark:bg-zinc-900 rounded-2xl p-1 border border-black/5 dark:border-white/5">
									<button
										onClick={() => setGridCols(3)}
										className={`p-1.5 rounded-xl transition ${gridCols === 3 ? "bg-luxury-gold text-lux-dark" : "text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
										title="3 cá»™t"
									>
										<Grid3X3 className="w-4 h-4" />
									</button>
									<button
										onClick={() => setGridCols(4)}
										className={`p-1.5 rounded-xl transition ${gridCols === 4 ? "bg-luxury-gold text-lux-dark" : "text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
										title="4 cá»™t"
									>
										<LayoutGrid className="w-4 h-4" />
									</button>
								</div>
								<select
									value={sort}
									onChange={handleSortChange}
									className="bg-gray-100/90 dark:bg-zinc-900 border border-gray-200/80 dark:border-luxury-border text-gray-900 dark:text-white px-4 py-2 rounded-2xl text-sm outline-none focus:border-luxury-gold transition"
								>
									<option value="newest">Má»›i nháº¥t</option>
									<option value="best_selling">BĂ¡n cháº¡y nháº¥t</option>
									<option value="price_asc">GiĂ¡: Tháº¥p â†’ Cao</option>
									<option value="price_desc">GiĂ¡: Cao â†’ Tháº¥p</option>
									<option value="name_asc">TĂªn: A-Z</option>
									<option value="name_desc">TĂªn: Z-A</option>
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
									XĂ³a táº¥t cáº£
								</button>
							</div>
						)}

						{!loading && (
							<p className="text-sm text-gray-500 mb-8 border-b border-black/10 dark:border-zinc-800 pb-4">
								TĂ¬m tháº¥y <span className="text-luxury-gold font-bold">{totalCount ?? products.length}</span> sáº£n pháº©m phĂ¹ há»£p
							</p>
						)}

						{loading ? (
							<div className={gridCols === 4 ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6" : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"}>
								{Array.from({ length: 8 }).map((_, index) => (
									<SkeletonProductCard key={index} />
								))}
							</div>
						) : products.length === 0 ? (
							<div className="text-center py-20 bg-white/80 dark:bg-zinc-900/30 rounded-2xl border border-black/5 dark:border-zinc-800/50">
								<svg className="w-16 h-16 mx-auto text-gray-400 dark:text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
								<h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">KhĂ´ng tĂ¬m tháº¥y sáº£n pháº©m</h2>
								<p className="text-gray-500 max-w-md mx-auto">Thá»­ Ä‘iá»u chá»‰nh láº¡i bá»™ lá»c hoáº·c khoáº£ng giĂ¡ Ä‘á»ƒ tĂ¬m tháº¥y chiáº¿c Ä‘á»“ng há»“ Æ°ng Ă½ nháº¥t cá»§a báº¡n.</p>
							</div>
						) : (
							<motion.div
								className={gridCols === 4 ? "product-grid-4" : "product-grid-3"}
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

						{/* PhĂ¢n trang */}
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
