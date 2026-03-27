import { useEffect, useState, useMemo } from "react";
import { useInventoryStore } from "../stores/useInventoryStore";
import { useProductStore } from "../stores/useProductStore";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, History, X, Search, ChevronLeft, ChevronRight, Edit3, PlusCircle, BookOpen } from "lucide-react";

const PAGE_SIZE = 8;

const InventoryTab = () => {
    const { lowStockProducts, fetchLowStockProducts, adjustStock, fetchProductLogs, inventoryLogs, loading } = useInventoryStore();
    const { products } = useProductStore();
    const [selectedProduct, setSelectedProduct] = useState("");
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);

    // Form states
    const [action, setAction] = useState("IN");
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState("");

    // Search and pagination state
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchLowStockProducts();
    }, [fetchLowStockProducts]);

    const filteredProducts = useMemo(() => {
        const q = search.toLowerCase().trim();
        let list = (products || []).filter(p => 
            !q || 
            p.name?.toLowerCase().includes(q) || 
            p.brand?.name?.toLowerCase().includes(q) ||
            (typeof p.brand === 'string' && p.brand.toLowerCase().includes(q))
        );
        return list;
    }, [products, search]);

    const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        try {
            await adjustStock(selectedProduct, action, quantity, note);
            setShowAdjustModal(false);
            setNote("");
            setQuantity(1);
            fetchLowStockProducts(); // Refresh
        } catch {
            // Error handled in store
        }
    };

    const openLogs = async (productId) => {
        setSelectedProduct(productId);
        await fetchProductLogs(productId);
        setShowLogsModal(true);
    };

    const openAdjust = (productId) => {
        setSelectedProduct(productId);
        setShowAdjustModal(true);
    };

    return (
        <div className="space-y-8">
            {/* Low Stock Alerts */}
            <section className="bg-red-50/50 dark:bg-red-900/10 rounded-2xl p-6 border border-red-100 dark:border-red-900/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                <h2 className="text-xl font-bold flex items-center text-red-600 dark:text-red-400 mb-4">
                    <AlertCircle className="w-6 h-6 mr-2" />
                    Cảnh báo Tồn kho Thiếu Hụt
                </h2>
                {lowStockProducts.length === 0 ? (
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg w-fit">
                        Tất cả sản phẩm đều đang đạt mức tồn kho an toàn.
                    </p>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-red-100 dark:border-red-900/30">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                            <thead className="bg-red-50/50 dark:bg-red-900/20">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">Sản phẩm</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">Tồn kho hiện tại</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">Hạn mức đề xuất</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                {lowStockProducts.map(p => (
                                    <tr key={p._id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-200">
                                            <div className="flex items-center gap-3">
                                                <img src={p.image} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 object-cover" alt="" />
                                                <span className="max-w-[180px] truncate" title={p.name}>{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 font-bold text-red-600 dark:text-red-400 text-lg">{p.stock}</td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{p.lowStockThreshold || 5} sản phẩm</td>
                                        <td className="px-5 py-3 text-right">
                                            <button 
                                                onClick={() => { setAction("IN"); openAdjust(p._id); }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 shadow-sm transition-colors text-xs font-bold"
                                            >
                                                <PlusCircle className="w-3.5 h-3.5" /> Nhập Kho Ngay
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Inventory Tools */}
            <section>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-luxury-gold flex items-center gap-2">
                        <History className="w-6 h-6 text-luxury-gold" /> Kiểm Kê & Lịch Sự
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={search}
                                onChange={handleSearch}
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-luxury-gold transition"
                            />
                        </div>
                        <button 
                            onClick={() => { setSelectedProduct(""); setAction("ADJUST"); setShowAdjustModal(true); }}
                            className="bg-luxury-gold font-bold text-luxury-dark px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-500 transition shadow w-full sm:w-auto justify-center"
                        >
                            <Edit3 className="w-4 h-4" /> Khởi tạo Kiểm kê
                        </button>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-transparent overflow-hidden flex flex-col">
                    <div className="overflow-x-auto overflow-y-auto max-h-[55vh] custom-scrollbar">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 relative">
                            <thead className="bg-gray-50/95 dark:bg-gray-700/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sản phẩm</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">SKU / Brand</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tồn kho</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-gray-400">
                                            Không tìm thấy sản phẩm nào.
                                        </td>
                                    </tr>
                                ) : paginatedProducts.map(p => (
                                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            <div className="flex items-center gap-3">
                                                <img src={p.image} className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-600 object-cover" alt="" />
                                                <span className="font-medium max-w-[180px] truncate" title={p.name}>{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{p.brand?.name || p.brand}</td>
                                        <td className="px-5 py-3 whitespace-nowrap text-sm">
                                            <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${p.stock <= (p.lowStockThreshold || 5) ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap text-right space-x-2">
                                            <button 
                                                onClick={() => { setAction("ADJUST"); openAdjust(p._id); }} 
                                                className="inline-flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-luxury-gold hover:text-luxury-dark transition-colors"
                                                title="Điều chỉnh số lượng"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => openLogs(p._id)} 
                                                className="inline-flex items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                                title="Xem lịch sử"
                                            >
                                                <BookOpen className="w-4 h-4" />
                                            </button>
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
                                Trang {currentPage} / {totalPages} • {filteredProducts.length} sản phẩm
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-transparent hover:bg-gray-50 disabled:opacity-40 transition"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                                    if (page > totalPages) return null;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 rounded-lg text-sm font-bold transition ${currentPage === page ? "bg-luxury-gold text-luxury-dark shadow" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-500"}`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-transparent hover:bg-gray-50 disabled:opacity-40 transition"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Adjust Modal */}
            <AnimatePresence>
            {showAdjustModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-luxury-darker rounded-2xl p-6 w-full max-w-md border border-gray-100 dark:border-luxury-border shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold dark:text-luxury-gold flex items-center gap-2">
                                <Edit3 className="w-5 h-5" /> Điều chỉnh tồn kho
                            </h3>
                            <button 
                                onClick={() => setShowAdjustModal(false)}
                                className="p-2 bg-gray-100 dark:bg-luxury-border text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAdjustSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Chọn sản phẩm</label>
                                <select 
                                    className="w-full bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 dark:text-white"
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    required
                                >
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Loại thao tác</label>
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
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Số lượng</label>
                                    <input 
                                        type="number" min="1" required
                                        className="w-full bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 dark:text-white"
                                        value={quantity} onChange={e => setQuantity(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Ghi chú / Lý do</label>
                                <textarea 
                                    className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition resize-none"
                                    rows="2" required
                                    placeholder="Vd: Nhập lô hàng mới tháng 4..."
                                    value={note} onChange={e => setNote(e.target.value)}
                                />
                            </div>
                            <div className="pt-2">
                                <button 
                                    type="submit" disabled={loading}
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

            {/* Logs Modal */}
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
                                onClick={() => setShowLogsModal(false)}
                                className="p-2 bg-gray-100 dark:bg-luxury-border text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {inventoryLogs.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Chưa có lịch sử nào ghi nhận.</p>
                            ) : (
                                <div className="space-y-3">
                                    {inventoryLogs.map(log => (
                                        <div key={log._id} className="p-3 bg-gray-50 dark:bg-luxury-darker rounded-lg border border-gray-100 dark:border-luxury-border text-sm">
                                            <div className="flex justify-between font-semibold mb-1">
                                                <span className={log.action === "OUT" ? "text-red-500" : log.action === "IN" ? "text-green-500" : "text-blue-500"}>
                                                    {log.action} ({log.quantity > 0 ? `+${log.quantity}` : log.quantity})
                                                </span>
                                                <span className="text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300">Lý do: <span className="font-medium">{log.note}</span></p>
                                            {log.referenceOrderId && (
                                                <p className="text-xs text-gray-500 mt-1">Order Ref: {log.referenceOrderId.orderCode || log.referenceOrderId._id}</p>
                                            )}
                                            {log.userId && (
                                                <p className="text-xs text-gray-500 mt-1">User/Admin: {log.userId.email}</p>
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
