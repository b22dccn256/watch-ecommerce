import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash, Star, Search, ChevronLeft, ChevronRight, Package, FileSpreadsheet, PlusCircle, X } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useUserStore } from "../stores/useUserStore";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import CreateProductForm from "./CreateProductForm";

const PAGE_SIZE = 7;

const ProductsList = () => {
	const { deleteProduct, toggleFeaturedProduct, products, fetchAllProducts } = useProductStore();
	const { user } = useUserStore();
	const importInputRef = useRef(null);
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState("name"); // name | price | createdAt
	const [showCreateModal, setShowCreateModal] = useState(false);

	// Search + sort
	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		let list = (products || []).filter(p =>
			!q ||
			p.name?.toLowerCase().includes(q) ||
			(typeof p.brand === 'object' ? p.brand?.name : p.brand)?.toLowerCase().includes(q) ||
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

	const handleFileExport = async () => {
		const toastId = toast.loading("Đang xuất dữ liệu ra Excel...");
		try {
			const res = await axios.get("/products/export", { responseType: 'blob' });
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'products.xlsx');
			document.body.appendChild(link);
			link.click();
			link.parentNode.removeChild(link);
			toast.success("Xuất file thành công", { id: toastId });
		} catch {
			toast.error("Lỗi khi xuất file Excel", { id: toastId });
		}
	};

	return (
		<div className="space-y-4">
			{/* Toolbar: search + sort */}
			<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-2">
				<div className="flex items-center gap-4 w-full sm:w-auto">
					<h2 className="text-2xl font-bold text-gray-900 dark:text-luxury-gold flex items-center gap-2 whitespace-nowrap hidden md:flex">
						<Package className="w-6 h-6 text-luxury-gold" /> Sản Phẩm
					</h2>
					<button
						onClick={() => setShowCreateModal(true)}
						className="flex items-center gap-2 px-4 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-sm font-bold shadow hover:bg-yellow-500 transition whitespace-nowrap flex-shrink-0"
					>
						<PlusCircle className="w-5 h-5" /> Thêm mới
					</button>
				</div>
				<div className="relative flex-1 max-w-md w-full">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						placeholder="Tìm theo tên, thương hiệu, danh mục..."
						value={search}
						onChange={handleSearch}
						className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-luxury-gold transition"
					/>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={handleFileExport}
						className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 border border-blue-500/50 text-blue-500 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition"
						title="Xuất danh sách sản phẩm ra tệp Excel (.xlsx)"
					>
						<FileSpreadsheet className="w-4 h-4" /> 
						<span className="hidden md:inline">Xuất Excel</span>
					</button>
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

					<span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">
						{filtered.length} / {products?.length || 0} sản phẩm
					</span>
					<select
						value={sortBy}
						onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
						className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
					>
						<option value="name">Sắp xếp: Tên A-Z</option>
						<option value="price">Sắp xếp: Giá cao → thấp</option>
						<option value="createdAt">Sắp xếp: Mới nhất</option>
					</select>
				</div>
			</div>

			{/* Table Container - Scrollable */}
			<motion.div
				className="bg-white dark:bg-gray-800 shadow-xl dark:shadow-none rounded-lg overflow-hidden border border-gray-100 dark:border-transparent flex flex-col"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className="overflow-x-auto overflow-y-auto max-h-[55vh] custom-scrollbar">
					<table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 relative">
						<thead className="bg-gray-50/95 dark:bg-gray-700/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
							<tr>
								<th className="px-5 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Product</th>
								<th className="px-5 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Brand</th>
								<th className="px-5 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Price</th>
								<th className="px-5 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Category</th>
								<th className="px-5 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Featured</th>
								<th className="px-5 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
						{paginated.length === 0 ? (
							<tr>
								<td colSpan="6" className="text-center py-12 text-gray-400 dark:text-gray-500">
									<Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
									{search ? `Không tìm thấy sản phẩm nào với "${search}"` : "Chưa có sản phẩm"}
								</td>
							</tr>
						) : paginated.map((product) => (
							<tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<td className="px-5 py-3 whitespace-nowrap">
									<div className="flex items-center gap-3">
										<img
											className="h-10 w-10 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600"
											src={product.image}
											alt={product.name}
											onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
										/>
										<div className="text-sm font-medium text-gray-900 dark:text-white max-w-[180px] truncate" title={product.name}>{product.name}</div>
									</div>
								</td>
								<td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
									{typeof product.brand === 'object' ? product.brand?.name : (product.brand || "—")}
								</td>
								<td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-emerald-600 dark:text-luxury-gold">
									{product.price?.toLocaleString("vi-VN")} ₫
								</td>
								<td className="px-5 py-3 whitespace-nowrap">
									<span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300">{product.category}</span>
								</td>
								<td className="px-5 py-3 whitespace-nowrap">
									<button
										onClick={() => toggleFeaturedProduct(product._id)}
										className={`p-1.5 rounded-lg transition-colors duration-200 ${product.isFeatured ? "bg-yellow-400 text-gray-900 shadow-sm" : "bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-300 hover:bg-yellow-500 hover:text-white"}`}
									>
										<Star className="h-4 w-4" />
									</button>
								</td>
								<td className="px-5 py-3 whitespace-nowrap">
									{user?.role === "admin" && (
										<button
											onClick={() => deleteProduct(product._id)}
											className="p-1.5 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
										>
											<Trash className="h-4 w-4" />
										</button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex items-center justify-between border-t border-gray-100 dark:border-gray-600">
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Trang {currentPage} / {totalPages} • {filtered.length} sản phẩm
						</p>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className="p-2 rounded-lg bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
										className={`w-8 h-8 rounded-lg text-sm font-bold transition ${currentPage === page ? "bg-luxury-gold text-luxury-dark" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"}`}
									>
										{page}
									</button>
								);
							})}
							<button
								onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
								disabled={currentPage === totalPages}
								className="p-2 rounded-lg bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}
			</motion.div>

			{/* Create Product Modal */}
			<AnimatePresence>
				{showCreateModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="relative bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border shadow-2xl rounded-2xl w-full max-w-4xl my-8 flex flex-col"
						>
							<div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-luxury-border">
								<h2 className="text-2xl font-bold text-gray-900 dark:text-luxury-gold flex items-center gap-2">
									<PlusCircle className="w-6 h-6" /> Thêm Sản Phẩm Mới
								</h2>
								<button 
									onClick={() => setShowCreateModal(false)}
									className="p-2 bg-gray-100 dark:bg-luxury-border text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full transition"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
							<div className="p-6 overflow-y-auto max-h-[70vh]">
								<CreateProductForm onSuccess={() => {
									setShowCreateModal(false);
									fetchAllProducts();
								}} />
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
};
export default ProductsList;
