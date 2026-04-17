import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Eye, XCircle, Download, ShieldCheck, AlertCircle, Search, Printer, Save, DollarSign, PenTool, StickyNote, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const STATUS_OPTIONS = ["pending", "awaiting_verification", "confirmed", "processing", "shipped", "delivered", "return_requested", "returned", "cancelled"];
const STATUS_COLORS = {
    pending: "text-yellow-400 bg-yellow-400/10",
    awaiting_verification: "text-amber-400 bg-amber-400/10",
    confirmed: "text-blue-400 bg-blue-400/10",
    processing: "text-orange-400 bg-orange-400/10",
    shipped: "text-purple-400 bg-purple-400/10",
    delivered: "text-emerald-400 bg-emerald-400/10",
    return_requested: "text-pink-400 bg-pink-400/10",
    returned: "text-red-400 bg-red-400/10",
    cancelled: "text-gray-400 bg-gray-400/10",
};

const STATUS_LABELS = {
    pending: "Chờ xác nhận",
    awaiting_verification: "Chờ xác minh",
    confirmed: "Đã xác nhận",
    processing: "Đang xử lý",
    shipped: "Đang giao hàng",
    delivered: "Đã giao",
    return_requested: "Đang chờ duyệt trả hàng",
    returned: "Trả hàng",
    cancelled: "Đã hủy",
};

const FILTER_TABS = ["Tất cả", ...STATUS_OPTIONS];

