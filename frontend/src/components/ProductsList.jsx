import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Trash, Star, Search, ChevronLeft, ChevronRight, Package, FileSpreadsheet } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

const ProductsList = () => {
	const { deleteProduct, toggleFeaturedProduct, products, fetchAllProducts } = useProductStore();
	const importInputRef = useRef(null);
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState("name"); // name | price | createdAt

	// Search + sort
	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		let list = (products || []).filter(p =>
			!q ||
			p.name?.toLowerCase().includes(q) ||
			p.brand?.toLowerCase().includes(q) ||
			p.category?.toLowerCase().includes(q)
		);
		list = [...list].sort((a, b) => {
			if (sortBy === "price") return (b.price || 0) - (a.price || 0);
			if (sortBy === "createdAt") return new Date(b.createdAt) - new Date(a.createdAt);
			return (a.name || "").localeCompare(b.name || "");
		});
		return list;
	}, [products, search, sortBy]);

	// Pagination
	const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
	const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

	const handleSearch = (e) => {
		setSearch(e.target.value);
		setCurrentPage(1); // reset to page 1 on new search
	};

	const handleFileImport = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const formData = new FormData();
		formData.append("file", file);

		const toastId = toast.loading("Đang nhập dữ liệu từ Excel...");
		try {
			const res = await axios.post("/products/import", formData, {
				headers: { "Content-Type": "multipart/form-data" }
			});
			toast.success(`Thành công: ${res.data.success}, Thất bại: ${res.data.failed}`, { id: toastId, duration: 5000 });
			if (res.data.errors?.length > 0) {
				console.error("Import errors:", res.data.errors);
			}
			fetchAllProducts(); // Refresh list
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi khi nhập file Excel", { id: toastId });
		}
		e.target.value = ""; // reset
	};

	return (
		<div className="space-y-4">
			{/* Toolbar: search + sort */}
			<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						placeholder="Tìm theo tên, thương hiệu, danh mục..."
						value={search}
						onChange={handleSearch}
						className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-luxury-gold transition"
					/>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={() => importInputRef.current?.click()}
						className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-600 hover:text-white transition"
						title="Nhập sản phẩm từ file Excel (.xlsx)"
					>
						<FileSpreadsheet className="w-4 h-4" /> 
						<span className="hidden md:inline">Nhập Excel</span>
					</button>
					<input
						ref={importInputRef}
						type="file"
						accept=".xlsx, .xls"
						className="hidden"
						onChange={handleFileImport}
					/>

					<span className="text-gray-400 text-sm whitespace-nowrap">
						{filtered.length} / {products?.length || 0} sản phẩm
					</span>
					<select
						value={sortBy}
						onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
						className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-luxury-gold transition"
					>
						<option value="name">Sắp xếp: Tên A-Z</option>
						<option value="price">Sắp xếp: Giá cao → thấp</option>
						<option value="createdAt">Sắp xếp: Mới nhất</option>
					</select>
				</div>
			</div>

			{/* Table */}
			<motion.div
				className="bg-gray-800 shadow-lg rounded-lg overflow-hidden"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<table className="min-w-full divide-y divide-gray-700">
					<thead className="bg-gray-700">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Brand</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Featured</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody className="bg-gray-800 divide-y divide-gray-700">
						{paginated.length === 0 ? (
							<tr>
								<td colSpan="6" className="text-center py-12 text-gray-500">
									<Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
									{search ? `Không tìm thấy sản phẩm nào với "${search}"` : "Chưa có sản phẩm"}
								</td>
							</tr>
						) : paginated.map((product) => (
							<tr key={product._id} className="hover:bg-gray-700 transition-colors">
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="flex items-center gap-3">
										<img
											className="h-10 w-10 rounded-full object-cover flex-shrink-0"
											src={product.image}
											alt={product.name}
											onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
										/>
										<div className="text-sm font-medium text-white max-w-[200px] truncate">{product.name}</div>
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{product.brand || "—"}</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
									{product.price?.toLocaleString("vi-VN")} ₫
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">{product.category}</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<button
										onClick={() => toggleFeaturedProduct(product._id)}
										className={`p-1 rounded-full transition-colors duration-200 ${product.isFeatured ? "bg-yellow-400 text-gray-900" : "bg-gray-600 text-gray-300 hover:bg-yellow-500"}`}
									>
										<Star className="h-5 w-5" />
									</button>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<button
										onClick={() => deleteProduct(product._id)}
										className="text-red-400 hover:text-red-300 transition-colors"
									>
										<Trash className="h-5 w-5" />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="px-6 py-4 bg-gray-700 flex items-center justify-between border-t border-gray-600">
						<p className="text-sm text-gray-400">
							Trang {currentPage} / {totalPages} • {filtered.length} sản phẩm
						</p>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className="p-2 rounded-lg bg-gray-600 text-gray-300 hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							{Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
								const page = totalPages <= 7
									? i + 1
									: currentPage <= 4
										? i + 1
										: currentPage >= totalPages - 3
											? totalPages - 6 + i
											: currentPage - 3 + i;
								return (
									<button
										key={page}
										onClick={() => setCurrentPage(page)}
										className={`w-8 h-8 rounded-lg text-sm font-bold transition ${currentPage === page ? "bg-luxury-gold text-luxury-dark" : "text-gray-400 hover:bg-gray-600"}`}
									>
										{page}
									</button>
								);
							})}
							<button
								onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
								disabled={currentPage === totalPages}
								className="p-2 rounded-lg bg-gray-600 text-gray-300 hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}
			</motion.div>
		</div>
	);
};
export default ProductsList;
