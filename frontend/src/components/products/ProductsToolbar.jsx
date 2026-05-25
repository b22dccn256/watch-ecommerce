import { useRef } from "react";
import { Package, PlusCircle, Search, Trash2, Megaphone, FileSpreadsheet } from "lucide-react";

const ProductsToolbar = ({
	search,
	onSearchChange,
	sortBy,
	onSortChange,
	selectedCount,
	onBulkDelete,
	onBulkPriceAdjust,
	onApplyCampaign,
	onExport,
	onFilePreview,
	onFileImport,
	onAddNew,
	bulkDeleting
}) => {
	const previewInputRef = useRef(null);
	const importInputRef = useRef(null);

	return (
		<div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between bg-white dark:bg-luxury-darker/40 p-2.5 rounded-xl border border-gray-100 dark:border-luxury-border/50 shadow-sm">
			<div className="flex items-center gap-3 flex-1 w-full">
				<h2 className="text-lg font-bold text-gray-900 dark:text-luxury-gold flex items-center gap-2 hidden xl:flex whitespace-nowrap px-2">
					<Package className="w-4 h-4 text-luxury-gold" /> Sản Phẩm
				</h2>
				<div className="relative flex-1 max-w-md min-w-[200px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						placeholder="Tìm tên, thương hiệu, danh mục..."
						value={search}
						onChange={onSearchChange}
						className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-luxury-gold transition"
					/>
				</div>
			</div>
			
			<div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
				{/* Bulk actions */}
				{selectedCount > 0 && (
					<div className="flex items-center gap-1 border-r border-gray-200 dark:border-luxury-border pr-2 mr-1">
						<button
							onClick={onBulkDelete}
							disabled={bulkDeleting}
							className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition"
							title={`Xóa ${selectedCount} sản phẩm`}
						>
							<Trash2 className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">Xóa ({selectedCount})</span>
						</button>
						<button
							onClick={onBulkPriceAdjust}
							className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold transition"
							title={`Điều chỉnh giá ${selectedCount} sản phẩm`}
						>
							±<span className="hidden sm:inline">Giá</span>
						</button>
						<button
							onClick={onApplyCampaign}
							className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-600/10 hover:bg-purple-100 dark:hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-bold transition"
							title={`Mở Marketing ${selectedCount} sản phẩm`}
						>
							<Megaphone className="w-3.5 h-3.5" />
						</button>
					</div>
				)}

				<select
					value={sortBy}
					onChange={onSortChange}
					className="bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition max-w-[120px]"
				>
					<option value="name_asc">Tên A-Z</option>
					<option value="name_desc">Tên Z-A</option>
					<option value="price_desc">Giá cao</option>
					<option value="price_asc">Giá thấp</option>
					<option value="newest">Mới nhất</option>
					<option value="best_selling">Bán chạy</option>
				</select>

				{/* Grouped Export/Import tools */}
				<div className="flex items-center gap-0.5 bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg p-0.5">
					<button
						onClick={onExport}
						title="Xuất Excel"
						className="flex items-center gap-1 p-1.5 px-2 text-gray-500 hover:text-luxury-gold hover:bg-white dark:hover:bg-luxury-darker rounded-md transition text-xs font-medium"
					>
						<FileSpreadsheet className="w-3.5 h-3.5" />
						<span className="hidden xl:inline">Xuất</span>
					</button>
					<div className="w-px h-3.5 bg-gray-300 dark:bg-luxury-border"></div>
					<button
						onClick={() => previewInputRef.current?.click()}
						title="Nhập Excel"
						className="flex items-center gap-1 p-1.5 px-2 text-gray-500 hover:text-luxury-gold hover:bg-white dark:hover:bg-luxury-darker rounded-md transition text-xs font-medium"
					>
						<FileSpreadsheet className="w-3.5 h-3.5" />
						<span className="hidden xl:inline">Nhập</span>
					</button>
				</div>
				<input ref={previewInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFilePreview} />
				<input ref={importInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileImport} />

				<button
					onClick={onAddNew}
					className="flex items-center gap-1.5 px-3 py-1.5 bg-luxury-gold text-luxury-dark rounded-lg text-xs font-bold shadow hover:bg-yellow-500 transition ml-1 whitespace-nowrap"
				>
					<PlusCircle className="w-4 h-4" /> <span className="hidden sm:inline">Thêm mới</span>
				</button>
			</div>
		</div>
	);
};

export default ProductsToolbar;
