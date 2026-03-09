import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import ProductCard from "../components/ProductCard"; // sẽ nâng cấp ở bước sau
import FilterSidebar from "../components/FilterSidebar";
import SearchBarWithSuggestions from "../components/SearchBarWithSuggestions";

const CatalogPage = () => {
	const { category } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const {
		products, loading, totalPages, currentPage,
		fetchFilteredProducts, setPage, searchTerm, setSearchTerm
	} = useProductStore();

	// Đồng bộ URL params với store
	useEffect(() => {
		const q = searchParams.get("q") || "";
		setSearchTerm(q);

		fetchFilteredProducts({
			category: category || undefined,
			q
		});
	}, [searchParams, category, fetchFilteredProducts, setSearchTerm]);

	// Phân trang
	const handlePageChange = (newPage) => {
		setPage(newPage);
		setSearchParams(prev => {
			prev.set("page", newPage);
			return prev;
		});
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
					<div className="flex-1">
						<div className="flex justify-between items-center mb-8">
							<h1 className="text-4xl font-bold">
								{category ? category.toUpperCase() : "Tất cả đồng hồ"}
							</h1>
							<select className="bg-zinc-900 border border-yellow-900 px-6 py-3 rounded-full text-sm">
								<option>Phổ biến nhất</option>
								<option>Giá thấp đến cao</option>
								<option>Giá cao đến thấp</option>
								<option>Mới nhất</option>
							</select>
						</div>

						{loading ? (
							<div className="text-center py-20">Đang tải...</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
								{products.map((product) => (
									<ProductCard key={product._id} product={product} />
								))}
							</div>
						)}

						{/* Phân trang */}
						<div className="flex justify-center mt-16 gap-2">
							{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
								<button
									key={page}
									onClick={() => handlePageChange(page)}
									className={`w-10 h-10 rounded-full font-medium transition ${currentPage === page
											? "bg-yellow-400 text-black"
											: "bg-zinc-900 hover:bg-zinc-800"
										}`}
								>
									{page}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CatalogPage;