import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  History,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit3,
  PlusCircle,
  BookOpen,
  Coins,
  ClipboardList,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useInventoryManagement } from "../../hooks/useInventoryManagement";

const InventoryTab = () => {
  const {
    lowStockProducts,
    products,
    loading,
    selectedProduct,
    setSelectedProduct,
    showAdjustModal,
    showLogsModal,
    action,
    setAction,
    quantity,
    setQuantity,
    note,
    setNote,
    search,
    handleSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedProducts,
    filteredProducts,
    warehouseValue,
    inventoryLogs,
    openAdjust,
    openBlankAdjust,
    openLogs,
    closeAdjustModal,
    closeLogsModal,
    handleAdjustSubmit,
  } = useInventoryManagement();

  const [stockFilter, setStockFilter] = useState("all"); // "all" | "low" | "in"
  const [stockSort, setStockSort] = useState(null); // null | "asc" | "desc"
  const [brandSort, setBrandSort] = useState(null); // null | "asc" | "desc"

  const getStockStatus = (p) => {
    const threshold =
      p.lowStockThreshold !== undefined && p.lowStockThreshold !== null
        ? p.lowStockThreshold
        : 5;
    const currentStock = Number(p.stock);
    if (currentStock <= 0)
      return {
        label: "Out of Stock",
        key: "low",
        cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      };
    if (currentStock <= threshold)
      return {
        label: "Low Stock",
        key: "low",
        cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      };
    return {
      label: "In Stock",
      key: "in",
      cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
  };

  const toggleStockSort = () => {
    setBrandSort(null);
    setStockSort((prev) =>
      prev === null ? "asc" : prev === "asc" ? "desc" : null,
    );
  };

  const toggleBrandSort = () => {
    setStockSort(null);
    setBrandSort((prev) =>
      prev === null ? "asc" : prev === "asc" ? "desc" : null,
    );
  };

  const getBrandName = (p) =>
    (
      p.brand?.name ||
      (typeof p.brand === "string" ? p.brand : "") ||
      ""
    ).toLowerCase();

  const finalProducts = useMemo(() => {
    let list = [...filteredProducts];

    if (stockFilter !== "all") {
      list = list.filter((p) => getStockStatus(p).key === stockFilter);
    }

    if (stockSort === "asc")
      list.sort((a, b) => Number(a.stock) - Number(b.stock));
    if (stockSort === "desc")
      list.sort((a, b) => Number(b.stock) - Number(a.stock));
    if (brandSort === "asc")
      list.sort((a, b) => getBrandName(a).localeCompare(getBrandName(b)));
    if (brandSort === "desc")
      list.sort((a, b) => getBrandName(b).localeCompare(getBrandName(a)));

    return list;
  }, [filteredProducts, stockFilter, stockSort, brandSort]);

  const PAGE_SIZE = 8;
  const computedTotalPages = Math.ceil(finalProducts.length / PAGE_SIZE) || 1;
  const validCurrentPage = Math.min(currentPage, computedTotalPages);

  const displayedProducts = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return finalProducts.slice(start, start + PAGE_SIZE);
  }, [finalProducts, validCurrentPage]);

  return (
    <div className="space-y-6">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tổng giá trị kho */}
        <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
            <Coins className="w-7 h-7 text-luxury-gold" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Tổng Giá Trị Kho
            </p>
            <p className="text-2xl font-bold text-luxury-gold leading-tight">
              {warehouseValue.toLocaleString("vi-VN")}{" "}
              <span className="text-lg">đ</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Giá trị hiện tại</p>
          </div>
        </div>

        {/* Sản phẩm sắp hết */}
        <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-7 h-7 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Sản Phẩm Sắp Hết
            </p>
            <p className="text-3xl font-bold text-red-500 leading-tight">
              {lowStockProducts.length}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Mức báo động:{" "}
              <span className="text-red-400 font-semibold">Theo SP</span>
            </p>
          </div>
        </div>

        {/* Đang kiểm kê */}
        <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <ClipboardList className="w-7 h-7 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Đang Kiểm Kê
            </p>
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-200 leading-tight">
              0
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Chờ xử lý</p>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search + Filter + CTA ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm, SKU, kho..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/40 transition shadow-sm"
          />
        </div>

        {/* Stock Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-luxury-darker p-1 rounded-xl shrink-0">
          {[
            { key: "all", label: "Tất cả" },
            { key: "low", label: "Low Stock" },
            { key: "in", label: "In Stock" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStockFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                stockFilter === f.key
                  ? f.key === "low"
                    ? "bg-red-500 text-white shadow-sm"
                    : f.key === "in"
                      ? "bg-green-500 text-white shadow-sm"
                      : "bg-white dark:bg-luxury-dark text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={openBlankAdjust}
          className="flex items-center gap-2 px-5 py-2.5 bg-luxury-gold text-black font-bold text-sm rounded-xl hover:bg-yellow-500 transition shadow-md whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" /> Khởi tạo Kiểm kê
        </button>
      </div>

      {/* ── Inventory Table ── */}
      <div className="bg-white dark:bg-luxury-dark rounded-2xl border border-gray-100 dark:border-luxury-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-luxury-border">
            <thead>
              <tr className="bg-gray-50 dark:bg-luxury-darker/60">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sản Phẩm
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={toggleBrandSort}
                    className="flex items-center gap-1.5 hover:text-luxury-gold transition-colors group"
                    title="Sắp xếp theo tên thương hiệu"
                  >
                    Brand
                    {brandSort === null && (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    )}
                    {brandSort === "asc" && (
                      <ArrowUp className="w-3.5 h-3.5 text-luxury-gold" />
                    )}
                    {brandSort === "desc" && (
                      <ArrowDown className="w-3.5 h-3.5 text-luxury-gold" />
                    )}
                  </button>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={toggleStockSort}
                    className="flex items-center gap-1.5 hover:text-luxury-gold transition-colors group"
                    title="Sắp xếp theo tồn kho"
                  >
                    Tồn Kho
                    {stockSort === null && (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    )}
                    {stockSort === "asc" && (
                      <ArrowUp className="w-3.5 h-3.5 text-luxury-gold" />
                    )}
                    {stockSort === "desc" && (
                      <ArrowDown className="w-3.5 h-3.5 text-luxury-gold" />
                    )}
                  </button>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-luxury-border/50">
              {displayedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              ) : (
                displayedProducts.map((p) => {
                  const status = getStockStatus(p);
                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-gray-50/70 dark:hover:bg-luxury-darker/30 transition-colors"
                    >
                      {/* Sản phẩm */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl border border-gray-100 dark:border-luxury-border object-cover shadow-sm"
                          />
                          <span
                            className="text-sm font-semibold text-gray-800 dark:text-gray-100 max-w-[200px] truncate"
                            title={p.name}
                          >
                            {p.name}
                          </span>
                        </div>
                      </td>
                      {/* Brand */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {p.brand?.name || p.brand || "—"}
                      </td>
                      {/* Tồn kho */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm font-bold text-gray-800 dark:text-gray-100">
                        {p.stock}
                      </td>
                      {/* Trạng thái */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      {/* Thao tác */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openAdjust(p._id, "ADJUST")}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-luxury-border bg-white dark:bg-luxury-darker text-gray-500 dark:text-gray-400 hover:bg-luxury-gold hover:text-black hover:border-luxury-gold transition-colors"
                            title="Điều chỉnh số lượng"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openLogs(p._id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-luxury-border bg-white dark:bg-luxury-darker text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-luxury-dark transition-colors"
                            title="Xem lịch sử"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {computedTotalPages > 1 && (
          <div className="px-5 py-3.5 bg-gray-50 dark:bg-luxury-darker/40 flex items-center justify-between border-t border-gray-100 dark:border-luxury-border">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Trang {validCurrentPage} / {computedTotalPages} •{" "}
              {finalProducts.length} sản phẩm
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-luxury-border text-gray-500 dark:text-gray-400 hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from(
                { length: Math.min(computedTotalPages, 5) },
                (_, i) => {
                  let page =
                    validCurrentPage <= 3 ? i + 1 : validCurrentPage - 2 + i;
                  if (page > computedTotalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition ${validCurrentPage === page ? "bg-luxury-gold text-black shadow-sm" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-luxury-dark"}`}
                    >
                      {page}
                    </button>
                  );
                },
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(computedTotalPages, p + 1))
                }
                disabled={validCurrentPage === computedTotalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-luxury-border text-gray-500 dark:text-gray-400 hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Adjust Modal ── */}
      <AnimatePresence>
        {showAdjustModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-luxury-darker rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-luxury-border shadow-2xl custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-luxury-gold flex items-center gap-2">
                  <Edit3 className="w-5 h-5" /> Điều chỉnh tồn kho
                </h3>
                <button
                  onClick={closeAdjustModal}
                  className="p-2 bg-gray-100 dark:bg-luxury-border text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Chọn sản phẩm
                  </label>
                  <select
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    required
                  >
                    <option value="" className="text-gray-400">
                      -- Chọn sản phẩm --
                    </option>
                    {products.length === 0 && (
                      <option value="" disabled className="text-gray-400">
                        Đang tải danh sách sản phẩm...
                      </option>
                    )}
                    {products.map((p) => (
                      <option
                        key={p._id}
                        value={p._id}
                        className="text-gray-900 dark:text-gray-100"
                      >
                        {p.name} {p.brand?.name ? `(${p.brand.name})` : ""} -
                        Tồn: {p.stock || 0}
                      </option>
                    ))}
                  </select>
                  {products.length === 0 && !loading && (
                    <p className="text-xs text-amber-500 mt-1">
                      ⚠ Chưa có sản phẩm. Vui lòng tải lại trang hoặc vào tab
                      Sản phẩm trước.
                    </p>
                  )}
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Loại thao tác
                    </label>
                    <select
                      className="w-full bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 dark:text-white"
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                    >
                      <option value="IN">Nhập Kho (+)</option>
                      <option value="OUT">Xuất Kho (-)</option>
                      <option value="ADJUST">Kiểm Kê (Set số mới)</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Số lượng
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 dark:text-white"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Ghi chú / Lý do
                  </label>
                  <textarea
                    className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition resize-none"
                    rows="2"
                    required
                    placeholder="Vd: Nhập lô hàng mới tháng 4..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-luxury-gold text-luxury-dark font-bold py-2.5 rounded-lg hover:bg-yellow-500 shadow-md transition-colors disabled:opacity-50"
                  >
                    {loading ? "Đang xử lý..." : "Xác nhận cập nhật"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Logs Modal ── */}
      <AnimatePresence>
        {showLogsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-luxury-darker rounded-2xl p-6 w-full max-w-2xl border border-gray-100 dark:border-luxury-border max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-luxury-border pb-4">
                <h3 className="text-xl font-bold dark:text-luxury-gold flex items-center gap-2">
                  <History className="w-5 h-5" /> Lịch sử xuất / nhập kho
                </h3>
                <button
                  onClick={closeLogsModal}
                  className="p-2 bg-gray-100 dark:bg-luxury-border text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {inventoryLogs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Chưa có lịch sử nào ghi nhận.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {inventoryLogs.map((log) => (
                      <div
                        key={log._id}
                        className="p-3 bg-gray-50 dark:bg-luxury-darker rounded-lg border border-gray-100 dark:border-luxury-border text-sm"
                      >
                        <div className="flex justify-between font-semibold mb-1">
                          <span
                            className={
                              log.action === "OUT"
                                ? "text-red-500"
                                : log.action === "IN"
                                  ? "text-luxury-gold"
                                  : "text-gray-500 dark:text-gray-400"
                            }
                          >
                            {log.action} (
                            {log.quantity > 0
                              ? `+${log.quantity}`
                              : log.quantity}
                            )
                          </span>
                          <span className="text-gray-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                          Lý do: <span className="font-medium">{log.note}</span>
                        </p>
                        {log.referenceOrderId && (
                          <p className="text-xs text-gray-500 mt-1">
                            Order Ref:{" "}
                            {log.referenceOrderId.orderCode ||
                              log.referenceOrderId._id}
                          </p>
                        )}
                        {log.userId && (
                          <p className="text-xs text-gray-500 mt-1">
                            Admin: {log.userId.email}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryTab;
