import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import ProductCard from "../components/ProductCard"; // sẽ nâng cấp ở bước sau
import FilterSidebar from "../components/FilterSidebar";
import SearchBarWithSuggestions from "../components/SearchBarWithSuggestions";

const CatalogPage = () => {
	const { category } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const {
		products, loading, totalPages, currentPage, sort,
		fetchFilteredProducts, setPage, searchTerm, setSearchTerm, setFilters, setSort
	} = useProductStore();

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
	}, [searchParams, category, fetchFilteredProducts, setSearchTerm, setFilters, setSort]);

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
		<div className="min-h-screen bg-[#0f0c08] text-white pt-20">
			<div className="max-w-screen-2xl mx-auto px-6 py-10">
				{/* Thanh tìm kiếm lớn + gợi ý */}
				<SearchBarWithSuggestions />

				<div className="flex gap-10 mt-10">
					{/* Bộ lọc bên trái */}
					<FilterSidebar />

					{/* Danh sách sản phẩm */}
					<div className="flex-1 w-full max-w-full overflow-hidden">
						{/* Breadcrumbs */}
						<div className="mb-4 flex items-center text-sm text-gray-500">
							<Link to="/" className="hover:text-[#D4AF37] transition">Trang chủ</Link>
							<span className="mx-2">/</span>
							<Link to="/catalog" className="hover:text-[#D4AF37] transition">Đồng hồ</Link>
							{category && (
								<>
									<span className="mx-2">/</span>
									<span className="text-[#D4AF37] font-medium">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
								</>
							)}
						</div>

						<div className="flex justify-between items-center mb-4">
							<h1 className="text-4xl font-bold">
								{category ? category.toUpperCase() : "Tất cả đồng hồ"}
							</h1>
							<select
								value={sort}
								onChange={handleSortChange}
								className="bg-zinc-900 border border-yellow-900 px-6 py-3 rounded-full text-sm outline-none focus:border-[#D4AF37] transition"
							>
								<option value="newest">Mới nhất</option>
								<option value="best_selling">Bán chạy nhất</option>
								<option value="price_asc">Giá: Thấp đến Cao</option>
								<option value="price_desc">Giá: Cao đến Thấp</option>
								<option value="name_asc">Tên: A-Z</option>
								<option value="name_desc">Tên: Z-A</option>
							</select>
						</div>

						{!loading && (
							<p className="text-sm text-gray-500 mb-8 border-b border-zinc-800 pb-4">
								Tìm thấy <span className="text-[#D4AF37] font-bold">{products.length * totalPages}</span> sản phẩm phù hợp
							</p>
						)}

						{loading ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
								{Array.from({ length: 8 }).map((_, index) => (
									<div key={index} className="w-full h-[400px] border border-zinc-800 bg-zinc-900/50 rounded-lg animate-pulse flex flex-col">
										<div className="h-80 w-full bg-zinc-800 rounded-t-lg"></div>
										<div className="p-5 space-y-3 flex-1 flex flex-col">
											<div className="h-4 bg-zinc-800 rounded w-1/3"></div>
											<div className="h-6 bg-zinc-800 rounded w-3/4"></div>
											<div className="mt-auto h-8 bg-zinc-800 rounded w-1/2"></div>
										</div>
									</div>
								))}
							</div>
						) : products.length === 0 ? (
							<div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
								<svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
								<h2 className="text-xl font-medium text-gray-300 mb-2">Không tìm thấy sản phẩm</h2>
								<p className="text-gray-500 max-w-md mx-auto">Thử điều chỉnh lại bộ lọc hoặc khoảng giá để tìm thấy chiếc đồng hồ ưng ý nhất của bạn.</p>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
								{products.map((product) => (
									<ProductCard key={product._id} product={product} />
								))}
							</div>
						)}

						{/* Phân trang */}
						{totalPages > 1 && (
							<div className="flex justify-center mt-16 gap-2">
								{getPaginationRange(currentPage, totalPages).map((page, index) => (
									page === '...' ? (
										<span key={`ellipsis-${index}`} className="flex items-center justify-center w-10 h-10 text-gray-400">...</span>
									) : (
										<button
											key={page}
											onClick={() => handlePageChange(page)}
											className={`w-10 h-10 rounded-full font-medium transition ${currentPage === page
												? "bg-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.3)]"
												: "bg-zinc-900 border border-zinc-800 text-gray-300 hover:bg-zinc-800 hover:text-white"
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