import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, AlertTriangle } from "lucide-react";
import { useProductStore } from "../../stores/useProductStore";
import axios from "../../lib/axios";
import toast from "react-hot-toast";

// Imported forms and modals
import CreateProductForm from "../CreateProductForm";
import EditProductForm from "../EditProductForm";
import ConfirmModal from "../ConfirmModal";
import InputModal from "../InputModal";

// Extracted components
import ProductsToolbar from "../products/ProductsToolbar";
import ProductsTable from "../products/ProductsTable";
import ProductsPagination from "../products/ProductsPagination";
import CampaignPickerModal from "../products/CampaignPickerModal";

const PAGE_SIZE = 10;

const ProductsList = () => {
	const { deleteProduct, toggleFeaturedProduct, products, totalPages: storeTotalPages, currentPage: storeCurrentPage, totalCount, fetchProductsAdminPaginated, fetchAllProducts, loading } = useProductStore();
	const [searchParams, setSearchParams] = useSearchParams();
	
	const urlPage = parseInt(searchParams.get("page")) || 1;
	const urlSearch = searchParams.get("search") || "";
	const urlSort = searchParams.get("sort") || "name_asc";

	const [search, setSearch] = useState(urlSearch);
	const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
	const [currentPage, setCurrentPage] = useState(urlPage);
	const [sortBy, setSortBy] = useState(urlSort);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editingProduct, setEditingProduct] = useState(null);
	const [importPreview, setImportPreview] = useState(null);
	const [previewFile, setPreviewFile] = useState(null);
	const [importConfirming, setImportConfirming] = useState(false);

	// Bulk select state
	const [selectedIds, setSelectedIds] = useState(new Set());
	const [bulkDeleting, setBulkDeleting] = useState(false);
	const [showCampaignPicker, setShowCampaignPicker] = useState(false);
	const [showPriceAdjustModal, setShowPriceAdjustModal] = useState(false);
	const [priceAdjustCount, setPriceAdjustCount] = useState(0);

	const [confirmConfig, setConfirmConfig] = useState(null);

	// Debounce search
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search);
		}, 500);
		return () => clearTimeout(handler);
	}, [search]);

	// Fetch data when params change
	useEffect(() => {
		const currentParams = new URLSearchParams(window.location.search);
		if (currentParams.get("tab") !== "products") return;

		const params = new URLSearchParams(searchParams);
		if (currentPage > 1) params.set("page", currentPage);
		else params.delete("page");

		if (debouncedSearch) params.set("search", debouncedSearch);
		else params.delete("search");

		if (sortBy !== "name_asc") params.set("sort", sortBy);
		else params.delete("sort");

		setSearchParams(params, { replace: true });

		fetchProductsAdminPaginated({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch, sort: sortBy });
	}, [currentPage, debouncedSearch, sortBy, fetchProductsAdminPaginated, searchParams, setSearchParams]);

	const paginated = products || [];
	const totalPages = storeTotalPages || 1;

	const handleSearch = (e) => { 
		setSearch(e.target.value); 
		setCurrentPage(1); 
	};

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

	const handleBulkDelete = () => {
		if (!selectedIds.size) return;
		setConfirmConfig({
			title: `Xóa ${selectedIds.size} sản phẩm`,
			message: `Bạn sắp xóa ${selectedIds.size} sản phẩm. Thao tác này sẽ không thể khôi phục.`,
			variant: "danger",
			confirmLabel: "Xóa",
			onConfirm: async () => {
				setBulkDeleting(true);
				try {
					await axios.patch("/products", { action: "softDelete", ids: [...selectedIds] });
					setSelectedIds(new Set());
					toast.success(`Đã xóa ${selectedIds.size} sản phẩm`);
					fetchProductsAdminPaginated({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch, sort: sortBy });
				} catch (error) {
					toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa hàng loạt");
				} finally {
					setBulkDeleting(false);
				}
			}
		});
	};

	const handleBulkPriceAdjust = async () => {
		if (!selectedIds.size) return;
		setPriceAdjustCount(selectedIds.size);
		setShowPriceAdjustModal(true);
	};

	const handleConfirmPriceAdjust = async (value) => {
		if (value === null || value === "") return;
		if (isNaN(Number(value))) { toast.error("Vui lòng nhập số hợp lệ"); return; }
		const toastId = toast.loading("Đang điều chỉnh giá...");
		try {
			const res = await axios.patch("/products", { action: "adjustPrice", ids: [...selectedIds], value: Number(value) });
			toast.success(res.data.message, { id: toastId });
			setSelectedIds(new Set());
			fetchProductsAdminPaginated({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch, sort: sortBy });
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi khi điều chỉnh giá", { id: toastId });
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
			fetchProductsAdminPaginated({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch, sort: sortBy });
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
			fetchProductsAdminPaginated({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch, sort: sortBy });
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
			<ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />

			<ProductsToolbar
				search={search}
				onSearchChange={handleSearch}
				sortBy={sortBy}
				onSortChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
				selectedCount={selectedIds.size}
				onBulkDelete={handleBulkDelete}
				onBulkPriceAdjust={handleBulkPriceAdjust}
				onApplyCampaign={() => setShowCampaignPicker(true)}
				onExport={handleFileExport}
				onFilePreview={handleFilePreview}
				onFileImport={handleFileImport}
				onAddNew={() => setShowCreateModal(true)}
				totalCount={totalCount}
				bulkDeleting={bulkDeleting}
			/>

			<motion.div
				className="bg-white dark:bg-gray-800 shadow-xl dark:shadow-none rounded-xl overflow-hidden border border-gray-100 dark:border-transparent"
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<ProductsTable
					products={paginated}
					loading={loading}
					selectedIds={selectedIds}
					allPageSelected={allPageSelected}
					onToggleSelectAll={toggleSelectAll}
					onToggleSelect={toggleSelect}
					onEdit={setEditingProduct}
					onDelete={deleteProduct}
					onToggleFeatured={toggleFeaturedProduct}
					search={search}
				/>

				<ProductsPagination
					currentPage={currentPage}
					totalPages={totalPages}
					totalCount={totalCount}
					onPageChange={setCurrentPage}
				/>
			</motion.div>

			{/* Create Product Modal */}
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
									Thêm Sản Phẩm Mới
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

			{/* Edit Product Modal */}
			<AnimatePresence>
				{editingProduct && (
					<div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/60 backdrop-blur-sm overflow-y-auto">
						<motion.div
							initial={{ opacity: 0, scale: 0.96, y: 12 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.96, y: 12 }}
							transition={{ duration: 0.2 }}
							className="relative bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border shadow-2xl rounded-2xl w-full max-w-4xl mb-8"
						>
							<div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-luxury-border">
								<div>
									<h2 className="text-xl font-bold text-gray-900 dark:text-luxury-gold flex items-center gap-2">
										Chỉnh Sửa Sản Phẩm
									</h2>
									<p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-sm">
										{editingProduct.name}
									</p>
								</div>
								<button
									onClick={() => setEditingProduct(null)}
									className="p-2 bg-gray-100 dark:bg-luxury-border text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full transition"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
							<div className="p-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
								<EditProductForm
									product={editingProduct}
									onClose={() => setEditingProduct(null)}
									onSuccess={() => setEditingProduct(null)}
								/>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Import Preview Modal */}
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

			{/* Campaign Picker Modal */}
			<AnimatePresence>
				{showCampaignPicker && (
					<CampaignPickerModal
						selectedIds={[...selectedIds]}
						onClose={() => setShowCampaignPicker(false)}
						onSuccess={() => { setShowCampaignPicker(false); setSelectedIds(new Set()); }}
					/>
				)}
			</AnimatePresence>

			{/* Price Adjust Input Modal */}
			<AnimatePresence>
				{showPriceAdjustModal && (
					<InputModal
						config={{
							title: `Điều chỉnh giá cho ${priceAdjustCount} sản phẩm`,
							message: "Nhập phần trăm điều chỉnh (ví dụ -10 để giảm 10%).",
							label: "Phần trăm (%)",
							confirmLabel: "Áp dụng",
							onConfirm: handleConfirmPriceAdjust,
						}}
						onClose={() => setShowPriceAdjustModal(false)}
					/>
				)}
			</AnimatePresence>
		</div>
	);
};

export default ProductsList;
