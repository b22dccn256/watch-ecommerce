import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, AlertTriangle } from "lucide-react";
import { useProductStore } from "../../stores/useProductStore";
import axios from "../../lib/axios";
import toast from "react-hot-toast";

// Imported forms and modals
import CreateProductForm from "../CreateProductForm";
import EditProductForm from "../EditProductForm";
import InputModal from "../InputModal";

// New centralized modal system
import Modal, { ConfirmModal } from "../ui/Modal";
import useModalStore from "../../stores/useModalStore";

// Custom hooks for extraction
import useProductsSearch from "../../hooks/useProductsSearch";
import useProductsBulkSelect from "../../hooks/useProductsBulkSelect";
import useProductsList from "../../hooks/useProductsList";
import useProductsModal from "../../hooks/useProductsModal";

// Extracted components
import ProductsToolbar from "../products/ProductsToolbar";
import ProductsTable from "../products/ProductsTable";
import ProductsPagination from "../products/ProductsPagination";
import CampaignPickerModal from "../products/CampaignPickerModal";

const PAGE_SIZE = 10;

const ProductsList = () => {
	// ============ NEW: Use custom hooks for cleaner state management ============
	const { search, setSearch, debouncedSearch, currentPage, setCurrentPage, sortBy, setSortBy } = useProductsSearch();
	
	// Get products from hook
	const { products, loading, totalPages, totalCount, fetchProducts, deleteProduct, bulkDelete, bulkToggleFeatured } = useProductsList();
	
	// For bulk select, we need to initialize it with current products
	const { selectedIds, toggleSelect, toggleSelectAll, allPageSelected, selectedCount, clearSelection } = useProductsBulkSelect(products);
	
	// Modal management
	const { 
		openCreateModal, isCreateOpen, 
		openEditModal, closeEditModal, isEditOpen, getEditingProduct,
		openDeleteConfirm, isDeleteConfirmOpen, getProductToDelete
	} = useProductsModal();

	// Local state for import/export operations only
	const [importPreview, setImportPreview] = useState(null);
	const [previewFile, setPreviewFile] = useState(null);
	const [importConfirming, setImportConfirming] = useState(false);
	const [bulkDeleting, setBulkDeleting] = useState(false);
	const [priceAdjustCount, setPriceAdjustCount] = useState(0);

	// Store functions
	const { fetchAllProducts } = useProductStore();

	// ============ Pre-fetch brands on mount để edit modal mở nhanh ============
	const { fetchBrands } = useProductStore();
	useEffect(() => {
		fetchBrands();
	}, [fetchBrands]);

	// ============ Fetch products when search/sort/pagination changes ============
	useEffect(() => {
		fetchProducts({
			page: currentPage,
			limit: PAGE_SIZE,
			search: debouncedSearch,
			sort: sortBy,
		});
	}, [currentPage, debouncedSearch, sortBy, fetchProducts]);

	// ============ Event Handlers ============

	// Search
	const handleSearch = (e) => {
		setSearch(e.target.value);
		setCurrentPage(1);
	};

	// Bulk delete
	const handleBulkDelete = () => {
		if (!selectedCount) return;
		const openBulkDeleteConfirm = useModalStore.getState().openModal;
		openBulkDeleteConfirm('bulkDeleteConfirm', { count: selectedCount, ids: Array.from(selectedIds) });
	};

	// Confirm bulk delete
	const handleConfirmedBulkDelete = async () => {
		setBulkDeleting(true);
		const success = await bulkDelete(Array.from(selectedIds));
		if (success) {
			clearSelection();
			await fetchProducts({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch, sort: sortBy });
		}
		setBulkDeleting(false);
	};

	// Bulk price adjust
	const handleBulkPriceAdjust = () => {
		if (!selectedCount) return;
		setPriceAdjustCount(selectedCount);
		useModalStore.getState().openModal('priceAdjust');
	};

	// Confirm price adjustment
	const handleConfirmPriceAdjust = async (value) => {
		if (value === null || value === "") return;
		if (isNaN(Number(value))) {
			toast.error("Vui lòng nhập số hợp lệ");
			return;
		}
		const toastId = toast.loading("Đang điều chỉnh giá...");
		try {
			const res = await axios.patch("/products", {
				action: "adjustPrice",
				ids: Array.from(selectedIds),
				value: Number(value),
			});
			toast.success(res.data.message, { id: toastId });
			clearSelection();
			await fetchProducts({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch, sort: sortBy });
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi khi điều chỉnh giá", { id: toastId });
		}
	};

	// File preview for import
	const handleFilePreview = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		setPreviewFile(file);
		const formData = new FormData();
		formData.append("file", file);
		const toastId = toast.loading("Đang đọc file Excel...");
		try {
			const res = await axios.post("/products/import/preview", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			setImportPreview(res.data);
			toast.success(`Đọc được ${res.data.total} dòng. Kiểm tra trước khi import.`, { id: toastId });
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi khi đọc file", { id: toastId });
		}
		e.target.value = "";
	};

	// Confirm import
	const handleConfirmedImport = async () => {
		if (!previewFile) return;
		setImportConfirming(true);
		const formData = new FormData();
		formData.append("file", previewFile);
		const toastId = toast.loading("Đang import...");
		try {
			const res = await axios.post("/products/import", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			toast.success(`Thành công: ${res.data.success} sản phẩm`, { id: toastId, duration: 5000 });
			setImportPreview(null);
			setPreviewFile(null);
			await fetchAllProducts();
			await fetchProducts({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch, sort: sortBy });
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi khi import", { id: toastId });
		} finally {
			setImportConfirming(false);
		}
	};

	// Direct file import (without preview)
	const handleFileImport = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const formData = new FormData();
		formData.append("file", file);
		const toastId = toast.loading("Đang nhập dữ liệu từ Excel...");
		try {
			const res = await axios.post("/products/import", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			toast.success(`Thành công: ${res.data.success}, Thất bại: ${res.data.failed}`, { id: toastId, duration: 5000 });
			await fetchAllProducts();
			await fetchProducts({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch, sort: sortBy });
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi khi nhập file Excel", { id: toastId });
		}
		e.target.value = "";
	};

	// Export to Excel
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

	// ============ RENDER ============
	return (
		<div className="space-y-4">
			{/* Toolbar with search, sort, and bulk actions */}
			<ProductsToolbar
				search={search}
				onSearchChange={handleSearch}
				sortBy={sortBy}
				onSortChange={(e) => {
					setSortBy(e.target.value);
					setCurrentPage(1);
				}}
				selectedCount={selectedCount}
				onBulkDelete={handleBulkDelete}
				onBulkPriceAdjust={handleBulkPriceAdjust}
				onApplyCampaign={() => useModalStore.getState().openModal('campaignPicker')}
				onExport={handleFileExport}
				onFilePreview={handleFilePreview}
				onFileImport={handleFileImport}
				onAddNew={openCreateModal}
				totalCount={totalCount}
				bulkDeleting={bulkDeleting}
			/>

			{/* Products table and pagination */}
			<motion.div
				className="bg-white dark:bg-gray-800 shadow-xl dark:shadow-none rounded-xl overflow-hidden border border-gray-100 dark:border-transparent"
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<ProductsTable
					products={products}
					loading={loading}
					selectedIds={selectedIds}
					allPageSelected={allPageSelected}
					onToggleSelectAll={toggleSelectAll}
					onToggleSelect={toggleSelect}
					onEdit={openEditModal}
					onDelete={(id) => openDeleteConfirm({ productId: id })}
					onToggleFeatured={bulkToggleFeatured}
					search={search}
				/>

				<ProductsPagination
					currentPage={currentPage}
					totalPages={totalPages}
					totalCount={totalCount}
					onPageChange={setCurrentPage}
				/>
			</motion.div>

			{/* ============ MODALS - Much cleaner! ============ */}

			{/* Create Product Modal */}
			<Modal name="createProduct" title="Thêm Sản Phẩm Mới" size="3xl">
				<CreateProductForm
					onSuccess={() => {
						useModalStore.getState().closeModal('createProduct');
						fetchAllProducts();
						fetchProducts({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch, sort: sortBy });
					}}
				/>
			</Modal>

			{/* Edit Product Modal */}
			{isEditOpen() && (
				<Modal name="editProduct" title="Chỉnh Sửa Sản Phẩm" size="3xl">
					<EditProductForm
						product={getEditingProduct()}
						onClose={closeEditModal}
						onSuccess={() => {
							closeEditModal();
							fetchProducts({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch, sort: sortBy });
						}}
					/>
				</Modal>
			)}

			{/* Import Preview Modal */}
			{importPreview && (
				<AnimatePresence>
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
										<Eye className="w-5 h-5 text-luxury-gold" /> Xem trước Import Excel
									</h2>
									<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
										{importPreview.message} (Hiển thị tối đa 50 dòng đầu)
									</p>
								</div>
								<button
									onClick={() => {
										setImportPreview(null);
										setPreviewFile(null);
									}}
									className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
								>
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
												<td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
													{row.name || <span className="text-red-400">—</span>}
												</td>
												<td className="px-3 py-2 text-gray-600 dark:text-gray-300">{row.brand}</td>
												<td className="px-3 py-2 text-gray-600 dark:text-gray-300">{row.category}</td>
												<td className="px-3 py-2 text-right font-semibold text-luxury-gold">
													{Number(row.price).toLocaleString("vi-VN")} ₫
												</td>
												<td className="px-3 py-2 text-right">{row.stock}</td>
												<td className="px-3 py-2">
													{row.validation === "OK" ? (
														<span className="text-luxury-gold font-semibold">✓</span>
													) : (
														<span className="text-red-400 flex items-center gap-1">
															<AlertTriangle className="w-3 h-3" />
															{row.validation}
														</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							<div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
								<p className="text-sm text-gray-500">
									Tổng: <strong className="text-gray-900 dark:text-white">{importPreview.total}</strong> sản phẩm sẽ được xử lý
								</p>
								<div className="flex gap-3">
									<button
										onClick={() => {
											setImportPreview(null);
											setPreviewFile(null);
										}}
										className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition"
									>
										Hủy
									</button>
									<button
										onClick={handleConfirmedImport}
										disabled={importConfirming}
										className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition disabled:opacity-60 flex items-center gap-2"
									>
										{importConfirming ? (
											<>
												<span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
												Đang lưu...
											</>
										) : (
											"✓ Xác nhận Import"
										)}
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				</AnimatePresence>
			)}

			{/* Delete Single Product Confirmation */}
			<ConfirmModal
				name="deleteConfirm"
				title="Xóa sản phẩm?"
				message="Bạn có chắc muốn xóa sản phẩm này không? Thao tác này không thể hoàn tác."
				onConfirm={async () => {
					const product = getProductToDelete();
					if (product) {
						const success = await deleteProduct(product.productId);
						if (success) {
							fetchProducts({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch, sort: sortBy });
						}
					}
				}}
				confirmText="Xóa"
				isDangerous
			/>

			{/* Bulk Delete Confirmation */}
			<ConfirmModal
				name="bulkDeleteConfirm"
				title="Xóa sản phẩm?"
				message={`Bạn sắp xóa ${selectedCount} sản phẩm. Thao tác này không thể hoàn tác.`}
				onConfirm={handleConfirmedBulkDelete}
				onCancel={() => useModalStore.getState().closeModal('bulkDeleteConfirm')}
				confirmText="Xóa"
				isDangerous
			/>

			{/* Price Adjustment Modal */}
			<InputModal
				isOpen={useModalStore((s) => s.isOpen('priceAdjust'))}
				onClose={() => useModalStore.getState().closeModal('priceAdjust')}
				title="Điều chỉnh giá"
				placeholder="Nhập mức điều chỉnh (%, hoặc số tiền)"
				onConfirm={handleConfirmPriceAdjust}
				confirmText="Cập nhật"
				defaultValue=""
			/>

			{/* Campaign Picker Modal */}
			<CampaignPickerModal
				isOpen={useModalStore((s) => s.isOpen('campaignPicker'))}
				onClose={() => useModalStore.getState().closeModal('campaignPicker')}
				selectedIds={selectedIds}
			/>
		</div>
	);
};

export default ProductsList;
