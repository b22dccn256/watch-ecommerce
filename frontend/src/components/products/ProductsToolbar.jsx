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
	totalCount,
	bulkDeleting
}) => {
	const previewInputRef = useRef(null);
	const importInputRef = useRef(null);

	return (
		<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
			<div className="flex items-center gap-3">
				<h2 className="text-xl font-bold text-gray-900 dark:text-luxury-gold flex items-center gap-2 hidden md:flex">
					<Package className="w-5 h-5 text-luxury-gold" /> Sản Phẩm
				</h2>
				<button
					onClick={onAddNew}
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
					onChange={onSearchChange}
					className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-luxury-gold transition"
				/>
			</div>
			<div className="flex items-center gap-2 flex-wrap">
				{/* Bulk actions */}
				{selectedCount > 0 && (
					<>
						<button
							onClick={onBulkDelete}
							disabled={bulkDeleting}
							className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition"
						>
							<Trash2 className="w-3.5 h-3.5" />
							Xóa ({selectedCount})
						</button>
						<button
							onClick={onBulkPriceAdjust}
							className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-lg text-sm font-bold hover:bg-amber-500 hover:text-white transition"
						>
							± Giá ({selectedCount})
						</button>
						<button
							onClick={onApplyCampaign}
							className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/20 border border-purple-500/50 text-purple-400 rounded-lg text-sm font-bold hover:bg-purple-600 hover:text-white transition"
						>
							<Megaphone className="w-3.5 h-3.5" />
							Mở Marketing ({selectedCount})
						</button>
					</>
				)}
				<button
					onClick={onExport}
					className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 border border-blue-500/50 text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition"
				>
					<FileSpreadsheet className="w-3.5 h-3.5" />
					<span className="hidden md:inline">Xuất Excel</span>
				</button>
				<button
					onClick={() => previewInputRef.current?.click()}
					className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-600 hover:text-white transition"
				>
					<FileSpreadsheet className="w-3.5 h-3.5" />
					<span className="hidden md:inline">Nhập Excel</span>
				</button>
				<input ref={previewInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFilePreview} />
				<input ref={importInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileImport} />

				<span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap hidden md:inline">
					{totalCount || 0} SP
				</span>
				<select
					value={sortBy}
					onChange={onSortChange}
					className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
				>
					<option value="name_asc">Tên A-Z</option>
					<option value="name_desc">Tên Z-A</option>
					<option value="price_desc">Giá cao nhất</option>
					<option value="price_asc">Giá thấp nhất</option>
					<option value="newest">Mới nhất</option>
					<option value="best_selling">Bán chạy nhất</option>
				</select>
			</div>
		</div>
	);
};

export default ProductsToolbar;
