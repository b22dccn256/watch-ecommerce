import { useRef } from "react";
import {
  Package,
  PlusCircle,
  Search,
  Trash2,
  Megaphone,
  Upload,
  Download,
} from "lucide-react";

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
  bulkDeleting,
}) => {
  const previewInputRef = useRef(null);
  const importInputRef = useRef(null);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between bg-white dark:bg-luxury-darker/40 p-4 rounded-2xl border border-gray-100 dark:border-luxury-border/50 shadow-sm">
      {/* Left section: Title and Search */}
      <div className="flex items-center gap-6 flex-1 w-full max-w-3xl">
        <h2 className="text-xl font-bold text-gray-900 dark:text-luxury-gold flex items-center gap-2 whitespace-nowrap">
          <div className="w-8 h-8 rounded-full bg-luxury-gold/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-luxury-gold" />
          </div>
          Sản Phẩm
        </h2>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, thương hiệu, hoặc danh mục..."
            value={search}
            onChange={onSearchChange}
            className="w-full bg-gray-100 dark:bg-luxury-dark border-transparent rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold/50 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Right section: Filters and Actions */}
      <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-end">
        {/* Bulk actions */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-1.5 border-r border-gray-200 dark:border-luxury-border pr-3">
            <button
              onClick={onBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold transition"
              title={`Xóa ${selectedCount} sản phẩm`}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa ({selectedCount})</span>
            </button>
            <button
              onClick={onBulkPriceAdjust}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-sm font-bold transition"
              title={`Điều chỉnh giá ${selectedCount} sản phẩm`}
            >
              ±<span className="hidden sm:inline">Giá</span>
            </button>
            <button
              onClick={onApplyCampaign}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-600/10 hover:bg-purple-100 dark:hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-bold transition"
              title={`Mở Marketing ${selectedCount} sản phẩm`}
            >
              <Megaphone className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative">
          <select
            value={sortBy}
            onChange={onSortChange}
            className="bg-gray-100 dark:bg-luxury-dark border-transparent rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold/50 focus:bg-white transition appearance-none pr-8 cursor-pointer"
          >
            <option value="price_desc">Lọc theo Giá cao</option>
            <option value="price_asc">Lọc theo Giá thấp</option>
            <option value="name_asc">Tên A-Z</option>
            <option value="name_desc">Tên Z-A</option>
            <option value="newest">Mới nhất</option>
            <option value="best_selling">Bán chạy</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-luxury-dark transition"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden xl:inline">Xuất</span>
        </button>

        <button
          onClick={() => previewInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-luxury-dark transition"
        >
          <Download className="w-4 h-4" />
          <span className="hidden xl:inline">Nhập</span>
        </button>

        <input
          ref={previewInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={onFilePreview}
        />
        <input
          ref={importInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={onFileImport}
        />

        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#dca41b] text-black rounded-lg text-sm font-bold shadow-md hover:bg-[#c49216] transition whitespace-nowrap"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Thêm mới</span>
        </button>
      </div>
    </div>
  );
};

export default ProductsToolbar;
