import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Trash, Star, Search, ChevronLeft, ChevronRight,
	Package, FileSpreadsheet, PlusCircle, X, CheckSquare, Square, Trash2, Megaphone, Eye, AlertTriangle
} from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import CreateProductForm from "./CreateProductForm";

const PAGE_SIZE = 10;

// Stock badge helper
const StockBadge = ({ stock }) => {
	if (stock === undefined || stock === null) return <span className="text-gray-400 text-xs">—</span>;
	if (stock <= 0) return <span className="stock-badge-out px-2 py-0.5 rounded-full text-xs font-semibold">Hết hàng</span>;
	if (stock <= 5) return <span className="stock-badge-low px-2 py-0.5 rounded-full text-xs font-semibold">Còn {stock}</span>;
	return <span className="stock-badge-high px-2 py-0.5 rounded-full text-xs font-semibold">Còn {stock}</span>;
};

const CampaignPickerModal = ({ selectedIds, onClose, onSuccess }) => (
	<motion.div
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		exit={{ opacity: 0 }}
		className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
		onClick={onClose}
	>
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 10, scale: 0.98 }}
			className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-6"
			onClick={(e) => e.stopPropagation()}
		>
			<h3 className="text-lg font-bold text-gray-900 dark:text-white">Gán chiến dịch</h3>
			<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
				Đã chọn {selectedIds.length} sản phẩm. Tính năng chọn chiến dịch đang được hoàn thiện.
			</p>
			<div className="mt-5 flex justify-end gap-3">
				<button
					onClick={onClose}
					className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200"
				>
					Đóng
				</button>
				<button
					onClick={onSuccess}
					className="px-4 py-2 rounded-lg bg-luxury-gold text-luxury-dark font-semibold"
				>
					Xác nhận
				</button>
			</div>
		</motion.div>
	</motion.div>
);