const OrdersTab = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [savingDetails, setSavingDetails] = useState(false);
    const [activeFilter, setActiveFilter] = useState("Tất cả");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [globalStats, setGlobalStats] = useState({ pendingCount: 0, returnedCount: 0, totalOrders: 0 });
    
    // Form states cho Modal Chi tiết
    const [detailsForm, setDetailsForm] = useState({
        internalNotes: "",
        returnReason: "",
        refundAmount: 0,
        carrier: "",
        carrierTrackingNumber: ""
    });

    const fetchOrders = useCallback(async (query = "", page = 1, status = "Tất cả") => {
        setLoading(true);
        try {
            let url = `/orders?page=${page}&limit=10`;
            if (query) url += `&search=${encodeURIComponent(query)}`;
            if (status !== "Tất cả") url += `&status=${status}`;
            
            const res = await axios.get(url);
            setOrders(res.data.orders);
            setTotalPages(res.data.pagination.totalPages);
            setTotalOrders(res.data.pagination.totalOrders);
            setCurrentPage(res.data.pagination.currentPage);
            setGlobalStats(res.data.stats || { pendingCount: 0, returnedCount: 0, totalOrders: 0 });
        } catch (error) {
            console.error("Failed to fetch orders", error);
            toast.error("Không thể tải danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchOrders(searchTerm, 1, activeFilter);
        }, 500);
        return () => clearTimeout(debounce);
    }, [searchTerm, activeFilter, fetchOrders]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchOrders(searchTerm, newPage, activeFilter);
        }
    };

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setDetailsForm({
            internalNotes: order.internalNotes || "",
            returnReason: order.returnReason || "",
            refundAmount: order.refundAmount || 0,
            carrier: order.carrier || "",
            carrierTrackingNumber: order.carrierTrackingNumber || ""
        });
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        setUpdatingStatus(true);
        try {
            await axios.patch(`/orders/${orderId}/status`, { status: newStatus });
            setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
            setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
            toast.success(`Đã cập nhật trạng thái: ${STATUS_LABELS[newStatus]}`);
            
            // Refresh stats
            fetchOrders(searchTerm, currentPage, activeFilter);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const saveOrderDetails = async () => {
        if (!selectedOrder) return;
        setSavingDetails(true);
        try {
            if (["return_requested", "returned"].includes(selectedOrder.status)) {
                if (!detailsForm.returnReason.trim()) {
                    toast.error("Vui lòng nhập lý do trả hàng.");
                    return;
                }
                if (detailsForm.refundAmount < 0 || detailsForm.refundAmount > selectedOrder.totalAmount) {
                    toast.error("Số tiền hoàn không hợp lệ.");
                    return;
                }
            }

            await axios.patch(`/orders/${selectedOrder._id}/details`, detailsForm);
            
            setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...detailsForm } : o)));
            setSelectedOrder((prev) => ({ ...prev, ...detailsForm }));
            toast.success("Lưu thành công");
        } catch (error) {
            toast.error(error.response?.data?.message || "Lưu thất bại");
        } finally {
            setSavingDetails(false);
        }
    };

    const handleExportCSV = async () => {
        setLoading(true);
        try {
            // Fetch tất cả đơn hàng theo filter hiện tại (không phân trang)
            let url = `/orders?limit=all`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (activeFilter !== "Tất cả") url += `&status=${activeFilter}`;
            
            const res = await axios.get(url);
            const allFilteredOrders = res.data.orders;

            if (allFilteredOrders.length === 0) {
                toast.error("Không có dữ liệu để xuất");
                return;
            }

            const rows = allFilteredOrders.map((o) => ({
                "Mã đơn": o.orderCode || o._id.substring(0, 8),
                "Khách hàng": o.shippingDetails?.fullName || o.user?.name || "Ẩn danh",
                "Email": o.user?.email || "N/A",
                "Điện thoại": o.shippingDetails?.phoneNumber || "N/A",
                "Trạng thái": STATUS_LABELS[o.status] || o.status,
                "Thanh toán": o.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
                "Tổng tiền": o.totalAmount,
                "Ngày đặt": new Date(o.createdAt).toLocaleString("vi-VN"),
                "Địa chỉ": `"${o.shippingDetails?.address || ""}, ${o.shippingDetails?.city || ""}"`,
                "Ghi chú nội bộ": `"${o.internalNotes || ""}"`,
                "Lý do trả hàng": `"${o.returnReason || ""}"`
            }));

            const headers = Object.keys(rows[0]).join(",");
            const csvRows = rows.map((r) => Object.values(r).map((v) => `${v}`).join(","));
            const csvContent = [headers, ...csvRows].join("\n");
            const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
            const urlDownload = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = urlDownload;
            a.download = `orders_full_${activeFilter}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(urlDownload);
            toast.success(`Đã xuất ${allFilteredOrders.length} đơn hàng`);
        } catch (error) {
            console.error("CSV Export error", error);
            toast.error("Lỗi xuất CSV");
        } finally {
            setLoading(false);
        }
    };

    const handlePrintInvoice = () => {
        const printArea = document.getElementById("order-invoice-print-area");
        if (!printArea) return;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printArea.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    const stats = [
        { label: "Đơn Cần Xử Lý", value: globalStats.pendingCount.toString(), action: "Yêu cầu kiểm tra", icon: AlertCircle },
        { label: "Hoàn Trả", value: globalStats.returnedCount.toString(), icon: ShieldCheck },
        { label: "Trạng thái", value: "Hoạt động", subValue: `Tổng ${globalStats.totalOrders} đơn`, icon: DollarSign },
    ];

    return (
        <div className='space-y-8'>
            {/* Header */}
            <div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
                <div className='space-y-2'>
                    <h1 className='text-4xl font-bold text-gray-900 dark:text-white tracking-tight'>Quản lý Đơn hàng</h1>
                    <p className='text-gray-500 dark:text-luxury-text-muted max-w-2xl'>
                        Xử lý, giao hàng và theo dõi vận đơn (Hiển thị 10 đơn/trang).
                    </p>
                </div>
                <div className='flex gap-3'>
                    <button
                        onClick={handleExportCSV}
                        className='flex items-center gap-2 px-4 py-2 bg-white dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl text-sm font-bold text-gray-900 dark:text-white shadow-sm hover:bg-gray-50 transition'
                    >
                        <Download className='w-4 h-4' /> Xuất CSV
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {stats.map((stat, idx) => (
                    <div key={idx} className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-6 rounded-2xl relative overflow-hidden shadow-md'>
                        <div className='relative z-10 space-y-4'>
                            <p className='text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest flex items-center gap-2'>
                                <stat.icon className='w-3 h-3 text-luxury-gold' /> {stat.label}
                            </p>
                            <div className='space-y-1'>
                                <h3 className='text-3xl font-bold text-gray-900 dark:text-white'>{stat.value}</h3>
                                {stat.subValue && <p className='text-gray-400 dark:text-luxury-text-muted text-[10px]'>{stat.subValue}</p>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Search & Table */}
            <div className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-3xl overflow-hidden shadow-2xl'>
                
                <div className='p-6 border-b border-gray-100 dark:border-luxury-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div className='flex flex-wrap items-center gap-2 flex-1'>
                        {FILTER_TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveFilter(tab)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeFilter === tab ? "bg-luxury-gold text-luxury-dark" : "text-gray-500 dark:text-luxury-text-muted hover:text-gray-900 dark:hover:text-white"
                                }`}
                            >
                                {tab === "Tất cả" ? "Tất cả" : STATUS_LABELS[tab]}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Tìm mã đơn, SĐT..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-xl pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full'>
                        <thead>
                            <tr className='text-left bg-gray-50 dark:bg-luxury-darker/30'>
                                <th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Mã Đơn</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Khách hàng</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Tổng Tiền</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Trạng thái</th>
                                <th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest text-right'>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100 dark:divide-luxury-border/30'>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index} className="animate-pulse">
                                        <td className="px-6 py-5" colSpan="5">
                                            <div className="grid grid-cols-5 gap-4 items-center">
                                                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-luxury-border/60" />
                                                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-luxury-border/60" />
                                                <div className="h-4 w-28 rounded bg-gray-200 dark:bg-luxury-border/60" />
                                                <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-luxury-border/60" />
                                                <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-luxury-border/60 ml-auto" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-luxury-text-muted">Không tìm thấy đơn hàng.</td></tr>
                            ) : orders.map((order) => (
                                <tr key={order._id} className='hover:bg-gray-50 dark:hover:bg-white/5 transition-colors'>
                                    <td className='px-6 py-6 font-bold text-gray-900 dark:text-white uppercase'>#{order.orderCode || order._id.substring(0, 8)}</td>
                                    <td className='px-6 py-6'>
                                        <div className='font-bold text-gray-900 dark:text-white'>{order.shippingDetails?.fullName || order.user?.name}</div>
                                        <div className='text-[10px] text-luxury-gold mt-0.5'>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</div>
                                    </td>
                                    <td className='px-6 py-6 font-bold text-gray-900 dark:text-white'>
                                        {order.totalAmount?.toLocaleString("vi-VN")} ₫
                                    </td>
                                    <td className='px-6 py-6'>
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                            disabled={updatingStatus}
                                            className={`min-w-[150px] px-3 py-2 rounded-full text-[10px] font-bold border transition ${STATUS_COLORS[order.status]} bg-transparent disabled:opacity-50`}
                                        >
                                            {STATUS_OPTIONS.map((status) => (
                                                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className='px-6 py-6 text-right'>
                                        <button onClick={() => openOrderDetails(order)} className='p-2 bg-gray-50 dark:bg-luxury-dark border rounded-lg text-gray-400 hover:text-luxury-gold transition-colors' title="Xem chi tiết / chỉnh sửa nhanh">
                                            <Eye className='w-4 h-4' />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                <div className='p-6 bg-gray-50 dark:bg-luxury-darker/30 flex items-center justify-between border-t dark:border-luxury-border/50'>
                    <p className='text-[10px] text-gray-500 dark:text-luxury-text-muted italic'>
                        Trang {currentPage} / {totalPages} (Tổng {totalOrders} đơn hàng)
                    </p>
                    <div className='flex gap-2'>
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                            className='p-1 border dark:border-luxury-border rounded hover:bg-luxury-gold hover:text-luxury-dark transition disabled:opacity-30'
                        >
                            <ChevronLeft className='w-4 h-4' />
                        </button>
                        <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                            className='p-1 border dark:border-luxury-border rounded hover:bg-luxury-gold hover:text-luxury-dark transition disabled:opacity-30'
                        >
                            <ChevronRight className='w-4 h-4' />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Detail Order */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white dark:bg-luxury-dark rounded-t-2xl md:rounded-2xl w-full max-w-4xl max-h-[90vh] h-[90vh] md:h-auto flex flex-col shadow-2xl relative"
                    >
                        <div className="sticky top-0 bg-white dark:bg-luxury-dark pt-5 pb-4 px-6 md:pt-6 md:px-8 border-b border-gray-100 dark:border-luxury-border flex items-center justify-between z-10 rounded-t-2xl">
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Chi tiết đơn hàng #{selectedOrder.orderCode || selectedOrder._id?.substring(0, 8).toUpperCase()}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-luxury-text-muted mt-1">
                                    {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handlePrintInvoice}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-luxury-border hover:bg-gray-200 hover:dark:bg-luxury-border/80 rounded-lg text-sm text-gray-800 dark:text-white transition"
                                >
                                    <Printer className="w-4 h-4" /> In Phiếu
                                </button>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-luxury-text-muted hover:text-red-500 transition"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6 md:p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Phân vùng 1: Khách hàng và Vận chuyển */}
                                <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-luxury-gold uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-luxury-border/50 pb-2">Thông tin Khách Hàng</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-luxury-text-muted">Họ tên:</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{selectedOrder.shippingDetails?.fullName || selectedOrder.user?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-luxury-text-muted">Số điện thoại:</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{selectedOrder.shippingDetails?.phoneNumber || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-luxury-text-muted">Email:</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{selectedOrder.shippingDetails?.email || selectedOrder.user?.email || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-luxury-text-muted">Địa chỉ:</span>
                                            <span className="font-bold text-gray-900 dark:text-white text-right max-w-[200px] leading-tight">
                                                {selectedOrder.shippingDetails?.address}, {selectedOrder.shippingDetails?.city}
                                            </span>
                                        </div>
                                        {selectedOrder.shippingDetails?.orderNotes && (
                                            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-lg">
                                                <span className="text-xs text-yellow-800 dark:text-yellow-600 font-bold block mb-1">Ghi chú của khách:</span>
                                                <span className="text-sm text-gray-800 dark:text-gray-300">{selectedOrder.shippingDetails.orderNotes}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-luxury-border/50 pb-2">Thanh toán</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-luxury-text-muted">Phương thức:</span>
                                            <span className="font-bold text-gray-900 dark:text-white uppercase">{selectedOrder.paymentMethod}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 dark:text-luxury-text-muted">Trạng thái TT:</span>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${selectedOrder.paymentStatus === "paid" ? "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10" : "text-yellow-600 dark:text-yellow-400 bg-yellow-400/10"}`}>
                                                {selectedOrder.paymentStatus === "paid" ? "ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 dark:bg-luxury-darker p-3 rounded-lg border border-gray-200 dark:border-luxury-border">
                                            <span className="text-gray-700 dark:text-gray-300 font-bold">Tổng tiền thu:</span>
                                            <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                                {selectedOrder.currency === "USD"
                                                    ? "$" + selectedOrder.totalAmount?.toLocaleString()
                                                    : selectedOrder.totalAmount?.toLocaleString("vi-VN") + " ₫"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Phân vùng 2: Cập nhật Backend & Trạng thái */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-luxury-border/50 pb-2 flex items-center gap-2">
                                        <PenTool className="w-4 h-4" /> Vận Hành Hệ Thống
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-luxury-text-muted font-bold block mb-1">Đơn vị vận chuyển</label>
                                                <select
                                                    value={detailsForm.carrier}
                                                    onChange={e => setDetailsForm({...detailsForm, carrier: e.target.value})}
                                                    className="w-full bg-white dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                                >
                                                    <option value="">Chọn Đơn Vị</option>
                                                    <option value="DHL Express">DHL Express</option>
                                                    <option value="GHTK">GHTK</option>
                                                    <option value="Viettel Post">Viettel Post</option>
                                                    <option value="J&T Express">J&T Express</option>
                                                    <option value="VNPost">VNPost</option>
                                                    <option value="Other">Khác</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-luxury-text-muted font-bold block mb-1">Mã Vận Đơn / Tracking</label>
                                                <input
                                                    type="text"
                                                    value={detailsForm.carrierTrackingNumber}
                                                    onChange={e => setDetailsForm({...detailsForm, carrierTrackingNumber: e.target.value})}
                                                    className="w-full bg-white dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                                                    placeholder="VD: GHTK123456"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-luxury-text-muted font-bold mb-1 flex items-center gap-1">
                                                <StickyNote className="w-3 h-3" /> Ghi Chú Nội Bộ (Không gửi khách)
                                            </label>
                                            <textarea
                                                rows="2"
                                                value={detailsForm.internalNotes}
                                                onChange={e => setDetailsForm({...detailsForm, internalNotes: e.target.value})}
                                                className="w-full bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/50 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-300"
                                                placeholder="VD: Khách yêu cầu cắt dây 2 mắt, gọi ra ngoài giờ..."
                                            ></textarea>
                                        </div>

                                        {/* Hiển thị form trả hàng nếu status liên quan */}
                                        {(["return_requested", "returned"].includes(selectedOrder.status) || detailsForm.returnReason) && (
                                            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-lg space-y-3">
                                                <p className="text-xs font-bold text-red-600 dark:text-red-400">Thông tin Hoàn trả</p>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 dark:text-luxury-text-muted block mb-1">Lý do</label>
                                                    <input 
                                                        type="text" 
                                                        value={detailsForm.returnReason}
                                                        onChange={e => setDetailsForm({...detailsForm, returnReason: e.target.value})}
                                                        placeholder="Lỗi kỹ thuật, sai màu..."
                                                        className="w-full bg-white dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded text-sm px-2 py-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 dark:text-luxury-text-muted block mb-1">Tiền Hoàn (VNĐ / USD)</label>
                                                    <input 
                                                        type="number"
                                                        value={detailsForm.refundAmount}
                                                        onChange={e => setDetailsForm({...detailsForm, refundAmount: Number(e.target.value)})}
                                                        className="w-full bg-white dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded text-sm px-2 py-1"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={saveOrderDetails}
                                            disabled={savingDetails}
                                            className="w-full flex justify-center items-center gap-2 py-2 bg-luxury-gold text-luxury-dark font-bold rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
                                        >
                                            <Save className="w-4 h-4" /> {savingDetails ? "Đang lưu..." : "Lưu Thay Đổi Backend"}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-luxury-border">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Chuyển Trạng Thái Đơn Hàng</h3>
                                    <div className="flex gap-3 items-center">
                                        <select
                                            value={selectedOrder.status}
                                            onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                                            disabled={updatingStatus}
                                            className="flex-1 bg-white dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition disabled:opacity-50"
                                        >
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                            ))}
                                        </select>
                                        <span className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider ${STATUS_COLORS[selectedOrder.status] || ""}`}>
                                            {updatingStatus ? "Đang xử lý..." : STATUS_LABELS[selectedOrder.status]?.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 italic">* Khách hàng sẽ nhận được thư thông báo tự động khi thay đổi trạng thái.</p>
                                </div>
                            </div>
                        </div>

                        {/* Phân vùng 3: Danh sách sản phẩm */}
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-luxury-border">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Sản Phẩm Đã Đặt</h3>
                            <div className="space-y-3">
                                {selectedOrder.products?.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center bg-gray-50 dark:bg-luxury-darker p-3 rounded-lg border border-gray-100 dark:border-luxury-border">
                                        {item.product?.image && (
                                            <img src={item.product.image} alt="Watch" className="w-16 h-16 object-cover rounded-md" />
                                        )}
                                        <div className="flex flex-col flex-1">
                                            <span className="font-bold text-gray-900 dark:text-white">{item.product?.name || "Sản phẩm đã bị xóa hoặc ẩn"}</span>
                                            <span className="text-xs text-gray-500 dark:text-luxury-text-muted">ID: {item.product?._id || "N/A"}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-luxury-gold">
                                                {selectedOrder.currency === "USD"
                                                    ? "$" + item.price?.toLocaleString()
                                                    : item.price?.toLocaleString("vi-VN") + " ₫"}
                                            </div>
                                            <div className="text-xs text-gray-500">x {item.quantity}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    </motion.div>
                </div>
            )}

            {/* Hidden Print Wrapper */}
            {selectedOrder && (
                <div id="order-invoice-print-area" className="hidden print:block text-black p-8 font-sans" style={{ backgroundColor: "white", width: "100%", height: "100%" }}>
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold uppercase tracking-widest">Luxury Watch Store</h1>
                        <p className="text-sm">Hóa đơn Bán lẻ / Phiếu giao hàng</p>
                    </div>

                    <div className="flex justify-between border-b-2 border-black pb-4 mb-4">
                        <div>
                            <p><strong>Mã Đơn:</strong> #{selectedOrder.orderCode || selectedOrder._id}</p>
                            <p><strong>Ngày tạo:</strong> {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                            <p><strong>Đơn vị VC:</strong> {detailsForm.carrier || selectedOrder.carrier || "Chưa chọn"} - Mã VĐ: {detailsForm.carrierTrackingNumber || "N/A"}</p>
                        </div>
                        <div className="text-right">
                            <p><strong>Khách hàng:</strong> {selectedOrder.shippingDetails?.fullName || selectedOrder.user?.name}</p>
                            <p><strong>Điện thoại:</strong> {selectedOrder.shippingDetails?.phoneNumber}</p>
                            <p><strong>Địa chỉ:</strong> {selectedOrder.shippingDetails?.address}, {selectedOrder.shippingDetails?.city}</p>
                        </div>
                    </div>

                    <table className="w-full text-left border-collapse mt-4">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="py-2">Tên Sản Phẩm</th>
                                <th className="py-2 text-center">SL</th>
                                <th className="py-2 text-right">Đơn giá</th>
                                <th className="py-2 text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedOrder.products?.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-300">
                                    <td className="py-3">{item.product?.name || "Sản phẩm rỗng"}</td>
                                    <td className="py-3 text-center">{item.quantity}</td>
                                    <td className="py-3 text-right">
                                        {selectedOrder.currency === "USD"
                                            ? "$" + item.price?.toLocaleString()
                                            : item.price?.toLocaleString("vi-VN")}
                                    </td>
                                    <td className="py-3 text-right">
                                        {selectedOrder.currency === "USD"
                                            ? "$" + (item.price * item.quantity).toLocaleString()
                                            : (item.price * item.quantity).toLocaleString("vi-VN")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end mt-6">
                        <div className="text-right border-t-2 border-black pt-2 min-w-[300px]">
                            <p className="text-lg font-bold">
                                TỔNG TIỀN: {selectedOrder.currency === "USD"
                                            ? "$" + selectedOrder.totalAmount?.toLocaleString()
                                            : selectedOrder.totalAmount?.toLocaleString("vi-VN") + " ₫"}
                            </p>
                            <p className="text-sm italic mt-1">
                                Trạng thái TT: {selectedOrder.paymentStatus === "paid" ? "Đã Thanh Toán" : "Thanh Toán Khi Nhận Hàng (COD)"}
                            </p>
                            {selectedOrder.shippingDetails?.orderNotes && (
                                <p className="text-sm italic mt-2">Ghi chú KH: {selectedOrder.shippingDetails.orderNotes}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-16 text-center text-sm italic">
                        Cảm ơn quý khách đã ủng hộ Luxury Watch Store!
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersTab;