const ProductsList = () => {
	const { deleteProduct, toggleFeaturedProduct, products, fetchAllProducts } = useProductStore();
	const importInputRef = useRef(null);
	const previewInputRef = useRef(null);
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState("name");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [importPreview, setImportPreview] = useState(null); // { total, preview, message }
	const [previewFile, setPreviewFile] = useState(null); // store the file for confirmed import
	const [importConfirming, setImportConfirming] = useState(false);

	// Bulk select state
	const [selectedIds, setSelectedIds] = useState(new Set());
	const [bulkDeleting, setBulkDeleting] = useState(false);
	const [showCampaignPicker, setShowCampaignPicker] = useState(false);

	// Search + sort
	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		let list = (products || []).filter(
			(p) =>
				!q ||
				p.name?.toLowerCase().includes(q) ||
				(typeof p.brand === "string" ? p.brand : p.brand?.name || "").toLowerCase().includes(q) ||
				p.category?.toLowerCase().includes(q)
		);
		list = [...list].sort((a, b) => {
			if (sortBy === "price") return (b.price || 0) - (a.price || 0);
			if (sortBy === "createdAt") return new Date(b.createdAt) - new Date(a.createdAt);
			if (sortBy === "stock") return (b.stock || 0) - (a.stock || 0);
			return (a.name || "").localeCompare(b.name || "");
		});
		return list;
	}, [products, search, sortBy]);

	// Pagination
	const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
	const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

	const handleSearch = (e) => { setSearch(e.target.value); setCurrentPage(1); };

	// Bulk select helpers
	const currentPageIds = paginated.map((p) => p._id);
	const allPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));

	const toggleSelectAll = () => {
		if (allPageSelected) {
			setSelectedIds((prev) => { const n = new Set(prev); currentPageIds.forEach((id) => n.delete(id)); return n; });
		} else {
			setSelectedIds((prev) => { const n = new Set(prev); currentPageIds.forEach((id) => n.add(id)); return n; });
		}
	};

	const toggleSelect = (id) => {
		setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
	};

	const handleBulkDelete = async () => {
		if (!selectedIds.size) return;
		if (!window.confirm(`Xóa ${selectedIds.size} sản phẩm đã chọn?`)) return;
		setBulkDeleting(true);
		try {
			for (const id of selectedIds) await deleteProduct(id);
			setSelectedIds(new Set());
			toast.success(`Đã xóa ${selectedIds.size} sản phẩm`);
		} catch {
			toast.error("Có lỗi xảy ra khi xóa hàng loạt");
		} finally {
			setBulkDeleting(false);
		}
	};

	const handleFilePreview = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		setPreviewFile(file);
		const formData = new FormData();
		formData.append("file", file);
		const toastId = toast.loading("Đang đọc file Excel...");
		try {
			const res = await axios.post("/products/import/preview", formData, { headers: { "Content-Type": "multipart/form-data" } });
			setImportPreview(res.data);
			toast.success(`Đọc được ${res.data.total} dòng. Kiểm tra trước khi import.`, { id: toastId });
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi khi đọc file", { id: toastId });
		}
		e.target.value = "";
	};

	const handleConfirmedImport = async () => {
		if (!previewFile) return;
		setImportConfirming(true);
		const formData = new FormData();
		formData.append("file", previewFile);
		const toastId = toast.loading("Đang import...");
		try {
			const res = await axios.post("/products/import", formData, { headers: { "Content-Type": "multipart/form-data" } });
			toast.success(`Thành công: ${res.data.success} sản phẩm`, { id: toastId, duration: 5000 });
			setImportPreview(null);
			setPreviewFile(null);
			fetchAllProducts();
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi khi import", { id: toastId });
		} finally {
			setImportConfirming(false);
		}
	};

	const handleFileImport = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const formData = new FormData();
		formData.append("file", file);
		const toastId = toast.loading("Đang nhập dữ liệu từ Excel...");
		try {
			const res = await axios.post("/products/import", formData, { headers: { "Content-Type": "multipart/form-data" } });
			toast.success(`Thành công: ${res.data.success}, Thất bại: ${res.data.failed}`, { id: toastId, duration: 5000 });
			fetchAllProducts();
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi khi nhập file Excel", { id: toastId });
		}
		e.target.value = "";
	};

	const handleFileExport = async () => {
		const toastId = toast.loading("Đang xuất dữ liệu ra Excel...");
		try {
			const res = await axios.get("/products/export", { responseType: "blob" });
			const url = window.URL.createObjectURL(new Blob([res.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", "products.xlsx");
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
			{/* ── Toolbar ──────────────────────────── */}
			<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
				<div className="flex items-center gap-3">
					<h2 className="text-xl font-bold text-gray-900 dark:text-luxury-gold flex items-center gap-2 hidden md:flex">
						<Package className="w-5 h-5 text-luxury-gold" /> Sản Phẩm
					</h2>
					<button
						onClick={() => setShowCreateModal(true)}
						className="flex items-center gap-2 px-4 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-sm font-bold shadow hover:bg-yellow-500 transition"
					>
						<PlusCircle className="w-4 h-4" /> Thêm mới
					</button>
				</div>
				<div className="relative flex-1 max-w-sm w-full">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						placeholder="Tìm tên, thương hiệu, danh mục..."
						value={search}
						onChange={handleSearch}
						className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-luxury-gold transition"
					/>
				</div>
				<div className="flex items-center gap-2 flex-wrap">
					{/* Bulk actions */}
					{selectedIds.size > 0 && (
						<>
							<button
								onClick={handleBulkDelete}
								disabled={bulkDeleting}
								className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition"
							>
								<Trash2 className="w-3.5 h-3.5" />
								Xóa ({selectedIds.size})
							</button>
							<button
								onClick={() => setShowCampaignPicker(true)}
								className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/20 border border-purple-500/50 text-purple-400 rounded-lg text-sm font-bold hover:bg-purple-600 hover:text-white transition"
							>
								<Megaphone className="w-3.5 h-3.5" />
								Áp dụng chiến dịch ({selectedIds.size})
							</button>
						</>
					)}
					<button
						onClick={handleFileExport}
						className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 border border-blue-500/50 text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition"
					>
						<FileSpreadsheet className="w-3.5 h-3.5" />
						<span className="hidden md:inline">Xuất Excel</span>
					</button>
					<button
						onClick={() => previewInputRef.current?.click()} // Use new ref for preview
						className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-600 hover:text-white transition"
					>
						<FileSpreadsheet className="w-3.5 h-3.5" />
						<span className="hidden md:inline">Nhập Excel</span>
					</button>
					<input ref={previewInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFilePreview} /> {/* New input for preview */}
					{/* The original importInputRef and handleFileImport are now effectively for a direct import,
					    but the UI button now points to the preview flow. */}
					<input ref={importInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileImport} />

					<span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap hidden md:inline">
						{filtered.length}/{products?.length || 0} SP
					</span>
					<select
						value={sortBy}
						onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
						className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
					>
						<option value="name">Tên A-Z</option>
						<option value="price">Giá cao nhất</option>
						<option value="stock">Tồn kho cao nhất</option>
						<option value="createdAt">Mới nhất</option>
					</select>
				</div>
			</div>

			{/* ── Table ────────────────────────────── */}
			<motion.div
				className="bg-white dark:bg-gray-800 shadow-xl dark:shadow-none rounded-xl overflow-hidden border border-gray-100 dark:border-transparent"
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
					<table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
						<thead className="bg-gray-50/95 dark:bg-gray-700/95 backdrop-blur-sm sticky top-0 z-10">
							<tr>
								{/* Checkbox */}
								<th className="px-3 py-3 w-10">
									<button onClick={toggleSelectAll} className="text-gray-400 hover:text-luxury-gold transition">
										{allPageSelected ? <CheckSquare className="w-4 h-4 text-luxury-gold" /> : <Square className="w-4 h-4" />}
									</button>
								</th>
								<th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sản phẩm</th>
								<th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Thương hiệu</th>
								<th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Giá</th>
								<th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bộ máy</th>
								<th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tồn kho</th>
								<th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Danh mục</th>
								<th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nổi bật</th>
								<th className="px-4 py-3 w-12"></th>
							</tr>
						</thead>
						<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
							{paginated.length === 0 ? (
								<tr>
									<td colSpan="9" className="text-center py-16 text-gray-400 dark:text-gray-500">
										<Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
										<p className="font-medium">{search ? `Không tìm thấy "${search}"` : "Chưa có sản phẩm nào"}</p>
										<p className="text-xs mt-1 opacity-60">Thêm sản phẩm đầu tiên bằng nút &quot;Thêm mới&quot;</p>
									</td>
								</tr>
							) : (
								paginated.map((product) => {
									const brandName = typeof product.brand === "string" ? product.brand : product.brand?.name || "—";
									const isSelected = selectedIds.has(product._id);
									return (
										<tr
											key={product._id}
											className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isSelected ? "bg-luxury-gold/5 dark:bg-luxury-gold/5" : ""}`}
										>
											<td className="px-3 py-3">
												<button onClick={() => toggleSelect(product._id)} className="text-gray-400 hover:text-luxury-gold transition">
													{isSelected ? <CheckSquare className="w-4 h-4 text-luxury-gold" /> : <Square className="w-4 h-4" />}
												</button>
											</td>
											<td className="px-4 py-3 whitespace-nowrap">
												<div className="flex items-center gap-3">
													<img
														className="h-11 w-11 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600"
														src={product.image}
														alt={product.name}
														onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
													/>
													<div className="max-w-[160px]">
														<p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={product.name}>{product.name}</p>
														<p className="text-[10px] text-gray-400 mt-0.5 truncate">{product.category}</p>
													</div>
												</div>
											</td>
											<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{brandName}</td>
											<td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-luxury-gold">
												{product.price?.toLocaleString("vi-VN")} ₫
											</td>
											<td className="px-4 py-3 whitespace-nowrap">
												{product.type ? (
													<span className="px-2 py-0.5 bg-luxury-gold/10 text-luxury-gold text-[10px] font-semibold rounded-full border border-luxury-gold/20">
														{product.type}
													</span>
												) : <span className="text-gray-400 text-xs">—</span>}
											</td>
											<td className="px-4 py-3 whitespace-nowrap">
												<StockBadge stock={product.stock} />
											</td>
											<td className="px-4 py-3 whitespace-nowrap">
												<span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[10px] font-medium text-gray-600 dark:text-gray-300 max-w-[120px] truncate inline-block" title={product.category}>
													{product.category}
												</span>
											</td>
											<td className="px-4 py-3 whitespace-nowrap">
												<button
													onClick={() => toggleFeaturedProduct(product._id)}
													className={`p-1.5 rounded-lg transition-colors ${product.isFeatured ? "bg-yellow-400 text-gray-900 shadow-sm" : "bg-gray-100 dark:bg-gray-600 text-gray-400 hover:bg-yellow-500 hover:text-white"}`}
													title={product.isFeatured ? "Bỏ nổi bật" : "Đặt nổi bật"}
												>
													<Star className="h-3.5 w-3.5" />
												</button>
											</td>
											<td className="px-4 py-3 whitespace-nowrap">
												<button
													onClick={() => deleteProduct(product._id)}
													className="p-1.5 text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
													title="Xóa sản phẩm"
												>
													<Trash className="h-3.5 w-3.5" />
												</button>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 flex items-center justify-between border-t border-gray-100 dark:border-gray-600">
						<p className="text-xs text-gray-500 dark:text-gray-400">
							Trang {currentPage}/{totalPages} • {filtered.length} sản phẩm
						</p>
						<div className="flex items-center gap-1">
							<button
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className="p-1.5 rounded-lg bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
							>
								<ChevronLeft className="w-3.5 h-3.5" />
							</button>
							{Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
								const page = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i;
								return (
									<button
										key={page}
										onClick={() => setCurrentPage(page)}
										className={`w-7 h-7 rounded-lg text-xs font-bold transition ${currentPage === page ? "bg-luxury-gold text-luxury-dark" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"}`}
									>
										{page}
									</button>
								);
							})}
							<button
								onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
								disabled={currentPage === totalPages}
								className="p-1.5 rounded-lg bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
							>
								<ChevronRight className="w-3.5 h-3.5" />
							</button>
						</div>
					</div>
				)}
			</motion.div>

			{/* ── Create Product Modal ─────────────── */}
			<AnimatePresence>
				{showCreateModal && (
					<div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/60 backdrop-blur-sm overflow-y-auto">
						<motion.div
							initial={{ opacity: 0, scale: 0.96, y: 12 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.96, y: 12 }}
							transition={{ duration: 0.2 }}
							className="relative bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border shadow-2xl rounded-2xl w-full max-w-4xl mb-8"
						>
							<div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-luxury-border">
								<h2 className="text-xl font-bold text-gray-900 dark:text-luxury-gold flex items-center gap-2">
									<PlusCircle className="w-5 h-5" /> Thêm Sản Phẩm Mới
								</h2>
								<button
									onClick={() => setShowCreateModal(false)}
									className="p-2 bg-gray-100 dark:bg-luxury-border text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full transition"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
							<div className="p-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
								<CreateProductForm onSuccess={() => { setShowCreateModal(false); fetchAllProducts(); }} />
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* ── Import Preview Modal ─────────────── */}
			<AnimatePresence>
				{importPreview && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-4xl max-h-[85vh] flex flex-col"
						>
							<div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
								<div>
									<h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
										<Eye className="w-5 h-5 text-emerald-500" /> Xem trước Import Excel
									</h2>
									<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{importPreview.message} (Hiển thị tối đa 50 dòng đầu)</p>
								</div>
								<button onClick={() => { setImportPreview(null); setPreviewFile(null); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
									<X className="w-4 h-4 text-gray-500" />
								</button>
							</div>
							<div className="overflow-auto flex-1 p-4">
								<table className="w-full text-xs text-left">
									<thead>
										<tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
											<th className="px-3 py-2">Dòng</th>
											<th className="px-3 py-2">Tên sản phẩm</th>
											<th className="px-3 py-2">Thương hiệu</th>
											<th className="px-3 py-2">Danh mục</th>
											<th className="px-3 py-2 text-right">Giá</th>
											<th className="px-3 py-2 text-right">Tồn kho</th>
											<th className="px-3 py-2">Trạng thái</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-100 dark:divide-gray-700">
										{importPreview.preview.map((row) => (
											<tr key={row.row} className={row.validation !== "OK" ? "bg-red-50 dark:bg-red-900/20" : ""}>
												<td className="px-3 py-2 text-gray-400">{row.row}</td>
												<td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{row.name || <span className="text-red-400">—</span>}</td>
												<td className="px-3 py-2 text-gray-600 dark:text-gray-300">{row.brand}</td>
												<td className="px-3 py-2 text-gray-600 dark:text-gray-300">{row.category}</td>
												<td className="px-3 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">{Number(row.price).toLocaleString("vi-VN")} ₫</td>
												<td className="px-3 py-2 text-right">{row.stock}</td>
												<td className="px-3 py-2">
													{row.validation === "OK"
														? <span className="text-emerald-500 font-semibold">✓</span>
														: <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{row.validation}</span>}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							<div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
								<p className="text-sm text-gray-500">Tổng: <strong className="text-gray-900 dark:text-white">{importPreview.total}</strong> sản phẩm sẽ được xử lý</p>
								<div className="flex gap-3">
									<button
										onClick={() => { setImportPreview(null); setPreviewFile(null); }}
										className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition"
									>
										Hủy
									</button>
									<button
										onClick={handleConfirmedImport}
										disabled={importConfirming}
										className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition disabled:opacity-60 flex items-center gap-2"
									>
										{importConfirming ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />Đang lưu...</> : "✓ Xác nhận Import"}
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* ── Campaign Picker Modal ─────────────── */}
			<AnimatePresence>
				{showCampaignPicker && (
					<CampaignPickerModal
						selectedIds={[...selectedIds]}
						onClose={() => setShowCampaignPicker(false)}
						onSuccess={() => { setShowCampaignPicker(false); setSelectedIds(new Set()); }}
					/>
				)}
			</AnimatePresence>
		</div>
	);
};

export default ProductsList;
